import nacl from 'tweetnacl'
import bs58 from 'bs58'

const SIGN_MESSAGE_PREFIX = 'Motus: verify wallet '

/**
 * Build the message that must be signed for wallet verification.
 */
export function buildVerifyMessage(walletAddress: string): string {
  return `${SIGN_MESSAGE_PREFIX}${walletAddress}`
}

/**
 * Verify that a wallet signature is valid for the given wallet address.
 * The expected signed message is "Motus: verify wallet <walletAddress>".
 *
 * @param walletAddress - Solana wallet public key (base58)
 * @param signatureBase64 - ed25519 signature encoded as base64
 * @returns true if the signature is valid
 */
export function verifyWalletSignature(
  walletAddress: string,
  signatureBase64: string
): boolean {
  try {
    const message = buildVerifyMessage(walletAddress)
    const messageBytes = new TextEncoder().encode(message)
    const signatureBytes = Buffer.from(signatureBase64, 'base64')
    const publicKeyBytes = bs58.decode(walletAddress)

    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes)
  } catch (error) {
    console.error('Wallet signature verification failed:', error)
    return false
  }
}
