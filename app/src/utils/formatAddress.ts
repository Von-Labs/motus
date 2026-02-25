/**
 * Truncates a long string (typically a wallet address or username) to fit
 * within `maxLen` characters by keeping the start and end and inserting "...".
 *
 * Short strings are returned as-is.
 */
export function truncateAddress(
  value: string | null | undefined,
  maxLen = 16,
): string {
  if (!value) return "Unknown";
  if (value.length <= maxLen) return value;
  const keep = Math.floor((maxLen - 3) / 2);
  return `${value.slice(0, keep)}...${value.slice(-keep)}`;
}
