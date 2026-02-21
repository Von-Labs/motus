import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { jupiterTools, handleToolCall as handleJupiterToolCall } from '../jupiter'
import { db } from '../db/supabase'

// Lazy-load Drift to avoid crashing on Windows when yellowstone-grpc native binding is missing
let _driftModule: { driftTools: any[]; handleToolCall: (name: string, input: any) => Promise<any> } | null | undefined = undefined
function getDriftModule () {
  if (_driftModule !== undefined) return _driftModule
  try {
    _driftModule = require('../drift')
    return _driftModule
  } catch (e) {
    console.warn('Drift module not available (native binding may be missing on this platform):', (e as Error)?.message)
    _driftModule = null
    return null
  }
}
function getDriftTools () { return getDriftModule()?.driftTools ?? [] }
async function handleDriftToolCall (name: string, input: any) {
  const mod = getDriftModule()
  if (!mod) return { error: 'Drift Protocol is not available on this server (native dependencies missing).' }
  return mod.handleToolCall(name, input)
}

type ModelLabel = 'claudeOpus' | 'claudeSonnet' | 'claudeHaiku'
type ModelName =
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-haiku-4-5-20251001'

interface ModelConfig {
  name: ModelName;
  inputPricePer1M: number;  // USD per 1M tokens
  outputPricePer1M: number; // USD per 1M tokens
}

const models: Record<ModelLabel, ModelConfig> = {
  claudeOpus: {
    name: 'claude-opus-4-5-20251101',
    inputPricePer1M: 5.00,
    outputPricePer1M: 25.00
  },
  claudeSonnet: {
    name: 'claude-sonnet-4-5-20250929',
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00
  },
  claudeHaiku: {
    name: 'claude-haiku-4-5-20251001',
    inputPricePer1M: 1.00,
    outputPricePer1M: 5.00
  }
}

interface Message {
  role: 'user' | 'assistant'
  content: any
}

interface RequestBody {
  messages: Message[]
  model: ModelLabel
  systemPrompt?: string
}

