import dotenv from 'dotenv'
dotenv.config()

import { TapestryService } from './tapestryService'

const WALLET = 'AdjN2jSx9J6JekavLzmHuZxUMv1YuMqtkNsDYuRB82nG'

async function main() {
  // 1. Find or create profile
  console.log('\n📝 Finding or creating profile...')
  const profileResult = await TapestryService.findOrCreateProfile({
    walletAddress: WALLET,
    username: WALLET,
    blockchain: 'SOLANA'
  })
  console.log('Profile result:', JSON.stringify(profileResult, null, 2))

  const profileId = profileResult.profile.id

  // 2. Create content
  console.log('\n📄 Creating content...')
  const contentResult = await TapestryService.findOrCreateContent({
    id: `test-content-${Date.now()}`,
    profileId,
    properties: [
      { key: 'title', value: 'Hello from Motus' },
      { key: 'type', value: 'post' },
      { key: 'image', value: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' }
    ]
  })
  console.log('Content result:', JSON.stringify(contentResult, null, 2))

  const contentId = contentResult.id

  // 3. Like the content
  console.log('\n❤️ Liking content...')
  const likeResult = await TapestryService.createLike(contentId, profileId)
  console.log('Like result:', JSON.stringify(likeResult, null, 2))

  // 4. Comment on the content
  console.log('\n💬 Commenting on content...')
  const commentResult = await TapestryService.createComment({
    profileId,
    contentId,
    text: 'This is a test comment from Motus!'
  })
  console.log('Comment result:', JSON.stringify(commentResult, null, 2))

  // 5. Get likes to verify
  console.log('\n👀 Getting likes...')
  const likes = await TapestryService.getLikes(contentId)
  console.log('Likes:', JSON.stringify(likes, null, 2))

  // 6. Get comments to verify
  console.log('\n👀 Getting comments...')
  const comments = await TapestryService.getComments({ contentId })
  console.log('Comments:', JSON.stringify(comments, null, 2))
}

main().catch(console.error)
