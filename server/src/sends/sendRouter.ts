import express from 'express'
import { buildTransferTransaction } from './transferService'
import { JupiterService } from '../jupiter/jupiterService'

const router = express.Router()

/**
 * GET /api/sends/tokens?query=...
 * Search tokens via Jupiter (same list as swap). Returns [{ address, symbol, name, decimals, logoURI? }].
 * Use for token picker when sending any Jupiter-supported token.
 */
router.get('/tokens', async (req, res) => {
  try {
    const query = (req.query.query as string) || ''
    if (!query.trim()) {
      return res.json([])
    }
    const tokens = await JupiterService.searchTokens(query.trim())
    res.json(tokens)
  } catch (error: any) {
    console.error('Send tokens search error:', error)
    res.status(500).json({
      error: 'Failed to search tokens',
      message: error.message
    })
  }
})

/**
 * GET /api/sends/token?mint=...
 * Get token info by mint (for resolving symbol/name on old transactions that didn't save them).
 * Returns { symbol, name } or {} if not found.
 */
router.get('/token', async (req, res) => {
  try {
    const mint = (req.query.mint as string) || ''
    if (!mint.trim()) {
      return res.json({})
    }
    const tokens = await JupiterService.searchTokens(mint.trim())
    const first = Array.isArray(tokens) && tokens.length > 0 ? tokens[0] : null
    if (!first) return res.json({})
    res.json({
      symbol: (first as any).symbol ?? '',
      name: (first as any).name ?? ''
    })
  } catch (error: any) {
    console.error('Send token by mint error:', error)
    res.status(500).json({ error: 'Failed to get token', message: error.message })
  }
})

/**
 * POST /api/sends/prepare
 * Body: { sender, recipient, amount, mint?, decimals? }
 * Returns: { success, transaction (base64), type, amount, mint? }
 */
router.post('/prepare', async (req, res) => {
  try {
    const { sender, recipient, amount, mint, decimals, cluster } = req.body

    if (!sender || !recipient || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: sender, recipient, amount'
      })
    }

    const network = cluster === 'devnet' ? 'devnet' : 'mainnet-beta'
    const result = await buildTransferTransaction(
      {
        sender,
        recipient,
        amount: String(amount),
        mint,
        decimals
      },
      network
    )

    res.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('Send prepare error:', error)
    res.status(500).json({
      error: 'Failed to prepare send transaction',
      message: error.message
    })
  }
})

export default router
