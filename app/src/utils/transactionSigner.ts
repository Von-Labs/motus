import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Transaction, VersionedTransaction } from "@solana/web3.js";
import { toByteArray } from "react-native-quick-base64";

const DEFAULT_FEE_ESTIMATE_LAMPORTS = 10_000;

// Track when MWA wallet interaction is active to prevent biometric gate.
// Uses a grace period because transact() may reject before AppState fires.
let _walletInteractionActive = false;
let _walletInteractionEndTime = 0;
const WALLET_INTERACTION_GRACE_MS = 3000;

export function isWalletInteractionActive(): boolean {
  if (_walletInteractionActive) return true;
  return Date.now() - _walletInteractionEndTime < WALLET_INTERACTION_GRACE_MS;
}

export class UserCancelledError extends Error {
  constructor() {
    super("Transaction cancelled by user");
    this.name = "UserCancelledError";
  }
}

function isWalletCancellation(error: any): boolean {
  const msg = (error?.message || String(error)).toLowerCase();
  return (
    msg.includes("reject") ||
    msg.includes("cancel") ||
    msg.includes("declined") ||
    msg.includes("user denied") ||
    msg.includes("cancellationexception")
  );
}

export interface HotWalletSignerOptions {
  useHotWallet: boolean;
  signAndSendTransaction: (
    tx: Transaction | VersionedTransaction,
  ) => Promise<string>;
  requireBalance: (lamports: number) => Promise<boolean>;
}

/**
 * Deserialize base64 transaction string to Transaction or VersionedTransaction.
 */
export function deserializeTransaction(txBase64: string): Transaction | VersionedTransaction {
  const bytes = toByteArray(txBase64);
  const uint8Array = new Uint8Array(bytes);
  try {
    return VersionedTransaction.deserialize(uint8Array);
  } catch {
    return Transaction.from(uint8Array);
  }
}

/**
 * Sign and send a transaction. Uses hot wallet when options.useHotWallet and
 * signer functions are provided; otherwise falls back to MWA transact().
 * Returns the transaction signature and whether the hot wallet was used.
 */
export async function signAndSendTransactionFromBase64(
  txBase64: string,
  options: {
    cluster?: string;
    hotWallet?: HotWalletSignerOptions | null;
  } = {},
): Promise<{ signature: string; signer: "hot_wallet" | "main_wallet" }> {
  const transaction = deserializeTransaction(txBase64);
  const cluster = options.cluster ?? "mainnet-beta";

  try {
    if (
      options.hotWallet?.useHotWallet &&
      options.hotWallet.signAndSendTransaction &&
      options.hotWallet.requireBalance
    ) {
      const hasBalance = await options.hotWallet.requireBalance(
        DEFAULT_FEE_ESTIMATE_LAMPORTS,
      );
      if (!hasBalance) {
        throw new Error("Insufficient balance in hot wallet. Please top up.");
      }
      const signature = await options.hotWallet.signAndSendTransaction(transaction);
      return { signature, signer: "hot_wallet" };
    }

    _walletInteractionActive = true;
    try {
      const signatures = await transact(async (wallet: any) => {
        await wallet.authorize({
          cluster,
          identity: { name: "Solana DeFi Agent" },
        });
        return wallet.signAndSendTransactions({
          transactions: [transaction],
        });
      });

      return { signature: signatures[0], signer: "main_wallet" };
    } finally {
      _walletInteractionActive = false;
      _walletInteractionEndTime = Date.now();
    }
  } catch (error) {
    if (isWalletCancellation(error)) {
      throw new UserCancelledError();
    }
    throw error;
  }
}
