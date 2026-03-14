// Drift Protocol Types

export interface InitializeDriftAccountParams {
  userPublicKey: string
}

export interface DepositDriftCollateralParams {
  amount: number
  marketIndex?: number
  userPublicKey: string
}

export interface WithdrawDriftCollateralParams {
  amount: number
  marketIndex?: number
  userPublicKey: string
}

export interface PlaceLongOrderParams {
  marketIndex: number
  amount: number
  slippageBps?: number
  userPublicKey: string
}

export interface PlaceShortOrderParams {
  marketIndex: number
  amount: number
  slippageBps?: number
  userPublicKey: string
}

export interface PlaceLimitOrderParams {
  marketIndex: number
  direction: 'LONG' | 'SHORT'
  amount: number
  price: number
  userPublicKey: string
}

export interface SetStopLossParams {
  marketIndex: number
  amount: number
  triggerPrice: number
  currentDirection: 'LONG' | 'SHORT'
  userPublicKey: string
}

export interface SetTakeProfitParams {
  marketIndex: number
  amount: number
  triggerPrice: number
  currentDirection: 'LONG' | 'SHORT'
  userPublicKey: string
}

export interface ClosePositionParams {
  marketIndex: number
  userPublicKey: string
}

export interface CancelOrderParams {
  orderId: number
  userPublicKey: string
}

export interface CancelAllOrdersParams {
  marketIndex?: number
  userPublicKey: string
}

export interface GetPositionsParams {
  userPublicKey: string
}

export interface GetOrdersParams {
  marketIndex?: number
  userPublicKey: string
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
