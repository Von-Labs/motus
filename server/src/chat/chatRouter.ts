import express from 'express'
import asyncHandler from 'express-async-handler'
import { claude } from './claude'
import { claudeWithTools } from './claudeWithTools'
import { gpt } from './gpt'
import { gemini } from './gemini'
import { JupiterService } from '../jupiter/jupiterService'
import { checkBalance, manualTrackUsage } from '../middleware/trackUsage'

const router = express.Router()

// Claude endpoints with balance check
router.post('/claude', checkBalance, claude)
router.post('/claude-tools', checkBalance, claudeWithTools)

// Summarize endpoint for share-to-social (with balance check)
router.post('/summarize', checkBalance, asyncHandler(async (req, res) => {
  const { text } = req.body
  const walletAddress = req.headers['x-wallet-address'] as string

  if (!text) {
    res.status(400).json({ error: 'Missing required field: text' })
    return
  }

  const model = 'claude-haiku-4-5-20251001'
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': process.env.ANTHROPIC_API_KEY || ''
    },
    body: JSON.stringify({
      model,
      max_tokens: 280,
      messages: [{ role: 'user', content: `Summarize this AI assistant response into a short, engaging social media post (max 280 chars). Keep it informative and concise. Do not use hashtags. Only return the summary text, nothing else.\n\nResponse:\n${text}` }]
    })
  })

  const data = await response.json() as any
  const summary = data.content?.[0]?.text || text.slice(0, 280)

  // Track usage
  const inputTokens = data.usage?.input_tokens || 0
  const outputTokens = data.usage?.output_tokens || 0
  if (walletAddress && inputTokens > 0) {
    manualTrackUsage({
      walletAddress,
      model,
      requestType: 'summarize',
      inputTokens,
      outputTokens,
      endpoint: '/chat/summarize'
    }).catch(err => console.error('Failed to track summarize usage:', err))
  }

  res.json({ summary })
}))

// Other endpoints without balance check (for now)
router.post('/gpt', gpt)
router.post('/gemini', gemini)

// Debug endpoint to test Jupiter API
router.get('/test-jupiter', async (req, res) => {
  try {
    const results = {
      apiKey: process.env.JUPITER_API_KEY ? 'Loaded ✅' : 'Missing ❌',
      tests: {} as any
    }

    // Test 1: Search JUP
    try {
      const search = await JupiterService.searchTokens('JUP')
      results.tests.search = {
        status: 'success ✅',
        count: search.length,
        first: search[0]?.name
      }
    } catch (err: any) {
      results.tests.search = { status: 'failed ❌', error: err.message }
    }

    // Test 2: Get price
    try {
      const price = await JupiterService.getTokenPrices([
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN'
      ])
      results.tests.price = {
        status: 'success ✅',
        data: price.data
      }
    } catch (err: any) {
      results.tests.price = { status: 'failed ❌', error: err.message }
    }

    res.json(results)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router