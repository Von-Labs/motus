import { Request, Response, NextFunction } from "express"
import asyncHandler from 'express-async-handler'
import { db } from '../db/supabase'

type ModelLabel = 'claudeOpus' | 'claudeSonnet' | 'claudeHaiku'
type ModelName =
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-haiku-4-5-20251001';

interface ModelConfig {
  name: ModelName;
  inputPricePer1M: number;  // USD per 1M tokens
  outputPricePer1M: number; // USD per 1M tokens
}

const models: Record<ModelLabel, ModelConfig> = {
  claudeOpus: {
    name: 'claude-opus-4-5-20251101',
    inputPricePer1M: 5.00,
    outputPricePer1M: 25.00
  },
  claudeSonnet: {
    name: 'claude-sonnet-4-5-20250929',
    inputPricePer1M: 3.00,
    outputPricePer1M: 15.00
  },
  claudeHaiku: {
    name: 'claude-haiku-4-5-20251001',
    inputPricePer1M: 1.00,
    outputPricePer1M: 5.00
  }
}

interface RequestBody {
  prompt: any;
  model: ModelLabel;
}

export const claude = asyncHandler(async (req: Request, res: Response) => {
  let inputTokens = 0
  let outputTokens = 0

  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })

    const { prompt, model }: RequestBody = req.body
    const modelConfig = models[model]
    const walletAddress = req.headers['x-wallet-address'] as string

    if (!modelConfig) {
      res.write('data: [DONE]\n\n')
      res.end()
      return
    }

    const decoder = new TextDecoder()
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'messages-2023-12-15',
        'x-api-key': process.env.ANTHROPIC_API_KEY || ''
      },
      body: JSON.stringify({
        model: modelConfig.name,
        "messages": [{"role": "user", "content": prompt }],
        "max_tokens": 4096,
        stream: true
      })
    })

    const reader = response.body?.getReader()
    if (reader) {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        let chunk = decoder.decode(value)

        const lines = chunk.split("\n")

        const parsedLines = lines
          .filter(line => line.startsWith('data: '))
          .map(line => {
            try {
              return JSON.parse(line.replace('data: ', ''))
            } catch {
              return null
            }
          })
          .filter(Boolean)

        for (const parsedLine of parsedLines) {
          if (parsedLine) {
            // Track usage from message_delta events
            if (parsedLine.type === 'message_delta' && parsedLine.usage) {
              outputTokens = parsedLine.usage.output_tokens || 0
            }

            // Track usage from message_start event
            if (parsedLine.type === 'message_start' && parsedLine.message?.usage) {
              inputTokens = parsedLine.message.usage.input_tokens || 0
            }

            if (parsedLine.delta && parsedLine.delta.text) {
              res.write(`data: ${JSON.stringify(parsedLine.delta)}\n\n`)
            }
          }
        }
      }

      // Track usage in database after streaming completes
      if (walletAddress && inputTokens > 0 && outputTokens > 0) {
        try {
          await db.processApiRequest({
            walletAddress,
            model: modelConfig.name,
            requestType: 'chat',
            inputTokens,
            outputTokens,
            endpoint: req.path
          })
        } catch (trackingErr) {
          console.error('Failed to track usage:', trackingErr)
          // Don't fail the request if tracking fails
        }
      }

      res.write('data: [DONE]\n\n')
      res.end()
    }
  } catch (err) {
    console.log('error in claude chat: ', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})