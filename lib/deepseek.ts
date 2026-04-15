// DeepSeek API 客户端封装
// 使用 openai 包，base_url 指向 DeepSeek，完全兼容 OpenAI 格式
import OpenAI from 'openai'

export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? 'sk-placeholder',
  baseURL: 'https://api.deepseek.com',
})

export const DEEPSEEK_MODEL = 'deepseek-chat'

// 检查 API Key 是否已配置
export function isApiKeyConfigured(): boolean {
  const key = process.env.DEEPSEEK_API_KEY
  return !!key && key !== 'sk-placeholder' && key.startsWith('sk-')
}
