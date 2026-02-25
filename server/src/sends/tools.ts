export const sendTools = [
  {
    name: 'send_tokens',
    description:
      'Send SOL or SPL tokens to another wallet address on Solana. Builds an unsigned transfer transaction for the user to sign. Use when user wants to send/transfer tokens to someone.',
    input_schema: {
      type: 'object',
      properties: {
        sender: {
          type: 'string',
          description: 'Sender wallet public key (Solana address)'
        },
        recipient: {
          type: 'string',
          description: 'Recipient wallet public key (Solana address)'
        },
        amount: {
          type: 'string',
          description: 'Amount in smallest unit (lamports for SOL where 1 SOL = 1e9, or token smallest unit for SPL e.g. 1 USDC = 1000000)'
        },
        mint: {
          type: 'string',
          description: 'Optional: SPL token mint address. Omit or use So11111111111111111111111111111111111111112 for native SOL transfer. Common mints: USDC=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v, USDT=Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
        },
        decimals: {
          type: 'number',
          description: 'Required for SPL tokens: number of decimals (e.g. 6 for USDC/USDT, 9 for SOL, 5 for BONK)'
        }
      },
      required: ['sender', 'recipient', 'amount']
    }
  }
]
