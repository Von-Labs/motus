import express from 'express'
import { claude } from './claude'
import { claudeWithTools } from './claudeWithTools'
import { gpt } from './gpt'
import { gemini } from './gemini'
import { JupiterService } from '../jupiter/jupiterService'

const router = express.Router()

router.post('/claude', claude)
router.post('/claude-tools', claudeWithTools)
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