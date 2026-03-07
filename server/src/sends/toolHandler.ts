import { buildTransferTransaction } from './transferService'
import { reportErrorToDiscord } from '../utils/errorReporter'

export async function handleToolCall(toolName: string, toolInput: any) {
  try {
    switch (toolName) {
      case 'send_tokens':
        return await buildTransferTransaction({
          sender: toolInput.sender,
          recipient: toolInput.recipient,
          amount: String(toolInput.amount),
          mint: toolInput.mint,
          decimals: toolInput.decimals
        })

      default:
        throw new Error(`Unknown send tool: ${toolName}`)
    }
  } catch (error: any) {
    console.error('❌ Send Tool Error:', {
      tool: toolName,
      error: error.message
    })
    reportErrorToDiscord(error.message || String(error), { source: `Send > ${toolName}` }).catch(() => {})
    return {
      error: true,
      message: error.message || 'Send tool execution failed'
    }
  }
}
