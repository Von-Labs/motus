// Tapestry API Types

// ─── Common ──────────────────────────────────────────────

export type Blockchain = 'SOLANA' | 'ETHEREUM'
export type WalletType = 'PHANTOM' | 'WEB3AUTH'
export type ContactType = 'EMAIL' | 'PHONE' | 'TWITTER' | 'FARCASTER'
export type HandleType = 'X_HANDLE' | 'FARCASTER_HANDLE'
export type Execution = 'FAST_UNCONFIRMED' | 'QUICK_SIGNATURE' | 'CONFIRMED_AND_PARSED'
export type SuggestionReason = 'EXTERNAL_NAMESPACE_FOLLOWS' | 'POPULAR_IN_NAMESPACE'
export type ExternalProfileURLKey = 'id' | 'walletAddress' | 'username'

export interface Property {
  key: string
  value: string | number | boolean
}

export interface Contact {
  id: string
  type: ContactType
  bio?: string
  image?: string
}

export interface Wallet {
  id: string
  created_at: number
  blockchain: Blockchain
  wallet_type?: WalletType
}

export interface WalletAddress {
  address: string
}

export interface Namespace {
  name: string | null
  readableName: string | null
  faviconURL: string | null
  userProfileURL: string | null
  externalProfileURL: string | null
}

export interface NamespaceWithKey {
  name: string | null
  readableName: string | null
  faviconURL: string | null
  userProfileURL: string | null
  externalProfileURLKey: ExternalProfileURLKey
}

export interface SocialCounts {
  followers: number
  following: number
}

export interface ContentSocialCounts {
  likeCount: number
  commentCount: number
}

// ─── Profile ─────────────────────────────────────────────

export interface Profile {
  id: string
  namespace: string
  created_at: number
  username: string
  bio?: string | null
  image?: string | null
}

export interface ProfileWithWallet extends Profile {
  wallet?: Wallet | null
}

// ─── Profile Requests ────────────────────────────────────

export interface FindOrCreateProfileParams {
  username: string
  id?: string
  bio?: string
  image?: string
  referredById?: string
  campaignId?: number
  inviteCode?: string
  walletAddress?: string
  blockchain?: Blockchain
  contact?: {
    id: string
    type: ContactType
    bio?: string
    image?: string
  }
  properties?: Property[]
  execution?: Execution
}

export interface UpdateProfileParams {
  username?: string
  bio?: string
  image?: string
  properties?: Property[]
  execution?: Execution
}

export interface GetProfilesParams {
  walletAddress?: string
  phoneNumber?: string
  twitterHandle?: string
  email?: string
  namespace?: string
  page?: string
  pageSize?: string
  sortBy?: string
  sortDirection?: 'ASC' | 'DESC'
}

export interface GetFollowersParams {
  page?: string
  pageSize?: string
}

export interface GetGlobalFollowersParams {
  page?: string
  pageSize?: string
  handleType?: HandleType
}

export interface GetFollowingWhoFollowParams {
  requestorId: string
  page?: string
  pageSize?: string
}

export interface GetTokenOwnersParams {
  namespace?: string
  requestorId?: string
  includeExternalProfiles?: string
  page?: string
  pageSize?: string
}

export interface LinkWalletsParams {
  wallets: Array<{
    address: string
    blockchain: Blockchain
  }>
}

export interface SendNotificationParams {
  message: string
  title?: string
}

// ─── Profile Responses ───────────────────────────────────

export interface FindOrCreateProfileResponse {
  profile: Profile
  walletAddress?: string
  hashedPhoneNumber?: string
  contact?: Contact
  operation: 'CREATED' | 'FOUND'
}

export interface GetProfileDetailsResponse {
  profile: Profile
  walletAddress?: string
  hashedPhoneNumber?: string
  contact?: Contact
  socialCounts: SocialCounts
  namespace?: Namespace
}

export interface GetProfilesResponse {
  profiles: Array<{
    profile: Profile
    wallet?: WalletAddress
    namespace?: Namespace
    contact?: Contact
    socialCounts: SocialCounts
  }>
  page: number
  pageSize: number
  totalCount: number
}

export interface SuggestedProfileFollow {
  namespaces: NamespaceWithKey[]
  profile: Profile
  suggestionReason: SuggestionReason
  wallet?: WalletAddress
  contact?: Contact
  lastEstimatedNetWorth?: number
}

export interface ProfileIdentity {
  wallet?: { address: string }
  contact?: { id: string }
  profiles: Array<{
    profile: Profile
    namespace: NamespaceWithKey
    socialCounts: SocialCounts
  }>
}

// ─── Content ─────────────────────────────────────────────

export interface Content {
  id: string
  created_at: number
  namespace: string
  externalLinkURL?: string
}

export interface ContentDetails {
  content: Content | null
  socialCounts: ContentSocialCounts
  authorProfile: Profile
  requestingProfileSocialInfo?: {
    hasLiked: boolean
  }
}

// ─── Content Requests ────────────────────────────────────

export interface FindOrCreateContentParams {
  id: string
  profileId?: string
  relatedContentId?: string
  properties?: Property[]
}

export interface UpdateContentParams {
  properties: Property[]
}

export interface GetContentsParams {
  orderByField?: string
  orderByDirection?: 'ASC' | 'DESC'
  requireFields?: string
  filters?: string
  page?: string
  pageSize?: string
  profileId?: string
  requestingProfileId?: string
  namespace?: string
}

export interface GetContentsAggregationParams {
  aggregation: string
  requireFields?: string
  filters?: string
  profileId?: string
  requestingProfileId?: string
  namespace?: string
}

// ─── Content Responses ───────────────────────────────────

export interface GetContentsResponse {
  contents: ContentDetails[]
  page: number
  pageSize: number
  totalCount: number
}

export interface GetContentsAggregationResponse {
  aggregations: Record<string, unknown>
  totalCount: number
}

export interface GetBatchContentsResponse {
  successful: ContentDetails[]
  failed: Array<{
    id: string
    error: string
  }>
}

// ─── Comment ─────────────────────────────────────────────

export interface Comment {
  id: string
  created_at: number
  text: string
}

export interface CommentDetails {
  comment: Comment
  contentId?: string
  author?: Profile
  socialCounts: {
    likeCount: number
  }
  requestingProfileSocialInfo?: {
    hasLiked: boolean
  }
}

export interface CommentDetailsWithReplies extends CommentDetails {
  recentReplies?: CommentDetails[]
}

// ─── Comment Requests ────────────────────────────────────

export interface CreateCommentParams {
  profileId: string
  text: string
  contentId?: string
  commentId?: string
  targetProfileId?: string
  properties?: Property[]
}

export interface UpdateCommentParams {
  properties: Property[]
}

export interface GetCommentsParams {
  contentId?: string
  profileId?: string
  targetProfileId?: string
  page?: string
  pageSize?: string
  requestingProfileId?: string
}

// ─── Comment Responses ───────────────────────────────────

export interface GetCommentsResponse {
  comments: CommentDetailsWithReplies[]
  page: number
  pageSize: number
}

export interface GetBatchCommentsResponse {
  successful: CommentDetails[]
  failed: Array<{
    id: string
    error: string
  }>
}

// ─── Like ────────────────────────────────────────────────

export interface LikeProfile extends Profile {
  isFollowedByRequester?: boolean
}

export interface GetLikesResponse {
  profiles: LikeProfile[]
  total: number
}

export interface GetLikesParams {
  page?: string
  pageSize?: string
  requestingProfileId?: string
}
