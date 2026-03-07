import { DriftService } from './driftService'
import { reportErrorToDiscord } from '../utils/errorReporter'
import type {
  PlaceLongOrderParams,
  PlaceShortOrderParams,
  PlaceLimitOrderParams,
  SetStopLossParams,
  SetTakeProfitParams,
  ClosePositionParams,
  CancelOrderParams,
  CancelAllOrdersParams,
  GetOrdersParams,
  GetMarketInfoParams
} from './types'

/**
 * Handle tool calls from Claude for Drift Protocol operations
 */
export async function handleToolCall(toolName: string, toolInput: any): Promise<any> {
  try {
    switch (toolName) {
      case 'place_long_order': {
        const params = toolInput as PlaceLongOrderParams
        const txSig = await DriftService.placeLongOrder(
          params.marketIndex,
          params.amount,
          params.slippageBps
        )
        return {
          success: true,
          transactionSignature: txSig,
          message: `LONG order placed successfully for market ${params.marketIndex}`,
          data: {
            marketIndex: params.marketIndex,
            direction: 'LONG',
            amount: params.amount,
            slippageBps: params.slippageBps || 50
          }
        }
      }

      case 'place_short_order': {
        const params = toolInput as PlaceShortOrderParams
        const txSig = await DriftService.placeShortOrder(
          params.marketIndex,
          params.amount,
          params.slippageBps
        )
        return {
          success: true,
          transactionSignature: txSig,
          message: `SHORT order placed successfully for market ${params.marketIndex}`,
          data: {
            marketIndex: params.marketIndex,
            direction: 'SHORT',
            amount: params.amount,
            slippageBps: params.slippageBps || 50
          }
        }
      }

      case 'place_limit_order': {
        const params = toolInput as PlaceLimitOrderParams
        const txSig = await DriftService.placeLimitOrder(
          params.marketIndex,
          params.direction,
          params.amount,
          params.price
        )
        return {
          success: true,
          transactionSignature: txSig,
          message: `${params.direction} limit order placed at $${params.price}`,
          data: {
            marketIndex: params.marketIndex,
            direction: params.direction,
            amount: params.amount,
            price: params.price
          }
        }
      }

      case 'set_stop_loss': {
        const params = toolInput as SetStopLossParams
        const txSig = await DriftService.setStopLoss(
          params.marketIndex,
          params.amount,
          params.triggerPrice,
          params.currentDirection
        )
        return {
          success: true,
          transactionSignature: txSig,
          message: `Stop loss set at $${params.triggerPrice} for ${params.currentDirection} position`,
          data: {
            marketIndex: params.marketIndex,
            amount: params.amount,
            triggerPrice: params.triggerPrice,
            currentDirection: params.currentDirection
          }
        }
      }

      case 'set_take_profit': {
        const params = toolInput as SetTakeProfitParams
        const txSig = await DriftService.setTakeProfit(
          params.marketIndex,
          params.amount,
          params.triggerPrice,
          params.currentDirection
        )
        return {
          success: true,
          transactionSignature: txSig,
          message: `Take profit set at $${params.triggerPrice} for ${params.currentDirection} position`,
          data: {
            marketIndex: params.marketIndex,
            amount: params.amount,
            triggerPrice: params.triggerPrice,
            currentDirection: params.currentDirection
          }
        }
      }

      case 'get_positions': {
        const positions = await DriftService.getPositions()
        return {
          success: true,
          message: `Found ${positions.length} open position(s)`,
          data: positions
        }
      }

      case 'close_position': {
        const params = toolInput as ClosePositionParams
        const txSig = await DriftService.closePosition(params.marketIndex)
        return {
          success: true,
          transactionSignature: txSig,
          message: `Position closed successfully for market ${params.marketIndex}`,
          data: {
            marketIndex: params.marketIndex
          }
        }
      }

      case 'cancel_order': {
        const params = toolInput as CancelOrderParams
        const txSig = await DriftService.cancelOrder(params.orderId)
        return {
          success: true,
          transactionSignature: txSig,
          message: `Order ${params.orderId} cancelled successfully`,
          data: {
            orderId: params.orderId
          }
        }
      }

      case 'cancel_all_orders': {
        const params = toolInput as CancelAllOrdersParams
        const txSig = await DriftService.cancelAllOrders(params.marketIndex)
        const msg = params.marketIndex !== undefined
          ? `All orders cancelled for market ${params.marketIndex}`
          : 'All orders cancelled across all markets'
        return {
          success: true,
          transactionSignature: txSig,
          message: msg,
          data: {
            marketIndex: params.marketIndex
          }
        }
      }

      case 'get_orders': {
        const params = toolInput as GetOrdersParams
        const orders = await DriftService.getOrders(params.marketIndex)
        const msg = params.marketIndex !== undefined
          ? `Found ${orders.length} order(s) for market ${params.marketIndex}`
          : `Found ${orders.length} open order(s)`
        return {
          success: true,
          message: msg,
          data: orders
        }
      }

      case 'get_market_info': {
        const params = toolInput as GetMarketInfoParams
        const marketInfo = await DriftService.getMarketInfo(params.marketIndex)
        return {
          success: true,
          message: `Retrieved market info for ${marketInfo.symbol}`,
          data: marketInfo
        }
      }

      default:
        return {
          success: false,
          error: `Unknown Drift tool: ${toolName}`
        }
    }
  } catch (error) {
    console.error(`Error in Drift tool ${toolName}:`, error)
    reportErrorToDiscord(error instanceof Error ? error.message : String(error), { source: `Drift > ${toolName}` }).catch(() => {})
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      toolName,
      toolInput
    }
  }
}
