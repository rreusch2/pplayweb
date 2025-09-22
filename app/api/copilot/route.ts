import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime'

// Configure Copilot Runtime to use xAI (OpenAI-compatible)
// Ensure XAI_API_KEY is set in Vercel/Env
const runtime = new CopilotRuntime({})

const xaiApiKey = process.env.XAI_API_KEY || ''
const baseUrl = process.env.XAI_BASE_URL || 'https://api.x.ai/v1'

const endpoint = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  provider: new OpenAIAdapter({ apiKey: xaiApiKey, baseUrl }),
  instructions: 'You are Professor Lock, an expert AI betting assistant. Be sharp, concise, and data-driven.'
})

export const GET = endpoint.GET
export const POST = endpoint.POST
export const OPTIONS = endpoint.OPTIONS

