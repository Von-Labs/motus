# Jupiter DeFi Tools for Claude

This module provides Jupiter Aggregator integration for Claude AI agent, enabling DeFi operations on Solana.

## Features

### 🔄 Token Swapping
- **swap_tokens**: Execute token swaps via Jupiter aggregator
- Supports gasless swaps (if wallet < 0.01 SOL)
- Auto-routing for best prices

### 💰 Price Discovery
- **get_token_price**: Get real-time USD prices for up to 50 tokens
- **search_tokens**: Find tokens by name, symbol, or mint address

### 📊 Portfolio Management
- **get_wallet_portfolio**: View token holdings and SOL balance
- **get_portfolio_positions**: See DeFi positions across protocols (LP, lending, staking)

### 🎯 Advanced Trading
- **create_limit_order**: Set price targets for automatic execution
- **create_dca_order**: Dollar-cost averaging with recurring buys
- **get_trigger_orders**: View active/historical limit orders
- **get_recurring_orders**: Check DCA order status

### 🛡️ Security
- **check_token_security**: Check for freeze/mint authorities and warnings

## Setup

### 1. Get Jupiter API Key
Visit https://portal.jup.ag to get a free API key (optional but recommended for higher rate limits)

### 2. Add to Environment Variables
```bash
JUPITER_API_KEY="your_api_key_here"
```

### 3. Endpoint
```
POST /chat/claude-tools
```

### 4. Request Format
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's the current price of SOL?"
    }
  ],
  "model": "claudeSonnet",
  "systemPrompt": "Optional custom system prompt"
}
```

## Usage Examples

### Example 1: Check Token Price
```
User: "What's the price of SOL?"
Claude: [Uses get_token_price tool] → "SOL is currently $195.50"
```

### Example 2: Search Token
```
User: "Find the USDC token"
Claude: [Uses search_tokens tool] → Returns USDC details with mint address
```

### Example 3: Swap Tokens
```
User: "Swap 10 USDC to SOL from wallet ABC123..."
Claude: [Uses swap_tokens tool] → Executes swap and returns transaction
```

### Example 4: Set Limit Order
```
User: "Buy SOL when price hits $180"
Claude: [Uses create_limit_order tool] → Creates limit order
```

### Example 5: Setup DCA
```
User: "Buy $100 of SOL every week for 4 weeks"
Claude: [Uses create_dca_order tool] → Creates recurring order
```

## Common Token Addresses

```typescript
SOL:  So11111111111111111111111111111111111111112
USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
USDT: Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
```

## Rate Limits

| Tier | Rate Limit | Get API Key |
|------|------------|-------------|
| Free | 60 req/min | https://portal.jup.ag |
| Pro  | 30,000 req/min | Paid plan |
| Ultra | Dynamic scaling | Based on volume |

## Tool Definitions

All tools are defined in `tools.ts` following Claude's tool schema format:
- Clear descriptions for Claude to understand when to use
- Proper input validation schemas
- Required vs optional parameters

## Error Handling

Tools return error objects on failure:
```json
{
  "error": true,
  "message": "Error description",
  "details": "Full error stack"
}
```

Claude will interpret errors and explain them to users.

## Architecture

```
jupiter/
├── types.ts           # TypeScript interfaces
├── jupiterService.ts  # Jupiter API client
├── tools.ts           # Claude tool definitions
├── toolHandler.ts     # Tool execution logic
└── index.ts           # Module exports
```

## Security Notes

⚠️ **Important**:
- Never expose user private keys
- Tools only prepare transactions, actual signing happens client-side
- Validate wallet addresses before operations
- Check token security before swaps
- Set appropriate slippage limits

## Future Enhancements

Potential additions:
- [ ] Jupiter Lend integration (deposit/borrow)
- [ ] Advanced routing options
- [ ] Multi-hop swap visualization
- [ ] Historical price charts
- [ ] Portfolio analytics
- [ ] Transaction history

## Support

For Jupiter API issues: https://discord.gg/jup
For Claude integration: Check Anthropic docs
