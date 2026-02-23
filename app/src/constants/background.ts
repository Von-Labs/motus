export type BackgroundKey = 'default' | 'soft' | 'warm'

export const BACKGROUND_BY_SCREEN: Record<string, BackgroundKey> = {
  chat: 'default',
  bluetooth: 'default',
  allChats: 'default',
  settings: 'soft',
  usage: 'soft',
  hotWallet: 'warm',
  transactions: 'warm',
  transactionDetail: 'warm',
}

export const getBackgroundKeyForScreen = (screen: string | null): BackgroundKey =>
  BACKGROUND_BY_SCREEN[screen || 'chat'] ?? 'default'

