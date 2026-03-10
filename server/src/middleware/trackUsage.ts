import { Request, Response, NextFunction } from 'express';
import { db } from '../db/supabase';

// Extend Express Request to include usage tracking
declare global {
  namespace Express {
    interface Request {
      walletAddress?: string;
      isFreeRequest?: boolean;
      usageTracking?: {
        model: string;
        requestType: string;
        startTime: number;
      };
    }
  }
}

/**
 * Middleware to check if user has enough balance/free requests before API call
 * Optional: If no wallet address provided, request continues but won't be tracked
 */
export const checkBalance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const walletAddress = req.headers['x-wallet-address'] as string;

    if (!walletAddress) {
      // Allow request without wallet address (for testing/development)
      // Usage won't be tracked
      console.warn('⚠️  No wallet address provided - usage will not be tracked');
      next();
      return;
    }

    // Get or create user
    const user = await db.getOrCreateUser(walletAddress) as any;

    // Store wallet address and free request status in request for later use
    req.walletAddress = walletAddress;
    req.isFreeRequest = user.free_requests_remaining > 0;

    // Check if user has free requests or USDC balance
    if (user.free_requests_remaining <= 0 && user.usdc_balance <= 0) {
      return res.status(402).json({
        error: 'Insufficient balance',
        message: 'Please deposit USDC to continue using the API',
        freeRequestsRemaining: user.free_requests_remaining,
        usdcBalance: user.usdc_balance
      });
    }

    next();
  } catch (error) {
    console.error('Error checking balance:', error);
    // Continue even if balance check fails (don't block the request)
    // This ensures the API remains available even if Supabase is down
    console.warn('⚠️  Balance check failed - continuing without tracking');
    next();
  }
};

/**
 * Middleware to track API usage after request completes
 * Should be used with custom response wrapper
 */
export const trackUsage = (model: string, requestType: string = 'chat') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store tracking info in request
    req.usageTracking = {
      model,
      requestType,
      startTime: Date.now()
    };

    // Store original write and end methods
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    let inputTokens = 0;
    let outputTokens = 0;
    let responseChunks: any[] = [];

    // Override write to capture streaming response
    res.write = function (chunk: any, ...args: any[]): boolean {
      responseChunks.push(chunk);
      return originalWrite(chunk, ...args);
    };

    // Override end to track usage when response completes
    res.end = function (chunk?: any, ...args: any[]): any {
      if (chunk) {
        responseChunks.push(chunk);
      }

      // Try to extract token usage from response
      // This is a simplified version - you may need to adjust based on actual response format
      try {
        const responseText = responseChunks.join('');

        // For Anthropic API, token usage is in the response
        // We'll need to parse it from the streaming response
        // This is a placeholder - actual implementation depends on how you want to count tokens

        // For now, use a simple estimation based on message length
        const estimatedTokens = Math.ceil(responseText.length / 4);
        outputTokens = estimatedTokens;

        // Estimate input tokens from request
        if (req.body?.prompt) {
          inputTokens = Math.ceil(JSON.stringify(req.body.prompt).length / 4);
        } else if (req.body?.messages) {
          inputTokens = Math.ceil(JSON.stringify(req.body.messages).length / 4);
        }

        // Track usage asynchronously (don't block response)
        if (req.walletAddress && req.usageTracking) {
          db.processApiRequest({
            walletAddress: req.walletAddress,
            model: req.usageTracking.model,
            requestType: req.usageTracking.requestType,
            inputTokens,
            outputTokens,
            endpoint: req.path
          }).catch(err => {
            console.error('Failed to track usage:', err);
          });
        }
      } catch (error) {
        console.error('Error tracking usage:', error);
      }

      return originalEnd(chunk, ...args);
    };

    next();
  };
};

/**
 * Wrapper function to manually track usage with actual token counts
 * Use this when you have access to actual token usage from the API response
 */
export const manualTrackUsage = async (params: {
  walletAddress: string;
  model: string;
  requestType: string;
  inputTokens: number;
  outputTokens: number;
  conversationId?: string;
  endpoint?: string;
}) => {
  try {
    const result = await db.processApiRequest(params);
    return result;
  } catch (error) {
    console.error('Failed to track usage:', error);
    throw error;
  }
};
