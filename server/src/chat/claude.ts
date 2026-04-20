import { Request, Response } from "express"
import asyncHandler from 'express-async-handler'
import { db } from '../db/supabase'
import { BedrockRuntimeClient, ConverseStreamCommand } from "@aws-sdk/client-bedrock-runtime"
import { models, ModelLabel } from './models'

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1'
})

function toBedrockContent(content: any): { text: string }[] {
  if (typeof content === 'string') return [{ text: content }]
  if (Array.isArray(content)) {
    return content.map(block => {
      if (typeof block === 'string') return { text: block }
      if (block.type === 'text') return { text: block.text }
      return { text: JSON.stringify(block) }
    })
  }
  return [{ text: String(content) }]
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
    const effectiveModel = req.isFreeRequest ? 'claudeHaiku' : model
    const modelConfig = models[effectiveModel]
    const walletAddress = req.headers['x-wallet-address'] as string

    if (!modelConfig) {
      res.write('data: [DONE]\n\n')
      res.end()
      return
    }

    const command = new ConverseStreamCommand({
      modelId: modelConfig.bedrockId,
      messages: [
        {
          role: 'user',
          content: toBedrockContent(prompt)
        }
      ],
      inferenceConfig: { maxTokens: 4096 }
    })

    const response = await bedrockClient.send(command)

    if (response.stream) {
      for await (const event of response.stream) {
        if (event.contentBlockDelta?.delta?.text) {
          res.write(`data: ${JSON.stringify({ type: 'text_delta', text: event.contentBlockDelta.delta.text })}\n\n`)
        }
        if (event.metadata?.usage) {
          inputTokens = event.metadata.usage.inputTokens || 0
          outputTokens = event.metadata.usage.outputTokens || 0
        }
      }
    }

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
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.log('error in claude chat: ', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})
