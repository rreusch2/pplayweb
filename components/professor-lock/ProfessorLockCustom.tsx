"use client"

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'

interface ProfessorLockCustomProps {
  className?: string
  onSessionStart?: () => void
  onSessionEnd?: () => void
}

export default function ProfessorLockCustom({ 
  className = "",
  onSessionStart,
  onSessionEnd
}: ProfessorLockCustomProps) {
  const { user, profile } = useAuth()
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load ChatKit Web Component script
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (window.customElements?.get('openai-chatkit')) {
      setScriptLoaded(true)
      return
    }

    console.log('📦 Loading ChatKit Web Component...')
    
    const script = document.createElement('script')
    script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js'
    script.type = 'module'
    script.async = true
    
    script.onload = () => {
      console.log('✅ ChatKit Web Component loaded')
      setScriptLoaded(true)
    }
    
    script.onerror = (e) => {
      console.error('❌ Failed to load ChatKit:', e)
      setError('Failed to load ChatKit library')
    }
    
    document.head.appendChild(script)
    
    return () => {
      // keep script loaded
    }
  }, [])

  // Initialize ChatKit element
  useEffect(() => {
    if (!scriptLoaded || !user || !containerRef.current) return

    const serverUrl = process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit'
    const domainKey = process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY || 'domain_pk_68ee8f22d84c8190afddda0c6ca72f7c0560633b5555ebb2'

    console.log('🎯 Creating ChatKit element...')
    console.log('🐍 Server:', serverUrl)
    console.log('👤 User:', user.id, 'Tier:', profile?.subscription_tier)

    const el = document.createElement('openai-chatkit') as any

    // Set both properties and attributes to be safe
    el.apiURL = serverUrl
    el.domainKey = domainKey
    el.setAttribute('api-url', serverUrl)
    el.setAttribute('domain-key', domainKey)

    // Inject headers for Custom API requests
    el.fetchInterceptor = (url: string, init: RequestInit) => {
      const headers = {
        ...init?.headers,
        'X-User-Id': user.id || '',
        'X-User-Email': user.email || '',
        'X-User-Tier': profile?.subscription_tier || 'free',
      }
      console.log('🌐 ChatKit request:', url)
      return fetch(url, { ...init, headers })
    }

    // Force visible UI: header + composer + start screen
    el.config = {
      header: true,
      composer: {
        attachments: { enabled: true, maxCount: 5, maxSize: 10485760 },
        placeholder: "What's the play today, champ? Ask about odds, build parlays, or get the latest insights...",
      },
      newThreadView: {
        greeting: "🎯 Professor Lock is locked in! Let's find some winners, champ! 💰",
        prompts: [
          { icon: 'star-filled', label: "Today's best value bets", prompt: "Analyze today's games and give me top 3 confident picks" },
          { icon: 'plus', label: 'Build me a 3-leg parlay', prompt: "Build a 3-leg parlay with strong value and reasonable risk" },
          { icon: 'bolt', label: 'Find hot player props', prompt: "Show the best player prop bets with strong value today" },
        ],
      },
      theme: {
        colorScheme: 'dark',
      },
    }

    // Helpful event listeners
    const onError = (e: any) => {
      console.error('🚨 chatkit.error:', e?.detail || e)
      setError(e?.detail?.error?.message || 'ChatKit error')
    }
    const onLog = (e: any) => console.log('🪵 chatkit.log:', e?.detail || e)
    const onStart = () => console.log('🟢 chatkit.response.start')
    const onEnd = () => console.log('🟣 chatkit.response.end')

    el.addEventListener('chatkit.error', onError)
    el.addEventListener('chatkit:log', onLog)
    el.addEventListener('chatkit.log', onLog)
    el.addEventListener('chatkit.response.start', onStart)
    el.addEventListener('chatkit.response.end', onEnd)

    // Style & mount
    el.style.width = '100%'
    el.style.height = '100%'
    el.style.display = 'block'
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(el)

    console.log('✅ ChatKit element mounted')
    onSessionStart?.()

    return () => {
      el.removeEventListener('chatkit.error', onError)
      el.removeEventListener('chatkit:log', onLog)
      el.removeEventListener('chatkit.log', onLog)
      el.removeEventListener('chatkit.response.start', onStart)
      el.removeEventListener('chatkit.response.end', onEnd)
      onSessionEnd?.()
    }
  }, [scriptLoaded, user, profile, onSessionStart, onSessionEnd])

  if (!user) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-lg text-slate-300 mb-2">Please log in to access Professor Lock</p>
          <p className="text-sm text-slate-500">Your AI sports betting assistant</p>
        </div>
      </div>
    )
  }

  if (!scriptLoaded) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-500/20 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-slate-200">Loading Professor Lock...</p>
          <p className="text-xs text-slate-400 mt-2">Initializing ChatKit</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center max-w-md">
          <div className="text-5xl text-red-500 mb-4">⚠️</div>
          <p className="text-lg text-red-400 mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: '600px', height: '600px' }}>
      <div className="absolute top-3 right-3 z-10 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        ⚡ Live
      </div>
      <div 
        ref={containerRef}
        className="w-full h-full rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 overflow-hidden"
      />
    </div>
  )
}
