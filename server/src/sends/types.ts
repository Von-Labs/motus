// Send tokens (SOL or SPL) to an address

export interface SendTokensParams {
  sender: string       // Sender wallet public key
  recipient: string   // Recipient wallet public key
  amount: string      // Amount in smallest unit (lamports for SOL, token decimals for SPL)
  mint?: string       // Optional: SPL token mint address. If omitted, transfer SOL
  decimals?: number  // Required for SPL: token decimals (e.g. 6 for USDC)
}

export interface SendTokensResponse {
  transaction: string // Base64-encoded unsigned transaction
  type: 'sol' | 'spl'
  amount: string
  mint?: string
}
