// Shared API client for web platform (adapted from mobile)
import axios from 'axios'
import { supabase } from '../../lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zooming-rebirth-production-a305.up.railway.app'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true
})

// Short-lived token cache to prevent refresh storms
let cachedToken: string | null = null
let cacheExpiresAt = 0
let inflightTokenPromise: Promise<string | null> | null = null

async function getAuthToken(): Promise<string | null> {
  const now = Date.now()
  if (cachedToken && now < cacheExpiresAt) return cachedToken
  if (inflightTokenPromise) return inflightTokenPromise

  inflightTokenPromise = (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token ?? null
      cachedToken = token
      cacheExpiresAt = Date.now() + 15_000
      return token
    } finally {
      setTimeout(() => { inflightTokenPromise = null }, 0)
    }
  })()

  return inflightTokenPromise
}

// Add auth token to requests (web version) with caching
apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken()
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default apiClient