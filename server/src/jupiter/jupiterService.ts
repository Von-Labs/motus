import {
  SwapParams,
  QuoteResponse,
  PriceResponse,
  TokenSearchResult,
  HoldingsResponse,
  LimitOrderParams,
  DCAOrderParams,
  PortfolioPosition,
  SecurityCheck,
  PortfolioPositionsResponse,
  Platform,
  StakedJupResponse,
  CreateTriggerOrderParams,
  CreateTriggerOrderResponse,
  CancelTriggerOrderParams,
  CancelTriggerOrdersParams,
  CancelTriggerOrderResponse,
  ExecuteTriggerParams,
  ExecuteTriggerResponse,
  GetTriggerOrdersParams,
  GetTriggerOrdersResponse
} from './types'

const JUPITER_API_BASE = 'https://api.jup.ag'
const JUPITER_API_KEY = process.env.JUPITER_API_KEY || ''

// Helper to make API requests
async function jupiterRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(JUPITER_API_KEY && { 'x-api-key': JUPITER_API_KEY }),
    ...options.headers
  }

  const response = await fetch(`${JUPITER_API_BASE}${endpoint}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Jupiter API Error: ${response.status} - ${error}`)
  }

  return response.json()
}

export class JupiterService {
  // 1. Ultra Swap - Get Quote with transaction
  static async getSwapQuote(params: SwapParams): Promise<QuoteResponse> {
    const { inputMint, outputMint, amount, slippageBps = 50, userPublicKey } = params

    const queryParams = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
      taker: userPublicKey  // Required to get transaction in response
    })

    return jupiterRequest<QuoteResponse>(
      `/ultra/v1/order?${queryParams.toString()}`
    )
  }

  // 2. Ultra Swap - Execute
  static async executeSwap(params: SwapParams) {
    const quote = await this.getSwapQuote(params)

    return jupiterRequest('/ultra/v1/execute', {
      method: 'POST',
      body: JSON.stringify({
        order: quote,
        userPublicKey: params.userPublicKey
      })
    })
  }

  // 3. Get Token Prices
  static async getTokenPrices(mints: string[]): Promise<PriceResponse> {
    if (mints.length > 50) {
      throw new Error('Maximum 50 tokens per request')
    }

    const ids = mints.join(',')
    return jupiterRequest<PriceResponse>(`/price/v3?ids=${ids}`)
  }

  // 4. Search Tokens
  static async searchTokens(query: string): Promise<TokenSearchResult[]> {
    const response = await jupiterRequest<TokenSearchResult[]>(
      `/tokens/v2/search?query=${encodeURIComponent(query)}`
    )
    // API returns array directly, take top 10
    return (Array.isArray(response) ? response : []).slice(0, 10).map((token: any) => ({
      address: token.id || token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoURI: token.icon || token.logoURI,
      tags: token.tags
    }))
  }

  // 5. Get Wallet Holdings
  static async getWalletHoldings(address: string): Promise<HoldingsResponse> {
    return jupiterRequest<HoldingsResponse>(`/ultra/v1/holdings/${address}`)
  }

  // 6. Create Limit Order (Legacy - use createTriggerOrder for full control)
  static async createLimitOrder(params: LimitOrderParams) {
    return jupiterRequest('/trigger/v1/createOrder', {
      method: 'POST',
      body: JSON.stringify({
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        inAmount: params.inAmount,
        limitPrice: params.limitPrice,
        userPublicKey: params.userPublicKey,
        expiry: params.expiry
      })
    })
  }

  // 6a. Create Trigger Order (New comprehensive API)
  static async createTriggerOrder(
    params: CreateTriggerOrderParams
  ): Promise<CreateTriggerOrderResponse> {
    return jupiterRequest<CreateTriggerOrderResponse>('/trigger/v1/createOrder', {
      method: 'POST',
      body: JSON.stringify({
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        maker: params.maker,
        payer: params.payer,
        params: {
          makingAmount: params.makingAmount,
          takingAmount: params.takingAmount,
          ...(params.expiredAt && { expiredAt: params.expiredAt }),
          ...(params.slippageBps !== undefined && { slippageBps: params.slippageBps }),
          ...(params.feeBps !== undefined && { feeBps: params.feeBps })
        },
        ...(params.feeAccount && { feeAccount: params.feeAccount }),
        ...(params.computeUnitPrice !== undefined && { computeUnitPrice: params.computeUnitPrice }),
        ...(params.wrapAndUnwrapSol !== undefined && { wrapAndUnwrapSol: params.wrapAndUnwrapSol })
      })
    })
  }

  // 6b. Cancel Trigger Order
  static async cancelTriggerOrder(
    params: CancelTriggerOrderParams
  ): Promise<CancelTriggerOrderResponse> {
    return jupiterRequest<CancelTriggerOrderResponse>('/trigger/v1/cancelOrder', {
      method: 'POST',
      body: JSON.stringify({
        maker: params.maker,
        order: params.order,
        ...(params.computeUnitPrice !== undefined && { computeUnitPrice: params.computeUnitPrice })
      })
    })
  }

  // 6c. Cancel Multiple Trigger Orders
  static async cancelTriggerOrders(
    params: CancelTriggerOrdersParams
  ): Promise<CancelTriggerOrderResponse> {
    return jupiterRequest<CancelTriggerOrderResponse>('/trigger/v1/cancelOrders', {
      method: 'POST',
      body: JSON.stringify({
        maker: params.maker,
        ...(params.orders && { orders: params.orders }),
        ...(params.computeUnitPrice !== undefined && { computeUnitPrice: params.computeUnitPrice })
      })
    })
  }

  // 6d. Execute Trigger Order
  static async executeTriggerOrder(
    params: ExecuteTriggerParams
  ): Promise<ExecuteTriggerResponse> {
    return jupiterRequest<ExecuteTriggerResponse>('/trigger/v1/execute', {
      method: 'POST',
      body: JSON.stringify({
        requestId: params.requestId,
        signedTransaction: params.signedTransaction
      })
    })
  }

  // 7. Get Trigger Orders (Legacy - use getTriggerOrdersDetailed)
  static async getTriggerOrders(walletAddress: string) {
    return jupiterRequest(
      `/trigger/v1/getTriggerOrders?wallet=${walletAddress}`
    )
  }

  // 7a. Get Trigger Orders Detailed
  static async getTriggerOrdersDetailed(
    params: GetTriggerOrdersParams
  ): Promise<GetTriggerOrdersResponse> {
    const queryParams = new URLSearchParams({
      user: params.user,
      orderStatus: params.orderStatus,
      ...(params.page && { page: params.page.toString() }),
      ...(params.includeFailedTx !== undefined && { includeFailedTx: params.includeFailedTx.toString() }),
      ...(params.inputMint && { inputMint: params.inputMint }),
      ...(params.outputMint && { outputMint: params.outputMint })
    })

    return jupiterRequest<GetTriggerOrdersResponse>(
      `/trigger/v1/getTriggerOrders?${queryParams.toString()}`
    )
  }

  // 8. Create DCA Order
  static async createDCAOrder(params: DCAOrderParams) {
    return jupiterRequest('/recurring/v1/createOrder', {
      method: 'POST',
      body: JSON.stringify({
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        inAmount: params.inAmount,
        cycleFrequency: params.cycleFrequency,
        numOrders: params.numOrders,
        userPublicKey: params.userPublicKey
      })
    })
  }

  // 9. Get Recurring Orders
  static async getRecurringOrders(walletAddress: string) {
    return jupiterRequest(
      `/recurring/v1/getRecurringOrders?wallet=${walletAddress}`
    )
  }

  // 10. Get Portfolio Positions (Deprecated - use getDetailedPortfolioPositions)
  static async getPortfolioPositions(
    walletAddress: string
  ): Promise<{ positions: PortfolioPosition[]; totalValue: number }> {
    return jupiterRequest(
      `/portfolio/v1/positions?wallet=${walletAddress}`
    )
  }

  // 10a. Get Detailed Portfolio Positions (New Portfolio API)
  static async getDetailedPortfolioPositions(
    walletAddress: string,
    platforms?: string[]
  ): Promise<PortfolioPositionsResponse> {
    let endpoint = `/portfolio/v1/positions/${walletAddress}`

    if (platforms && platforms.length > 0) {
      endpoint += `?platforms=${platforms.join(',')}`
    }

    return jupiterRequest<PortfolioPositionsResponse>(endpoint)
  }

  // 10b. Get Supported Platforms
  static async getSupportedPlatforms(): Promise<Platform[]> {
    return jupiterRequest<Platform[]>('/portfolio/v1/platforms')
  }

  // 10c. Get Staked JUP
  static async getStakedJup(walletAddress: string): Promise<StakedJupResponse> {
    return jupiterRequest<StakedJupResponse>(
      `/portfolio/v1/staked-jup/${walletAddress}`
    )
  }

  // 11. Check Token Security
  static async checkTokenSecurity(mints: string[]): Promise<SecurityCheck> {
    const mintsParam = mints.join(',')
    return jupiterRequest<SecurityCheck>(`/ultra/v1/shield?mints=${mintsParam}`)
  }

  // 12. Ultra Search (up to 100 mints)
  static async ultraSearch(queries: string[]): Promise<any> {
    if (queries.length > 100) {
      throw new Error('Maximum 100 mints per request')
    }

    const query = queries.join(',')
    return jupiterRequest(`/ultra/v1/search?query=${encodeURIComponent(query)}`)
  }
}
