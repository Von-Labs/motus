import { createWalletTransaction } from "./database";
import {
  signAndSendTransactionFromBase64,
  type HotWalletSignerOptions,
} from "./transactionSigner";

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
  } catch (error) {
    console.error("Failed to save transaction to database:", error);
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
  } catch (error) {
    console.error("Failed to save transaction to database:", error);
  }

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

/**
 * Handle Drift Protocol perpetual transaction (LONG/SHORT/limit orders)
 * @param driftData - The Drift tool result containing transaction
 * @param toolName - Name of the Drift tool used
 * @returns Transaction signature
 */
export async function handleDriftTransaction(
  driftData: any,
  toolName: string
): Promise<string> {
  if (!driftData.transactionSignature) {
    throw new Error("No transaction signature found in Drift data");
  }

  const signature = driftData.transactionSignature;

  // Save transaction to database
  try {
    // Determine transaction type based on tool name
    let type: string;
    if (toolName === 'place_long_order' || toolName === 'place_short_order') {
      type = 'drift_market_order';
    } else if (toolName === 'place_limit_order') {
      type = 'drift_limit_order';
    } else if (toolName === 'set_stop_loss') {
      type = 'drift_stop_loss';
    } else if (toolName === 'set_take_profit') {
      type = 'drift_take_profit';
    } else if (toolName === 'close_position') {
      type = 'drift_close_position';
    } else if (toolName === 'cancel_order' || toolName === 'cancel_all_orders') {
      type = 'drift_cancel_order';
    } else {
      type = 'drift_other';
    }

    await createWalletTransaction(
      type,
      signature,
      'success',
      driftData.data
    );
  } catch (error) {
    console.error('Failed to save Drift transaction to database:', error);
  }

  return signature;
}

/**
 * Check if a tool result is a Drift transaction
 */
export function isDriftTransaction(data: any, toolName?: string): boolean {
  // Check if it's a Drift tool by name
  const driftToolNames = [
    'place_long_order',
    'place_short_order',
    'place_limit_order',
    'set_stop_loss',
    'set_take_profit',
    'get_positions',
    'close_position',
    'cancel_order',
    'cancel_all_orders',
    'get_orders',
    'get_market_info'
  ];

  if (toolName && driftToolNames.includes(toolName)) {
    return true;
  }

  // Check by data structure
  return (
    data &&
    typeof data === 'object' &&
    'success' in data &&
    data.success === true &&
    ('transactionSignature' in data || 'data' in data)
  );
}

/**
 * Format Drift order details for display
 */
export function formatDriftOrderDetails(driftData: any, toolName: string): string {
  if (!driftData || !driftData.data) return '';

  const data = driftData.data;

  if (toolName === 'place_long_order' || toolName === 'place_short_order') {
    return `
**Drift ${data.direction} Order:**
- Market Index: ${data.marketIndex}
- Amount: ${data.amount}
- Slippage: ${(data.slippageBps || 50) / 100}%
    `.trim();
  }

  if (toolName === 'place_limit_order') {
    return `
**Drift Limit Order:**
- Market Index: ${data.marketIndex}
- Direction: ${data.direction}
- Amount: ${data.amount}
- Price: $${data.price}
    `.trim();
  }

  if (toolName === 'set_stop_loss') {
    return `
**Drift Stop Loss:**
- Market Index: ${data.marketIndex}
- Amount: ${data.amount}
- Trigger Price: $${data.triggerPrice}
- Position: ${data.currentDirection}
    `.trim();
  }

  if (toolName === 'set_take_profit') {
    return `
**Drift Take Profit:**
- Market Index: ${data.marketIndex}
- Amount: ${data.amount}
- Trigger Price: $${data.triggerPrice}
- Position: ${data.currentDirection}
    `.trim();
  }

  if (toolName === 'close_position') {
    return `
**Drift Close Position:**
- Market Index: ${data.marketIndex}
    `.trim();
  }

  return '';
}
