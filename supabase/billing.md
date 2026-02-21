# Supabase Billing System

## Overview

This project uses Supabase as the database to manage user billing, API usage tracking, and USDC payment system.

## Features

- **User Management**: Users are identified by Solana wallet addresses
- **Free Tier**: Each user gets 10 free API requests
- **Pay-as-you-go**: Users can deposit USDC to continue using the API
- **Usage Tracking**: Tracks token usage and costs for all API requests
- **Transparent Pricing**: Non-cached pricing for Claude models

## Database Schema

### Tables

1. **users**
   - Stores user information mapped by wallet address
   - Tracks free requests remaining and USDC balance

2. **api_usage**
   - Records every API request with token counts and costs
   - Links to user and includes request metadata

3. **usdc_transactions**
   - Tracks all USDC deposits and usage
   - Links to Solana blockchain transactions

4. **model_pricing**
   - Stores pricing for each Claude model
   - Easily updateable when prices change

## Setup Instructions

### 1. Create Supabase Project

1. Go to Supabase Dashboard
2. Create a new project
3. Save your project URL and anon key

### 2. Run Migrations

You can run the migration in two ways:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Click New Query
4. Copy the contents of `migrations/001_initial_schema.sql`
5. Paste and click Run

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### 3. Configure Environment Variables

Update your `.env` file:

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_DB_PASSWORD="your-db-password"
```

### 4. Verify Setup

After running the migration, verify these tables exist:

- users
- api_usage
- usdc_transactions
- model_pricing

## Model Pricing (Non-Cached)

Current pricing per 1M tokens:

| Model | Input Price | Output Price |
|-------|-------------|--------------|
| Claude Opus 4.5 | $5.00 | $25.00 |
| Claude Sonnet 4.5 | $3.00 | $15.00 |
| Claude Haiku 4.5 | $1.00 | $5.00 |

## API Usage

### Check User Balance

```typescript
import { db } from './src/db/supabase';

const user = await db.getOrCreateUser('wallet_address');
console.log({
  freeRequests: user.free_requests_remaining,
  usdcBalance: user.usdc_balance
});
```

### Track API Request

```typescript
const result = await db.processApiRequest({
  walletAddress: 'user_wallet_address',
  model: 'claude-sonnet-4-5-20250929',
  requestType: 'chat',
  inputTokens: 1000,
  outputTokens: 500,
  conversationId: 'optional_conversation_id',
  endpoint: '/chat/claude-tools'
});

// Returns:
// {
//   success: true,
//   message: 'Request processed successfully',
//   usage_id: 'uuid',
//   is_free: true,  // or false if paid
//   cost: 0.00525   // in USD
// }
```

### Add USDC Deposit

```typescript
await db.addUsdcDeposit({
  walletAddress: 'user_wallet_address',
  amount: 10.00,  // 10 USDC
  signature: 'solana_transaction_signature',
  fromAddress: 'user_wallet',
  toAddress: 'treasury_wallet'
});
```

### Get User Statistics

```typescript
const stats = await db.getUserStats('wallet_address');

console.log({
  user: stats.user,
  stats: {
    totalRequests: stats.stats.totalRequests,
    freeRequests: stats.stats.freeRequests,
    paidRequests: stats.stats.paidRequests,
    totalTokens: stats.stats.totalTokens,
    totalCost: stats.stats.totalCost,
    freeRequestsRemaining: stats.stats.freeRequestsRemaining
  }
});
```

## Using Middleware

### Protect Routes with Balance Check

```typescript
import { checkBalance } from './middleware/trackUsage';

// Add to your route
router.post('/chat/claude', checkBalance, claude);
```

This middleware:

- Requires `X-Wallet-Address` header
- Checks if user has free requests or USDC balance
- Returns 402 Payment Required if insufficient balance

### Example Request

```bash
curl -X POST http://localhost:3050/chat/claude \
  -H "Content-Type: application/json" \
  -H "X-Wallet-Address: YOUR_WALLET_ADDRESS" \
  -d '{
    "model": "claudeSonnet",
    "prompt": "Hello, how are you?"
  }'
```

## Database Functions

### calculate_api_cost(model, input_tokens, output_tokens)

Calculates the cost for an API request based on current pricing.

```sql
SELECT * FROM calculate_api_cost('claude-sonnet-4-5-20250929', 1000, 500);
-- Returns: { input_cost, output_cost, total_cost }
```

### process_api_request(...)

Processes an API request:

1. Gets or creates user
2. Calculates cost
3. Uses free request if available, otherwise deducts from USDC balance
4. Creates usage record
5. Creates transaction record (if paid)

```sql
SELECT * FROM process_api_request(
  'wallet_address',
  'claude-sonnet-4-5-20250929',
  'chat',
  1000,
  500,
  'conversation_id',
  '/chat/claude'
);
```

## Row Level Security (RLS)

RLS is enabled on all tables to ensure users can only access their own data. When querying from the client side, set the wallet address:

```typescript
// Set RLS context
await supabase.rpc('set_config', {
  setting: 'app.wallet_address',
  value: walletAddress
});

// Now queries will only return data for this wallet
const { data } = await supabase.from('api_usage').select('*');
```

## Updating Pricing

To update model pricing:

```sql
UPDATE model_pricing
SET
  input_price_per_1m = 3.50,
  output_price_per_1m = 16.00,
  updated_at = NOW()
WHERE model_name = 'claude-sonnet-4-5-20250929';
```

## Monitoring

### View Top Spenders

```sql
SELECT
  wallet_address,
  total_spent,
  usdc_balance,
  (SELECT COUNT(*) FROM api_usage WHERE user_id = users.id) as total_requests
FROM users
ORDER BY total_spent DESC
LIMIT 10;
```

### View Daily Usage

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as requests,
  SUM(total_tokens) as tokens,
  SUM(total_cost) as cost
FROM api_usage
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### View Model Usage

```sql
SELECT
  model,
  COUNT(*) as requests,
  SUM(total_tokens) as tokens,
  SUM(total_cost) as revenue
FROM api_usage
GROUP BY model
ORDER BY revenue DESC;
```

## Troubleshooting

### Missing Environment Variables

If you see "Missing Supabase environment variables", check that `.env` contains:

- SUPABASE_URL
- SUPABASE_ANON_KEY

### Insufficient Balance Error

When user gets 402 error, they need to:

1. Check their balance via `/api/user/stats`
2. Deposit USDC to continue using the API

### RLS Policy Errors

If queries fail with permission errors, ensure:

1. You're using the service role key for server-side operations
2. RLS context is set correctly for client-side queries
