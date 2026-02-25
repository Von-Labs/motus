const DICEBEAR_BASE_URL = "https://api.dicebear.com/9.x/thumbs/png";

export function getAvatarUrl(seed: string | undefined | null): string | null {
  if (!seed) return null;
  return `${DICEBEAR_BASE_URL}?seed=${encodeURIComponent(seed)}&backgroundColor=0f0f23`;
}
