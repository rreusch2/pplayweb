"use client"

import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'

interface ProfessorLockCustomProps {
  className?: string
  onSessionStart?: () => void
  onSessionEnd?: () => void
}

// Declare the web component for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'openai-chatkit': any
    }
  }
}

export default function ProfessorLockCustomRaw({ 
  className = "",
  onSessionStart,
  onSessionEnd
}: ProfessorLockCustomProps) {
  const { user, profile } = useAuth()
  const chatkitRef = useRef<any>(null)

  const serverUrl = process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit'

  useEffect(() => {
    // Load the ChatKit web component script
    const script = document.createElement('script')
    script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (!chatkitRef.current || !user) return

    const element = chatkitRef.current as any

    // Configure the web component directly
    element.apiURL = serverUrl
    element.theme = 'dark'
    
    // Custom fetch with auth headers
    element.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = {
        ...init?.headers,
        'X-User-Id': user?.id || '',
        'X-User-Email': user?.email || '',
        'X-User-Tier': profile?.subscription_tier || 'free',
      }
      console.log('🌐 ChatKit fetch:', typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url)
      return fetch(input, { ...init, headers })
    }

    // Composer configuration
    element.composer = {
      placeholder: "What's the play today, champ? Ask about odds, build parlays, or get insights..."
    }

    // New thread view configuration
    element.newThreadView = {
      greeting: "🎯 Professor Lock is locked in! Let's find some winners, champ! 💰",
      starterPrompts: [
        { 
          label: "Today's best value bets", 
          prompt: "Analyze today's games and give me top 3 confident picks"
        },
        { 
          label: 'Build me a 3-leg parlay', 
          prompt: "Build a 3-leg parlay with strong value and reasonable risk"
        },
        { 
          label: 'Find hot player props', 
          prompt: "Show the best player prop bets with strong value today"
        },
      ]
    }

    // Event listeners
    const handleError = (e: any) => {
      console.error('🚨 ChatKit error:', e.detail)
    }

    const handleLog = (e: any) => {
      console.log('🪵 ChatKit log:', e.detail)
    }

    const handleResponseStart = () => {
      console.log('🟢 Response started')
    }

    const handleResponseEnd = () => {
      console.log('🟣 Response ended')
    }

    element.addEventListener('chatkit.error', handleError)
    element.addEventListener('chatkit.log', handleLog)
    element.addEventListener('chatkit.response.start', handleResponseStart)
    element.addEventListener('chatkit.response.end', handleResponseEnd)

    onSessionStart?.()

    return () => {
      element.removeEventListener('chatkit.error', handleError)
      element.removeEventListener('chatkit.log', handleLog)
      element.removeEventListener('chatkit.response.start', handleResponseStart)
      element.removeEventListener('chatkit.response.end', handleResponseEnd)
      onSessionEnd?.()
    }
  }, [user, profile, serverUrl, onSessionStart, onSessionEnd])

  if (!user) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <p className="text-white/60">Please sign in to access Professor Lock</p>
        </div>
      </div>
    )
  }

  console.log('🎨 Rendering Raw ChatKit Web Component')
  console.log('🐍 Server URL:', serverUrl)
  console.log('👤 User:', user?.id, 'Tier:', profile?.subscription_tier)

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
      <div className="absolute top-3 right-3 z-50 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        ⚡ Custom API (Raw)
      </div>
      
      {/* Raw ChatKit Web Component */}
      <openai-chatkit 
        ref={chatkitRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  )
}

