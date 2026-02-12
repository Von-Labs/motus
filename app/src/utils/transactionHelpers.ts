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
    default:
      return type;
  }
}
