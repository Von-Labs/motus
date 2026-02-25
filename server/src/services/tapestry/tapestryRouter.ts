import express from 'express'
import asyncHandler from 'express-async-handler'
import { TapestryService } from './tapestryService'
import { executePendingAction } from './toolHandler'

const router = express.Router()

// ─── Execute (wallet-signed write actions from chat) ──────

router.post('/execute', asyncHandler(async (req, res) => {
  const { action, payload } = req.body
  const walletAddress = req.headers['x-wallet-address'] as string
  const walletSignature = req.headers['x-wallet-signature'] as string

  if (!action || !payload) {
    res.status(400).json({ error: 'Missing required fields: action, payload' })
    return
  }
  if (!walletAddress || !walletSignature) {
    res.status(401).json({ error: 'Missing wallet address or signature headers' })
    return
  }

  const result = await executePendingAction(action, payload, walletAddress, walletSignature)
  res.json(result)
}))

// ─── Profiles ──────────────────────────────────────────────

router.post('/profiles/findOrCreate', asyncHandler(async (req, res) => {
  const { username } = req.body
  if (!username) {
    res.status(400).json({ error: 'Missing required field: username' })
    return
  }
  const result = await TapestryService.findOrCreateProfile(req.body)
  res.json(result)
}))

router.get('/profiles', asyncHandler(async (req, res) => {
  const result = await TapestryService.getProfiles(
    req.query as Record<string, string>
  )
  res.json(result)
}))

router.get('/profiles/:id', asyncHandler(async (req, res) => {
  const result = await TapestryService.getProfileById(req.params.id)
  res.json(result)
}))

router.put('/profiles/:id', asyncHandler(async (req, res) => {
  const result = await TapestryService.updateProfile(req.params.id, req.body)
  res.json(result)
}))

// ─── Followers / Following ─────────────────────────────────

router.get('/profiles/:id/followers', asyncHandler(async (req, res) => {
  const result = await TapestryService.getFollowers(
    req.params.id,
    req.query as Record<string, string>
  )
  res.json(result)
}))

router.get('/profiles/:id/followers/global', asyncHandler(async (req, res) => {
  const result = await TapestryService.getGlobalFollowers(
    req.params.id,
    req.query as Record<string, string>
  )
  res.json(result)
}))

router.get('/profiles/:id/following', asyncHandler(async (req, res) => {
  const result = await TapestryService.getFollowing(
    req.params.id,
    req.query as Record<string, string>
  )
  res.json(result)
}))

router.get('/profiles/:id/following/global', asyncHandler(async (req, res) => {
  const result = await TapestryService.getGlobalFollowing(
    req.params.id,
    req.query as Record<string, string>
  )
  res.json(result)
}))

router.get('/profiles/:id/following-who-follow', asyncHandler(async (req, res) => {
  const { requestorId } = req.query as { requestorId?: string }
  if (!requestorId) {
    res.status(400).json({ error: 'Missing required query parameter: requestorId' })
    return
  }
  const result = await TapestryService.getFollowingWhoFollow(
    req.params.id,
    req.query as Record<string, string> as any
  )
  res.json(result)
}))

// ─── Suggestions ───────────────────────────────────────────

router.get('/profiles/:id/suggested-profiles', asyncHandler(async (req, res) => {
  const result = await TapestryService.getSuggestedProfiles(req.params.id)
  res.json(result)
}))

router.get('/profiles/suggested/:identifier', asyncHandler(async (req, res) => {
  const { contactType } = req.query as { contactType?: string }
  const result = await TapestryService.getSuggestedProfilesByIdentifier(
    req.params.identifier,
    contactType
  )
  res.json(result)
}))

router.get('/profiles/suggested/:identifier/global', asyncHandler(async (req, res) => {
  const { contactType } = req.query as { contactType?: string }
  const result = await TapestryService.getSuggestedProfilesToInvite(
    req.params.identifier,
    contactType
  )
  res.json(result)
}))

// ─── Referrals ─────────────────────────────────────────────

router.get('/profiles/:id/referrals', asyncHandler(async (req, res) => {
  const { upstream, downstream } = req.query as Record<string, string>
  const result = await TapestryService.getReferrals(
    req.params.id,
    upstream,
    downstream
  )
  res.json(result)
}))

// ─── Wallets ───────────────────────────────────────────────

router.get('/profiles/:id/wallets', asyncHandler(async (req, res) => {
  const result = await TapestryService.getProfileWallets(req.params.id)
  res.json(result)
}))

router.patch('/profiles/:id/wallets', asyncHandler(async (req, res) => {
  const result = await TapestryService.linkWallets(req.params.id, req.body)
  res.json(result)
}))

router.delete('/profiles/:id/wallets', asyncHandler(async (req, res) => {
  const result = await TapestryService.unlinkWallets(req.params.id, req.body)
  res.json(result)
}))

// ─── Token Owners ──────────────────────────────────────────

