import crypto from 'crypto'
import { TapestryService } from './tapestryService'
import { verifyWalletSignature } from '../../utils/verifyWallet'

/** Tools that require wallet signature verification before execution */
const WRITE_TOOLS = new Set([
  'create_social_post',
  'comment_on_post',
  'like_post',
  'unlike_post'
])

/**
 * Handle tool calls from Claude for Tapestry social operations.
 * Write operations return a pendingAction for the app to sign and execute.
 * Read operations execute immediately.
 */
export async function handleToolCall(
  toolName: string,
  toolInput: any
): Promise<any> {
  try {
    // Write tools: return pending action for client-side signing (swap pattern)
    if (WRITE_TOOLS.has(toolName)) {
      return buildPendingAction(toolName, toolInput)
    }

    // Read tools: execute immediately
    switch (toolName) {
      case 'get_social_feed': {
        const params: Record<string, string | undefined> = {
          profileId: toolInput.profileId,
          page: toolInput.page,
          pageSize: toolInput.pageSize
        }
        const feed = await TapestryService.getContents(params)
        return {
          success: true,
          message: `Retrieved ${feed.contents?.length || 0} posts`,
          data: feed
        }
      }

      case 'get_post_details': {
        const details = await TapestryService.getContentById(
          toolInput.contentId,
          toolInput.requestingProfileId
        )
        return {
          success: true,
          message: 'Post details retrieved',
          data: details
        }
      }

      case 'get_post_comments': {
        const comments = await TapestryService.getComments({
          contentId: toolInput.contentId,
          page: toolInput.page,
          pageSize: toolInput.pageSize
        })
        return {
          success: true,
          message: `Retrieved ${comments.comments?.length || 0} comments`,
          data: comments
        }
      }

      case 'get_tapestry_profile': {
        if (toolInput.profileId) {
          const profile = await TapestryService.getProfileById(toolInput.profileId)
          return {
            success: true,
            message: 'Profile found',
            data: profile
          }
        }
        if (toolInput.walletAddress) {
          const profiles = await TapestryService.getProfiles({
            walletAddress: toolInput.walletAddress
          })
          return {
            success: true,
            message: `Found ${profiles.profiles?.length || 0} profile(s)`,
            data: profiles
          }
        }
        return {
          success: false,
          error: 'Either walletAddress or profileId is required'
        }
      }

      default:
        return {
          success: false,
          error: `Unknown Tapestry tool: ${toolName}`
        }
    }
  } catch (error) {
    console.error(`Error in Tapestry tool ${toolName}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      toolName,
      toolInput
    }
  }
}

/**
 * Build a pending action payload for write tools.
 * The app will sign a message and call /api/tapestry/execute to complete.
 */
function buildPendingAction(toolName: string, toolInput: any) {
  const descriptions: Record<string, string> = {
    create_social_post: `Creating post: "${toolInput.title || toolInput.body?.slice(0, 50) || 'New post'}"`,
    comment_on_post: `Commenting on post`,
    like_post: 'Liking post',
    unlike_post: 'Removing like'
  }

  return {
    pendingAction: true,
    action: toolName,
    payload: toolInput,
    message: descriptions[toolName] || toolName
  }
}

/**
 * Execute a pending write action after wallet signature verification.
 * Called by the /api/tapestry/execute endpoint.
 */
export async function executePendingAction(
  action: string,
  payload: any,
  walletAddress: string,
  walletSignature: string
): Promise<any> {
  const valid = verifyWalletSignature(walletAddress, walletSignature)
  if (!valid) {
    throw new Error('Invalid wallet signature')
  }

  switch (action) {
    case 'create_social_post': {
      const properties = [
        { key: 'title', value: payload.title },
        { key: 'body', value: payload.body },
        { key: 'type', value: 'post' }
      ]
      if (payload.image) {
        properties.push({ key: 'image', value: payload.image })
      }

      const content = await TapestryService.findOrCreateContent({
        id: crypto.randomUUID(),
        profileId: payload.profileId,
        properties
      })
      return {
        success: true,
        message: 'Post created successfully',
        data: content
      }
    }

    case 'comment_on_post': {
      const comment = await TapestryService.createComment({
        contentId: payload.contentId,
        profileId: payload.profileId,
        text: payload.text
      })
      return {
        success: true,
        message: 'Comment posted successfully',
        data: comment
      }
    }

    case 'like_post': {
      const result = await TapestryService.createLike(
        payload.contentId,
        payload.profileId
      )
      return {
        success: true,
        message: 'Post liked successfully',
        data: result
      }
    }

    case 'unlike_post': {
      const result = await TapestryService.deleteLike(
        payload.contentId,
        payload.profileId
      )
      return {
        success: true,
        message: 'Like removed successfully',
        data: result
      }
    }

    default:
      throw new Error(`Unknown action: ${action}`)
  }
}
