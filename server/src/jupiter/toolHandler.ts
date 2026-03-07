import { JupiterService } from './jupiterService'
import { reportErrorToDiscord } from '../utils/errorReporter'

// Tool Handler - Execute tool calls from Claude
export async function handleToolCall(toolName: string, toolInput: any) {
  try {
    switch (toolName) {
      case 'swap_tokens':
        // Return quote with transaction for mobile app to sign
        return await JupiterService.getSwapQuote({
          inputMint: toolInput.inputMint,
          outputMint: toolInput.outputMint,
          amount: toolInput.amount,
          slippageBps: toolInput.slippageBps || 50,
          userPublicKey: toolInput.userPublicKey
        })

      case 'get_token_price':
        return await JupiterService.getTokenPrices(toolInput.tokens)

      case 'search_tokens':
        return await JupiterService.searchTokens(toolInput.query)

      case 'get_wallet_portfolio':
        return await JupiterService.getWalletHoldings(toolInput.walletAddress)

      case 'create_trigger_order':
        return await JupiterService.createTriggerOrder({
          inputMint: toolInput.inputMint,
          outputMint: toolInput.outputMint,
          maker: toolInput.maker,
          payer: toolInput.payer,
          makingAmount: toolInput.makingAmount,
          takingAmount: toolInput.takingAmount,
          expiredAt: toolInput.expiredAt,
          slippageBps: toolInput.slippageBps,
          feeBps: toolInput.feeBps,
          feeAccount: toolInput.feeAccount,
          computeUnitPrice: toolInput.computeUnitPrice,
          wrapAndUnwrapSol: toolInput.wrapAndUnwrapSol
        })

      case 'cancel_trigger_order':
        return await JupiterService.cancelTriggerOrder({
          maker: toolInput.maker,
          order: toolInput.order,
          computeUnitPrice: toolInput.computeUnitPrice
        })

      case 'cancel_all_trigger_orders':
        return await JupiterService.cancelTriggerOrders({
          maker: toolInput.maker,
          orders: [],  // Empty array cancels all orders
          computeUnitPrice: toolInput.computeUnitPrice
        })

      case 'create_dca_order':
        return await JupiterService.createDCAOrder({
          inputMint: toolInput.inputMint,
          outputMint: toolInput.outputMint,
          inAmount: toolInput.inAmount,
          cycleFrequency: toolInput.cycleFrequency,
          numOrders: toolInput.numOrders,
          userPublicKey: toolInput.userPublicKey
        })

      case 'get_trigger_orders_detailed':
        return await JupiterService.getTriggerOrdersDetailed({
          user: toolInput.user,
          orderStatus: toolInput.orderStatus,
          page: toolInput.page,
          includeFailedTx: toolInput.includeFailedTx,
          inputMint: toolInput.inputMint,
          outputMint: toolInput.outputMint
        })

      case 'get_recurring_orders':
        return await JupiterService.getRecurringOrders(toolInput.walletAddress)

      case 'get_portfolio_positions':
        return await JupiterService.getPortfolioPositions(toolInput.walletAddress)

      case 'check_token_security':
        return await JupiterService.checkTokenSecurity(toolInput.mints)

      case 'get_detailed_portfolio':
        return await JupiterService.getDetailedPortfolioPositions(
          toolInput.walletAddress,
          toolInput.platforms
        )

      case 'get_supported_platforms':
        return await JupiterService.getSupportedPlatforms()

      case 'get_staked_jup':
        return await JupiterService.getStakedJup(toolInput.walletAddress)

      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  } catch (error: any) {
    console.error('❌ Jupiter Tool Error:', {
      tool: toolName,
      error: error.message,
      stack: error.stack
    })
    reportErrorToDiscord(error.message || String(error), { source: `Jupiter > ${toolName}` }).catch(() => {})
    return {
      error: true,
      message: error.message || 'Tool execution failed',
      details: error.toString()
    }
  }
}
