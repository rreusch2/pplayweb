import { NextRequest } from 'next/server'
import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime'

// Configure Copilot Runtime to use xAI (OpenAI-compatible)
// Ensure XAI_API_KEY is set in Vercel/Env
const runtime = new CopilotRuntime({})

export const POST = async (req: NextRequest) => {
  const xaiApiKey = process.env.XAI_API_KEY
  if (!xaiApiKey) {
    return new Response(JSON.stringify({ error: 'XAI_API_KEY is not configured' }), { status: 500 })
  }

  // You can override model and baseUrl per request via headers if desired
  const baseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1'

  return copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    provider: new OpenAIAdapter({ apiKey: xaiApiKey, baseUrl }),
  })(req)
}

export const GET = POST


