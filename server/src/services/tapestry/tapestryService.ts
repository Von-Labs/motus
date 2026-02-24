import {
  FindOrCreateProfileParams,
  FindOrCreateProfileResponse,
  UpdateProfileParams,
  GetProfilesParams,
  GetProfilesResponse,
  GetProfileDetailsResponse,
  GetFollowersParams,
  GetGlobalFollowersParams,
  GetFollowingWhoFollowParams,
  GetTokenOwnersParams,
  LinkWalletsParams,
  SendNotificationParams,
  SuggestedProfileFollow,
  ProfileWithWallet,
  Profile,
  FindOrCreateContentParams,
  UpdateContentParams,
  GetContentsParams,
  GetContentsResponse,
  GetContentsAggregationParams,
  GetContentsAggregationResponse,
  GetBatchContentsResponse,
  Content,
  ContentDetails,
  CreateCommentParams,
  UpdateCommentParams,
  GetCommentsParams,
  GetCommentsResponse,
  GetBatchCommentsResponse,
  Comment,
  CommentDetailsWithReplies,
  GetLikesParams,
  GetLikesResponse,
} from './types'

// Helper to make Tapestry API requests
async function tapestryRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const TAPESTRY_API_KEY = process.env.TAPESTRY_API_KEY || ''
  const TAPESTRY_BASE_URL = process.env.TAPESTRY_BASE_URL || 'https://api.usetapestry.dev/api/v1'

  const separator = endpoint.includes('?') ? '&' : '?'
  const url = `${TAPESTRY_BASE_URL}${endpoint}${separator}apiKey=${TAPESTRY_API_KEY}`

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ Tapestry API Error:', {
      status: response.status,
      error
    })
    throw new Error(`Tapestry API Error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log('✅ Tapestry API Success:', {
    endpoint: endpoint.split('?')[0],
    dataPreview: JSON.stringify(data).substring(0, 200)
  })

  return data
}

function toQueryString(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    (entry): entry is [string, string] => entry[1] !== undefined
  )
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries).toString()
}

export class TapestryService {
  // ─── Profiles ────────────────────────────────────────────

  static async findOrCreateProfile(
    params: FindOrCreateProfileParams
  ): Promise<FindOrCreateProfileResponse> {
    return tapestryRequest<FindOrCreateProfileResponse>('/profiles/findOrCreate', {
      method: 'POST',
      body: JSON.stringify(params)
    })
  }

  static async getProfiles(
    params: GetProfilesParams = {}
  ): Promise<GetProfilesResponse> {
    const qs = toQueryString(params as Record<string, string | undefined>)
    return tapestryRequest<GetProfilesResponse>(`/profiles/${qs}`)
  }

  static async getProfileById(
    id: string
  ): Promise<GetProfileDetailsResponse> {
    return tapestryRequest<GetProfileDetailsResponse>(
      `/profiles/${encodeURIComponent(id)}`
    )
  }

  static async updateProfile(
    id: string,
    params: UpdateProfileParams
  ): Promise<Profile> {
    return tapestryRequest<Profile>(
      `/profiles/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(params)
      }
    )
  }

  // ─── Followers / Following ───────────────────────────────

  static async getFollowers(
    id: string,
    params: GetFollowersParams = {}
  ): Promise<ProfileWithWallet[]> {
    const qs = toQueryString(params as Record<string, string | undefined>)
    return tapestryRequest<ProfileWithWallet[]>(
      `/profiles/${encodeURIComponent(id)}/followers${qs}`
    )
  }

  static async getGlobalFollowers(
    id: string,
    params: GetGlobalFollowersParams = {}
  ) {
    const qs = toQueryString(params as Record<string, string | undefined>)
    return tapestryRequest(
      `/profiles/${encodeURIComponent(id)}/followers/global${qs}`
    )
  }

  static async getFollowing(
    id: string,
    params: GetFollowersParams = {}
  ): Promise<ProfileWithWallet[]> {
    const qs = toQueryString(params as Record<string, string | undefined>)
    return tapestryRequest<ProfileWithWallet[]>(
      `/profiles/${encodeURIComponent(id)}/following${qs}`
    )
  }

  static async getGlobalFollowing(
    id: string,
    params: GetGlobalFollowersParams = {}
  ) {
    const qs = toQueryString(params as Record<string, string | undefined>)
    return tapestryRequest(
      `/profiles/${encodeURIComponent(id)}/following/global${qs}`
    )
  }

  static async getFollowingWhoFollow(
    id: string,
    params: GetFollowingWhoFollowParams
  ) {
    const qs = toQueryString(params as Record<string, string | undefined>)
    return tapestryRequest(
      `/profiles/${encodeURIComponent(id)}/following-who-follow${qs}`
    )
  }

  // ─── Suggestions ─────────────────────────────────────────

  static async getSuggestedProfiles(
    id: string
  ): Promise<Record<string, SuggestedProfileFollow>> {
    return tapestryRequest<Record<string, SuggestedProfileFollow>>(
      `/profiles/${encodeURIComponent(id)}/suggested-profiles`
    )
  }

  static async getSuggestedProfilesByIdentifier(
    identifier: string,
    contactType?: string
  ): Promise<Record<string, SuggestedProfileFollow>> {
    const qs = toQueryString({ contactType })
    return tapestryRequest<Record<string, SuggestedProfileFollow>>(
      `/profiles/suggested/${encodeURIComponent(identifier)}${qs}`
    )
  }

  static async getSuggestedProfilesToInvite(
    identifier: string,
    contactType?: string
  ) {
    const qs = toQueryString({ contactType })
    return tapestryRequest(
      `/profiles/suggested/${encodeURIComponent(identifier)}/global${qs}`
    )
  }

  // ─── Referrals ───────────────────────────────────────────

  static async getReferrals(
    id: string,
    upstream?: string,
    downstream?: string
  ) {
    const qs = toQueryString({ upstream, downstream })
    return tapestryRequest(
      `/profiles/${encodeURIComponent(id)}/referrals${qs}`
    )
  }

  // ─── Wallets ─────────────────────────────────────────────

  static async getProfileWallets(id: string) {
    return tapestryRequest(
      `/profiles/${encodeURIComponent(id)}/wallets`
    )
  }

  static async linkWallets(id: string, params: LinkWalletsParams) {
    return tapestryRequest(
      `/profiles/${encodeURIComponent(id)}/wallets`,
      {
        method: 'PATCH',
        body: JSON.stringify(params)
      }
    )
  }

  static async unlinkWallets(id: string, params: LinkWalletsParams) {
    return tapestryRequest(
      `/profiles/${encodeURIComponent(id)}/wallets`,
      {
        method: 'DELETE',
        body: JSON.stringify(params)
      }
    )
  }

  // ─── Token Owners ────────────────────────────────────────

  static async getTokenOwners(
    tokenAddress: string,
    params: GetTokenOwnersParams = {}
  ) {
    const qs = toQueryString(params as Record<string, string | undefined>)
    return tapestryRequest(
      `/profiles/token-owners/${encodeURIComponent(tokenAddress)}${qs}`
    )
  }

  // ─── Notifications ───────────────────────────────────────

  static async sendNotification(
    id: string,
    params: SendNotificationParams
  ) {
    return tapestryRequest(
      `/profiles/${encodeURIComponent(id)}/notification`,
      {
        method: 'POST',
        body: JSON.stringify(params)
      }
    )
  }

  // ─── Contacts ────────────────────────────────────────────

  static async getProfileContacts(id: string) {
    return tapestryRequest(
      `/profiles/${encodeURIComponent(id)}/contacts`
    )
  }

  // ─── Contents ────────────────────────────────────────────

  static async findOrCreateContent(
    params: FindOrCreateContentParams
  ): Promise<Content> {
    return tapestryRequest<Content>('/contents/findOrCreate', {
      method: 'POST',
      body: JSON.stringify(params)
    })
  }

  static async getContents(
    params: GetContentsParams = {}
  ): Promise<GetContentsResponse> {
    const qs = toQueryString(params as Record<string, string | undefined>)
    return tapestryRequest<GetContentsResponse>(`/contents/${qs}`)
  }

  static async getContentsAggregation(
    params: GetContentsAggregationParams
  ): Promise<GetContentsAggregationResponse> {
    const qs = toQueryString(params as Record<string, string | undefined>)
    return tapestryRequest<GetContentsAggregationResponse>(
      `/contents/aggregation${qs}`
    )
  }

  static async getContentById(
    id: string,
    requestingProfileId?: string
  ): Promise<ContentDetails> {
    const qs = toQueryString({ requestingProfileId })
    return tapestryRequest<ContentDetails>(
      `/contents/${encodeURIComponent(id)}${qs}`
    )
  }

  static async updateContent(
    id: string,
    params: UpdateContentParams
  ): Promise<Content> {
    return tapestryRequest<Content>(
      `/contents/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(params)
      }
    )
  }

  static async deleteContent(id: string) {
    return tapestryRequest(
      `/contents/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    )
  }

  static async batchGetContents(
    ids: string[]
  ): Promise<GetBatchContentsResponse> {
    if (ids.length > 20) {
      throw new Error('Maximum 20 content IDs per batch request')
    }
    return tapestryRequest<GetBatchContentsResponse>('/contents/batch/read', {
      method: 'POST',
      body: JSON.stringify(ids)
    })
  }

  // ─── Comments ──────────────────────────────────────────

  static async createComment(
    params: CreateCommentParams
  ): Promise<Comment> {
    return tapestryRequest<Comment>('/comments/', {
      method: 'POST',
      body: JSON.stringify(params)
    })
  }

  static async getComments(
    params: GetCommentsParams = {}
  ): Promise<GetCommentsResponse> {
    const qs = toQueryString(params as Record<string, string | undefined>)
    return tapestryRequest<GetCommentsResponse>(`/comments/${qs}`)
  }

  static async getCommentById(
    id: string,
    requestingProfileId?: string
  ): Promise<CommentDetailsWithReplies> {
    const qs = toQueryString({ requestingProfileId })
    return tapestryRequest<CommentDetailsWithReplies>(
      `/comments/${encodeURIComponent(id)}${qs}`
    )
  }

  static async updateComment(
    id: string,
    params: UpdateCommentParams
  ): Promise<Comment> {
    return tapestryRequest<Comment>(
      `/comments/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(params)
      }
    )
  }

  static async deleteComment(id: string) {
    return tapestryRequest(
      `/comments/${encodeURIComponent(id)}`,
      { method: 'DELETE' }
    )
  }

  static async getCommentReplies(
    id: string,
    params: GetCommentsParams = {}
  ): Promise<GetCommentsResponse> {
    const qs = toQueryString(params as Record<string, string | undefined>)
    return tapestryRequest<GetCommentsResponse>(
      `/comments/${encodeURIComponent(id)}/replies${qs}`
    )
  }

  static async batchGetComments(
    ids: string[]
  ): Promise<GetBatchCommentsResponse> {
    if (ids.length > 20) {
      throw new Error('Maximum 20 comment IDs per batch request')
    }
    return tapestryRequest<GetBatchCommentsResponse>('/comments/batch/read', {
      method: 'POST',
      body: JSON.stringify(ids)
    })
  }

  // ─── Likes ─────────────────────────────────────────────

  static async getLikes(
    nodeId: string,
    params: GetLikesParams = {}
  ): Promise<GetLikesResponse> {
    const qs = toQueryString(params as Record<string, string | undefined>)
    return tapestryRequest<GetLikesResponse>(
      `/likes/${encodeURIComponent(nodeId)}${qs}`
    )
  }

  static async createLike(nodeId: string, startId: string) {
    return tapestryRequest(
      `/likes/${encodeURIComponent(nodeId)}`,
      {
        method: 'POST',
        body: JSON.stringify({ startId })
      }
    )
  }

  static async deleteLike(nodeId: string, startId: string) {
    return tapestryRequest(
      `/likes/${encodeURIComponent(nodeId)}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ startId })
      }
    )
  }
}
