// Claude Tool Definitions for Jupiter API

export const jupiterTools = [
  {
    name: 'swap_tokens',
    description:
      'Prepare a token swap transaction on Solana via Jupiter aggregator. Returns unsigned transaction for user to sign on mobile wallet. Use this when user wants to exchange tokens.',
    input_schema: {
      type: 'object',
      properties: {
        inputMint: {
          type: 'string',
          description:
            'Input token mint address (e.g., EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v for USDC)'
        },
        outputMint: {
          type: 'string',
          description:
            'Output token mint address (e.g., So11111111111111111111111111111111111111112 for SOL)'
        },
        amount: {
          type: 'number',
          description:
            "Amount to swap in token's smallest unit (e.g., for 10 USDC with 6 decimals, use 10000000)"
        },
        slippageBps: {
          type: 'number',
          description:
            'Slippage tolerance in basis points (default: 50 = 0.5%). Higher slippage = more tolerant to price changes'
        },
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['inputMint', 'outputMint', 'amount', 'userPublicKey']
    }
  },
  {
    name: 'get_token_price',
    description:
      'Get current USD price for Solana tokens. Returns price data for up to 50 tokens at once. Use this when user asks about token prices.',
    input_schema: {
      type: 'object',
      properties: {
        tokens: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Array of token mint addresses to get prices for (maximum 50 tokens)'
        }
      },
      required: ['tokens']
    }
  },
  {
    name: 'search_tokens',
    description:
      'Search for Solana tokens by name, symbol, or mint address. Returns matching tokens with details like address, symbol, name, decimals. Use when user wants to find a token.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search query: token name (e.g., "Solana"), symbol (e.g., "SOL"), or mint address'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'get_wallet_portfolio',
    description:
      "Get user's token holdings and SOL balance. Returns all tokens in the wallet with amounts. Use when user asks about their balance or holdings.",
    input_schema: {
      type: 'object',
      properties: {
        walletAddress: {
          type: 'string',
          description: 'Solana wallet address to check holdings'
        }
      },
      required: ['walletAddress']
    }
  },
  {
    name: 'create_trigger_order',
    description:
      'Create a limit order to buy/sell tokens at a specific target price. Order executes automatically when market reaches the price. Perfect for "buy SOL at $60 USDC" type orders. Returns unsigned transaction for user to sign. Use when user wants to buy/sell at a target price.',
    input_schema: {
      type: 'object',
      properties: {
        inputMint: {
          type: 'string',
          description: 'Token to sell (mint address). For "buy SOL with USDC", this is USDC.'
        },
        outputMint: {
          type: 'string',
          description: 'Token to receive (mint address). For "buy SOL with USDC", this is SOL.'
        },
        maker: {
          type: 'string',
          description: "Order creator's wallet address"
        },
        payer: {
          type: 'string',
          description: 'Account funding the transaction (usually same as maker)'
        },
        makingAmount: {
          type: 'string',
          description: 'Exact amount of input token to sell (in smallest unit). For 100 USDC (6 decimals), use "100000000"'
        },
        takingAmount: {
          type: 'string',
          description: 'Exact amount of output token to receive (in smallest unit). This sets your target price.'
        },
        expiredAt: {
          type: 'number',
          description: 'Optional: Unix timestamp when order expires. Leave empty for no expiration.'
        },
        slippageBps: {
          type: 'number',
          description: 'Optional: Slippage tolerance in basis points (default: 50 = 0.5%)'
        }
      },
      required: ['inputMint', 'outputMint', 'maker', 'payer', 'makingAmount', 'takingAmount']
    }
  },
  {
    name: 'cancel_trigger_order',
    description:
      'Cancel a specific limit order. Returns unfilled tokens to the user. Use when user wants to cancel an open order.',
    input_schema: {
      type: 'object',
      properties: {
        maker: {
          type: 'string',
          description: "Order creator's wallet address"
        },
        order: {
          type: 'string',
          description: 'Order account address (orderKey from get_trigger_orders_detailed)'
        }
      },
      required: ['maker', 'order']
    }
  },
  {
    name: 'cancel_all_trigger_orders',
    description:
      'Cancel all open limit orders for a wallet. Returns unfilled tokens to the user. Use when user wants to cancel all their orders.',
    input_schema: {
      type: 'object',
      properties: {
        maker: {
          type: 'string',
          description: "Order creator's wallet address"
        }
      },
      required: ['maker']
    }
  },
  {
    name: 'create_dca_order',
    description:
      'Create recurring buy/sell orders (Dollar-Cost Averaging). Automatically executes trades at regular intervals. Use when user wants to automate regular purchases.',
    input_schema: {
      type: 'object',
      properties: {
        inputMint: {
          type: 'string',
          description: 'Token to sell (mint address)'
        },
        outputMint: {
          type: 'string',
          description: 'Token to buy (mint address)'
        },
        inAmount: {
          type: 'string',
          description: 'Amount to sell per order in smallest unit'
        },
        cycleFrequency: {
          type: 'number',
          description:
            'Seconds between each order execution (e.g., 86400 for daily, 604800 for weekly)'
        },
        numOrders: {
          type: 'number',
          description: 'Total number of orders to execute'
        },
        userPublicKey: {
          type: 'string',
          description: "User's wallet public key"
        }
      },
      required: [
        'inputMint',
        'outputMint',
        'inAmount',
        'cycleFrequency',
        'numOrders',
        'userPublicKey'
      ]
    }
  },
  {
    name: 'get_trigger_orders_detailed',
    description:
      "Get user's limit orders with full details including trade history, remaining amounts, and status. Supports filtering by active/history, token pairs, and pagination. Use when user wants to check their limit orders.",
    input_schema: {
      type: 'object',
      properties: {
        user: {
          type: 'string',
          description: 'Wallet address to check orders for'
        },
        orderStatus: {
          type: 'string',
          enum: ['active', 'history'],
          description: '"active" for open orders, "history" for completed/cancelled orders'
        },
        page: {
          type: 'number',
          description: 'Optional: Page number for pagination (default: 1)'
        },
        inputMint: {
          type: 'string',
          description: 'Optional: Filter by input token mint address'
        },
        outputMint: {
          type: 'string',
          description: 'Optional: Filter by output token mint address'
        }
      },
      required: ['user', 'orderStatus']
    }
  },
  {
    name: 'get_recurring_orders',
    description:
      "Get user's active and historical DCA/recurring orders. Shows order status and execution history. Use when user wants to check their recurring orders.",
    input_schema: {
      type: 'object',
      properties: {
        walletAddress: {
          type: 'string',
          description: 'Wallet address to check orders for'
        }
      },
      required: ['walletAddress']
    }
  },
  {
    name: 'get_portfolio_positions',
    description:
      "Get user's DeFi positions across all protocols (liquidity pools, lending, staking, etc). Returns total portfolio value and breakdown by protocol. Use when user asks about their DeFi positions.",
    input_schema: {
      type: 'object',
      properties: {
        walletAddress: {
          type: 'string',
          description: 'Wallet address to check positions for'
        }
      },
      required: ['walletAddress']
    }
  },
  {
    name: 'check_token_security',
    description:
      'Check tokens for security warnings like freeze authority or mint authority. Helps identify potentially risky tokens. Use when user asks if a token is safe.',
    input_schema: {
      type: 'object',
      properties: {
        mints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of token mint addresses to check'
        }
      },
      required: ['mints']
    }
  },
  {
    name: 'get_detailed_portfolio',
    description:
      "Get comprehensive DeFi portfolio including wallet balances, staked JUP, limit orders, DCA orders, liquidity pools, leveraged positions, lending/borrowing positions across all Solana protocols. This is the most comprehensive portfolio view available. Use when user asks for complete portfolio overview or wants to see all their positions.",
    input_schema: {
      type: 'object',
      properties: {
        walletAddress: {
          type: 'string',
          description: 'Wallet address to get portfolio for'
        },
        platforms: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Optional: Filter by specific platform IDs (e.g., ["jupiter-exchange", "jupiter-governance"]). Leave empty to get all platforms.'
        }
      },
      required: ['walletAddress']
    }
  },
  {
    name: 'get_supported_platforms',
    description:
      'Get list of all DeFi platforms supported by Jupiter Portfolio API. Returns platform names, IDs, descriptions, and categories. Use when user wants to know what platforms are tracked or to get platform IDs for filtering.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_staked_jup',
    description:
      "Get user's JUP token staking information including total staked amount and pending unstaking positions with unlock times. Use when user asks about their JUP staking.",
    input_schema: {
      type: 'object',
      properties: {
        walletAddress: {
          type: 'string',
          description: 'Wallet address to check JUP staking for'
        }
      },
      required: ['walletAddress']
    }
  }
]
