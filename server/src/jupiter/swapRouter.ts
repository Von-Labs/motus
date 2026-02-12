import express from 'express'
import { JupiterService } from './jupiterService'

const router = express.Router()

// 1. Get swap quote with unsigned transaction
router.post('/quote', async (req, res) => {
  try {
    const { inputMint, outputMint, amount, slippageBps, userPublicKey } = req.body

    if (!inputMint || !outputMint || !amount || !userPublicKey) {
      return res.status(400).json({
        error: 'Missing required fields: inputMint, outputMint, amount, userPublicKey'
      })
    }

    const quote = await JupiterService.getSwapQuote({
      inputMint,
      outputMint,
      amount: Number(amount),
      slippageBps: slippageBps || 50,
      userPublicKey
    })

    res.json({
      success: true,
      quote,
      // requestId will be needed for executing
      requestId: quote.contextSlot?.toString() || Date.now().toString()
    })
  } catch (error: any) {
    console.error('Jupiter quote error:', error)
    res.status(500).json({
      error: 'Failed to get quote',
      message: error.message
    })
  }
})

// 2. Submit signed transaction to Jupiter
router.post('/execute', async (req, res) => {
  try {
    const { signedTransaction, requestId } = req.body

    if (!signedTransaction || !requestId) {
      return res.status(400).json({
        error: 'Missing required fields: signedTransaction, requestId'
      })
    }

    // Execute the signed transaction via Jupiter
    const result = await fetch('https://api.jup.ag/ultra/v1/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.JUPITER_API_KEY && {
          'x-api-key': process.env.JUPITER_API_KEY
        })
      },
      body: JSON.stringify({
        signedTransaction,
        requestId
      })
    })

    const data = await result.json()

    if (!result.ok) {
      throw new Error(data.error || 'Jupiter execution failed')
    }

    res.json({
      success: true,
      signature: data.signature,
      data
    })
  } catch (error: any) {
    console.error('Jupiter execute error:', error)
    res.status(500).json({
      error: 'Failed to execute swap',
      message: error.message
    })
  }
})

// 3. Combined endpoint: Get quote with transaction for signing
router.post('/prepare', async (req, res) => {
  try {
    const { inputMint, outputMint, amount, slippageBps, userPublicKey } = req.body

    if (!inputMint || !outputMint || !amount || !userPublicKey) {
      return res.status(400).json({
        error: 'Missing required fields'
      })
    }

    const quote = await JupiterService.getSwapQuote({
      inputMint,
      outputMint,
      amount: Number(amount),
      slippageBps: slippageBps || 50,
      userPublicKey
    })

    // Jupiter Ultra returns the transaction in the quote response
    res.json({
      success: true,
      quote,
      requestId: quote.contextSlot?.toString() || Date.now().toString(),
      // The unsigned transaction should be in the quote response
      // Format depends on Jupiter API response structure
    })
  } catch (error: any) {
    console.error('Jupiter prepare error:', error)
    res.status(500).json({
      error: 'Failed to prepare swap',
      message: error.message
    })
  }
})

export default router
