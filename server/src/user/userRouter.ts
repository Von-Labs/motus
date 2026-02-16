import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { db } from '../db/supabase';

const router = Router();

// Get user stats
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const walletAddress = req.headers['x-wallet-address'] as string;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Missing wallet address',
        message: 'Please provide X-Wallet-Address header'
      });
    }

    const stats = await db.getUserStats(walletAddress);

    res.json(stats);
  })
);

// Get usage history
router.get(
  '/usage',
  asyncHandler(async (req: Request, res: Response) => {
    const walletAddress = req.headers['x-wallet-address'] as string;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Missing wallet address',
        message: 'Please provide X-Wallet-Address header'
      });
    }

    const usage = await db.getUsageHistory(walletAddress, limit);

    res.json({ usage });
  })
);

// Get transaction history
router.get(
  '/transactions',
  asyncHandler(async (req: Request, res: Response) => {
    const walletAddress = req.headers['x-wallet-address'] as string;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Missing wallet address',
        message: 'Please provide X-Wallet-Address header'
      });
    }

    const transactions = await db.getTransactionHistory(walletAddress, limit);

    res.json({ transactions });
  })
);

// Add USDC deposit
router.post(
  '/deposit',
  asyncHandler(async (req: Request, res: Response) => {
    const walletAddress = req.headers['x-wallet-address'] as string;

    if (!walletAddress) {
      return res.status(400).json({
        error: 'Missing wallet address',
        message: 'Please provide X-Wallet-Address header'
      });
    }

    const { amount, signature, fromAddress, toAddress } = req.body;

    if (!amount || !signature || !fromAddress || !toAddress) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Please provide amount, signature, fromAddress, and toAddress'
      });
    }

    // TODO: Verify the Solana transaction signature before crediting
    // This is a placeholder - you should verify the transaction on-chain

    const transaction = await db.addUsdcDeposit({
      walletAddress,
      amount: parseFloat(amount),
      signature,
      fromAddress,
      toAddress
    });

    res.json({
      success: true,
      transaction
    });
  })
);

export default router;
