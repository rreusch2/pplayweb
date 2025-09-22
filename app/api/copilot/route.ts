import { NextRequest } from 'next/server'
import { CopilotRuntime, copilotRuntimeNextJSAppRouterEndpoint, OpenAIAdapter } from '@copilotkit/runtime'
import OpenAI from 'openai'

// Use an OpenAI-compatible adapter pointing at xAI base URL, key provided via env
// xAI on Vercel: set XAI_API_KEY and XAI_BASE_URL (defaults provided below)
const xaiBaseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1'
const xaiApiKey = process.env.XAI_API_KEY

const openai = new OpenAI({
  apiKey: xaiApiKey,
  baseURL: xaiBaseUrl,
})

const serviceAdapter = new OpenAIAdapter({
  openai,
  model: process.env.XAI_MODEL || 'grok-2-latest'
})

const runtime = new CopilotRuntime({
  serviceAdapter,
  // Keep defaults for guardrails and logging
})

export const POST = async (req: NextRequest) => {
  return copilotRuntimeNextJSAppRouterEndpoint({ runtime })(req)
}


