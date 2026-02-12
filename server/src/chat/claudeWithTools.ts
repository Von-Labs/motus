import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { jupiterTools, handleToolCall } from '../jupiter'

type ModelLabel = 'claudeOpus' | 'claudeSonnet' | 'claudeHaiku'
type ModelName =
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-haiku-4-5-20251001'

const models: Record<ModelLabel, ModelName> = {
  claudeOpus: 'claude-opus-4-5-20251101',
  claudeSonnet: 'claude-sonnet-4-5-20250929',
  claudeHaiku: 'claude-haiku-4-5-20251001'
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
    try {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache'
      })

      const { messages, model, systemPrompt }: RequestBody = req.body
      const selectedModel = models[model]

      if (!selectedModel) {
        res.write('data: [DONE]\n\n')
        res.end()
        return
      }

      const defaultSystemPrompt = `You are a helpful DeFi assistant on Solana blockchain. You have access to Jupiter aggregator tools to help users:
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

When users ask to perform DeFi operations, use the appropriate tools. Always explain what you're doing and confirm important actions.

Portfolio Tools Guide:
- Use 'get_wallet_portfolio' for simple token balances and SOL balance
- Use 'get_detailed_portfolio' for comprehensive view of ALL DeFi positions across protocols (lending, staking, LPs, leveraged trades, Jupiter-specific positions)
- Use 'get_staked_jup' specifically for JUP staking information
- Use 'get_supported_platforms' to see what DeFi platforms are tracked

Limit Order Tools Guide:
- Use 'create_trigger_order' when user wants to buy/sell at a specific price (e.g., "buy SOL at $60 USDC")
  * For "buy SOL at $60 USDC with 100 USDC": inputMint=USDC, outputMint=SOL, makingAmount=100 USDC (in smallest unit), takingAmount=(100/60) SOL (in smallest unit)
  * makingAmount is what they're spending, takingAmount is what they want to receive
- Use 'get_trigger_orders_detailed' to check active or historical orders
- Use 'cancel_trigger_order' to cancel a specific order
- Use 'cancel_all_trigger_orders' to cancel all user's open orders

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

      while (continueLoop) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01',
            'x-api-key': process.env.ANTHROPIC_API_KEY || ''
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: conversationMessages,
            max_tokens: 4096,
            system: systemPrompt || defaultSystemPrompt,
            tools: jupiterTools
          })
        })

        if (!response.ok) {
          throw new Error(`Anthropic API error: ${response.status}`)
        }

        const result = await response.json()

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

            // Execute the tool
            const toolResult = await handleToolCall(
              toolUse.name,
              toolUse.input
            )

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
