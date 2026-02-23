/**
 * Feature flags. Toggle features on/off in one place.
 * All feature logic should branch on these constants rather than duplicating flags.
 */
export const FEATURE_FLAGS = {
  /** In-app burner wallet (top-up from MWA, sign without leaving app). */
  HOT_WALLET: true,
} as const;

export const isHotWalletEnabled = (): boolean => FEATURE_FLAGS.HOT_WALLET;
