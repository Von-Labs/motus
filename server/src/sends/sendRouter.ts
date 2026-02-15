import express from 'express'
import { buildTransferTransaction } from './transferService'

const router = express.Router()

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
