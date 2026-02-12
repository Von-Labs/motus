// Jupiter API Types

export interface SwapParams {
  inputMint: string
  outputMint: string
  amount: number
  slippageBps?: number
  userPublicKey: string
}

export interface QuoteResponse {
  inputMint: string
  outputMint: string
  inAmount: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  slippageBps: number
  priceImpactPct: string
  platformFee?: {
    amount: string
    feeBps: number
  }
  routePlan: Array<{
    swapInfo: {
      ammKey: string
      label: string
      inputMint: string
      outputMint: string
      inAmount: string
      outAmount: string
      feeAmount: string
      feeMint: string
    }
  }>
  contextSlot?: number
  timeTaken?: number
  transaction?: string  // Base64 encoded unsigned transaction
  requestId?: string    // Required for execution
}

export interface PriceResponse {
  data: {
    [mintAddress: string]: {
      id: string
      type?: string
      price: number
      extraInfo?: any
    }
  }
  timeTaken: number
}

export interface TokenSearchResult {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
  tags?: string[]
  daily_volume?: number
}

export interface HoldingsResponse {
  tokens: Array<{
    address: string
    mint: string
    amount: string
    decimals: number
    uiAmount: number
  }>
  solBalance: number
}

// Trigger API (Limit Orders) Types
export interface CreateTriggerOrderParams {
  inputMint: string
  outputMint: string
  maker: string
  payer: string
  makingAmount: string
  takingAmount: string
  expiredAt?: number
  slippageBps?: number
  feeBps?: number
  feeAccount?: string
  computeUnitPrice?: number
  wrapAndUnwrapSol?: boolean
}

export interface CreateTriggerOrderResponse {
  requestId: string
  transaction: string  // Base64 encoded unsigned transaction
  order: string        // Order account address
}

export interface CancelTriggerOrderParams {
  maker: string
  order: string
  computeUnitPrice?: number
}

export interface CancelTriggerOrdersParams {
  maker: string
  orders?: string[]  // Empty array cancels all orders
  computeUnitPrice?: number
}

export interface CancelTriggerOrderResponse {
  requestId: string
  transaction: string | string[]  // Single or array of base64 transactions
}

export interface ExecuteTriggerParams {
  requestId: string
  signedTransaction: string  // Base64 signed transaction
}

export interface ExecuteTriggerResponse {
  signature: string
  status: 'Success' | 'Failed'
  code?: number
  error?: string
}

export interface TriggerOrderTrade {
  keeper: string
  makingAmount: string
  takingAmount: string
  fee: string
  timestamp: number
  txHash: string
}

export interface TriggerOrder {
  orderKey: string
  inputMint: string
  outputMint: string
  makingAmount: string
  takingAmount: string
  remainingMakingAmount: string
  remainingTakingAmount: string
  status: 'Open' | 'Completed' | 'Cancelled'
  trades: TriggerOrderTrade[]
  expiredAt: number | null
  createdAt: number
}

export interface GetTriggerOrdersParams {
  user: string
  orderStatus: 'active' | 'history'
  page?: number
  includeFailedTx?: boolean
  inputMint?: string
  outputMint?: string
}

export interface GetTriggerOrdersResponse {
  user: string
  orderStatus: string
  orders: TriggerOrder[]
  totalPages: number
  page: number
}

// Legacy type for backward compatibility
export interface LimitOrderParams {
  inputMint: string
  outputMint: string
  inAmount: string
  limitPrice: number
  userPublicKey: string
  expiry?: number
}

export interface DCAOrderParams {
  inputMint: string
  outputMint: string
  inAmount: string
  cycleFrequency: number
  numOrders: number
  userPublicKey: string
}

export interface PortfolioPosition {
  protocol: string
  type: string
  value: number
  tokens: Array<{
    mint: string
    amount: number
    value: number
  }>
}

export interface SecurityCheck {
  [mintAddress: string]: {
    freezeAuthority: boolean | null
    mintAuthority: boolean | null
    warnings: string[]
  }
}

// Portfolio API Types
export interface PortfolioAsset {
  type: 'generic' | 'token' | 'collectible'
  networkId: string
  value: number
  attributes?: {
    isClaimable?: boolean
    lockedUntil?: number
    isDeprecated?: boolean
    validatorUrl?: string
  }
  data?: {
    address?: string
    amount?: number
    decimals?: number
    price?: number
  }
}

export interface PortfolioElement {
  type: 'multiple' | 'liquidity' | 'leverage' | 'borrowlend' | 'trade'
  networkId: string
  platformId: string
  label: string
  value: number
  name?: string
  data?: {
    assets: PortfolioAsset[]
    yields?: Array<{
      apy: number
      apr?: number
      type: string
    }>
    healthFactor?: number
    liquidationThreshold?: number
  }
}

export interface FetcherReport {
  id: string
  status: 'success' | 'error'
  duration: number
  error?: string
}

export interface TokenInfo {
  address: string
  decimals: number
  symbol?: string
  name?: string
  logoURI?: string
}

export interface PortfolioPositionsResponse {
  date: number
  owner: string
  fetcherReports: FetcherReport[]
  elements: PortfolioElement[]
  duration: number
  tokenInfo: {
    [networkId: string]: {
      [address: string]: TokenInfo
    }
  }
}

export interface Platform {
  id: string
  name: string
  image?: string
  description?: string
  defiLlamaId?: string
  isDeprecated: boolean
  tokens?: string[]
  tags?: string[]
  links?: {
    website?: string
    discord?: string
    github?: string
    twitter?: string
    telegram?: string
  }
}

export interface StakedJupResponse {
  stakedAmount: number
  unstaking: Array<{
    amount: number
    unlockTimestamp: number
  }>
}
