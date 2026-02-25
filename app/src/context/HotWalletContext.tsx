import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import { toByteArray } from "react-native-quick-base64";
import {
  deleteHotWallet as deleteHotWalletFromStore,
  generateHotWallet,
  getHotWalletKeypair,
  getPublicKeyString,
  getSecretKeyBase58,
} from "../utils/hotWallet";
import { isHotWalletEnabled } from "../constants/featureFlags";
import { DOMAIN } from "../../constants";

// Choose cluster for hot wallet: default devnet, can override via EXPO_PUBLIC_HOT_WALLET_CLUSTER
const HOT_WALLET_CLUSTER_ENV =
  (process.env.EXPO_PUBLIC_HOT_WALLET_CLUSTER || "devnet").toLowerCase();
const HOT_WALLET_CLUSTER: "devnet" | "mainnet-beta" =
  HOT_WALLET_CLUSTER_ENV === "mainnet-beta" ? "mainnet-beta" : "devnet";

const connection = new Connection(
  clusterApiUrl(HOT_WALLET_CLUSTER),
  "confirmed",
);

const QUERY_KEYS = {
  keypair: ["hotWallet", "keypair"],
  balance: (pubkey: string) => ["hotWallet", "balance", pubkey],
};

interface HotWalletContextType {
  /** Whether the hot wallet feature is enabled (feature flag). */
  isHotWalletFeatureEnabled: boolean;
  hotWallet: Keypair | null;
  publicKey: string | null;
  balance: number | null;
  isLoading: boolean;
  isHotWalletActive: boolean;

  createHotWallet: () => Promise<void>;
  deleteHotWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;

  signTransaction: (
    tx: Transaction | VersionedTransaction,
  ) => Transaction | VersionedTransaction;
  signAndSendTransaction: (
    tx: Transaction | VersionedTransaction,
  ) => Promise<string>;
  sendSol: (to: string, lamports: number) => Promise<string>;
  topUpFromMainWallet: (lamports: number) => Promise<string>;

  requireBalance: (lamports: number) => Promise<boolean>;
  exportSecretKey: () => string | null;

  /** For TopUpBottomSheet: when set, sheet should open. Cleared by closeTopUpSheet. */
  pendingTopUp: { requiredLamports: number } | null;
  closeTopUpSheet: (success: boolean) => void;
  /** Open top-up sheet from UI (e.g. dashboard). Pass 0 or omit to let user choose amount. */
  openTopUpSheet: (requiredLamports?: number) => void;
}

const HotWalletContext = createContext<HotWalletContextType>({
  isHotWalletFeatureEnabled: false,
  hotWallet: null,
  publicKey: null,
  balance: null,
  isLoading: true,
  isHotWalletActive: false,

  createHotWallet: async () => {},
  deleteHotWallet: async () => {},
  refreshBalance: async () => {},

  signTransaction: (tx) => tx,
  signAndSendTransaction: async () => "",
  sendSol: async () => "",
  topUpFromMainWallet: async () => "",

  requireBalance: async () => false,
  exportSecretKey: () => null,

  pendingTopUp: null,
  closeTopUpSheet: () => {},
  openTopUpSheet: () => {},
});

export function useHotWallet() {
  return useContext(HotWalletContext);
}

