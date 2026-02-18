import { Router, Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const asyncHandler = require('express-async-handler');
import { db } from '../db/supabase';
import { verifyDeposit, prepareDeposit } from '../deposit/depositService';

const TREASURY_WALLET = process.env.TREASURY_WALLET_ADDRESS!;

const router = Router();

// Get user stats
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const walletAddress = req.headers['x-wallet-address'] as string;

    if (!walletAddress) {
      res.status(400).json({
        error: 'Missing wallet address',
        message: 'Please provide X-Wallet-Address header'
      });
      return;
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
      res.status(400).json({
        error: 'Missing wallet address',
        message: 'Please provide X-Wallet-Address header'
      });
      return;
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
      res.status(400).json({
        error: 'Missing wallet address',
        message: 'Please provide X-Wallet-Address header'
      });
      return;
    }

    const transactions = await db.getTransactionHistory(walletAddress, limit);
    res.json({ transactions });
  })
);

// Prepare unsigned USDC deposit transaction for client to sign
router.post(
  '/deposit/prepare',
  asyncHandler(async (req: Request, res: Response) => {
    const walletAddress = req.headers['x-wallet-address'] as string;

    if (!walletAddress) {
      res.status(400).json({
        error: 'Missing wallet address',
        message: 'Please provide X-Wallet-Address header'
      });
      return;
    }

    const { amount } = req.body;

    if (!amount || isNaN(parseFloat(amount))) {
      res.status(400).json({
        error: 'Missing amount',
        message: 'Please provide a valid USDC amount'
      });
      return;
    }

    const result = await prepareDeposit(walletAddress, parseFloat(amount));
    res.json(result);
  })
);

// Add USDC deposit - verifies on-chain before crediting
router.post(
  '/deposit',
  asyncHandler(async (req: Request, res: Response) => {
    const walletAddress = req.headers['x-wallet-address'] as string;

    if (!walletAddress) {
      res.status(400).json({
        error: 'Missing wallet address',
        message: 'Please provide X-Wallet-Address header'
      });
      return;
    }

    const { signature } = req.body;

    if (!signature) {
      res.status(400).json({
        error: 'Missing signature',
        message: 'Please provide the Solana transaction signature'
      });
      return;
    }

    // Verify the transaction on-chain
    const verification = await verifyDeposit(signature);

    if (!verification.valid) {
      res.status(400).json({
        error: 'Invalid transaction',
        message: verification.error
      });
      return;
    }

    // Check signature not already used (prevent double-spend)
    const existing = await db.getDepositBySignature(signature);
    if (existing) {
      res.status(409).json({
        error: 'Transaction already processed',
        message: 'This transaction signature has already been used'
      });
      return;
    }

    // Credit the user's balance
    const transaction = await db.addUsdcDeposit({
      walletAddress,
      amount: verification.amount!,
      signature,
      fromAddress: verification.sender!,
      toAddress: TREASURY_WALLET,
    });

    res.json({
      success: true,
      amount: verification.amount,
      transaction,
    });
  })
);

export default router;
