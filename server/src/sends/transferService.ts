import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import type { SendTokensParams, SendTokensResponse } from './types'

const SOL_MINT = 'So11111111111111111111111111111111111111112'

const RPC_BY_CLUSTER: Record<string, string> = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  devnet: 'https://api.devnet.solana.com',
}

function getConnection(cluster?: 'mainnet-beta' | 'devnet'): Connection {
  const rpc =
    cluster === 'devnet'
      ? RPC_BY_CLUSTER.devnet
      : (process.env.SOLANA_RPC_URL || RPC_BY_CLUSTER['mainnet-beta'])
  return new Connection(rpc)
}

/**
 * Build an unsigned transfer transaction (SOL or SPL).
 * @param params - sender, recipient, amount, mint?, decimals?
 * @param cluster - optional 'mainnet-beta' | 'devnet'; if set, server uses that RPC (khớp với app/ví).
 */
export async function buildTransferTransaction(
  params: SendTokensParams,
  cluster?: 'mainnet-beta' | 'devnet'
): Promise<SendTokensResponse> {
  const { sender, recipient, amount, mint, decimals } = params
  const connection = getConnection(cluster)

  const senderPubkey = new PublicKey(sender)
  const recipientPubkey = new PublicKey(recipient)
  const amountBigInt = BigInt(amount)

  const transaction = new Transaction()

  if (!mint || mint === SOL_MINT) {
    // Native SOL transfer
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: senderPubkey,
        toPubkey: recipientPubkey,
        lamports: amountBigInt
      })
    )

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = senderPubkey

    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    })
    const base64 = serialized.toString('base64')

    return {
      transaction: base64,
      type: 'sol',
      amount
    }
  }

  // SPL token transfer
  if (decimals === undefined || decimals === null) {
    throw new Error('decimals is required for SPL token transfer')
  }

  const mintPubkey = new PublicKey(mint)

  const senderAta = await getAssociatedTokenAddress(
    mintPubkey,
    senderPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
  const recipientAta = await getAssociatedTokenAddress(
    mintPubkey,
    recipientPubkey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )

  const recipientAtaInfo = await connection.getAccountInfo(recipientAta)
  if (!recipientAtaInfo) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        senderPubkey,
        recipientAta,
        recipientPubkey,
        mintPubkey,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    )
  }

  transaction.add(
    createTransferCheckedInstruction(
      senderAta,
      mintPubkey,
      recipientAta,
      senderPubkey,
      amountBigInt,
      decimals,
      [],
      TOKEN_PROGRAM_ID
    )
  )

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = senderPubkey

  const serialized = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false
  })
  const base64 = serialized.toString('base64')

  return {
    transaction: base64,
    type: 'spl',
    amount,
    mint
  }
}
