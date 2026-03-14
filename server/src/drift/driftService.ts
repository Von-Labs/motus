import {
  DriftClient,
  OrderType,
  PositionDirection,
  OrderTriggerCondition,
  BASE_PRECISION,
  PRICE_PRECISION,
  MarketType,
} from '@drift-labs/sdk'
import { Connection, PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'

interface CachedClient {
  client: DriftClient
  lastUsed: number
}

const CLIENT_TTL_MS = 5 * 60 * 1000 // 5 minutes

function createReadOnlyWallet(publicKey: PublicKey) {
  return {
    publicKey,
    signTransaction: async (_tx: any): Promise<any> => {
      throw new Error('Read-only wallet cannot sign transactions')
    },
    signAllTransactions: async (_txs: any[]): Promise<any[]> => {
      throw new Error('Read-only wallet cannot sign transactions')
    },
  }
}

function serializeTx(tx: any): string {
  // Check for VersionedTransaction (has no `serializeMessage` but has `serialize`)
  if (tx.version !== undefined || !tx.serializeMessage) {
    return Buffer.from(tx.serialize()).toString('base64')
  }
  return Buffer.from(tx.serialize({ requireAllSignatures: false })).toString('base64')
}

export class DriftService {
  private static clients: Map<string, CachedClient> = new Map()
  private static cleanupInterval: ReturnType<typeof setInterval> | null = null

  private static startCleanup() {
    if (this.cleanupInterval) return
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, cached] of this.clients.entries()) {
        if (now - cached.lastUsed > CLIENT_TTL_MS) {
          cached.client.unsubscribe().catch(() => {})
          this.clients.delete(key)
        }
      }
      if (this.clients.size === 0 && this.cleanupInterval) {
        clearInterval(this.cleanupInterval)
        this.cleanupInterval = null
      }
    }, 60_000)
  }

  static async getClient(userPublicKey: string): Promise<DriftClient> {
    const cached = this.clients.get(userPublicKey)
    if (cached) {
      cached.lastUsed = Date.now()
      return cached.client
    }

    const rpcUrl = process.env.SOLANA_RPC_URL
    if (!rpcUrl) throw new Error('SOLANA_RPC_URL not configured')

    const connection = new Connection(rpcUrl, 'confirmed')
    const wallet = createReadOnlyWallet(new PublicKey(userPublicKey))

    const client = new DriftClient({
      connection: connection as any,
      wallet: wallet as any,
      env: 'mainnet-beta',
    })

    await client.subscribe()

    this.clients.set(userPublicKey, { client, lastUsed: Date.now() })
    this.startCleanup()
    return client
  }

  /**
   * Check if user has a Drift account and collateral balance
   */
  static async checkAccountStatus(userPublicKey: string): Promise<{
    hasAccount: boolean
    freeCollateral: string
    needsDeposit: boolean
  }> {
    const client = await this.getClient(userPublicKey)

    try {
      const userAccount = client.getUserAccount()
      if (!userAccount) {
        return { hasAccount: false, freeCollateral: '0', needsDeposit: true }
      }

      const user = client.getUser()
      const freeCollateral = user.getFreeCollateral()

      return {
        hasAccount: true,
        freeCollateral: freeCollateral.toString(),
        needsDeposit: freeCollateral.isZero(),
      }
    } catch {
      return { hasAccount: false, freeCollateral: '0', needsDeposit: true }
    }
  }

  /**
   * Build unsigned initialize user account transaction
   */
  static async buildInitializeAccountTx(
    userPublicKey: string,
  ): Promise<{ transaction: string }> {
    const client = await this.getClient(userPublicKey)

    const [ixs] = await client.getInitializeUserAccountIxs()
    const tx = await client.buildTransaction(ixs)
    return { transaction: serializeTx(tx) }
  }

  /**
   * Build unsigned deposit collateral transaction
   * marketIndex 0 = USDC (quote asset)
   */
  static async buildDepositTx(
    userPublicKey: string,
    amount: number,
    marketIndex: number = 0,
  ): Promise<{ transaction: string }> {
    const client = await this.getClient(userPublicKey)
    const pubkey = new PublicKey(userPublicKey)

    const associatedTokenAccount = await client.getAssociatedTokenAccount(
      marketIndex,
      false,
      undefined,
      pubkey,
    )

    const ixs = await client.getDepositTxnIx(
      new BN(amount),
      marketIndex,
      associatedTokenAccount,
    )

    const tx = await client.buildTransaction(ixs)
    return { transaction: serializeTx(tx) }
  }

  /**
   * Build unsigned withdraw collateral transaction
   * marketIndex 0 = USDC (quote asset)
   */
  static async buildWithdrawTx(
    userPublicKey: string,
    amount: number,
    marketIndex: number = 0,
  ): Promise<{ transaction: string }> {
    const client = await this.getClient(userPublicKey)
    const pubkey = new PublicKey(userPublicKey)

    const associatedTokenAccount = await client.getAssociatedTokenAccount(
      marketIndex,
      false,
      undefined,
      pubkey,
    )

    const ixs = await client.getWithdrawalIxs(
      new BN(amount),
      marketIndex,
      associatedTokenAccount,
    )

    const tx = await client.buildTransaction(ixs)
    return { transaction: serializeTx(tx) }
  }

  /**
   * Build unsigned LONG market order transaction
   */
  static async buildLongOrderTx(
    userPublicKey: string,
    marketIndex: number,
    amount: number,
  ): Promise<{ transaction: string }> {
    const client = await this.getClient(userPublicKey)

    const ix = await client.getPlacePerpOrderIx({
      marketIndex,
      orderType: OrderType.MARKET,
      direction: PositionDirection.LONG,
      baseAssetAmount: BASE_PRECISION.mul(new BN(amount)),
      price: new BN(0),
      maxTs: new BN(0),
      marketType: MarketType.PERP,
    })

    const tx = await client.buildTransaction(ix)
    return { transaction: serializeTx(tx) }
  }

  /**
   * Build unsigned SHORT market order transaction
   */
  static async buildShortOrderTx(
    userPublicKey: string,
    marketIndex: number,
    amount: number,
  ): Promise<{ transaction: string }> {
    const client = await this.getClient(userPublicKey)

    const ix = await client.getPlacePerpOrderIx({
      marketIndex,
      orderType: OrderType.MARKET,
      direction: PositionDirection.SHORT,
      baseAssetAmount: BASE_PRECISION.mul(new BN(amount)),
      price: new BN(0),
      maxTs: new BN(0),
      marketType: MarketType.PERP,
    })

    const tx = await client.buildTransaction(ix)
    return { transaction: serializeTx(tx) }
  }

  /**
   * Build unsigned limit order transaction
   */
  static async buildLimitOrderTx(
    userPublicKey: string,
    marketIndex: number,
    direction: 'LONG' | 'SHORT',
    amount: number,
    price: number,
  ): Promise<{ transaction: string }> {
    const client = await this.getClient(userPublicKey)

    const ix = await client.getPlacePerpOrderIx({
      marketIndex,
      orderType: OrderType.LIMIT,
      direction: direction === 'LONG' ? PositionDirection.LONG : PositionDirection.SHORT,
      baseAssetAmount: BASE_PRECISION.mul(new BN(amount)),
      price: PRICE_PRECISION.mul(new BN(price)),
      maxTs: new BN(0),
      marketType: MarketType.PERP,
      postOnly: true,
    })

    const tx = await client.buildTransaction(ix)
    return { transaction: serializeTx(tx) }
  }

  /**
   * Build unsigned stop loss transaction
   */
  static async buildStopLossTx(
    userPublicKey: string,
    marketIndex: number,
    amount: number,
    triggerPrice: number,
    currentDirection: 'LONG' | 'SHORT',
  ): Promise<{ transaction: string }> {
    const client = await this.getClient(userPublicKey)

    const closeDirection = currentDirection === 'LONG' ? PositionDirection.SHORT : PositionDirection.LONG

    const ix = await client.getPlacePerpOrderIx({
      orderType: OrderType.TRIGGER_MARKET,
      marketIndex,
      direction: closeDirection,
      baseAssetAmount: BASE_PRECISION.mul(new BN(amount)),
      triggerPrice: PRICE_PRECISION.mul(new BN(triggerPrice)),
      triggerCondition:
        currentDirection === 'LONG' ? OrderTriggerCondition.BELOW : OrderTriggerCondition.ABOVE,
      reduceOnly: true,
      marketType: MarketType.PERP,
      price: new BN(0),
      maxTs: new BN(0),
    })

    const tx = await client.buildTransaction(ix)
    return { transaction: serializeTx(tx) }
  }

  /**
   * Build unsigned take profit transaction
   */
  static async buildTakeProfitTx(
    userPublicKey: string,
    marketIndex: number,
    amount: number,
    triggerPrice: number,
    currentDirection: 'LONG' | 'SHORT',
  ): Promise<{ transaction: string }> {
    const client = await this.getClient(userPublicKey)

    const closeDirection = currentDirection === 'LONG' ? PositionDirection.SHORT : PositionDirection.LONG

    const ix = await client.getPlacePerpOrderIx({
      orderType: OrderType.TRIGGER_MARKET,
      marketIndex,
      direction: closeDirection,
      baseAssetAmount: BASE_PRECISION.mul(new BN(amount)),
      triggerPrice: PRICE_PRECISION.mul(new BN(triggerPrice)),
      triggerCondition:
        currentDirection === 'LONG' ? OrderTriggerCondition.ABOVE : OrderTriggerCondition.BELOW,
      reduceOnly: true,
      marketType: MarketType.PERP,
      price: new BN(0),
      maxTs: new BN(0),
    })

    const tx = await client.buildTransaction(ix)
    return { transaction: serializeTx(tx) }
  }

  /**
   * Get current perpetual positions
   */
  static async getPositions(userPublicKey: string) {
    const client = await this.getClient(userPublicKey)
    const user = client.getUser()

    const positions = (user as any).getActivePerpPositions?.() ?? (user as any).perpPositions ?? []
    const activePositions = positions.filter((pos: any) => !pos.baseAssetAmount.isZero())

    return activePositions.map((pos: any) => ({
      marketIndex: pos.marketIndex,
      baseAssetAmount: pos.baseAssetAmount.toString(),
      quoteAssetAmount: pos.quoteAssetAmount.toString(),
      lastCumulativeFundingRate: pos.lastCumulativeFundingRate.toString(),
      direction: pos.baseAssetAmount.isNeg() ? 'SHORT' : 'LONG',
    }))
  }

  /**
   * Build unsigned close position transaction
   */
  static async buildClosePositionTx(
    userPublicKey: string,
    marketIndex: number,
  ): Promise<{ transaction: string }> {
    const client = await this.getClient(userPublicKey)
    const user = client.getUser()

    const position = user.getPerpPosition(marketIndex)
    if (!position || position.baseAssetAmount.isZero()) {
      throw new Error(`No open position for market ${marketIndex}`)
    }

    const closeDirection = position.baseAssetAmount.isNeg()
      ? PositionDirection.LONG
      : PositionDirection.SHORT

    const ix = await client.getPlacePerpOrderIx({
      marketIndex,
      orderType: OrderType.MARKET,
      direction: closeDirection,
      baseAssetAmount: position.baseAssetAmount.abs(),
      price: new BN(0),
      maxTs: new BN(0),
      marketType: MarketType.PERP,
      reduceOnly: true,
    })

    const tx = await client.buildTransaction(ix)
    return { transaction: serializeTx(tx) }
  }

  /**
   * Build unsigned cancel order transaction
   */
  static async buildCancelOrderTx(
    userPublicKey: string,
    orderId: number,
  ): Promise<{ transaction: string }> {
    const client = await this.getClient(userPublicKey)

    const ix = await client.getCancelOrderIx(orderId)
    const tx = await client.buildTransaction(ix)
    return { transaction: serializeTx(tx) }
  }

  /**
   * Build unsigned cancel all orders transaction
   */
  static async buildCancelAllOrdersTx(
    userPublicKey: string,
    marketIndex?: number,
  ): Promise<{ transaction: string }> {
    const client = await this.getClient(userPublicKey)

    const ix = marketIndex !== undefined
      ? await client.getCancelOrdersIx(MarketType.PERP, marketIndex, null)
      : await client.getCancelOrdersIx(null, null, null)

    const tx = await client.buildTransaction(ix)
    return { transaction: serializeTx(tx) }
  }

  /**
   * Get all open orders
   */
  static async getOrders(userPublicKey: string, marketIndex?: number) {
    const client = await this.getClient(userPublicKey)
    const user = client.getUser()

    const orders = user.getOpenOrders()
    const filteredOrders = marketIndex !== undefined
      ? orders.filter((order) => order.marketIndex === marketIndex)
      : orders

    return filteredOrders.map((order) => ({
      orderId: order.orderId,
      marketIndex: order.marketIndex,
      orderType: (OrderType as any)[(order.orderType as any)],
      direction: (PositionDirection as any)[(order.direction as any)],
      baseAssetAmount: order.baseAssetAmount.toString(),
      price: order.price.toString(),
      triggerPrice: order.triggerPrice?.toString(),
      triggerCondition: order.triggerCondition
        ? (OrderTriggerCondition as any)[(order.triggerCondition as any)]
        : undefined,
      reduceOnly: order.reduceOnly,
      postOnly: order.postOnly,
    }))
  }

  /**
   * Get market information (no user context needed, but uses cached client)
   */
  static async getMarketInfo(marketIndex: number) {
    // Use any cached client or create a temporary one
    let client: DriftClient
    const firstCached = this.clients.values().next().value
    if (firstCached) {
      client = (firstCached as CachedClient).client
    } else {
      const rpcUrl = process.env.SOLANA_RPC_URL
      if (!rpcUrl) throw new Error('SOLANA_RPC_URL not configured')

      const connection = new Connection(rpcUrl, 'confirmed')
      // Use a dummy pubkey for market info queries (no user context needed)
      const wallet = createReadOnlyWallet(PublicKey.default)
      client = new DriftClient({
        connection: connection as any,
        wallet: wallet as any,
        env: 'mainnet-beta',
      })
      await client.subscribe()
      // Don't cache this temporary client
    }

    const market = client.getPerpMarketAccount(marketIndex)
    if (!market) {
      throw new Error(`Market ${marketIndex} not found`)
    }

    return {
      marketIndex: market.marketIndex,
      symbol: Buffer.from(market.name).toString('utf8').trim(),
      oraclePrice: market.amm.historicalOracleData.lastOraclePrice.toString(),
      markPrice: market.amm.lastMarkPriceTwap.toString(),
      fundingRate: market.amm.lastFundingRate.toString(),
      openInterest: market.amm.baseAssetAmountWithAmm.toString(),
    }
  }

  /**
   * Unsubscribe and cleanup all clients
   */
  static async cleanup() {
    for (const [key, cached] of this.clients.entries()) {
      await cached.client.unsubscribe().catch(() => {})
      this.clients.delete(key)
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}
