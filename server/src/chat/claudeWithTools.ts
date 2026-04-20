import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'
import { jupiterTools, handleToolCall as handleJupiterToolCall } from '../jupiter'
import { sendTools, handleToolCall as handleSendToolCall } from '../sends'
import { tapestryTools, handleToolCall as handleTapestryToolCall } from '../services/tapestry'
import { db } from '../db/supabase'
import { reportErrorToDiscord } from '../utils/errorReporter'
import { models, ModelLabel } from './models'

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

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
})

// Convert Anthropic tool definitions to Bedrock toolSpec format
function toBedrockTools (anthropicTools: any[]): any[] {
  return anthropicTools.map(tool => ({
    toolSpec: {
      name: tool.name,
      description: tool.description,
      inputSchema: { json: tool.input_schema }
    }
  }))
}

// Convert a single Anthropic content block to a Bedrock content block
function anthropicBlockToBedrockBlock (block: any): any {
  if (typeof block === 'string') return { text: block }
  if (block.type === 'text') return { text: block.text }
  if (block.type === 'tool_use') {
    return { toolUse: { toolUseId: block.id, name: block.name, input: block.input } }
  }
  if (block.type === 'tool_result') {
    const text = typeof block.content === 'string' ? block.content : JSON.stringify(block.content)
    return { toolResult: { toolUseId: block.tool_use_id, content: [{ text }] } }
  }
  return { text: JSON.stringify(block) }
}

