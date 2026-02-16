// Claude Tool Definitions for Drift Protocol

export const driftTools = [
  {
    name: 'place_long_order',
    description:
      'Open a LONG perpetual position on Drift Protocol (bullish bet - profits when price goes up). Use this when user wants to go long, buy perpetual futures, or take a bullish position.',
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description:
            'Market index (0 = SOL-PERP, 1 = BTC-PERP, 2 = ETH-PERP, etc.). Check Drift docs for full list.'
        },
        amount: {
          type: 'number',
          description:
            'Amount of base asset to trade (e.g., 1 = 1 SOL for SOL-PERP market)'
        },
        slippageBps: {
          type: 'number',
          description: 'Optional: Slippage tolerance in basis points (default: 50 = 0.5%)'
        }
      },
      required: ['marketIndex', 'amount']
    }
  },
  {
    name: 'place_short_order',
    description:
      'Open a SHORT perpetual position on Drift Protocol (bearish bet - profits when price goes down). Use this when user wants to go short, sell perpetual futures, or take a bearish position.',
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description:
            'Market index (0 = SOL-PERP, 1 = BTC-PERP, 2 = ETH-PERP, etc.). Check Drift docs for full list.'
        },
        amount: {
          type: 'number',
          description:
            'Amount of base asset to trade (e.g., 1 = 1 SOL for SOL-PERP market)'
        },
        slippageBps: {
          type: 'number',
          description: 'Optional: Slippage tolerance in basis points (default: 50 = 0.5%)'
        }
      },
      required: ['marketIndex', 'amount']
    }
  },
  {
    name: 'place_limit_order',
    description:
      'Place a limit order for perpetual futures on Drift. Order executes only at specified price or better. Use when user wants to enter at specific price level.',
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
        }
      },
      required: ['marketIndex', 'direction', 'amount', 'price']
    }
  },
  {
    name: 'set_stop_loss',
    description:
      'Set a stop loss trigger order to automatically close position when price hits stop level. Protects against losses. Use when user wants to limit downside risk.',
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
        }
      },
      required: ['marketIndex', 'amount', 'triggerPrice', 'currentDirection']
    }
  },
  {
    name: 'set_take_profit',
    description:
      'Set a take profit trigger order to automatically close position when price hits profit target. Locks in gains. Use when user wants to secure profits at target price.',
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
        }
      },
      required: ['marketIndex', 'amount', 'triggerPrice', 'currentDirection']
    }
  },
  {
    name: 'get_positions',
    description:
      "Get user's current open perpetual positions across all Drift markets. Shows position size, direction, and PnL. Use when user asks about their positions or holdings.",
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'close_position',
    description:
      'Close an entire perpetual position immediately at market price. Use when user wants to exit a position completely.',
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description: 'Market index of the position to close'
        }
      },
      required: ['marketIndex']
    }
  },
  {
    name: 'cancel_order',
    description:
      'Cancel a specific pending order by order ID. Use when user wants to cancel one specific order.',
    input_schema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'number',
          description: 'Order ID to cancel (from get_orders)'
        }
      },
      required: ['orderId']
    }
  },
  {
    name: 'cancel_all_orders',
    description:
      'Cancel all pending orders, optionally filtered by market. Use when user wants to cancel multiple or all orders at once.',
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description:
            'Optional: Market index to filter by. If not provided, cancels all orders across all markets.'
        }
      },
      required: []
    }
  },
  {
    name: 'get_orders',
    description:
      "Get user's open orders (limit orders, stop loss, take profit). Shows all pending orders with details. Use when user asks about their orders.",
    input_schema: {
      type: 'object',
      properties: {
        marketIndex: {
          type: 'number',
          description: 'Optional: Filter orders by market index'
        }
      },
      required: []
    }
  },
  {
    name: 'get_market_info',
    description:
      'Get detailed information about a Drift perpetual market including current price, funding rate, and open interest. Use when user asks about market conditions or prices.',
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
