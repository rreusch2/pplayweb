// lib/apiClient.ts
import axios from 'axios';
import { supabase } from './supabase';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://zooming-rebirth-production-a305.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Simple in-memory token cache to avoid hammering getSession and triggering refresh storms
let cachedToken: string | null = null
let cacheExpiresAt = 0 // ms epoch
let inflightTokenPromise: Promise<string | null> | null = null

async function getAuthToken(): Promise<string | null> {
  const now = Date.now()
  if (cachedToken && now < cacheExpiresAt) return cachedToken
  if (inflightTokenPromise) return inflightTokenPromise

  inflightTokenPromise = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? null
      // Cache briefly (15s) to coalesce bursts of requests; supabase-js manages real refresh timing
      cachedToken = token
      cacheExpiresAt = Date.now() + 15_000
      return token
    } finally {
      // Reset inflight regardless of success/failure
      setTimeout(() => { inflightTokenPromise = null }, 0)
    }
  })()

  return inflightTokenPromise
}

// Add a request interceptor to include the Supabase auth token (with caching)
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken()
    if (token) {
      (config.headers as any).Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

export default apiClient;
