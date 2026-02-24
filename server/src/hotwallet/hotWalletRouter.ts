import express from 'express';
import asyncHandler from 'express-async-handler';
import { Connection, PublicKey } from '@solana/web3.js';

function getConnection(): Connection {
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!rpcUrl) {
    throw new Error('SOLANA_RPC_URL is not set');
  }
  return new Connection(rpcUrl, 'confirmed');
}

const router = express.Router();

// Get latest blockhash and a recent slot for minContextSlot
router.get(
  '/blockhash',
  asyncHandler(async (_req, res) => {
    const connection = getConnection();
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash('confirmed');
    const slot = await connection.getSlot('confirmed');

    res.json({
      blockhash,
      lastValidBlockHeight,
      minContextSlot: slot,
    });
  }),
);

// Get hot wallet balance (lamports) on chain
router.get(
  '/balance',
  asyncHandler(async (req, res) => {
    const { pubkey } = req.query as { pubkey?: string };
    if (!pubkey) {
      res.status(400).json({ error: 'Missing pubkey' });
      return;
    }

    const connection = getConnection();
    const balance = await connection.getBalance(new PublicKey(pubkey));
    res.json({ balance });
  }),
);

// Send a signed transaction (base64) using secure RPC
router.post(
  '/send-raw',
  asyncHandler(async (req, res) => {
    const { transaction } = req.body as { transaction?: string };
    if (!transaction) {
      res.status(400).json({ error: 'Missing transaction' });
      return;
    }

    const connection = getConnection();
    const rawTx = Buffer.from(transaction, 'base64');
    const signature = await connection.sendRawTransaction(rawTx);
    await connection.confirmTransaction(signature, 'confirmed');

    res.json({ signature });
  }),
);

// Confirm a transaction signature on chain
router.post(
  '/confirm',
  asyncHandler(async (req, res) => {
    const { signature } = req.body as { signature?: string };
    if (!signature) {
      res.status(400).json({ error: 'Missing signature' });
      return;
    }

    const connection = getConnection();
    const result = await connection.confirmTransaction(signature, 'confirmed');
    res.json(result);
  }),
);

export default router;


