export function formatDate(timestamp: number | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTypeIcon(type: string): string {
  switch (type) {
    case "swap":
      return "swap-horizontal";
    case "trigger_order":
      return "checkmark-circle";
    case "cancel_order":
      return "close-circle";
    case "send":
      return "send";
    default:
      return "help-circle";
  }
}

export function getTypeLabel(type: string): string {
  switch (type) {
    case "swap":
      return "Swap";
    case "trigger_order":
      return "Trigger Order";
    case "cancel_order":
      return "Cancel Order";
    case "send":
      return "Send";
    default:
      return type;
  }
}

const LAMPORTS_PER_SOL = 1e9;

/**
 * Format amount for display. Send SOL: lamports → "0.01 SOL". Send SPL: raw + label.
 */
export function formatAmountDisplay(
  details: Record<string, unknown>,
  transactionType: string
): string {
  if (transactionType === "send" && details.type === "sol" && details.amount != null) {
    const lamports = Number(details.amount);
    return `${(lamports / LAMPORTS_PER_SOL).toFixed(4)} SOL`;
  }
  if (transactionType === "send" && details.type === "spl" && details.amount != null) {
    return `${details.amount} (SPL token)`;
  }
  if (details.amount != null) return String(details.amount);
  return "";
}
