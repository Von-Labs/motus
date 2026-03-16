import { createWalletTransaction } from "./database";
import {
  signAndSendTransactionFromBase64,
  type HotWalletSignerOptions,
} from "./transactionSigner";
import { reportErrorToDiscord } from "./errorReporter";

export interface SwapHandlerOptions {
  hotWallet?: HotWalletSignerOptions | null;
  cluster?: string;
}

/**
 * Handle swap transaction from Claude tool response
 * @param swapData - The swap_tokens tool result containing transaction
 * @param options - Optional hot wallet signer (from useHotWallet) and cluster
 * @returns Transaction signature
 */
export async function handleSwapTransaction(
  swapData: any,
  options?: SwapHandlerOptions,
): Promise<string> {
  if (!swapData.transaction) {
    throw new Error("No transaction found in swap data");
  }

  const { signature, signer } = await signAndSendTransactionFromBase64(
    swapData.transaction,
    {
      cluster: options?.cluster ?? "mainnet-beta",
      hotWallet: options?.hotWallet ?? null,
    },
  );

  try {
    await createWalletTransaction(
      "swap",
      signature,
      "success",
      {
        inputMint: swapData.inputMint,
        outputMint: swapData.outputMint,
        inAmount: swapData.inAmount,
        outAmount: swapData.outAmount,
        priceImpactPct: swapData.priceImpactPct,
      },
      signer,
    );
  } catch (error: any) {
    console.error("Failed to save transaction to database:", error);
    reportErrorToDiscord(error?.message || String(error), { source: 'swapHandler > handleSwapTransaction (db save)' }).catch(() => {});
  }

  return signature;
}

/**
 * Handle trigger order transaction (limit order, cancel order, etc.)
 * @param triggerData - The trigger tool result containing transaction
 * @param options - Optional hot wallet signer and cluster
 * @returns Transaction signature
 */
export async function handleTriggerTransaction(
  triggerData: any,
  options?: SwapHandlerOptions,
): Promise<string> {
  if (!triggerData.transaction) {
    throw new Error("No transaction found in trigger data");
  }

  const { signature, signer } = await signAndSendTransactionFromBase64(
    triggerData.transaction,
    {
      cluster: options?.cluster ?? "mainnet-beta",
      hotWallet: options?.hotWallet ?? null,
    },
  );

  try {
    const isCancelOrder = !(
      "makingAmount" in triggerData || "order" in triggerData
    );
    const type = isCancelOrder ? "cancel_order" : "trigger_order";

    await createWalletTransaction(
      type,
      signature,
      "success",
      {
        requestId: triggerData.requestId,
        order: triggerData.order,
        makingAmount: triggerData.makingAmount,
        takingAmount: triggerData.takingAmount,
      },
      signer,
    );
  } catch (error: any) {
    console.error("Failed to save transaction to database:", error);
    reportErrorToDiscord(error?.message || String(error), { source: 'swapHandler > handleTriggerTransaction (db save)' }).catch(() => {});
  }

  return signature;
}

export type SolanaCluster = 'mainnet-beta' | 'devnet';

/**
 * Handle send token transaction (SOL or SPL) from /api/sends/prepare response
 * @param sendData - Response from POST /api/sends/prepare: { transaction, type, amount, mint? }
 * @param cluster - Network: 'mainnet-beta' or 'devnet'. Must match server SOLANA_RPC_URL.
 * @returns Transaction signature
 */
export async function handleSendTransaction(
  sendData: {
    transaction: string;
    type: 'sol' | 'spl';
    amount: string;
    mint?: string;
    decimals?: number;
    symbol?: string;
    name?: string;
  },
  cluster: SolanaCluster = 'mainnet-beta'
): Promise<string> {
  if (!sendData.transaction) {
    throw new Error("No transaction found in send data");
  }

  const { signature, signer } = await signAndSendTransactionFromBase64(
    sendData.transaction,
    { cluster },
  );

  try {
    const details: Record<string, unknown> = {
      type: sendData.type,
      amount: sendData.amount,
      mint: sendData.mint,
    };
    if (sendData.decimals != null) details.decimals = sendData.decimals;
    details.symbol = sendData.symbol || sendData.name || null;
    details.name = sendData.name || null;
    await createWalletTransaction('send', signature, 'success', details, signer);
  } catch (error: any) {
    console.error('Failed to save send transaction to database:', error);
    reportErrorToDiscord(error?.message || String(error), { source: 'swapHandler > handleSendTransaction (db save)' }).catch(() => {});
  }

  return signature;
}

