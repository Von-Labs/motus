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

export interface ShareToSocialOptions extends TapestryHandlerOptions {
  walletAddress: string
  onSummarized?: () => void
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

/**
 * Summarize text via server and post to Tapestry social.
 * 1. Call /chat/summarize to get a short summary
 * 2. Get user's Tapestry profile by wallet address
 * 3. Create a social post via handleTapestryAction
 */
export async function shareToSocial(
  assistantText: string,
  options: ShareToSocialOptions
): Promise<void> {
  const { walletAddress, signMessage, onSummarized } = options

  // 1. Summarize the response
  console.log('[Share] Step 1: Summarizing response...')
  const summarizeRes = await fetch(`${DOMAIN}/chat/summarize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Wallet-Address': walletAddress,
    },
    body: JSON.stringify({ text: assistantText }),
  })

  if (!summarizeRes.ok) {
    const err = await summarizeRes.json().catch(() => ({}))
    console.error('[Share] Summarize failed:', err)
    throw new Error((err as any).error || 'Failed to summarize')
  }

  const { summary } = await summarizeRes.json() as { summary: string }
  console.log('[Share] Summary:', summary)

  // 2. Get user's Tapestry profile
  console.log('[Share] Step 2: Getting Tapestry profile...')
  const profileRes = await fetch(
    `${DOMAIN}/api/tapestry/profiles?walletAddress=${walletAddress}`
  )

  if (!profileRes.ok) {
    console.error('[Share] Profile fetch failed:', profileRes.status)
    throw new Error('Failed to fetch Tapestry profile')
  }

  const profileData = await profileRes.json() as any
  const profileId = profileData.profiles?.[0]?.profile?.id
  console.log('[Share] Profile ID:', profileId)

  if (!profileId) {
    throw new Error('No Tapestry profile found. Please create a profile first.')
  }

  // 3. Post to social via pending action flow
  onSummarized?.()
  console.log('[Share] Step 3: Posting to social...')
  const pendingAction: TapestryPendingAction = {
    pendingAction: true,
    action: 'create_social_post',
    payload: {
      profileId,
      title: summary.slice(0, 80),
      body: summary,
    },
    message: `Sharing: "${summary.slice(0, 50)}..."`,
  }

  await handleTapestryAction(pendingAction, walletAddress, { signMessage })
  console.log('[Share] Done!')
}
