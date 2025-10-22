"use client"

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'

// Declare the custom element type for TypeScript
interface OpenAIChatKitElement extends HTMLElement {
  fetch?: typeof window.fetch
  composer?: any
  newThreadView?: any
  theme?: string
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'openai-chatkit': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'api-url'?: string
        theme?: string
      }, HTMLElement>
    }
  }
}

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
  const [error, setError] = useState<string | null>(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const chatkitRef = useRef<OpenAIChatKitElement | null>(null)

  const serverUrl = process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit'

  console.log('🎯 Configuring ChatKit for Custom Backend')
  console.log('🐍 Server URL:', serverUrl)
  console.log('👤 User:', user?.id, 'Tier:', profile?.subscription_tier)

  // Load ChatKit script
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if script already exists
    if (document.querySelector('script[src*="chatkit.js"]')) {
      console.log('📦 ChatKit script already loaded')
      setIsScriptLoaded(true)
      return
    }

    console.log('📦 Loading ChatKit script from CDN...')
    const script = document.createElement('script')
    script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js'
    script.async = true
    
    script.onload = () => {
      console.log('✅ ChatKit script loaded successfully')
      setIsScriptLoaded(true)
    }
    
    script.onerror = () => {
      console.error('❌ Failed to load ChatKit script')
      setError('Failed to load ChatKit')
      setIsScriptLoaded(false)
    }

    document.head.appendChild(script)

    return () => {
      // Don't remove the script on unmount as it might be used by other components
    }
  }, [])

  // Configure ChatKit Web Component after it loads
  useEffect(() => {
    if (!isScriptLoaded || !chatkitRef.current || !user) return

    const element = chatkitRef.current

    console.log('⚙️ Configuring ChatKit Web Component')

    // Set up custom fetch to inject user headers
    const originalFetch = window.fetch
    element.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = {
        ...init?.headers,
        'X-User-Id': user?.id || '',
        'X-User-Email': user?.email || '',
        'X-User-Tier': profile?.subscription_tier || 'free',
      }
      console.log('🌐 ChatKit fetch:', typeof input === 'string' ? input : input instanceof URL ? input.href : 'Request')
      return originalFetch(input, { ...init, headers })
    }

    // Configure composer
    element.composer = {
      placeholder: "What's the play today, champ? Ask about odds, build parlays, or get insights..."
    }

    // Configure new thread view (start screen)
    element.newThreadView = {
      greeting: "🎯 Professor Lock is locked in! Let's find some winners, champ! 💰",
      prompts: [
        { 
          label: "Today's best value bets", 
          prompt: "Analyze today's games and give me top 3 confident picks", 
          icon: 'star'
        },
        { 
          label: 'Build me a 3-leg parlay', 
          prompt: "Build a 3-leg parlay with strong value and reasonable risk", 
          icon: 'write'
        },
        { 
          label: 'Find hot player props', 
          prompt: "Show the best player prop bets with strong value today", 
          icon: 'bolt'
        },
      ],
    }

    // Set up event listeners
    element.addEventListener('chatkit.error', ((e: CustomEvent) => {
      console.error('🚨 ChatKit error:', e.detail.error)
      setError(e.detail.error?.message || 'An error occurred')
    }) as EventListener)

    element.addEventListener('chatkit.log', ((e: CustomEvent) => {
      console.log('🪵 ChatKit log:', e.detail.name, e.detail.data)
    }) as EventListener)

    element.addEventListener('chatkit.response.start', () => {
      console.log('🟢 Response started')
    })

    element.addEventListener('chatkit.response.end', () => {
      console.log('🟣 Response ended')
    })

    console.log('✅ ChatKit Web Component configured')
    onSessionStart?.()

    return () => {
      onSessionEnd?.()
    }
  }, [isScriptLoaded, user, profile, onSessionStart, onSessionEnd])

  if (!user) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <p className="text-white/60">Please sign in to access Professor Lock</p>
        </div>
      </div>
    )
  }

  if (!isScriptLoaded) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
          <p className="text-white/40">Loading ChatKit...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative rounded-2xl border border-white/10 overflow-hidden ${className}`}
      style={{ 
        minHeight: '600px', 
        height: '600px', 
        width: '100%',
        background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,30,0.9) 100%)'
      }}
    >
      {error && (
        <div className="absolute top-3 left-3 z-50 text-xs px-3 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
          ⚠️ {error}
        </div>
      )}
      <div className="absolute top-3 right-3 z-50 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        ⚡ Custom API
      </div>
      
      {/* ChatKit Web Component for Custom Backend */}
      <openai-chatkit
        ref={chatkitRef as any}
        api-url={serverUrl}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  )
}
