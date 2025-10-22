"use client"

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { toast } from 'react-hot-toast'

interface ProfessorLockCustomProps {
  className?: string
  onSessionStart?: () => void
  onSessionEnd?: () => void
}

// ChatKit Web Component types
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'openai-chatkit': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'api-url'?: string
        'domain-key'?: string
      }
    }
  }
}

export default function ProfessorLockCustom({ 
  className = "",
  onSessionStart,
  onSessionEnd
}: ProfessorLockCustomProps) {
  const { user, profile, session } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const chatkitElementRef = useRef<any>(null)
  
  // Load ChatKit Web Component script
  useEffect(() => {
    console.log('📦 Loading ChatKit Web Component script...')
    
    // Check if script already exists
    if (document.querySelector('script[src*="chatkit"]')) {
      console.log('✅ ChatKit script already loaded')
      setScriptLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdn.openai.com/chatkit/v1/chatkit.js'
    script.async = true
    script.onload = () => {
      console.log('✅ ChatKit Web Component script loaded')
      setScriptLoaded(true)
    }
    script.onerror = () => {
      console.error('❌ Failed to load ChatKit script')
      setError('Failed to load ChatKit library')
    }
    
    document.head.appendChild(script)
    
    return () => {
      // Don't remove script on unmount (shared across instances)
    }
  }, [])

  // Initialize ChatKit Web Component
  useEffect(() => {
    if (!scriptLoaded || !user || !containerRef.current) return

    console.log('🎯 Initializing ChatKit Web Component...')
    console.log('User:', user.id)
    console.log('Tier:', profile?.subscription_tier)
    
    const serverUrl = process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit'
    const domainKey = process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY || 'domain_pk_68ee8f22d84c8190afddda0c6ca72f7c0560633b5555ebb2'
    
    console.log('🐍 Server:', serverUrl)
    console.log('🔑 Domain Key:', domainKey.substring(0, 20) + '...')

    // Create the openai-chatkit custom element
    const chatkitEl = document.createElement('openai-chatkit')
    chatkitEl.setAttribute('api-url', serverUrl)
    chatkitEl.setAttribute('domain-key', domainKey)
    
    // Apply configuration via JavaScript
    const config = {
      theme: {
        colorScheme: 'dark',
        radius: 'pill',
        density: 'normal',
        color: {
          grayscale: { hue: 0, tint: 0 },
          accent: { primary: '#168aa2', level: 1 },
          surface: { background: '#242424', foreground: '#595654' }
        },
        typography: {
          baseSize: 16,
          fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }
      },
      header: true,
      composer: {
        attachments: { enabled: true, maxCount: 5, maxSize: 10485760 },
        placeholder: "What's the play today, champ? Ask about odds, build parlays, or get the latest insights...",
        tools: [
          {
            id: 'analyze_games',
            label: 'Analyze Today\'s Games',
            icon: 'analytics',
            shortLabel: 'Games',
            placeholderOverride: 'Which sport or specific games should I analyze?',
            pinned: true
          },
          {
            id: 'build_parlay',
            label: 'Build Smart Parlay',
            icon: 'sparkle',
            shortLabel: 'Parlay',
            placeholderOverride: 'Tell me your preferred legs or let me suggest a parlay',
            pinned: true
          }
        ]
      },
      newThreadView: {
        greeting: '🎯 Professor Lock is locked in! Let\'s find some winners, champ! 💰',
        prompts: [
          {
            icon: 'star-filled',
            label: 'What are today\'s best value bets?',
            prompt: 'Analyze today\'s games across all sports and give me your top 3 confident picks with the best value'
          },
          {
            icon: 'plus',
            label: 'Build me a 3-leg parlay',
            prompt: 'Create a 3-leg parlay with solid confidence levels and good payout potential for tonight\'s games'
          },
          {
            icon: 'bolt',
            label: 'Find hot player props',
            prompt: 'Show me the best player prop bets with strong value and high confidence for today\'s slate'
          }
        ]
      }
    }
    
    // Apply config
    ;(chatkitEl as any).config = config
    
    // Add user context headers interceptor
    ;(chatkitEl as any).fetchInterceptor = (url: string, init: RequestInit) => {
      return fetch(url, {
        ...init,
        headers: {
          ...init.headers,
          'X-User-Id': user.id || '',
          'X-User-Email': user.email || '',
          'X-User-Tier': profile?.subscription_tier || 'free'
        }
      })
    }
    
    // Style the element
    chatkitEl.style.width = '100%'
    chatkitEl.style.height = '100%'
    chatkitEl.style.minHeight = '600px'
    chatkitEl.style.display = 'block'
    
    // Append to container
    containerRef.current.innerHTML = '' // Clear any existing content
    containerRef.current.appendChild(chatkitEl)
    chatkitElementRef.current = chatkitEl
    
    console.log('✅ ChatKit element created and mounted')

    // Event listeners
    const handleError = (e: any) => {
      console.error('🚨 chatkit.error:', e.detail)
      setError(`ChatKit error: ${e.detail?.error?.message || 'Connection failed'}`)
    }
    const handleLog = (e: any) => {
      console.log('🪵 chatkit.log:', e.detail)
    }
    const handleStart = () => {
      console.log('🟢 chatkit.response.start')
    }
    const handleEnd = () => {
      console.log('🟣 chatkit.response.end')
    }
    const handleThread = (e: any) => {
      console.log('🧵 chatkit.thread.change:', e.detail)
      if (e.detail?.threadId && !chatkitElementRef.current?.hasSession) {
        chatkitElementRef.current.hasSession = true
        onSessionStart?.()
      }
    }
    const handleAction = (e: any) => {
      console.log('🎬 chatkit.widget.action:', e.detail)
      const { action } = e.detail || {}
      if (action?.type) {
        const actionLabels: Record<string, string> = {
          'add_to_betslip': '💰 Added to betslip!',
          'submit_parlay': '🔒 Parlay submitted!',
          'analyze_game': '📊 Analyzing game...',
          'refresh_odds': '🔄 Refreshing odds...'
        }
        toast.success(actionLabels[action.type] || '✅ Action completed')
      }
    }

    chatkitEl.addEventListener('chatkit.error', handleError)
    chatkitEl.addEventListener('chatkit.log', handleLog)
    chatkitEl.addEventListener('chatkit.response.start', handleStart)
    chatkitEl.addEventListener('chatkit.response.end', handleEnd)
    chatkitEl.addEventListener('chatkit.thread.change', handleThread)
    chatkitEl.addEventListener('chatkit.widget.action', handleAction)
    
    return () => {
      console.log('🔌 Cleaning up ChatKit Web Component')
      chatkitEl.removeEventListener('chatkit.error', handleError)
      chatkitEl.removeEventListener('chatkit.log', handleLog)
      chatkitEl.removeEventListener('chatkit.response.start', handleStart)
      chatkitEl.removeEventListener('chatkit.response.end', handleEnd)
      chatkitEl.removeEventListener('chatkit.thread.change', handleThread)
      chatkitEl.removeEventListener('chatkit.widget.action', handleAction)
      onSessionEnd?.()
    }
  }, [scriptLoaded, user, profile, onSessionStart, onSessionEnd])

  if (!user) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="mb-4">
            <div className="text-6xl">🎯</div>
          </div>
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
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-3 border-blue-500/20 border-t-blue-500 mx-auto"></div>
          <p className="text-lg text-slate-200 font-medium">Loading Professor Lock...</p>
          <p className="text-xs text-slate-400 mt-2">Initializing ChatKit</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight: '600px', height: '600px', background: '#1a1a1a' }}
    >
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center max-w-md mx-4">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-lg text-red-400 mb-2 font-semibold">Connection Error</p>
            <p className="text-sm text-slate-300 mb-4 bg-red-950/30 p-3 rounded-lg border border-red-500/30">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      
      <div className="absolute top-3 right-3 z-10 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        ⚡ Live
      </div>
      
      {/* ChatKit Web Component container */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
