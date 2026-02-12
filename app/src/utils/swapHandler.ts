import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

/**
 * Handle swap transaction from Claude tool response
 * @param swapData - The swap_tokens tool result containing transaction
 * @returns Transaction signature
 */
export async function handleSwapTransaction(swapData: any): Promise<string> {
  if (!swapData.transaction) {
    throw new Error("No transaction found in swap data");
  }

  console.log("Processing swap transaction from Claude...");

  // Use Solana Mobile Wallet Adapter to sign and send transaction
  const signatures = await transact(async (wallet: any) => {
    // Authorize the wallet
    await wallet.authorize({
      cluster: 'mainnet-beta',
      identity: { name: 'Solana DeFi Agent' },
    });

    // Deserialize the transaction
    const transactionBuffer = Buffer.from(swapData.transaction, 'base64');
    const uint8Array = new Uint8Array(transactionBuffer);

    // Try VersionedTransaction first (Jupiter uses v0 transactions)
    let transaction: Transaction | VersionedTransaction;
    try {
      transaction = VersionedTransaction.deserialize(uint8Array);
      console.log("Deserialized as VersionedTransaction");
    } catch (e) {
      transaction = Transaction.from(transactionBuffer);
      console.log("Deserialized as legacy Transaction");
    }

    // Sign and send the transaction
    const txSignatures = await wallet.signAndSendTransactions({
      transactions: [transaction],
    });

    return txSignatures;
  });

  const signature = signatures[0];
  console.log(`Swap transaction successful: ${signature}`);
  console.log(`View on Solscan: https://solscan.io/tx/${signature}`);

  return signature;
}

/**
 * Handle trigger order transaction (limit order, cancel order, etc.)
 * @param triggerData - The trigger tool result containing transaction
 * @returns Transaction signature
 */
export async function handleTriggerTransaction(
  triggerData: any
): Promise<string> {
  if (!triggerData.transaction) {
    throw new Error("No transaction found in trigger data");
  }

  console.log("Processing trigger order transaction from Claude...");

  // Use Solana Mobile Wallet Adapter to sign and send transaction
  const signatures = await transact(async (wallet: any) => {
    // Authorize the wallet
    await wallet.authorize({
      cluster: 'mainnet-beta',
      identity: { name: 'Solana DeFi Agent' },
    });

    // Deserialize the transaction
    const transactionBuffer = Buffer.from(triggerData.transaction, 'base64');
    const uint8Array = new Uint8Array(transactionBuffer);

    // Try VersionedTransaction first
    let transaction: Transaction | VersionedTransaction;
    try {
      transaction = VersionedTransaction.deserialize(uint8Array);
      console.log("Deserialized as VersionedTransaction");
    } catch (e) {
      transaction = Transaction.from(transactionBuffer);
      console.log("Deserialized as legacy Transaction");
    }

    // Sign and send the transaction
    const txSignatures = await wallet.signAndSendTransactions({
      transactions: [transaction],
    });

    return txSignatures;
  });

  const signature = signatures[0];
  console.log(`Trigger order transaction successful: ${signature}`);
  console.log(`View on Solscan: https://solscan.io/tx/${signature}`);

  return signature;
}

/**
 * Check if a tool result contains a swap transaction
 */
export function isSwapTransaction(data: any): boolean {
  return data && typeof data === 'object' && 'transaction' in data && 'inputMint' in data;
}

/**
 * Check if a tool result contains a trigger order transaction
 */
export function isTriggerOrderTransaction(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    'transaction' in data &&
    'requestId' in data &&
    ('order' in data || 'orders' in data || 'makingAmount' in data)
  );
}

/**
 * Check if a tool result contains a cancel order transaction
 */
export function isCancelOrderTransaction(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    'transaction' in data &&
    'requestId' in data &&
    !('order' in data || 'makingAmount' in data)
  );
}

/**
 * Format swap details for display
 */
export function formatSwapDetails(swapData: any): string {
  if (!swapData) return '';

  const inAmount = swapData.inAmount ? (parseInt(swapData.inAmount) / 1000000).toFixed(6) : '?';
  const outAmount = swapData.outAmount ? (parseInt(swapData.outAmount) / 1000000).toFixed(6) : '?';
  const priceImpact = swapData.priceImpactPct || '?';

  return `
**Swap Details:**
- Input: ${inAmount} tokens
- Output: ${outAmount} tokens
- Price Impact: ${priceImpact}%
- Slippage: ${(swapData.slippageBps || 50) / 100}%
  `.trim();
}

/**
 * Format trigger order details for display
 */
export function formatTriggerOrderDetails(orderData: any): string {
  if (!orderData) return '';

  const makingAmount = orderData.makingAmount || '?';
  const takingAmount = orderData.takingAmount || '?';
  const orderAddress = orderData.order ? `\n- Order Address: \`${orderData.order.slice(0, 8)}...${orderData.order.slice(-8)}\`` : '';

  return `
**Limit Order Details:**
- Spending: ${makingAmount} (smallest unit)
- Receiving: ${takingAmount} (smallest unit)${orderAddress}
  `.trim();
}

/**
 * Format cancel order details for display
 */
export function formatCancelOrderDetails(cancelData: any): string {
  if (!cancelData) return '';

  const isBatch = Array.isArray(cancelData.transaction);
  const count = isBatch ? cancelData.transaction.length : 1;

  return `
**Cancel Order:**
- Orders to cancel: ${count}
- Type: ${isBatch ? 'Batch cancellation' : 'Single order cancellation'}
  `.trim();
}
