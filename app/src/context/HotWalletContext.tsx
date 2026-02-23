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

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const QUERY_KEYS = {
  keypair: ["hotWallet", "keypair"],
  balance: (pubkey: string) => ["hotWallet", "balance", pubkey],
};

interface HotWalletContextType {
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

  // Load keypair from SecureStore on mount
  const { isLoading } = useQuery({
    queryKey: QUERY_KEYS.keypair,
    queryFn: async () => {
      const kp = await getHotWalletKeypair();
      setKeypair(kp);
      return kp ? getPublicKeyString(kp) : null;
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Poll balance every 15s while app is active
  const { data: balance = null } = useQuery({
    queryKey: QUERY_KEYS.balance(publicKey ?? ""),
    queryFn: async () => {
      if (!keypair) return null;
      return connection.getBalance(keypair.publicKey);
    },
    enabled: isHotWalletActive,
    refetchInterval: (query) => {
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

      const signatures = await transact(async (wallet: any) => {
        const authResult = await wallet.authorize({
          cluster: "devnet",
          identity: { name: "Motus" },
        });

        const account = authResult.accounts[0];
        if (!account) throw new Error("No authorized account");
        const fromPubkey = new PublicKey(
          new Uint8Array(toByteArray(account.address)),
        );

        const { blockhash } =
          await connection.getLatestBlockhash("confirmed");
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey,
            toPubkey: keypair.publicKey,
            lamports,
          }),
        );
        tx.feePayer = fromPubkey;
        tx.recentBlockhash = blockhash;

        const minContextSlot = await connection.getSlot("confirmed");

        return await wallet.signAndSendTransactions({
          transactions: [tx],
          minContextSlot,
          commitment: "confirmed",
        });
      });

      const sig = signatures[0];
      await connection.confirmTransaction(sig, "confirmed");

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
      const currentBalance = await connection.getBalance(keypair.publicKey);
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
        hotWallet: keypair,
        publicKey,
        balance,
        isLoading,
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
