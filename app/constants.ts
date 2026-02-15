import { AnthropicIcon } from './src/components/AnthropicIcon'
import { GeminiIcon } from './src/components/GeminiIcon'
import { OpenAIIcon } from './src/components/OpenAIIcon'

const normalizeDomain = (value?: string) => {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value
  }
  return `http://${value}`
}

const env = (process.env.EXPO_PUBLIC_ENV || 'DEVELOPMENT').toUpperCase()
const devUrl = process.env.EXPO_PUBLIC_DEV_API_URL
const prodUrl = process.env.EXPO_PUBLIC_PROD_API_URL
const rawDomain = env === 'DEVELOPMENT' ? devUrl : prodUrl
export const DOMAIN = normalizeDomain(rawDomain || devUrl || prodUrl || '')

export const MODELS = {
  claudeOpus: {
    name: 'Claude Opus',
    label: 'claudeOpus',
    icon: AnthropicIcon
  },
  claudeSonnet: {
    name: 'Claude Sonnet',
    label: 'claudeSonnet',
    icon: AnthropicIcon
  },
  claudeHaiku: {
    name: 'Claude Haiku',
    label: 'claudeHaiku',
    icon: AnthropicIcon
  },
  gpt52: { name: 'GPT 5.2', label: 'gpt52', icon: OpenAIIcon },
  gpt5Mini: { name: 'GPT 5 Mini', label: 'gpt5Mini', icon: OpenAIIcon },
  gemini: { name: 'Gemini', label: 'gemini', icon: GeminiIcon },
}

export const IMAGE_MODELS = {
  nanoBanana: { name: 'Nano Banana (Gemini Flash Image)', label: 'nanoBanana' },
  nanoBananaPro: { name: 'Nano Banana Pro (Gemini 3 Pro)', label: 'nanoBananaPro' },
}

/**
 * Frosted Light – Soft and minimal, perfect for clean layouts and relaxing experiences.
 * Palette: #EBF4F5, #B5C6E0
 * Vertical gradient: white/light on top, darker on bottom for floating effect
 * CSS: linear-gradient(180deg, #EBF4F5, #B5C6E0)
 */
export const GRADIENT_FROSTED_LIGHT = {
  name: 'Frosted Light',
  description: 'Soft and minimal, perfect for clean layouts and relaxing experiences.',
  colors: ['#EBF4F5', '#B5C6E0'] as const,
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
} as const