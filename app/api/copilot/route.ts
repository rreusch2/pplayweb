import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime'
import OpenAI from 'openai'

// Configure Copilot Runtime to use xAI (OpenAI-compatible)
// Ensure XAI_API_KEY is set in Vercel/Env
const runtime = new CopilotRuntime({})

const xaiApiKey = process.env.XAI_API_KEY || ''
const baseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1'

const openai = new OpenAI({ apiKey: xaiApiKey, baseURL: baseUrl })

const endpoint = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter: new OpenAIAdapter({ openai, model: process.env.XAI_MODEL || 'grok-2-latest' }),
  endpoint: '/api/copilot'
})

export const GET = endpoint.GET
export const POST = endpoint.POST
export const OPTIONS = endpoint.OPTIONS

