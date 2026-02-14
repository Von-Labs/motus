import {
  DriftClient,
  OrderType,
  PositionDirection,
  OrderTriggerCondition,
  BASE_PRECISION,
  PRICE_PRECISION,
  MarketType,
  User,
} from '@drift-labs/sdk'
import { Connection, PublicKey } from '@solana/web3.js'
import { Wallet, AnchorProvider } from '@coral-xyz/anchor'
import { BN } from '@coral-xyz/anchor'

export class DriftService {
  private static driftClient: DriftClient | null = null

  /**
   * Initialize DriftClient with connection and wallet
   */
  static async initialize(connection: Connection, wallet: Wallet, env: 'mainnet-beta' | 'devnet' = 'mainnet-beta') {
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    })

    this.driftClient = new DriftClient({
      connection,
      wallet: provider.wallet,
      env,
    })

    await this.driftClient.subscribe()
    return this.driftClient
  }

  /**
   * Get or create DriftClient instance
   */
  static getDriftClient(): DriftClient {
    if (!this.driftClient) {
      throw new Error('DriftClient not initialized. Call initialize() first.')
    }
    return this.driftClient
  }

  /**
   * Place a LONG market order (buy/bullish)
   */
  static async placeLongOrder(
    marketIndex: number,
    amount: number,
    slippageBps: number = 50
  ): Promise<string> {
    const client = this.getDriftClient()

    const txSig = await client.placePerpOrder({
      marketIndex,
      orderType: OrderType.MARKET,
      direction: PositionDirection.LONG,
      baseAssetAmount: BASE_PRECISION.mul(new BN(amount)),
      price: new BN(0), // Market order
      maxTs: new BN(0),
      marketType: MarketType.PERP,
    })

    return txSig
  }

  /**
   * Place a SHORT market order (sell/bearish)
   */
  static async placeShortOrder(
    marketIndex: number,
    amount: number,
    slippageBps: number = 50
  ): Promise<string> {
    const client = this.getDriftClient()

    const txSig = await client.placePerpOrder({
      marketIndex,
      orderType: OrderType.MARKET,
      direction: PositionDirection.SHORT,
      baseAssetAmount: BASE_PRECISION.mul(new BN(amount)),
      price: new BN(0), // Market order
      maxTs: new BN(0),
      marketType: MarketType.PERP,
    })

    return txSig
  }

  /**
   * Place a limit order
   */
  static async placeLimitOrder(
    marketIndex: number,
    direction: 'LONG' | 'SHORT',
    amount: number,
    price: number
  ): Promise<string> {
    const client = this.getDriftClient()

    const txSig = await client.placePerpOrder({
      marketIndex,
      orderType: OrderType.LIMIT,
      direction: direction === 'LONG' ? PositionDirection.LONG : PositionDirection.SHORT,
      baseAssetAmount: BASE_PRECISION.mul(new BN(amount)),
      price: PRICE_PRECISION.mul(new BN(price)),
      maxTs: new BN(0),
      marketType: MarketType.PERP,
      postOnly: true, // 0% maker fees
    })

    return txSig
  }

  /**
   * Set stop loss trigger order
   */
  static async setStopLoss(
    marketIndex: number,
    amount: number,
    triggerPrice: number,
    currentDirection: 'LONG' | 'SHORT'
  ): Promise<string> {
    const client = this.getDriftClient()

    // Stop loss closes the position, so direction is opposite
    const closeDirection = currentDirection === 'LONG' ? PositionDirection.SHORT : PositionDirection.LONG

    const txSig = await client.placePerpOrder({
      orderType: OrderType.TRIGGER_MARKET,
      marketIndex,
      direction: closeDirection,
      baseAssetAmount: BASE_PRECISION.mul(new BN(amount)),
      triggerPrice: PRICE_PRECISION.mul(new BN(triggerPrice)),
      triggerCondition:
        currentDirection === 'LONG' ? OrderTriggerCondition.BELOW : OrderTriggerCondition.ABOVE,
      reduceOnly: true, // Only close position, don't open new one
      marketType: MarketType.PERP,
      price: new BN(0),
      maxTs: new BN(0),
    })

    return txSig
  }

  /**
   * Set take profit trigger order
   */
  static async setTakeProfit(
    marketIndex: number,
    amount: number,
    triggerPrice: number,
    currentDirection: 'LONG' | 'SHORT'
  ): Promise<string> {
    const client = this.getDriftClient()

    // Take profit closes the position, so direction is opposite
    const closeDirection = currentDirection === 'LONG' ? PositionDirection.SHORT : PositionDirection.LONG

    const txSig = await client.placePerpOrder({
      orderType: OrderType.TRIGGER_MARKET,
      marketIndex,
      direction: closeDirection,
      baseAssetAmount: BASE_PRECISION.mul(new BN(amount)),
      triggerPrice: PRICE_PRECISION.mul(new BN(triggerPrice)),
      triggerCondition:
        currentDirection === 'LONG' ? OrderTriggerCondition.ABOVE : OrderTriggerCondition.BELOW,
      reduceOnly: true, // Only close position, don't open new one
      marketType: MarketType.PERP,
      price: new BN(0),
      maxTs: new BN(0),
    })

    return txSig
  }

  /**
   * Get current perpetual positions
   */
  static async getPositions() {
    const client = this.getDriftClient()
    const user = client.getUser()

    const positions = user.getPerpPositions()

    // Filter out empty positions
    const activePositions = positions.filter((pos) => !pos.baseAssetAmount.isZero())

    return activePositions.map((pos) => ({
      marketIndex: pos.marketIndex,
      baseAssetAmount: pos.baseAssetAmount.toString(),
      quoteAssetAmount: pos.quoteAssetAmount.toString(),
      lastCumulativeFundingRate: pos.lastCumulativeFundingRate.toString(),
      direction: pos.baseAssetAmount.isNeg() ? 'SHORT' : 'LONG',
    }))
  }

  /**
   * Close a position
   */
  static async closePosition(marketIndex: number): Promise<string> {
    const client = this.getDriftClient()
    const user = client.getUser()

    const position = user.getPerpPosition(marketIndex)
    if (!position || position.baseAssetAmount.isZero()) {
      throw new Error(`No open position for market ${marketIndex}`)
    }

    // Close direction is opposite of current position
    const closeDirection = position.baseAssetAmount.isNeg()
      ? PositionDirection.LONG
      : PositionDirection.SHORT

    const txSig = await client.placePerpOrder({
      marketIndex,
      orderType: OrderType.MARKET,
      direction: closeDirection,
      baseAssetAmount: position.baseAssetAmount.abs(),
      price: new BN(0),
      maxTs: new BN(0),
      marketType: MarketType.PERP,
      reduceOnly: true,
    })

    return txSig
  }

  /**
   * Cancel a specific order
   */
  static async cancelOrder(orderId: number): Promise<string> {
    const client = this.getDriftClient()
    const txSig = await client.cancelOrder(orderId)
    return txSig
  }

  /**
   * Cancel all orders
   */
  static async cancelAllOrders(marketIndex?: number): Promise<string> {
    const client = this.getDriftClient()

    if (marketIndex !== undefined) {
      const txSig = await client.cancelOrders(MarketType.PERP, marketIndex)
      return txSig
    } else {
      const txSig = await client.cancelOrders()
      return txSig
    }
  }

  /**
   * Get all open orders
   */
  static async getOrders(marketIndex?: number) {
    const client = this.getDriftClient()
    const user = client.getUser()

    const orders = user.getOpenOrders()

    // Filter by market index if provided
    const filteredOrders = marketIndex !== undefined
      ? orders.filter((order) => order.marketIndex === marketIndex)
      : orders

    return filteredOrders.map((order) => ({
      orderId: order.orderId,
      marketIndex: order.marketIndex,
      orderType: OrderType[order.orderType],
      direction: PositionDirection[order.direction],
      baseAssetAmount: order.baseAssetAmount.toString(),
      price: order.price.toString(),
      triggerPrice: order.triggerPrice?.toString(),
      triggerCondition: order.triggerCondition
        ? OrderTriggerCondition[order.triggerCondition]
        : undefined,
      reduceOnly: order.reduceOnly,
      postOnly: order.postOnly,
    }))
  }

  /**
   * Get market information
   */
  static async getMarketInfo(marketIndex: number) {
    const client = this.getDriftClient()
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
   * Unsubscribe and cleanup
   */
  static async cleanup() {
    if (this.driftClient) {
      await this.driftClient.unsubscribe()
      this.driftClient = null
    }
  }
}