export const claudeWithTools = asyncHandler(
  async (req: Request, res: Response) => {
    // Track total token usage across all API calls in the conversation loop
    let totalInputTokens = 0
    let totalOutputTokens = 0

    try {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache'
      })

      const { messages, model, systemPrompt }: RequestBody = req.body
      const modelConfig = models[model]
      const walletAddress = req.headers['x-wallet-address'] as string

      if (!modelConfig) {
        res.write('data: [DONE]\n\n')
        res.end()
        return
      }

      const defaultSystemPrompt = `You are a helpful DeFi assistant on Solana blockchain. You have access to Jupiter aggregator and Drift Protocol tools to help users:

Jupiter Tools (Spot Trading):
- Swap tokens instantly
- Check token prices
- View basic wallet balances
- View comprehensive DeFi portfolio (including staking, liquidity pools, lending, leveraged positions)
- Check JUP staking positions
- Browse supported DeFi platforms
- Create limit orders (buy/sell at target price)
- Cancel limit orders
- View order history and status
- Create DCA (Dollar-Cost Averaging) strategies
- Check token security

Drift Protocol Tools (Perpetual Futures Trading):
- Open LONG positions (bullish bets, profit when price rises)
- Open SHORT positions (bearish bets, profit when price falls)
- Place limit orders for perpetual futures
- Set stop loss orders to limit downside risk
- Set take profit orders to lock in gains
- View current perpetual positions
- Close positions completely
- Cancel pending orders
- Get market information (prices, funding rates)

When users ask to perform DeFi operations, use the appropriate tools. Always explain what you're doing and confirm important actions.

Portfolio Tools Guide:
- Use 'get_wallet_portfolio' for simple token balances and SOL balance
- Use 'get_detailed_portfolio' for comprehensive view of ALL DeFi positions across protocols (lending, staking, LPs, leveraged trades, Jupiter-specific positions)
- Use 'get_staked_jup' specifically for JUP staking information
- Use 'get_supported_platforms' to see what DeFi platforms are tracked

Limit Order Tools Guide (Jupiter):
- Use 'create_trigger_order' when user wants to buy/sell at a specific price (e.g., "buy SOL at $60 USDC")
  * For "buy SOL at $60 USDC with 100 USDC": inputMint=USDC, outputMint=SOL, makingAmount=100 USDC (in smallest unit), takingAmount=(100/60) SOL (in smallest unit)
  * makingAmount is what they're spending, takingAmount is what they want to receive
- Use 'get_trigger_orders_detailed' to check active or historical orders
- Use 'cancel_trigger_order' to cancel a specific order
- Use 'cancel_all_trigger_orders' to cancel all user's open orders

Drift Perpetual Tools Guide:
- Use 'place_long_order' for bullish bets (expect price to rise)
- Use 'place_short_order' for bearish bets (expect price to fall)
- Use 'set_stop_loss' to protect positions from excessive losses
- Use 'set_take_profit' to automatically close at profit target
- Use 'get_positions' to check current perpetual positions
- Use 'close_position' to exit positions immediately
- Market indexes: 0=SOL-PERP, 1=BTC-PERP, 2=ETH-PERP

Common token addresses you should know:
- SOL: So11111111111111111111111111111111111111112
- USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
- USDT: Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
- JUP: JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN

Token Decimals (important for calculations):
- SOL: 9 decimals
- USDC: 6 decimals
- USDT: 6 decimals
- JUP: 6 decimals

Always ask for wallet address when needed. Be helpful and educational about DeFi concepts.`

      // Start conversation loop with tool support
      let conversationMessages = [...messages]
      let continueLoop = true

      const apiKey = process.env.ANTHROPIC_API_KEY

      while (continueLoop) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            'x-api-key': apiKey || ''
          },
          body: JSON.stringify({
            model: modelConfig.name,
            messages: conversationMessages,
            max_tokens: 4096,
            system: systemPrompt || defaultSystemPrompt,
            tools: [...jupiterTools, ...getDriftTools()]
          })
        })

        if (!response.ok) {
          throw new Error(`Anthropic API error: ${response.status}`)
        }

        const result = await response.json()

        // Track token usage from this API call
        if (result.usage) {
          totalInputTokens += result.usage.input_tokens || 0
          totalOutputTokens += result.usage.output_tokens || 0
        }

        // Stream assistant's text response
        if (result.content) {
          for (const block of result.content) {
            if (block.type === 'text') {
              res.write(
                `data: ${JSON.stringify({ type: 'text', text: block.text })}\n\n`
              )
            }
          }
        }

        // Check if Claude wants to use tools
        const toolUseBlocks = result.content?.filter(
          (block: any) => block.type === 'tool_use'
        )

        if (toolUseBlocks && toolUseBlocks.length > 0) {
          // Add assistant message to conversation
          conversationMessages.push({
            role: 'assistant',
            content: result.content
          })

          // Execute tools and collect results
          const toolResults = []

          for (const toolUse of toolUseBlocks) {
            res.write(
              `data: ${JSON.stringify({
                type: 'tool_use',
                name: toolUse.name,
                input: toolUse.input
              })}\n\n`
            )

            // Execute the tool - route to correct handler based on tool name
            const isDriftTool = getDriftTools().some(tool => tool.name === toolUse.name)
            const toolResult = isDriftTool
              ? await handleDriftToolCall(toolUse.name, toolUse.input)
              : await handleJupiterToolCall(toolUse.name, toolUse.input)

            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(toolResult)
            })

            // Stream tool result
            res.write(
              `data: ${JSON.stringify({
                type: 'tool_result',
                name: toolUse.name,
                result: toolResult
              })}\n\n`
            )
          }

          // Add tool results to conversation
          conversationMessages.push({
            role: 'user',
            content: toolResults
          })

          // Continue loop to get Claude's response with tool results
          continue
        } else {
          // No more tools to use, end loop
          continueLoop = false
        }
      }

      // Track usage in database after conversation completes
      if (walletAddress && totalInputTokens > 0 && totalOutputTokens > 0) {
        try {
          await db.processApiRequest({
            walletAddress,
            model: modelConfig.name,
            requestType: 'chat_with_tools',
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            endpoint: req.path
          })
        } catch (trackingErr) {
          console.error('Failed to track usage:', trackingErr)
          // Don't fail the request if tracking fails
        }
      }

      res.write('data: [DONE]\n\n')
      res.end()
    } catch (err) {
      console.log('error in claude chat with tools: ', err)
      res.write(
        `data: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`
      )
      res.write('data: [DONE]\n\n')
      res.end()
    }
  }
)
