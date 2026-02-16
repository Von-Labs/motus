# Solana Mobile DeFi Agent

A full-stack React Native mobile application with AI-powered DeFi capabilities on Solana. Chat with Claude AI to execute DeFi operations like token swaps, price checks, portfolio management, and automated trading strategies through Jupiter Aggregator.

## Features

### 🤖 AI Chat Integration
- **Multi-LLM Support**: OpenAI GPT-5.2/Mini, Anthropic Claude Opus/Sonnet/Haiku 4.5, Google Gemini
- **Real-time Streaming**: Server-Sent Events (SSE) for instant responses
- **Markdown Rendering**: Rich text formatting in chat
- **Per-Model History**: Separate conversation history for each AI model

### 💳 Usage & Billing
- **Free Tier**: 10 free API requests per wallet
- **Pay-as-you-go**: USDC payment for continued usage
- **Usage Tracking**: Monitor token usage and costs
- **Transparent Pricing**: Real-time cost calculation per request

### 💰 Jupiter DeFi Tools (Claude Only)
- **Token Operations**:
  - `swap_tokens` - Execute token swaps via Jupiter aggregator
  - `search_tokens` - Find tokens by name, symbol, or address
  - `get_token_price` - Real-time USD prices for Solana tokens
  - `get_wallet_portfolio` - View token holdings and balances

- **Advanced Trading**:
  - `create_limit_order` - Set price targets for automatic execution
  - `create_dca_order` - Dollar-cost averaging with recurring buys
  - `get_trigger_orders` - View active/historical limit orders
  - `get_recurring_orders` - Check DCA order status

- **Portfolio & Security**:
  - `get_portfolio_positions` - DeFi positions across protocols
  - `check_token_security` - Token safety verification (freeze/mint authority)

### 🎨 Additional Features
- **Image Generation**: Gemini-powered text-to-image and image-to-image
- **Theming**: 7 built-in themes (Light, Dark, Hacker News, Miami, Vercel, Cyberpunk, Matrix)
- **Custom Fonts**: Geist font family (9 weights)

## Tech Stack

### Mobile App
- **Framework**: React Native (Expo 54)
- **Navigation**: React Navigation (Bottom Tabs)
- **State**: React Context API
- **Storage**: AsyncStorage
- **UI**: Custom design system with theme support
- **Markdown**: @ronradtke/react-native-markdown-display
- **SSE**: react-native-sse

### Backend Server
- **Framework**: Express.js + TypeScript
- **APIs**: Anthropic, OpenAI, Google Gemini, Jupiter Aggregator
- **AI Tools**: Claude function calling with streaming
- **File Upload**: Multer (for image generation)

## Project Structure

```
.
├── app/                      # React Native mobile app
│   ├── src/
│   │   ├── screens/         # Chat, Images, Settings
│   │   ├── components/      # Reusable UI components
│   │   ├── context.tsx      # Theme & App state
│   │   └── utils.ts         # API utilities
│   ├── constants.ts         # Models, themes, config
│   └── App.tsx              # Entry point
│
├── server/                   # Express backend
│   ├── src/
│   │   ├── chat/            # Chat endpoints (Claude, GPT, Gemini)
│   │   │   ├── claude.ts
│   │   │   ├── claudeWithTools.ts  # Claude + Jupiter tools
│   │   │   └── chatRouter.ts
│   │   ├── jupiter/         # Jupiter DeFi integration
│   │   │   ├── jupiterService.ts   # API client
│   │   │   ├── tools.ts            # Claude tool definitions
│   │   │   ├── toolHandler.ts      # Tool execution
│   │   │   ├── types.ts            # TypeScript types
│   │   │   └── README.md
│   │   ├── images/          # Image generation
│   │   └── index.ts         # Server entry
│   └── .env                 # API keys
│
└── .claude/
    └── claude.md            # Git commit standards
```

## Setup

### Prerequisites
- Node.js 18.16+
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### 1. Clone Repository
```bash
git clone https://github.com/Von-Labs/solana-mobile-defi-agent.git
cd solana-mobile-defi-agent
```

### 2. Backend Setup
```bash
cd server
npm install

# Create .env file
cp .env.example .env
```

Edit `server/.env`:
```env
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="..."
GEMINI_CHAT_MODEL="gemini-2.5-flash"
JUPITER_API_KEY="..."  # Get from https://portal.jup.ag

# Supabase (for billing & usage tracking)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

**Setup Supabase Database**:
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Push database migrations
supabase db push
```

