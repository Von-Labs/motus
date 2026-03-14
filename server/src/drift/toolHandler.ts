import { DriftService } from './driftService'
import { reportErrorToDiscord } from '../utils/errorReporter'
import type {
  InitializeDriftAccountParams,
  DepositDriftCollateralParams,
  WithdrawDriftCollateralParams,
  PlaceLongOrderParams,
  PlaceShortOrderParams,
  PlaceLimitOrderParams,
  SetStopLossParams,
  SetTakeProfitParams,
  ClosePositionParams,
  CancelOrderParams,
  CancelAllOrdersParams,
  GetPositionsParams,
  GetOrdersParams,
  GetMarketInfoParams
} from './types'

/**
 * Handle tool calls from Claude for Drift Protocol operations.
 * Write operations return unsigned transactions for client-side signing.
 */
export async function handleToolCall(toolName: string, toolInput: any): Promise<any> {
  try {
    switch (toolName) {
      case 'check_drift_account': {
        const { userPublicKey } = toolInput
        const status = await DriftService.checkAccountStatus(userPublicKey)
        return {
          success: true,
          ...status,
          message: !status.hasAccount
            ? 'User does not have a Drift account. Call initialize_drift_account first.'
            : status.needsDeposit
              ? 'User has a Drift account but no collateral. Call deposit_drift_collateral first.'
              : `User has a Drift account with ${status.freeCollateral} free collateral (QUOTE_PRECISION).`,
        }
      }

      case 'initialize_drift_account': {
        const params = toolInput as InitializeDriftAccountParams
        const { transaction } = await DriftService.buildInitializeAccountTx(
          params.userPublicKey,
        )
        return {
          transaction,
          type: 'drift_initialize_account',
        }
      }

      case 'deposit_drift_collateral': {
        const params = toolInput as DepositDriftCollateralParams
        const { transaction } = await DriftService.buildDepositTx(
          params.userPublicKey,
          params.amount,
          params.marketIndex,
        )
        return {
          transaction,
          type: 'drift_deposit',
          amount: params.amount,
          marketIndex: params.marketIndex || 0,
        }
      }

      case 'withdraw_drift_collateral': {
        const params = toolInput as WithdrawDriftCollateralParams
        const { transaction } = await DriftService.buildWithdrawTx(
          params.userPublicKey,
          params.amount,
          params.marketIndex,
        )
        return {
          transaction,
          type: 'drift_withdraw',
          amount: params.amount,
          marketIndex: params.marketIndex || 0,
        }
      }

      case 'place_long_order': {
        const params = toolInput as PlaceLongOrderParams
        const { transaction } = await DriftService.buildLongOrderTx(
          params.userPublicKey,
          params.marketIndex,
          params.amount,
        )
        return {
          transaction,
          type: 'drift_market_order',
          direction: 'LONG',
          marketIndex: params.marketIndex,
          amount: params.amount,
          slippageBps: params.slippageBps || 50,
        }
      }

      case 'place_short_order': {
        const params = toolInput as PlaceShortOrderParams
        const { transaction } = await DriftService.buildShortOrderTx(
          params.userPublicKey,
          params.marketIndex,
          params.amount,
        )
        return {
          transaction,
          type: 'drift_market_order',
          direction: 'SHORT',
          marketIndex: params.marketIndex,
          amount: params.amount,
          slippageBps: params.slippageBps || 50,
        }
      }

      case 'place_limit_order': {
        const params = toolInput as PlaceLimitOrderParams
        const { transaction } = await DriftService.buildLimitOrderTx(
          params.userPublicKey,
          params.marketIndex,
          params.direction,
          params.amount,
          params.price,
        )
        return {
          transaction,
          type: 'drift_limit_order',
          direction: params.direction,
          marketIndex: params.marketIndex,
          amount: params.amount,
          price: params.price,
        }
      }

      case 'set_stop_loss': {
        const params = toolInput as SetStopLossParams
        const { transaction } = await DriftService.buildStopLossTx(
          params.userPublicKey,
          params.marketIndex,
          params.amount,
          params.triggerPrice,
          params.currentDirection,
        )
        return {
          transaction,
          type: 'drift_stop_loss',
          marketIndex: params.marketIndex,
          amount: params.amount,
          triggerPrice: params.triggerPrice,
          currentDirection: params.currentDirection,
        }
      }

      case 'set_take_profit': {
        const params = toolInput as SetTakeProfitParams
        const { transaction } = await DriftService.buildTakeProfitTx(
          params.userPublicKey,
          params.marketIndex,
          params.amount,
          params.triggerPrice,
          params.currentDirection,
        )
        return {
          transaction,
          type: 'drift_take_profit',
          marketIndex: params.marketIndex,
          amount: params.amount,
          triggerPrice: params.triggerPrice,
          currentDirection: params.currentDirection,
        }
      }

      case 'get_positions': {
        const params = toolInput as GetPositionsParams
        const positions = await DriftService.getPositions(params.userPublicKey)
        return {
          success: true,
          message: `Found ${positions.length} open position(s)`,
          data: positions
        }
      }

      case 'close_position': {
        const params = toolInput as ClosePositionParams
        const { transaction } = await DriftService.buildClosePositionTx(
          params.userPublicKey,
          params.marketIndex,
        )
        return {
          transaction,
          type: 'drift_close_position',
          marketIndex: params.marketIndex,
        }
      }

      case 'cancel_order': {
        const params = toolInput as CancelOrderParams
        const { transaction } = await DriftService.buildCancelOrderTx(
          params.userPublicKey,
          params.orderId,
        )
        return {
          transaction,
          type: 'drift_cancel_order',
          orderId: params.orderId,
        }
      }

      case 'cancel_all_orders': {
        const params = toolInput as CancelAllOrdersParams
        const { transaction } = await DriftService.buildCancelAllOrdersTx(
          params.userPublicKey,
          params.marketIndex,
        )
        const msg = params.marketIndex !== undefined
          ? `Cancel all orders for market ${params.marketIndex}`
          : 'Cancel all orders across all markets'
        return {
          transaction,
          type: 'drift_cancel_all_orders',
          marketIndex: params.marketIndex,
          message: msg,
        }
      }

      case 'get_orders': {
        const params = toolInput as GetOrdersParams
        const orders = await DriftService.getOrders(params.userPublicKey, params.marketIndex)
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
