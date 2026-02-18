// Centralized model configuration for all Claude models

export type ModelLabel = 'claudeOpus' | 'claudeSonnet' | 'claudeHaiku';
export type ModelName =
  | 'claude-opus-4-5-20251101'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-haiku-4-5-20251001';

export interface ModelConfig {
  name: ModelName;
  inputPricePer1M: number;  // USD per 1M tokens
  outputPricePer1M: number; // USD per 1M tokens
}

export const models: Record<ModelLabel, ModelConfig> = {
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
