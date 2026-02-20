import express from 'express'
import { buildTransferTransaction } from './transferService'
import { JupiterService } from '../jupiter/jupiterService'

const router = express.Router()

// Fallback list for common tokens, used when Jupiter search fails or returns empty
const FALLBACK_TOKENS = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9
  },
  {
    // USDC (mainnet)
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6
  },
  {
    // USDT (mainnet)
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6
  },
  {
    // BONK (mainnet)
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5
  },
  {
    // JUP (mainnet)
    address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    symbol: 'JUP',
    name: 'Jupiter',
    decimals: 6
  }
] as const

/**
 * GET /api/sends/tokens?query=...
 * Search tokens via Jupiter (same list as swap). Returns [{ address, symbol, name, decimals, logoURI? }].
 * Use for token picker when sending any Jupiter-supported token.
 */
router.get('/tokens', async (req, res) => {
  const query = ((req.query.query as string) || '').trim()
  if (!query) {
    return res.json([])
  }

  const lc = query.toLowerCase()

  try {
    const tokens = await JupiterService.searchTokens(query)

    if (Array.isArray(tokens) && tokens.length > 0) {
      return res.json(tokens)
    }

    // Jupiter returned empty; fall back to static list
    const fallback = FALLBACK_TOKENS.filter(
      (t) =>
        t.symbol.toLowerCase().includes(lc) ||
        (t.name && t.name.toLowerCase().includes(lc))
    )
    return res.json(fallback)
  } catch (error: any) {
    console.error('Send tokens search error:', error)

    // On error, still try to return something useful from fallback list
    const fallback = FALLBACK_TOKENS.filter(
      (t) =>
        t.symbol.toLowerCase().includes(lc) ||
        (t.name && t.name.toLowerCase().includes(lc))
    )

    if (fallback.length > 0) {
      return res.json(fallback)
    }

    return res.status(500).json({
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