export function HotWalletProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [keypair, setKeypair] = useState<Keypair | null>(null);
  const [pendingTopUp, setPendingTopUp] = useState<{
    requiredLamports: number;
  } | null>(null);
  const topUpResolveRef = useRef<(success: boolean) => void | null>(null);

  const publicKey = keypair ? getPublicKeyString(keypair) : null;
  const isHotWalletActive = keypair !== null;
  const hotWalletEnabled = isHotWalletEnabled();

  // Load keypair from SecureStore on mount (only when feature is on)
  const { isLoading } = useQuery({
    queryKey: QUERY_KEYS.keypair,
    queryFn: async () => {
      const kp = await getHotWalletKeypair();
      setKeypair(kp);
      return kp ? getPublicKeyString(kp) : null;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: hotWalletEnabled,
  });

  // Poll balance every 15s while app is active
  const { data: balance = null } = useQuery({
    queryKey: QUERY_KEYS.balance(publicKey ?? ""),
    queryFn: async () => {
      if (!keypair) return null;
      // On mainnet, ask backend (secured by SOLANA_RPC_URL) for balance
      if (HOT_WALLET_CLUSTER === "mainnet-beta") {
        const res = await fetch(
          `${DOMAIN}/api/hotwallet/balance?pubkey=${encodeURIComponent(
            getPublicKeyString(keypair),
          )}`,
        );
        if (!res.ok) {
          throw new Error("Failed to fetch hot wallet balance");
        }
        const data = await res.json();
        return typeof data.balance === "number" ? data.balance : null;
      }
      // On devnet, we can safely use client RPC
      return connection.getBalance(keypair.publicKey);
    },
    enabled: isHotWalletActive,
    refetchInterval: (_query) => {
      if (AppState.currentState !== "active") return false;
      return 15_000;
    },
    staleTime: 10_000,
  });

  const invalidateBalance = useCallback(() => {
    if (publicKey) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.balance(publicKey),
      });
    }
  }, [publicKey, queryClient]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      const kp = await generateHotWallet();
      setKeypair(kp);
      return kp;
    },
    onSuccess: (kp) => {
      const pk = getPublicKeyString(kp);
      queryClient.setQueryData(QUERY_KEYS.keypair, pk);
      queryClient.setQueryData(QUERY_KEYS.balance(pk), 0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await deleteHotWalletFromStore();
    },
    onSuccess: () => {
      if (publicKey) {
        queryClient.removeQueries({ queryKey: QUERY_KEYS.balance(publicKey) });
      }
      setKeypair(null);
      queryClient.setQueryData(QUERY_KEYS.keypair, null);
    },
  });

  const signTransaction = useCallback(
    (tx: Transaction | VersionedTransaction) => {
      if (!keypair) throw new Error("No hot wallet available");
      if (tx instanceof Transaction) {
        tx.sign(keypair);
      } else {
        tx.sign([keypair]);
      }
      return tx;
    },
    [keypair],
  );

  const signAndSendTransaction = useCallback(
    async (tx: Transaction | VersionedTransaction): Promise<string> => {
      if (!keypair) throw new Error("No hot wallet available");

      // Mainnet: sign locally, send via backend using SOLANA_RPC_URL
      if (HOT_WALLET_CLUSTER === "mainnet-beta") {
        // Ensure fee payer + blockhash for legacy tx
        if (tx instanceof Transaction) {
          tx.feePayer = keypair.publicKey;
          if (!tx.recentBlockhash) {
            const res = await fetch(`${DOMAIN}/api/hotwallet/blockhash`);
            if (!res.ok) {
              const text = await res.text();
              throw new Error(
                `Failed to get recent blockhash from server: ${text}`,
              );
            }
            const data = await res.json();
            tx.recentBlockhash = data.blockhash;
          }
          tx.sign(keypair);
        } else {
          // Versioned tx: assume it already has a recent blockhash
          tx.sign([keypair]);
        }

        const rawTx = tx.serialize();
        const base64Tx = Buffer.from(rawTx).toString("base64");
        const res = await fetch(`${DOMAIN}/api/hotwallet/send-raw`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction: base64Tx }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to send transaction via server: ${text}`);
        }
        const data = await res.json();
        const sig = data.signature as string;
        invalidateBalance();
        return sig;
      }

      // Devnet: existing direct RPC behaviour (for easier local testing)
      if (tx instanceof Transaction) {
        tx.feePayer = keypair.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        const sig = await sendAndConfirmTransaction(connection, tx, [keypair]);
        invalidateBalance();
        return sig;
      }

      tx.sign([keypair]);
      const rawTx = tx.serialize();
      const sig = await connection.sendRawTransaction(rawTx);
      await connection.confirmTransaction(sig, "confirmed");
      invalidateBalance();
      return sig;
    },
    [keypair, invalidateBalance],
  );

  const sendSol = useCallback(
    async (to: string, lamports: number): Promise<string> => {
      if (!keypair) throw new Error("No hot wallet available");

      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: keypair.publicKey,
          toPubkey: new PublicKey(to),
          lamports,
        }),
      );

      return signAndSendTransaction(tx);
    },
    [keypair, signAndSendTransaction],
  );

  const topUpFromMainWallet = useCallback(
    async (lamports: number): Promise<string> => {
      if (!keypair) throw new Error("No hot wallet to top up");

      // Get recent blockhash + minContextSlot from backend when on mainnet,
      // otherwise use client connection (devnet) for convenience.
      let blockhash: string;
      let minContextSlot: number | undefined;
      if (HOT_WALLET_CLUSTER === "mainnet-beta") {
        const res = await fetch(`${DOMAIN}/api/hotwallet/blockhash`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to get recent blockhash from server: ${text}`);
        }
        const data = await res.json();
        blockhash = data.blockhash;
        minContextSlot = data.minContextSlot;
      } else {
        const latest = await connection.getLatestBlockhash("confirmed");
        blockhash = latest.blockhash;
        minContextSlot = await connection.getSlot("confirmed");
      }

      const signatures = await transact(async (wallet: any) => {
        const authResult = await wallet.authorize({
          cluster: HOT_WALLET_CLUSTER,
          identity: { name: "Motus" },
        });

        const account = authResult.accounts[0];
        if (!account) throw new Error("No authorized account");
        const fromPubkey = new PublicKey(
          new Uint8Array(toByteArray(account.address)),
        );

        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey: keypair.publicKey,
            lamports,
          }),
        );
        tx.feePayer = fromPubkey;
        tx.recentBlockhash = blockhash;

        return await wallet.signAndSendTransactions({
          transactions: [tx],
          ...(minContextSlot != null ? { minContextSlot } : {}),
          commitment: "confirmed",
        });
      });

      const sig = signatures[0];

      if (HOT_WALLET_CLUSTER === "mainnet-beta") {
        // Ask backend (which uses secure SOLANA_RPC_URL) to confirm
        await fetch(`${DOMAIN}/api/hotwallet/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signature: sig }),
        }).catch(() => {
          // Non-fatal; balance will eventually update via poll
        });
      } else {
        await connection.confirmTransaction(sig, "confirmed");
      }

      invalidateBalance();
      return sig;
    },
    [keypair, invalidateBalance],
  );

  const refreshBalance = useCallback(async () => {
    invalidateBalance();
  }, [invalidateBalance]);

  const closeTopUpSheet = useCallback((success: boolean) => {
    topUpResolveRef.current?.(success);
    topUpResolveRef.current = null;
    setPendingTopUp(null);
  }, []);

  const openTopUpSheet = useCallback((requiredLamports = 0) => {
    setPendingTopUp({ requiredLamports });
  }, []);

  const requireBalance = useCallback(
    async (lamports: number): Promise<boolean> => {
      if (!keypair) return false;
      let currentBalance: number;
      if (HOT_WALLET_CLUSTER === "mainnet-beta") {
        const res = await fetch(
          `${DOMAIN}/api/hotwallet/balance?pubkey=${encodeURIComponent(
            getPublicKeyString(keypair),
          )}`,
        );
        if (!res.ok) {
          throw new Error("Failed to fetch hot wallet balance");
        }
        const data = await res.json();
        currentBalance =
          typeof data.balance === "number" ? data.balance : 0;
      } else {
        currentBalance = await connection.getBalance(keypair.publicKey);
      }

      queryClient.setQueryData(
        QUERY_KEYS.balance(getPublicKeyString(keypair)),
        currentBalance,
      );
      if (currentBalance >= lamports) return true;
      return new Promise<boolean>((resolve) => {
        topUpResolveRef.current = resolve;
        setPendingTopUp({ requiredLamports: lamports });
      });
    },
    [keypair, queryClient],
  );

  const exportSecretKey = useCallback((): string | null => {
    if (!keypair) return null;
    return getSecretKeyBase58(keypair);
  }, [keypair]);

  return (
    <HotWalletContext.Provider
      value={{
        isHotWalletFeatureEnabled: hotWalletEnabled,
        hotWallet: keypair,
        publicKey,
        balance,
        isLoading: hotWalletEnabled ? isLoading : false,
        isHotWalletActive,

        createHotWallet: () => createMutation.mutateAsync().then(() => {}),
        deleteHotWallet: () => deleteMutation.mutateAsync(),
        refreshBalance,

        signTransaction,
        signAndSendTransaction,
        sendSol,
        topUpFromMainWallet,

        requireBalance,
        exportSecretKey,

        pendingTopUp,
        closeTopUpSheet,
        openTopUpSheet,
      }}
    >
      {children}
    </HotWalletContext.Provider>
  );
}