router.get('/profiles/token-owners/:tokenAddress', asyncHandler(async (req, res) => {
  const result = await TapestryService.getTokenOwners(
    req.params.tokenAddress,
    req.query as Record<string, string>
  )
  res.json(result)
}))

// ─── Notifications ─────────────────────────────────────────

router.post('/profiles/:id/notification', asyncHandler(async (req, res) => {
  const { message } = req.body
  if (!message) {
    res.status(400).json({ error: 'Missing required field: message' })
    return
  }
  const result = await TapestryService.sendNotification(req.params.id, req.body)
  res.json(result)
}))

// ─── Contacts ──────────────────────────────────────────────

router.get('/profiles/:id/contacts', asyncHandler(async (req, res) => {
  const result = await TapestryService.getProfileContacts(req.params.id)
  res.json(result)
}))

// ─── Contents ──────────────────────────────────────────────

router.post('/contents/findOrCreate', asyncHandler(async (req, res) => {
  const { id } = req.body
  if (!id) {
    res.status(400).json({ error: 'Missing required field: id' })
    return
  }
  const result = await TapestryService.findOrCreateContent(req.body)
  res.json(result)
}))

router.get('/contents', asyncHandler(async (req, res) => {
  const result = await TapestryService.getContents(
    req.query as Record<string, string>
  )
  res.json(result)
}))

router.get('/contents/aggregation', asyncHandler(async (req, res) => {
  const { aggregation } = req.query as { aggregation?: string }
  if (!aggregation) {
    res.status(400).json({ error: 'Missing required query parameter: aggregation' })
    return
  }
  const result = await TapestryService.getContentsAggregation(
    req.query as Record<string, string> as any
  )
  res.json(result)
}))

router.get('/contents/:id', asyncHandler(async (req, res) => {
  const { requestingProfileId } = req.query as { requestingProfileId?: string }
  const result = await TapestryService.getContentById(
    req.params.id,
    requestingProfileId
  )
  res.json(result)
}))

router.put('/contents/:id', asyncHandler(async (req, res) => {
  const result = await TapestryService.updateContent(req.params.id, req.body)
  res.json(result)
}))

router.delete('/contents/:id', asyncHandler(async (req, res) => {
  const result = await TapestryService.deleteContent(req.params.id)
  res.json(result)
}))

router.post('/contents/batch/read', asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body) || req.body.length === 0) {
    res.status(400).json({ error: 'Request body must be a non-empty array of content IDs' })
    return
  }
  const result = await TapestryService.batchGetContents(req.body)
  res.json(result)
}))

// ─── Comments ──────────────────────────────────────────────

router.post('/comments', asyncHandler(async (req, res) => {
  const { profileId, text } = req.body
  if (!profileId || !text) {
    res.status(400).json({ error: 'Missing required fields: profileId, text' })
    return
  }
  const result = await TapestryService.createComment(req.body)
  res.json(result)
}))

router.get('/comments', asyncHandler(async (req, res) => {
  const result = await TapestryService.getComments(
    req.query as Record<string, string>
  )
  res.json(result)
}))

router.get('/comments/:id', asyncHandler(async (req, res) => {
  const { requestingProfileId } = req.query as { requestingProfileId?: string }
  const result = await TapestryService.getCommentById(
    req.params.id,
    requestingProfileId
  )
  res.json(result)
}))

router.put('/comments/:id', asyncHandler(async (req, res) => {
  const result = await TapestryService.updateComment(req.params.id, req.body)
  res.json(result)
}))

router.delete('/comments/:id', asyncHandler(async (req, res) => {
  const result = await TapestryService.deleteComment(req.params.id)
  res.json(result)
}))

router.get('/comments/:id/replies', asyncHandler(async (req, res) => {
  const result = await TapestryService.getCommentReplies(
    req.params.id,
    req.query as Record<string, string>
  )
  res.json(result)
}))

router.post('/comments/batch/read', asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body) || req.body.length === 0) {
    res.status(400).json({ error: 'Request body must be a non-empty array of comment IDs' })
    return
  }
  const result = await TapestryService.batchGetComments(req.body)
  res.json(result)
}))

// ─── Likes ─────────────────────────────────────────────────

router.get('/likes/:nodeId', asyncHandler(async (req, res) => {
  const result = await TapestryService.getLikes(
    req.params.nodeId,
    req.query as Record<string, string>
  )
  res.json(result)
}))

router.post('/likes/:nodeId', asyncHandler(async (req, res) => {
  const { startId } = req.body
  if (!startId) {
    res.status(400).json({ error: 'Missing required field: startId' })
    return
  }
  const result = await TapestryService.createLike(req.params.nodeId, startId)
  res.json(result)
}))

router.delete('/likes/:nodeId', asyncHandler(async (req, res) => {
  const { startId } = req.body
  if (!startId) {
    res.status(400).json({ error: 'Missing required field: startId' })
    return
  }
  const result = await TapestryService.deleteLike(req.params.nodeId, startId)
  res.json(result)
}))

export default router
