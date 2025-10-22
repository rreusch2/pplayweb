"use client"

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { ChatKit, useChatKit } from '@openai/chatkit-react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { toast } from 'react-hot-toast'

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
  const { user, profile, session } = useAuth()
  const [error, setError] = useState<string | null>(null)
  
  // Store callbacks and values in refs to prevent unnecessary re-renders
  const accessTokenRef = useRef(session?.access_token)
  
  useEffect(() => {
    accessTokenRef.current = session?.access_token
  }, [session?.access_token])

  // Memoize the entire options object to prevent ChatKit from reinitializing
  // Custom API mode: use your self-hosted server URL + domain key
  const options = useMemo(() => ({
    api: {
      url: process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit',
      domainKey: process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY || 'domain_pk_68ee8f22d84c8190afddda0c6ca72f7c0560633b5555ebb2',
      // Custom fetch to pass user context headers
      fetch: async (url: string, init?: RequestInit) => {
        const headers = {
          ...init?.headers,
          'X-User-Id': user?.id || '',
          'X-User-Email': user?.email || '',
          'X-User-Tier': profile?.subscription_tier || 'free',
        };
        console.log('🌐 ChatKit fetch:', url, 'Headers:', headers);
        return globalThis.fetch(url, { ...init, headers });
      },
    },
    theme: {
      colorScheme: 'dark' as const,
      radius: 'pill' as const,
      density: 'normal' as const,
      color: {
        grayscale: {
          hue: 0,
          tint: 0 as const
        },
        accent: {
          primary: '#168aa2',
          level: 1 as const
        },
        surface: {
          background: '#242424',
          foreground: '#595654'
        }
      },
      typography: {
        baseSize: 16 as const,
        fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }
    },
    header: true as const,
    composer: {
      attachments: {
        enabled: true,
        maxCount: 5,
        maxSize: 10485760 // 10MB
      },
      placeholder: "What's the play today, champ? Ask about odds, builds parlays, or get the latest insights...",
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
        },
        {
          id: 'find_props',
          label: 'Find Player Props',
          icon: 'star',
          shortLabel: 'Props',
          placeholderOverride: 'Which players or prop types are you interested in?',
          pinned: true
        },
        {
          id: 'check_injuries',
          label: 'Injury Reports',
          icon: 'lifesaver',
          shortLabel: 'Injuries',
          placeholderOverride: 'Which teams should I check for injury updates?',
          pinned: false
        },
        {
          id: 'get_trends',
          label: 'Betting Trends',
          icon: 'chart',
          shortLabel: 'Trends',
          placeholderOverride: 'What trends or patterns should I analyze?',
          pinned: false
        }
      ],
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
        },
        {
          icon: 'chart',
          label: 'Show me betting trends',
          prompt: 'What are the current betting trends, line movements, and where is the smart money going?'
        },
        {
          icon: 'info',
          label: 'Any key injuries affecting bets?',
          prompt: 'Check for any significant injuries or lineup changes that could impact betting decisions today'
        }
      ],
    },
    widgets: {
      async onAction(action: any, item: any) {
        try {
          console.log('Widget action:', action.type, action.payload)
          
          // Send action to your custom widget handler
          const token = accessTokenRef.current
          if (!token) return
          
          await fetch('/api/chatkit/widget-action', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ action, itemId: item?.id })
          })
          
          // Show success feedback
          const actionLabels: { [key: string]: string } = {
            'add_to_betslip': '💰 Added to betslip!',
            'submit_parlay': '🔒 Parlay submitted!',
            'analyze_game': '📊 Analyzing game...',
            'refresh_odds': '🔄 Refreshing odds...'
          }
          
          const message = actionLabels[action.type] || '✅ Action completed'
          toast.success(message)
          
        } catch (error) {
          console.error('Widget action error:', error)
          toast.error('Action failed')
        }
      },
    }
  } as any), [user, profile])

  const { control } = useChatKit(options)

  useEffect(() => {
    console.log('🎯 ProfessorLockCustom mounting (Custom API mode)...')
    console.log('User:', user?.id)
    console.log('User Tier:', profile?.subscription_tier)
    
    const serverUrl = process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit'
    const domainKey = process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY || 'domain_pk_68ee8f22d84c8190afddda0c6ca72f7c0560633b5555ebb2'
    
    console.log('🐍 Custom API mode - Railway server')
    console.log('🔗 Server URL:', serverUrl)
    console.log('🔑 Domain Key:', domainKey.substring(0, 20) + '...')
    
    // Listen for ChatKit events for deeper debugging
    const handleError = (e: any) => {
      console.error('🚨 chatkit.error:', e.detail)
      setError(`ChatKit error: ${e.detail?.error?.message || 'Unknown error'}`)
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
    }

    window.addEventListener('chatkit.error', handleError as any)
    window.addEventListener('chatkit.log', handleLog as any)
    window.addEventListener('chatkit.response.start', handleStart as any)
    window.addEventListener('chatkit.response.end', handleEnd as any)
    window.addEventListener('chatkit.thread.change', handleThread as any)
    
    // Trigger onSessionStart when component mounts (Custom API has no "session")
    onSessionStart?.()
    
    return () => {
      console.log('🔌 ProfessorLockCustom unmounting')
      window.removeEventListener('chatkit.error', handleError as any)
      window.removeEventListener('chatkit.log', handleLog as any)
      window.removeEventListener('chatkit.response.start', handleStart as any)
      window.removeEventListener('chatkit.response.end', handleEnd as any)
      window.removeEventListener('chatkit.thread.change', handleThread as any)
      onSessionEnd?.()
    }
  }, [onSessionStart, onSessionEnd, user, profile])

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

  console.log('🎨 Rendering ProfessorLockCustom, control:', control ? 'Present' : 'Missing')

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
      
      {control ? (
        <>
          <div className="absolute top-3 right-3 z-10 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            ⚡ Live
          </div>
          <ChatKit control={control} className="w-full min-h-[600px]" />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-3 border-blue-500/20 border-t-blue-500 mx-auto"></div>
            <p className="text-lg text-slate-200 font-medium">Initializing Professor Lock...</p>
            <p className="text-xs text-slate-400 mt-2">Custom API Mode</p>
          </div>
        </div>
      )}
    </div>
  )
}
