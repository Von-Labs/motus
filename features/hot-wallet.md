# Hot Wallet Feature

## Overview

A self-custodied, in-app burner wallet that lives entirely within Motus. The hot wallet lets users sign and pay for transactions without switching to an external wallet app (Phantom, etc.), enabling a seamless one-tap DeFi experience. Private keys are stored in the device's secure keystore (iOS Keychain / Android Keystore) and are never exposed outside the app.

---

## Current Architecture (Context)

- **Wallet connection**: Solana Mobile Wallet Adapter (MWA) — keys live in external wallet apps.
- **Signing flow**: Every transaction calls `transact()` which opens the external wallet for authorization.
- **State management**: React Context (`AppContext` / `ThemeContext`), no Redux/Zustand.
- **Storage**: `AsyncStorage` for preferences, SQLite (Drizzle) for conversations & transactions. No secure storage today.
- **Solana libs**: `@solana/web3.js` v1, `@solana-mobile/mobile-wallet-adapter-protocol-web3js`.
- **Secure storage**: `expo-secure-store` already installed.

---

## Implementation Plan

### Phase 1: Hot Wallet Management UI

**Goal**: Build the UI first so UX can be verified before wiring up the backend logic.

#### Screen: `app/src/screens/hotWallet.tsx`

##### State A — No wallet created:
- Explanation of what a hot wallet is and why it's useful
- "Create Hot Wallet" button
- Security disclaimer

##### State B — Wallet exists:
- Wallet address (truncated, tappable to copy full address)
- SOL balance (auto-refreshing)
- Action buttons:
  - "Top Up" — triggers MWA transfer from main wallet → hot wallet directly
  - "Send SOL" — simple send form (address + amount)
  - "Export Private Key" — requires confirmation, shows key briefly
  - "Delete Wallet" — destructive action with confirmation dialog, warns about remaining funds

##### Top-Up Flow (via MWA)

When the user taps "Top Up" or when balance is insufficient for a transaction:
1. Build a SOL transfer instruction: main wallet (MWA) → hot wallet public key
2. User enters amount (or amount is pre-filled based on deficit)
3. Sign & send via MWA `transact()` — the main wallet pays
4. Balance refreshes automatically after confirmation

No QR codes, no address copying needed — it's a direct MWA-signed transfer.

##### Navigation

Add to the Drawer navigator in `app/src/main.tsx`:
- Menu item: "Hot Wallet" with a flame/wallet icon
- Badge showing balance (optional)

##### Header Integration

In `app/src/components/Header.tsx`:
- Show a small hot wallet indicator (flame icon) when hot wallet is active
- Tapping it navigates to the hot wallet screen

---

### Phase 2: Keypair Generation & Secure Storage

**Goal**: Generate a Solana keypair in-app and persist it safely once the UI is approved.

| Task | Details |
|------|---------|
| Create `app/src/utils/hotWallet.ts` | Utility module with: `generateHotWallet()`, `getHotWalletKeypair()`, `deleteHotWallet()`, `hasHotWallet()`. |
| Key storage format | Store the **secret key** (64-byte Uint8Array) as a base64 string under a constant key `HOT_WALLET_SECRET_KEY` in SecureStore. |
| Keypair generation | Use `Keypair.generate()` from `@solana/web3.js`. |
| Retrieval | `SecureStore.getItemAsync(KEY)` → decode base64 → `Keypair.fromSecretKey()`. |
| Deletion | `SecureStore.deleteItemAsync(KEY)` — for wallet reset/destroy. |

**File**: `app/src/utils/hotWallet.ts`

```typescript
// Core functions
export async function generateHotWallet(): Promise<Keypair>
export async function getHotWalletKeypair(): Promise<Keypair | null>
export async function hasHotWallet(): Promise<boolean>
export async function deleteHotWallet(): Promise<void>
export function getHotWalletPublicKey(keypair: Keypair): string
```

---

### Phase 3: HotWalletContext (React Context)

**Goal**: Provide a global context that the rest of the app can consume to sign transactions, check balance, and send SOL — all routing through the hot wallet when available.

**File**: `app/src/context/HotWalletContext.tsx`

#### Context Shape

```typescript
interface HotWalletContextType {
  // State
  hotWallet: Keypair | null;
  publicKey: string | null;
  balance: number | null;         // SOL balance in lamports
  isLoading: boolean;
  isHotWalletActive: boolean;     // true if hot wallet exists & is the active signer

  // Wallet lifecycle
  createHotWallet: () => Promise<void>;
  deleteHotWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;

  // Transaction helpers
  signTransaction: (tx: Transaction | VersionedTransaction) => Transaction | VersionedTransaction;
  signAndSendTransaction: (tx: Transaction | VersionedTransaction) => Promise<string>;
  sendSol: (to: string, lamports: number) => Promise<string>;

  // Top-up (via MWA)
  topUpFromMainWallet: (lamports: number) => Promise<string>;

  // Balance gate
  requireBalance: (lamports: number) => Promise<boolean>;
}
```

#### Behavior

1. **On mount**: Check `hasHotWallet()`. If yes, load keypair into memory and fetch balance.
2. **`isHotWalletActive`**: Derived from whether a hot wallet exists. When `true`, all transaction handlers in the app should route through this context instead of MWA.
3. **`signAndSendTransaction`**: Signs with the in-memory keypair, sends via `Connection.sendRawTransaction()`, confirms via `Connection.confirmTransaction()`.
4. **`topUpFromMainWallet`**: Builds a SOL transfer from the connected MWA wallet to the hot wallet public key, signs via MWA `transact()`, confirms, and refreshes balance.
5. **`requireBalance`**: Before any transaction, check if the hot wallet has enough SOL. If not, prompt user to top up via MWA. Returns `false` if user dismisses without topping up.
6. **Balance polling**: Refresh balance on an interval (every 15s when the app is foregrounded) and after every sent transaction.

