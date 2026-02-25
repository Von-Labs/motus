# Tapestry Service

Integration with [Tapestry API](https://api.usetapestry.dev/api/v1) for social features: profiles, content, comments, likes, and followers.

## Setup

Add to `server/.env`:

```env
TAPESTRY_API_KEY="your-api-key"
TAPESTRY_BASE_URL="https://api.usetapestry.dev/api/v1"
```

## Files

| File | Description |
|------|-------------|
| `tapestryService.ts` | Service class with static methods for all Tapestry API calls |
| `tapestryRouter.ts` | Express router exposing endpoints at `/api/tapestry/*` |
| `types.ts` | TypeScript interfaces for requests/responses |
| `test.ts` | Test script for verifying API integration |

## API Endpoints

Base path: `/api/tapestry`

### Profiles

| Method | Path | Description |
|--------|------|-------------|
| POST | `/profiles/findOrCreate` | Create or find a profile |
| GET | `/profiles` | List profiles with filters |
| GET | `/profiles/:id` | Get profile details |
| PUT | `/profiles/:id` | Update a profile |
| GET | `/profiles/:id/followers` | Get followers |
| GET | `/profiles/:id/followers/global` | Get global followers |
| GET | `/profiles/:id/following` | Get following |
| GET | `/profiles/:id/following/global` | Get global following |
| GET | `/profiles/:id/following-who-follow` | Get mutual followers |
| GET | `/profiles/:id/suggested-profiles` | Get suggested profiles |
| GET | `/profiles/suggested/:identifier` | Get suggestions by identifier |
| GET | `/profiles/suggested/:identifier/global` | Get suggestions to invite |
| GET | `/profiles/:id/referrals` | Get referrals |
| GET | `/profiles/:id/wallets` | Get profile wallets |
| PATCH | `/profiles/:id/wallets` | Link wallets |
| DELETE | `/profiles/:id/wallets` | Unlink wallets |
| GET | `/profiles/token-owners/:tokenAddress` | Get token owner profiles |
| POST | `/profiles/:id/notification` | Send notification |
| GET | `/profiles/:id/contacts` | Get profile contacts |

### Contents

| Method | Path | Description |
|--------|------|-------------|
| POST | `/contents/findOrCreate` | Create or find content |
| GET | `/contents` | List contents with filters |
| GET | `/contents/aggregation` | Get aggregated content data |
| GET | `/contents/:id` | Get content details |
| PUT | `/contents/:id` | Update content |
| DELETE | `/contents/:id` | Delete content |
| POST | `/contents/batch/read` | Batch get contents (max 20) |

### Comments

| Method | Path | Description |
|--------|------|-------------|
| POST | `/comments` | Create a comment |
| GET | `/comments` | List comments (filter by contentId/profileId/targetProfileId) |
| GET | `/comments/:id` | Get comment with replies |
| PUT | `/comments/:id` | Update comment |
| DELETE | `/comments/:id` | Delete comment |
| GET | `/comments/:id/replies` | Get comment replies |
| POST | `/comments/batch/read` | Batch get comments (max 20) |

### Likes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/likes/:nodeId` | Get profiles who liked a node |
| POST | `/likes/:nodeId` | Like a node (content or comment) |
| DELETE | `/likes/:nodeId` | Unlike a node |

## Usage Examples

### Service (direct)

```typescript
import { TapestryService } from './tapestryService'

// Create profile
const { profile } = await TapestryService.findOrCreateProfile({
  walletAddress: 'AdjN2jSx...',
  username: 'alice',
  blockchain: 'SOLANA'
})

// Create content with properties
const content = await TapestryService.findOrCreateContent({
  id: 'post-123',
  profileId: profile.id,
  properties: [
    { key: 'title', value: 'My first post' },
    { key: 'image', value: 'https://example.com/image.png' }
  ]
})

// Like content
await TapestryService.createLike(content.id, profile.id)

// Comment on content
const comment = await TapestryService.createComment({
  profileId: profile.id,
  contentId: content.id,
  text: 'Great post!'
})

// Reply to comment
await TapestryService.createComment({
  profileId: profile.id,
  commentId: comment.id,
  text: 'Thanks!'
})
```

### Router (HTTP)

```bash
# Create profile
curl -X POST localhost:3050/api/tapestry/profiles/findOrCreate \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"AdjN2jSx...","username":"alice","blockchain":"SOLANA"}'

# Create content
curl -X POST localhost:3050/api/tapestry/contents/findOrCreate \
  -H "Content-Type: application/json" \
  -d '{"id":"post-123","profileId":"...","properties":[{"key":"title","value":"Hello"}]}'

# Like content
curl -X POST localhost:3050/api/tapestry/likes/post-123 \
  -H "Content-Type: application/json" \
  -d '{"startId":"profile-id"}'

# Add comment
curl -X POST localhost:3050/api/tapestry/comments \
  -H "Content-Type: application/json" \
  -d '{"profileId":"...","contentId":"post-123","text":"Nice!"}'
```

## Running Tests

```bash
cd server
export PATH="$HOME/.nvm/versions/node/v22.14.0/bin:$PATH"
npx tsx src/services/tapestry/test.ts
```

## Notes

- Tapestry uses `apiKey` as a query parameter (not header) for authentication
- Content `properties` are flattened into top-level fields in the response
- Content creation requires at least one property (cannot be empty)
- Likes work on both content and comment nodes via `nodeId`
- Node 18+ required (uses native `fetch`)
