// Centralized model configuration for all Claude models

export type ModelLabel = 'claudeOpus' | 'claudeSonnet' | 'claudeHaiku';
export type ModelName =
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-haiku-4-5-20251001';

export interface ModelConfig {
  name: ModelName;         // Anthropic model ID — used for DB tracking & pricing lookup
  bedrockId: string;       // AWS Bedrock model ID — used for actual API calls
  inputPricePer1M: number;  // USD per 1M tokens
  outputPricePer1M: number; // USD per 1M tokens
}

export const models: Record<ModelLabel, ModelConfig> = {
  claudeOpus: {
    name: 'claude-opus-4-5-20251101',
    bedrockId: 'us.anthropic.claude-opus-4-5-20251101-v1:0',
    inputPricePer1M: 10.00,
    outputPricePer1M: 50.00
  },
  claudeSonnet: {
    name: 'claude-sonnet-4-5-20250929',
    bedrockId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
    inputPricePer1M: 6.00,
    outputPricePer1M: 30.00
  },
  claudeHaiku: {
    name: 'claude-haiku-4-5-20251001',
    bedrockId: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
    inputPricePer1M: 2.00,
    outputPricePer1M: 10.00
  }
};

// Helper function to get model config
export const getModelConfig = (modelLabel: ModelLabel): ModelConfig => {
  return models[modelLabel];
};

// Helper function to calculate cost
export const calculateModelCost = (
  modelLabel: ModelLabel,
  inputTokens: number,
  outputTokens: number
): { inputCost: number; outputCost: number; totalCost: number } => {
  const config = models[modelLabel];
  const inputCost = (inputTokens / 1_000_000) * config.inputPricePer1M;
  const outputCost = (outputTokens / 1_000_000) * config.outputPricePer1M;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost
  };
};