#### Provider Placement

Wrap inside `MobileWalletProvider` in `app/_layout.tsx` so it has access to the connection:

```
<MobileWalletProvider>
  <HotWalletProvider>
    <App />
  </HotWalletProvider>
</MobileWalletProvider>
```

---

### Phase 4: Build Context Functions

**Goal**: Implement all the transaction helpers and balance management inside the context.

| Function | Implementation |
|----------|---------------|
| `signTransaction` | Keypair signs in-memory, returns signed tx. |
| `signAndSendTransaction` | Sign → `Connection.sendRawTransaction()` → `confirmTransaction()`. |
| `sendSol` | Build `SystemProgram.transfer()` → sign → send. |
| `topUpFromMainWallet` | Build `SystemProgram.transfer(mainWallet → hotWallet)` → sign via MWA `transact()` → confirm → refresh balance. |
| `requireBalance` | Check `balance >= lamports`. If not, show top-up bottom sheet. Await user action. Return boolean. |
| `refreshBalance` | `Connection.getBalance(publicKey)` → update state. |

#### Top-Up Bottom Sheet: `app/src/components/TopUpBottomSheet.tsx`

- Bottom sheet (using `@gorhom/bottom-sheet`) showing:
  - Current hot wallet balance
  - Required amount (deficit)
  - Amount input (pre-filled with deficit, editable)
  - "Top Up from Main Wallet" button — triggers MWA transfer directly
  - Loading state during transaction
  - Success/error feedback

---

### Phase 5: Migrate Existing Signing Code

**Goal**: When `isHotWalletActive === true`, bypass MWA `transact()` and sign directly with the hot wallet keypair.

#### Unified signing abstraction

Create `app/src/utils/transactionSigner.ts`:

```typescript
export async function signAndSendTransaction(
  transaction: Transaction | VersionedTransaction,
  hotWalletContext: HotWalletContextType | null,
): Promise<string> {
  if (hotWalletContext?.isHotWalletActive) {
    const hasBalance = await hotWalletContext.requireBalance(/* estimated fee */);
    if (!hasBalance) throw new Error('Insufficient balance');
    return hotWalletContext.signAndSendTransaction(transaction);
  }

  // Fallback to MWA
  return transactViaMWA(transaction);
}
```

#### Files to migrate

| File | Change |
|------|--------|
| `app/src/utils/swapHandler.ts` | Replace direct MWA `transact()` calls with unified `signAndSendTransaction()`. |
| `app/src/components/SignTransaction.tsx` | Use `HotWalletContext.signAndSendTransaction` when available. |
| `app/src/screens/usage.tsx` | USDC deposit flow — route through unified signer. |

---

### Phase 6: Integration & Polish

| Area | Integration |
|------|-------------|
| **Onboarding** | After MWA wallet connect, offer to create a hot wallet (optional step). |
| **Chat/AI tools** | When AI triggers a swap/trade, the signing flow automatically uses hot wallet if active — no user intervention needed. |
| **Transaction history** | Tag transactions signed by hot wallet vs. main wallet in the `wallet_transactions` table (add `signer` column). |
| **Settings** | Add hot wallet toggle/management link in settings screen. |

---

## File Structure (New Files)

```
app/src/
├── utils/
│   ├── hotWallet.ts              # Keypair generation, secure storage CRUD
│   └── transactionSigner.ts      # Unified signing abstraction
├── context/
│   └── HotWalletContext.tsx       # React Context + Provider
├── components/
│   └── TopUpBottomSheet.tsx       # MWA-powered top-up prompt
└── screens/
    └── hotWallet.tsx              # Wallet management screen
```

## Files to Modify

```
app/_layout.tsx                    # Wrap with HotWalletProvider
app/src/context.tsx                # Re-export or reference new context
app/src/main.tsx                   # Add Hot Wallet to drawer nav
app/src/components/Header.tsx      # Hot wallet indicator
app/src/utils/swapHandler.ts       # Route signing through abstraction
app/src/components/SignTransaction.tsx  # Use unified signer
app/src/screens/usage.tsx          # USDC deposit uses unified signer
app/src/screens/settings.tsx       # Link to hot wallet management
```

## Dependencies

| Package | Status | Purpose |
|---------|--------|---------|
| `expo-secure-store` | **Installed** | Encrypted keychain/keystore for private key storage |

No additional dependencies needed — top-up uses MWA directly (no QR code library required).

## Security Considerations

- Private key **never** leaves SecureStore except as an in-memory `Keypair` object.
- No logging of private keys anywhere.
- SecureStore is scoped to the app — other apps cannot access it.
- On wallet deletion, key is wiped from SecureStore immediately.
- "Export Private Key" requires explicit user confirmation and should show a timed display (auto-hide after 30s).
- Consider adding biometric authentication (`expo-local-authentication`) before showing the private key or deleting the wallet (future enhancement).

## Execution Order

1. **Phase 1** — UI screen + navigation + header indicator → **UX review**
2. **Phase 2** — `hotWallet.ts` keypair utility (SecureStore CRUD)
3. **Phase 3** — `HotWalletContext.tsx` + wire into `_layout.tsx`
4. **Phase 4** — Build all context functions + `TopUpBottomSheet.tsx` (MWA-powered top-up)
5. **Phase 5** — `transactionSigner.ts` + migrate `swapHandler.ts`, `SignTransaction.tsx`, `usage.tsx`
6. **Phase 6** — Polish integrations (onboarding, transaction history tagging, settings)
