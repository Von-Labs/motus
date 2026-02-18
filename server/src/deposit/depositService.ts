import {
  Connection,
  PublicKey,
  Transaction,
  ParsedTransactionWithMeta,
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';

const USDC_MINT_DEFAULT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Lazy getters so env vars are read after dotenv loads
function getConnection(): Connection {
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl) throw new Error('SOLANA_RPC_URL is not set');
  return new Connection(rpcUrl, 'confirmed');
}
function getTreasuryWallet(): string {
  return process.env.TREASURY_WALLET_ADDRESS!;
}
function getUsdcMint(): string {
  return process.env.USDC_MINT_ADDRESS || USDC_MINT_DEFAULT;
}
function getMinDeposit(): number {
  return parseFloat(process.env.MIN_DEPOSIT_USDC || '5');
}


export interface PrepareDepositResult {
  transaction: string; // base64 serialized unsigned transaction
  senderATA: string;
  treasuryATA: string;
  amount: number;
}

/**
 * Build an unsigned USDC transferChecked transaction for the client to sign
 */
export async function prepareDeposit(
  senderAddress: string,
  amount: number
): Promise<PrepareDepositResult> {
  const connection = getConnection();
  const TREASURY_WALLET = getTreasuryWallet();
  const USDC_MINT = getUsdcMint();
  const MIN_DEPOSIT = getMinDeposit();

  if (amount < MIN_DEPOSIT) {
    throw new Error(`Minimum deposit is ${MIN_DEPOSIT} USDC`);
  }

  const senderPubkey = new PublicKey(senderAddress);
  const treasuryPubkey = new PublicKey(TREASURY_WALLET);
  const usdcMintPubkey = new PublicKey(USDC_MINT);

  const senderATA = getAssociatedTokenAddressSync(usdcMintPubkey, senderPubkey);
  const treasuryATA = getAssociatedTokenAddressSync(usdcMintPubkey, treasuryPubkey);

  const USDC_DECIMALS = 6;
  const rawAmount = BigInt(Math.round(amount * 10 ** USDC_DECIMALS));

  // Idempotent: no-op if treasury ATA already exists, creates it otherwise
  const createAtaIx = createAssociatedTokenAccountIdempotentInstruction(
    senderPubkey,   // payer
    treasuryATA,    // ata
    treasuryPubkey, // owner
    usdcMintPubkey, // mint
  );

  const transferIx = createTransferCheckedInstruction(
    senderATA,      // source
    usdcMintPubkey, // mint
    treasuryATA,    // destination
    senderPubkey,   // owner
    rawAmount,      // amount
    USDC_DECIMALS,  // decimals
  );

  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = senderPubkey;
  tx.add(createAtaIx);
  tx.add(transferIx);

  const serialized = tx.serialize({ requireAllSignatures: false });
  const transaction = serialized.toString('base64');

  return {
    transaction,
    senderATA: senderATA.toBase58(),
    treasuryATA: treasuryATA.toBase58(),
    amount,
  };
}

export interface DepositVerificationResult {
  valid: boolean;
  amount?: number;
  error?: string;
  sender?: string;
}

/**
 * Verifies a Solana transaction is a valid USDC deposit to treasury wallet.
 * Uses token balance diff (preTokenBalances/postTokenBalances) so it works
 * regardless of whether the instruction is parsed or raw.
 * Retries up to 10 times (3s apart) to handle confirmation delay.
 */
export async function verifyDeposit(signature: string): Promise<DepositVerificationResult> {
  try {
    const connection = getConnection();
    const TREASURY_WALLET = getTreasuryWallet();
    const USDC_MINT = getUsdcMint();
    const MIN_DEPOSIT = getMinDeposit();

    // Retry loop — tx may not be confirmed yet right after MWA sends it
    let tx: ParsedTransactionWithMeta | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      tx = await connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed',
      }) as ParsedTransactionWithMeta | null;

      if (tx) break;
      await new Promise(r => setTimeout(r, 3000));
    }

    if (!tx) {
      return { valid: false, error: 'Transaction not found after waiting. Please try again.' };
    }

    if (tx.meta?.err) {
      return { valid: false, error: 'Transaction failed on-chain' };
    }

    const pre = tx.meta?.preTokenBalances ?? [];
    const post = tx.meta?.postTokenBalances ?? [];

    // Find treasury ATA index — look for account owned by TREASURY_WALLET holding USDC
    const treasuryEntry = post.find(
      (b) => b.mint === USDC_MINT && b.owner === TREASURY_WALLET
    );

    if (!treasuryEntry) {
      return { valid: false, error: 'No USDC deposit to treasury found in transaction' };
    }

    const accountIndex = treasuryEntry.accountIndex;
    const preEntry = pre.find((b) => b.accountIndex === accountIndex);

    const preAmount = preEntry?.uiTokenAmount.uiAmount ?? 0;
    const postAmount = treasuryEntry.uiTokenAmount.uiAmount ?? 0;
    const depositAmount = postAmount - preAmount;

    if (depositAmount <= 0) {
      return { valid: false, error: 'Treasury balance did not increase' };
    }

    if (depositAmount < MIN_DEPOSIT) {
      return {
        valid: false,
        error: `Minimum deposit is ${MIN_DEPOSIT} USDC, received ${depositAmount.toFixed(6)} USDC`,
      };
    }

    // Find sender: look for USDC account whose balance decreased
    const senderEntry = pre.find((b) => {
      if (b.mint !== USDC_MINT || b.accountIndex === accountIndex) return false;
      const postB = post.find((p) => p.accountIndex === b.accountIndex);
      const postAmt = postB?.uiTokenAmount.uiAmount ?? 0;
      const preAmt = b.uiTokenAmount.uiAmount ?? 0;
      return preAmt - postAmt > 0;
    });

    return {
      valid: true,
      amount: depositAmount,
      sender: senderEntry?.owner,
    };
  } catch (err: any) {
    console.error('Error verifying deposit:', err);
    return { valid: false, error: err.message || 'Failed to verify transaction' };
  }
}

