import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import OpenAI from "openai";

// Environment variables (configure in Vercel)
const XAI_API_KEY = process.env.XAI_API_KEY || process.env.XAI_KEY;
const XAI_BASE_URL = process.env.XAI_BASE_URL || "https://api.x.ai/v1"; // xAI OpenAI-compatible base
const MODEL = process.env.XAI_MODEL || "grok-3-latest";

const BACKEND_API_URL =
  process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL ||
  "https://zooming-rebirth-production-a305.up.railway.app";

const STATMUSE_API_URL =
  process.env.STATMUSE_API_URL || "https://feisty-nurturing-production-9c29.up.railway.app";

if (!XAI_API_KEY) {
  console.warn("[Copilot Runtime] Missing XAI_API_KEY. Please set it in your Vercel project env.");
}

// Create OpenAI client pointed at xAI
const openai = new OpenAI({
  apiKey: XAI_API_KEY,
  baseURL: XAI_BASE_URL,
});

// Define server-side actions (tools)
const runtime = new CopilotRuntime({
  actions: [
    {
      name: "get_latest_predictions",
      description:
        "Fetch the latest combined team and player prop predictions from the backend with optional tier limiting.",
      parameters: [
        { name: "userId", type: "string", description: "User ID (optional)", required: false },
        { name: "userTier", type: "string", description: "free|pro|allstar (optional)", required: false },
      ],
      handler: async ({ userId, userTier }: { userId?: string; userTier?: string }) => {
        const params = new URLSearchParams();
        if (userId) params.set("userId", userId);
        if (userTier) params.set("userTier", userTier);
        const url = `${BACKEND_API_URL}/api/ai/daily-picks-combined${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url, { headers: { "Content-Type": "application/json" }, cache: "no-store" });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Backend daily-picks-combined failed ${res.status}: ${text}`);
        }
        const data = await res.json();
        return data;
      },
    },
    {
      name: "statmuse_query",
      description:
        "Query the StatMuse proxy service for sports stats, trends, and Q&A. Provide a concise natural language query.",
      parameters: [
        { name: "query", type: "string", description: "The StatMuse question", required: true },
        { name: "sport", type: "string", description: "Optional sport (mlb, wnba, nba, etc)", required: false },
      ],
      handler: async ({ query, sport }: { query: string; sport?: string }) => {
        const res = await fetch(`${STATMUSE_API_URL}/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, sport }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`StatMuse query failed ${res.status}: ${text}`);
        }
        const data = await res.json();
        return data;
      },
    },
  ],
});

const adapter = new OpenAIAdapter({ openai, model: MODEL, disableParallelToolCalls: false });

const { GET, POST, OPTIONS } = copilotRuntimeNextJSAppRouterEndpoint({
  runtime,
  serviceAdapter: adapter,
  endpoint: "/api/copilot",
  properties: {},
  logLevel: "error",
});

export { GET, POST, OPTIONS };