Start server:
```bash
npm run dev  # Runs on port 3050
```

### 3. Mobile App Setup
```bash
cd app
npm install

# Create .env file
cp .env.example .env
```

Edit `app/.env`:
```env
EXPO_PUBLIC_ENV="DEVELOPMENT"
EXPO_PUBLIC_DEV_API_URL="http://YOUR_LOCAL_IP:3050"  # e.g., http://192.168.1.100:3050
EXPO_PUBLIC_PROD_API_URL="https://your-production-url.com"
```

**Find your local IP**:
- macOS/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig`

Start app:
```bash
npm start
# Press 'i' for iOS, 'a' for Android
```

## Usage

### Basic Chat
1. Open app → **Chat** tab
2. Select AI model from header (Claude, GPT, Gemini)
3. Type message and press send
4. View streaming response with markdown formatting

### DeFi Operations (Claude Models Only)
Ask Claude about tokens, prices, or DeFi:

**Examples**:
```
"What's the price of SOL?"
"Find USDC token"
"Show me JUP price and check if it's safe"
"Set a limit order to buy SOL at $180"
```

Claude will automatically:
1. Detect DeFi-related queries
2. Use appropriate Jupiter tools
3. Execute operations
4. Return formatted results

### Image Generation
1. Go to **Images** tab
2. Enter text prompt or upload image
3. Select model (Nano Banana / Pro)
4. Generate and save images

## API Endpoints

### Chat
- `POST /chat/claude` - Claude chat (streaming)
- `POST /chat/claude-tools` - Claude with Jupiter tools (streaming)
- `POST /chat/gpt` - GPT chat (streaming)
- `POST /chat/gemini` - Gemini chat (streaming)

### Images
- `POST /images/gemini` - Image generation

### Debug
- `GET /chat/test-jupiter` - Test Jupiter API integration

## Development

### Add New Theme
Edit `app/constants.ts`:
```typescript
export const themes = {
  myTheme: {
    textColor: '#000000',
    backgroundColor: '#FFFFFF',
    // ... other colors
  }
}
```

### Add New AI Model
1. Add model config to `app/constants.ts`
2. Create endpoint in `server/src/chat/`
3. Add route to `chatRouter.ts`
4. Update `getChatType()` in `app/src/utils.ts`

## Environment Variables

### Server
| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (for Claude) | Anthropic API key |
| `OPENAI_API_KEY` | Yes (for GPT) | OpenAI API key |
| `GEMINI_API_KEY` | Yes (for Gemini) | Google Gemini API key |
| `GEMINI_CHAT_MODEL` | No | Default: gemini-2.5-flash |
| `JUPITER_API_KEY` | No | Jupiter API key (optional, increases rate limits) |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |

### Mobile App
| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_ENV` | Yes | DEVELOPMENT or PRODUCTION |
| `EXPO_PUBLIC_DEV_API_URL` | Yes | Backend URL for development |
| `EXPO_PUBLIC_PROD_API_URL` | No | Backend URL for production |

## Troubleshooting

### Mobile can't connect to server
- Use local IP address (not localhost) in `EXPO_PUBLIC_DEV_API_URL`
- Ensure both devices on same network
- Check firewall settings

### Jupiter API 401 error
- Verify `JUPITER_API_KEY` in `server/.env`
- Restart server after adding API key
- Get free key at https://portal.jup.ag

### TypeScript errors
```bash
cd server && npm run build
```

## Git Commit Standards

This project follows Conventional Commits format. See [.claude/claude.md](.claude/claude.md) for guidelines.

**Format**: `<type>(<scope>): <description>`

**Examples**:
```bash
feat: add user authentication
fix(chat): resolve streaming disconnection
docs: update API documentation
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feat/my-feature`
3. Follow commit standards in `.claude/claude.md`
4. Push changes: `git push origin feat/my-feature`
5. Create Pull Request

## License

MIT

## Resources

- [Jupiter Aggregator](https://jup.ag)
- [Anthropic Claude](https://anthropic.com)
- [OpenAI](https://openai.com)
- [Google Gemini](https://ai.google.dev)
- [Expo Documentation](https://docs.expo.dev)
- [React Native](https://reactnative.dev)

## Support

For issues or questions:
- Create an issue on GitHub
- Check existing documentation in `server/src/jupiter/README.md`
