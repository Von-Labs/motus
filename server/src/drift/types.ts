// Drift Protocol Types

export interface PlaceLongOrderParams {
  marketIndex: number
  amount: number
  slippageBps?: number
}

export interface PlaceShortOrderParams {
  marketIndex: number
  amount: number
  slippageBps?: number
}

export interface PlaceLimitOrderParams {
  marketIndex: number
  direction: 'LONG' | 'SHORT'
  amount: number
  price: number
}

export interface SetStopLossParams {
  marketIndex: number
  amount: number
  triggerPrice: number
  currentDirection: 'LONG' | 'SHORT'
}

export interface SetTakeProfitParams {
  marketIndex: number
  amount: number
  triggerPrice: number
  currentDirection: 'LONG' | 'SHORT'
}

export interface ClosePositionParams {
  marketIndex: number
}

export interface CancelOrderParams {
  orderId: number
}

export interface CancelAllOrdersParams {
  marketIndex?: number
}

export interface GetOrdersParams {
  marketIndex?: number
}

export interface GetMarketInfoParams {
  marketIndex: number
}

export interface Position {
  marketIndex: number
  baseAssetAmount: string
  quoteAssetAmount: string
  lastCumulativeFundingRate: string
  direction: 'LONG' | 'SHORT'
}

export interface Order {
  orderId: number
  marketIndex: number
  orderType: string
  direction: string
  baseAssetAmount: string
  price: string
  triggerPrice?: string
  triggerCondition?: string
  reduceOnly: boolean
  postOnly: boolean
}

export interface MarketInfo {
  marketIndex: number
  symbol: string
  oraclePrice: string
  markPrice: string
  fundingRate: string
  openInterest: string
}
