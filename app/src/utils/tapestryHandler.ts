import { DOMAIN } from '../../constants'

export interface TapestryPendingAction {
  pendingAction: true
  action: string
  payload: any
  message: string
}

export interface TapestryHandlerOptions {
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
}

/**
 * Check if a tool result is a tapestry pending action requiring wallet sign.
 */
export function isTapestryPendingAction(data: any): data is TapestryPendingAction {
  return (
    data &&
    typeof data === 'object' &&
    data.pendingAction === true &&
    'action' in data &&
    'payload' in data
  )
}

/**
 * Format tapestry action details for display in chat.
 */
export function formatTapestryActionDetails(data: TapestryPendingAction): string {
  const action = data.action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l: string) => l.toUpperCase())

  return `**${action}:** ${data.message}`
}

/**
 * Handle a tapestry pending action:
 * 1. Sign verification message via wallet (useMobileWallet signMessage)
 * 2. Send signature + action to server /execute endpoint
 */
export async function handleTapestryAction(
  actionData: TapestryPendingAction,
  walletAddress: string,
  options: TapestryHandlerOptions
): Promise<any> {
  const message = `Motus: verify wallet ${walletAddress}`
  const messageBytes = new TextEncoder().encode(message)

  // Sign verification message via wallet adapter
  const signatureBytes = await options.signMessage(messageBytes)

  // Convert signature to base64 for server verification
  const signatureBase64 = btoa(
    String.fromCharCode(...new Uint8Array(signatureBytes))
  )

  // Call server execute endpoint with signature
  const response = await fetch(`${DOMAIN}/api/tapestry/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Wallet-Address': walletAddress,
      'X-Wallet-Signature': signatureBase64,
    },
    body: JSON.stringify({
      action: actionData.action,
      payload: actionData.payload,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.error || `Server error: ${response.status}`)
  }

  return response.json()
}
