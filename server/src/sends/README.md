# Send Tokens Module

Builds **transfer transactions** (SOL or SPL) on Solana. The server only **builds unsigned transactions**; the app/wallet **signs and submits** them to the chain.

## Features

- **Send SOL**: Transfer native SOL (lamports) from address A → B.
- **Send SPL tokens**: Transfer tokens (USDC, USDT, etc.) from A → B; if the recipient has no Associated Token Account, the module adds a create-ATA instruction in the same transaction.

## Folder structure

```
sends/
├── types.ts           # SendTokensParams, SendTokensResponse
├── transferService.ts # buildTransferTransaction() – build SOL/SPL tx
├── sendRouter.ts      # REST: POST /api/sends/prepare
├── index.ts           # Export types, buildTransferTransaction, sendRouter
└── README.md
```

## Files and roles

| File | Role |
|------|------|
| **types.ts** | Params (sender, recipient, amount, mint?, decimals?) and response (transaction base64, type, amount). |
| **transferService.ts** | Uses `@solana/web3.js` and `@solana/spl-token` to build the transaction: SOL = `SystemProgram.transfer`; SPL = ATA + `createTransferCheckedInstruction` (and create ATA if needed). RPC from env `SOLANA_RPC_URL`. |
| **sendRouter.ts** | **POST /api/sends/prepare**: accepts body, calls `buildTransferTransaction`, returns JSON with `transaction` (base64). |
| **index.ts** | Exports types, `buildTransferTransaction`, and `sendRouter` for the server. |

## API

### POST /api/sends/prepare

**Body:**

```json
{
  "sender": "<sender_pubkey>",
  "recipient": "<recipient_pubkey>",
  "amount": "1000000",
  "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "decimals": 6
}
```

- **Send SOL**: omit `mint` (or leave unset); `amount` = lamports (1 SOL = 1e9).
- **Send SPL**: require `mint` and `decimals`; `amount` = smallest units (e.g. USDC 6 decimals → 1 USDC = 1000000).

**Success response:**

```json
{
  "success": true,
  "transaction": "<base64_unsigned_tx>",
  "type": "sol",
  "amount": "1000000"
}
```

App decodes base64 → signs with wallet → submits to Solana (same flow as swap).

## Env

- **SOLANA_RPC_URL** (optional): RPC endpoint. Default: `https://api.mainnet-beta.solana.com`.

## Security

- Server **does not** hold private keys; it only builds and returns unsigned transactions.
- Signing and submitting transactions is done in the user’s app/wallet.
