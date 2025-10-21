"use client"

import { useEffect, useRef, useState } from 'react'
import { ChatKit, useChatKit } from '@openai/chatkit-react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { toast } from 'react-hot-toast'

interface ProfessorLockCustomProps {
  className?: string
  onSessionStart?: () => void
  onSessionEnd?: () => void
}

export default function ProfessorLockCustom({ 
  className = "h-[600px] w-full",
  onSessionStart,
  onSessionEnd
}: ProfessorLockCustomProps) {
  const { user, profile, session } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)

  // Enhanced ChatKit configuration for Professor Lock custom server
  const options = {
    api: {
      async getClientSecret(existing: any) {
        try {
          if (existing) {
            console.log('Refreshing Professor Lock session...')
          }

          const token = session?.access_token
          
          if (!token) {
            throw new Error('No access token available')
          }
          
          // Use custom session endpoint for Professor Lock server
          const res = await fetch('/api/chatkit/custom-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          })

          if (!res.ok) {
            const errorData = await res.json()
            throw new Error(errorData.error || 'Failed to get Professor Lock session')
          }

          const data = await res.json()
          setSessionData(data)
          onSessionStart?.()
          
          return data.client_secret
        } catch (error) {
          console.error('Professor Lock session error:', error)
          setError('Failed to connect to Professor Lock')
          throw error
        }
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
    startScreen: {
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
          const token = session?.access_token
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
  } as any

  const { control } = useChatKit(options)

  useEffect(() => {
    // Load ChatKit script
    if (!document.querySelector('script[src*="chatkit.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js'
      script.async = true
      script.onload = () => setIsLoading(false)
      script.onerror = () => {
        setError('Failed to load ChatKit')
        setIsLoading(false)
      }
      document.head.appendChild(script)
    } else {
      setIsLoading(false)
    }

    return () => {
      onSessionEnd?.()
    }
  }, [onSessionEnd])

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

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto"></div>
          <p className="text-lg text-slate-300 mb-2">Loading Professor Lock...</p>
          <p className="text-sm text-slate-500">Preparing your betting analysis tools</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <p className="mb-4 text-lg text-red-400">{error}</p>
          <button 
            onClick={() => {
              setError(null)
              setIsLoading(true)
              window.location.reload()
            }} 
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="chatkit-container rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-xl">
      {/* Professor Lock Status Bar */}
      {sessionData && (
        <div className="p-3 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-slate-300">
                🎯 Professor Lock • <span className="capitalize">{profile?.subscription_tier || 'free'} tier</span>
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>🔧 Advanced Tools</span>
              <span>📊 Live Widgets</span>
              <span>💰 Parlay Builder</span>
            </div>
          </div>
        </div>
      )}
      
      <ChatKit control={control} className={className} />
    </div>
  )
}