/**
 * Check if a tool result contains a send token transaction
 */
export function isSendTransaction(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    'transaction' in data &&
    'type' in data &&
    (data.type === 'sol' || data.type === 'spl')
  );
}

/**
 * Format send token details for display
 */
export function formatSendDetails(sendData: any): string {
  if (!sendData) return '';

  const isSol = sendData.type === 'sol';
  const amount = sendData.amount || '?';

  return `
**Send ${isSol ? 'SOL' : 'SPL Token'} Transaction:**
- Amount: ${amount} (smallest unit)
${sendData.mint ? `- Token Mint: \`${sendData.mint.slice(0, 8)}...${sendData.mint.slice(-8)}\`` : ''}
  `.trim();
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

/**
 * Handle Drift Protocol perpetual transaction (LONG/SHORT/limit orders)
 * Now uses client-side signing like Jupiter pattern.
 * @param driftData - The Drift tool result containing unsigned transaction
 * @param toolName - Name of the Drift tool used
 * @param options - Optional hot wallet signer and cluster
 * @returns Transaction signature
 */
export async function handleDriftTransaction(
  driftData: any,
  toolName: string,
  options?: SwapHandlerOptions,
): Promise<string> {
  if (!driftData.transaction) {
    throw new Error("No transaction found in Drift data");
  }

  const { signature, signer } = await signAndSendTransactionFromBase64(
    driftData.transaction,
    {
      cluster: options?.cluster ?? "mainnet-beta",
      hotWallet: options?.hotWallet ?? null,
    },
  );

  try {
    const type = driftData.type || 'drift_other';
    const { transaction: _tx, ...metadata } = driftData;
    await createWalletTransaction(type, signature, 'success', metadata, signer);
  } catch (error: any) {
    console.error('Failed to save Drift transaction to database:', error);
    reportErrorToDiscord(error?.message || String(error), { source: 'swapHandler > handleDriftTransaction (db save)' }).catch(() => {});
  }

  return signature;
}

/**
 * Check if a tool result is a Drift transaction that needs signing
 */
export function isDriftSignableTransaction(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    'transaction' in data &&
    'type' in data &&
    typeof data.type === 'string' &&
    data.type.startsWith('drift_')
  );
}

/**
 * Format Drift order details for display
 */
export function formatDriftOrderDetails(driftData: any): string {
  if (!driftData) return '';

  const type = driftData.type;

  if (type === 'drift_initialize_account') {
    return '**Initialize Drift Account**';
  }

  if (type === 'drift_deposit') {
    return `
**Drift Deposit:**
- Amount: ${driftData.amount} (smallest unit)
- Market Index: ${driftData.marketIndex || 0}
    `.trim();
  }

  if (type === 'drift_withdraw') {
    return `
**Drift Withdraw:**
- Amount: ${driftData.amount} (smallest unit)
- Market Index: ${driftData.marketIndex || 0}
    `.trim();
  }

  if (type === 'drift_market_order') {
    return `
**Drift ${driftData.direction} Order:**
- Market Index: ${driftData.marketIndex}
- Amount: ${driftData.amount}
- Slippage: ${(driftData.slippageBps || 50) / 100}%
    `.trim();
  }

  if (type === 'drift_limit_order') {
    return `
**Drift Limit Order:**
- Market Index: ${driftData.marketIndex}
- Direction: ${driftData.direction}
- Amount: ${driftData.amount}
- Price: $${driftData.price}
    `.trim();
  }

  if (type === 'drift_stop_loss') {
    return `
**Drift Stop Loss:**
- Market Index: ${driftData.marketIndex}
- Amount: ${driftData.amount}
- Trigger Price: $${driftData.triggerPrice}
- Position: ${driftData.currentDirection}
    `.trim();
  }

  if (type === 'drift_take_profit') {
    return `
**Drift Take Profit:**
- Market Index: ${driftData.marketIndex}
- Amount: ${driftData.amount}
- Trigger Price: $${driftData.triggerPrice}
- Position: ${driftData.currentDirection}
    `.trim();
  }

  if (type === 'drift_close_position') {
    return `
**Drift Close Position:**
- Market Index: ${driftData.marketIndex}
    `.trim();
  }

  if (type === 'drift_cancel_order' || type === 'drift_cancel_all_orders') {
    return `
**Drift Cancel Order:**
${driftData.orderId ? `- Order ID: ${driftData.orderId}` : `- Cancel all${driftData.marketIndex !== undefined ? ` for market ${driftData.marketIndex}` : ''}`}
    `.trim();
  }

  return '';
}
