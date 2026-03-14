// Claude Tool Definitions for Drift Protocol

export const driftTools = [
  {
    name: 'check_drift_account',
    description:
      'Check if user has a Drift Protocol account and collateral balance. ALWAYS call this FIRST before any Drift operation. Returns account status, free collateral, and whether deposit is needed.',
    input_schema: {
      type: 'object',
      properties: {
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['userPublicKey']
    }
  },
  {
    name: 'initialize_drift_account',
    description:
      'Initialize a Drift Protocol user account. Must be called before placing any orders or depositing collateral. Returns unsigned transaction for user to sign.',
    input_schema: {
      type: 'object',
      properties: {
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['userPublicKey']
    }
  },
  {
    name: 'deposit_drift_collateral',
    description:
      'Deposit collateral (USDC) into Drift Protocol account. Required before trading perpetual futures. Returns unsigned transaction for user to sign.',
    input_schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Amount to deposit in smallest unit (e.g., 1000000 = 1 USDC with 6 decimals)'
        },
        marketIndex: {
          type: 'number',
          description: 'Spot market index for collateral (0 = USDC, default). Usually use 0 for USDC.'
        },
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['amount', 'userPublicKey']
    }
  },
  {
    name: 'withdraw_drift_collateral',
    description:
      'Withdraw collateral (USDC) from Drift Protocol account back to wallet. Returns unsigned transaction for user to sign.',
    input_schema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Amount to withdraw in smallest unit (e.g., 1000000 = 1 USDC with 6 decimals)'
        },
        marketIndex: {
          type: 'number',
          description: 'Spot market index for collateral (0 = USDC, default). Usually use 0 for USDC.'
        },
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['amount', 'userPublicKey']
    }
  },
  {
    name: 'place_long_order',
    description:
      'Prepare a LONG perpetual position transaction on Drift Protocol (bullish bet). Returns unsigned transaction for user to sign on mobile wallet.',
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description:
            'Market index (0 = SOL-PERP, 1 = BTC-PERP, 2 = ETH-PERP, etc.)'
        },
        amount: {
          type: 'number',
          description:
            'Amount of base asset to trade (e.g., 1 = 1 SOL for SOL-PERP market)'
        },
        slippageBps: {
          type: 'number',
          description: 'Optional: Slippage tolerance in basis points (default: 50 = 0.5%)'
        },
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['marketIndex', 'amount', 'userPublicKey']
    }
  },
  {
    name: 'place_short_order',
    description:
      'Prepare a SHORT perpetual position transaction on Drift Protocol (bearish bet). Returns unsigned transaction for user to sign on mobile wallet.',
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description:
            'Market index (0 = SOL-PERP, 1 = BTC-PERP, 2 = ETH-PERP, etc.)'
        },
        amount: {
          type: 'number',
          description:
            'Amount of base asset to trade (e.g., 1 = 1 SOL for SOL-PERP market)'
        },
        slippageBps: {
          type: 'number',
          description: 'Optional: Slippage tolerance in basis points (default: 50 = 0.5%)'
        },
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['marketIndex', 'amount', 'userPublicKey']
    }
  },
  {
    name: 'place_limit_order',
    description:
      'Prepare a limit order transaction for perpetual futures on Drift. Returns unsigned transaction for user to sign on mobile wallet.',
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description: 'Market index (0 = SOL-PERP, 1 = BTC-PERP, 2 = ETH-PERP, etc.)'
        },
        direction: {
          type: 'string',
          enum: ['LONG', 'SHORT'],
          description: 'Order direction: LONG (buy) or SHORT (sell)'
        },
        amount: {
          type: 'number',
          description: 'Amount of base asset to trade'
        },
        price: {
          type: 'number',
          description: 'Limit price in USD (e.g., 60.5 for $60.50)'
        },
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['marketIndex', 'direction', 'amount', 'price', 'userPublicKey']
    }
  },
  {
    name: 'set_stop_loss',
    description:
      'Prepare a stop loss trigger order transaction to protect position. Returns unsigned transaction for user to sign on mobile wallet.',
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description: 'Market index of the position to protect'
        },
        amount: {
          type: 'number',
          description: 'Amount to close (should match position size)'
        },
        triggerPrice: {
          type: 'number',
          description:
            'Price that triggers stop loss in USD. For LONG: triggers when price drops below this. For SHORT: triggers when price rises above this.'
        },
        currentDirection: {
          type: 'string',
          enum: ['LONG', 'SHORT'],
          description: 'Current position direction (LONG or SHORT)'
        },
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['marketIndex', 'amount', 'triggerPrice', 'currentDirection', 'userPublicKey']
    }
  },
  {
    name: 'set_take_profit',
    description:
      'Prepare a take profit trigger order transaction to lock in gains. Returns unsigned transaction for user to sign on mobile wallet.',
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description: 'Market index of the position'
        },
        amount: {
          type: 'number',
          description: 'Amount to close (should match position size)'
        },
        triggerPrice: {
          type: 'number',
          description:
            'Price that triggers take profit in USD. For LONG: triggers when price rises above this. For SHORT: triggers when price drops below this.'
        },
        currentDirection: {
          type: 'string',
          enum: ['LONG', 'SHORT'],
          description: 'Current position direction (LONG or SHORT)'
        },
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['marketIndex', 'amount', 'triggerPrice', 'currentDirection', 'userPublicKey']
    }
  },
  {
    name: 'get_positions',
    description:
      "Get user's current open perpetual positions across all Drift markets. Shows position size, direction, and PnL.",
    input_schema: {
      type: 'object',
      properties: {
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['userPublicKey']
    }
  },
  {
    name: 'close_position',
    description:
      'Prepare a transaction to close an entire perpetual position at market price. Returns unsigned transaction for user to sign on mobile wallet.',
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description: 'Market index of the position to close'
        },
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['marketIndex', 'userPublicKey']
    }
  },
  {
    name: 'cancel_order',
    description:
      'Prepare a transaction to cancel a specific pending order. Returns unsigned transaction for user to sign on mobile wallet.',
    input_schema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'number',
          description: 'Order ID to cancel (from get_orders)'
        },
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['orderId', 'userPublicKey']
    }
  },
  {
    name: 'cancel_all_orders',
    description:
      'Prepare a transaction to cancel all pending orders, optionally filtered by market. Returns unsigned transaction for user to sign on mobile wallet.',
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description:
            'Optional: Market index to filter by. If not provided, cancels all orders across all markets.'
        },
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['userPublicKey']
    }
  },
  {
    name: 'get_orders',
    description:
      "Get user's open orders (limit orders, stop loss, take profit). Shows all pending orders with details.",
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description: 'Optional: Filter orders by market index'
        },
        userPublicKey: {
          type: 'string',
          description: "User's Solana wallet public key"
        }
      },
      required: ['userPublicKey']
    }
  },
  {
    name: 'get_market_info',
    description:
      'Get detailed information about a Drift perpetual market including current price, funding rate, and open interest.',
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description: 'Market index to get info for (0 = SOL-PERP, 1 = BTC-PERP, etc.)'
        }
      },
      required: ['marketIndex']
    }
  }
]