// Convert Anthropic messages array to Bedrock messages format
function toBedrockMessages (messages: any[]): any[] {
  return messages.map(msg => {
    let content: any[]
    if (typeof msg.content === 'string') {
      content = [{ text: msg.content }]
    } else if (Array.isArray(msg.content)) {
      content = msg.content.map(anthropicBlockToBedrockBlock)
    } else {
      content = [{ text: JSON.stringify(msg.content) }]
    }
    return { role: msg.role, content }
  })
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
      // Force Haiku for free requests, use UI-selected model for paid
      const effectiveModel = req.isFreeRequest ? 'claudeHaiku' : model
      const modelConfig = models[effectiveModel]
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

Send Tools (Token Transfers):
- Send SOL or SPL tokens to any wallet address
- Supports native SOL and all SPL tokens (USDC, USDT, BONK, JUP, etc.)

Tapestry Social Tools (Social Features):
- Create social posts with text and images
- Browse the social feed
- View post details with engagement stats
- Comment on posts
- Like/unlike posts
- Look up user profiles by wallet address

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
- ALWAYS call 'check_drift_account' FIRST before any Drift operation to check if user has an account and collateral
  * If hasAccount=false: tell user they need to create a Drift account, then call 'initialize_drift_account'
  * If hasAccount=true but needsDeposit=true: tell user they need to deposit USDC collateral, then call 'deposit_drift_collateral'
  * If hasAccount=true and needsDeposit=false: proceed with the requested trading operation
- Use 'initialize_drift_account' to create a Drift account (one-time setup)
- Use 'deposit_drift_collateral' to deposit USDC as collateral. Amount in smallest unit: 1 USDC = 1000000
- Use 'withdraw_drift_collateral' to withdraw USDC collateral back to wallet. Amount in smallest unit: 1 USDC = 1000000
- Use 'place_long_order' for bullish bets (expect price to rise)
- Use 'place_short_order' for bearish bets (expect price to fall)
- Use 'set_stop_loss' to protect positions from excessive losses
- Use 'set_take_profit' to automatically close at profit target
- Use 'get_positions' to check current perpetual positions
- Use 'close_position' to exit positions immediately
- All Drift trading tools return unsigned transactions for the user to sign on their mobile wallet
- Perp market indexes: 0=SOL-PERP, 1=BTC-PERP, 2=ETH-PERP
- Collateral spot market indexes: 0=USDC

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

Send Tools Guide:
- Use 'send_tokens' to transfer SOL or SPL tokens to another wallet
- For SOL: omit mint, amount in lamports (1 SOL = 1000000000)
- For SPL: provide mint address and decimals (e.g. USDC: mint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v, decimals=6, 1 USDC = 1000000)
- The sender field should be the user's wallet address
- Returns an unsigned transaction for the user to sign on their wallet

Tapestry Social Tools Guide:
- Use 'get_tapestry_profile' to find a user's profile by wallet address (needed for other social actions)
- Use 'create_social_post' to post content (requires profileId from get_tapestry_profile)
- Use 'get_social_feed' to browse posts, optionally filtered by author
- Use 'get_post_details' to see a specific post with engagement
- Use 'comment_on_post' to add a comment on a post
- Use 'like_post' / 'unlike_post' to toggle likes on posts
- Always look up the user's profile first before creating posts or comments

Always ask for wallet address when needed. Be helpful and educational about DeFi concepts.`

      const allAnthropicTools = [...jupiterTools, ...getDriftTools(), ...tapestryTools, ...sendTools]
      const bedrockTools = toBedrockTools(allAnthropicTools)

      // Start conversation loop with tool support — messages kept in Bedrock format
      let bedrockMessages = toBedrockMessages(messages)
      let continueLoop = true

      while (continueLoop) {
        const command = new ConverseCommand({
          modelId: modelConfig.bedrockId,
          messages: bedrockMessages,
          system: [{ text: systemPrompt || defaultSystemPrompt }],
          toolConfig: { tools: bedrockTools },
          inferenceConfig: { maxTokens: 4096 }
        })

        const result = await bedrockClient.send(command)

        // Track token usage from this API call
        if (result.usage) {
          totalInputTokens += result.usage.inputTokens || 0
          totalOutputTokens += result.usage.outputTokens || 0
        }

        const responseContent = result.output?.message?.content ?? []

        // Stream assistant's text response
        for (const block of responseContent) {
          if (block.text) {
            res.write(
              `data: ${JSON.stringify({ type: 'text', text: block.text })}\n\n`
            )
          }
        }

        // Check if Claude wants to use tools
        const toolUseBlocks = responseContent.filter((block: any) => block.toolUse)

        if (result.stopReason === 'tool_use' && toolUseBlocks.length > 0) {
          // Add assistant message (with tool use blocks) to conversation
          bedrockMessages.push({
            role: 'assistant',
            content: responseContent
          })

          // Execute tools and collect Bedrock-format results
          const toolResultBlocks: any[] = []

          for (const block of toolUseBlocks) {
            const { toolUseId, name = '', input } = block.toolUse!

            res.write(
              `data: ${JSON.stringify({ type: 'tool_use', name, input })}\n\n`
            )

            // Route to correct handler based on tool name
            const isDriftTool = getDriftTools().some((t: any) => t.name === name)
            const isTapestryTool = tapestryTools.some((t: any) => t.name === name)
            const isSendTool = sendTools.some((t: any) => t.name === name)
            let toolResult
            if (isDriftTool) {
              toolResult = await handleDriftToolCall(name, input)
            } else if (isTapestryTool) {
              toolResult = await handleTapestryToolCall(name, input)
            } else if (isSendTool) {
              toolResult = await handleSendToolCall(name, input)
            } else {
              toolResult = await handleJupiterToolCall(name, input)
            }

            toolResultBlocks.push({
              toolResult: {
                toolUseId,
                content: [{ text: JSON.stringify(toolResult) }]
              }
            })

            // Stream tool result
            res.write(
              `data: ${JSON.stringify({ type: 'tool_result', name, result: toolResult })}\n\n`
            )
          }

          // Add tool results as user message
          bedrockMessages.push({
            role: 'user',
            content: toolResultBlocks
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
    } catch (err: any) {
      console.log('error in claude chat with tools: ', err)
      reportErrorToDiscord(err?.message || String(err), {
        source: 'claudeWithTools',
        endpoint: req.path,
        wallet: req.headers['x-wallet-address'] as string,
        model: req.body?.model,
      }).catch(() => {})
      res.write(
        `data: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`
      )
      res.write('data: [DONE]\n\n')
      res.end()
    }
  }
)
