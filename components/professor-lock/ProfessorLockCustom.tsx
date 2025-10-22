"use client"

import { useEffect, useRef, useState, useMemo } from 'react'
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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const accessTokenRef = useRef(session?.access_token)
  useEffect(() => {
    accessTokenRef.current = session?.access_token
  }, [session?.access_token])

  const options = useMemo(() => ({
    api: {
      url: process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit',
      domainKey: process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY || 'domain_pk_68ee8f22d84c8190afddda0c6ca72f7c0560633b5555ebb2',
      fetch: async (url: string, init?: RequestInit) => {
        const headers = {
          ...init?.headers,
          'X-User-Id': user?.id || '',
          'X-User-Email': user?.email || '',
          'X-User-Tier': profile?.subscription_tier || 'free',
        };
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
    console.log('🎯 ProfessorLockCustom mounting (self-hosted)...')
    console.log('User:', user?.id)
    
    console.log('🐍 Using self-hosted ChatKit - connecting to Railway server')
    console.log('🔗 ChatKit server URL:', process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit')
    setIsLoading(false)
    
    onSessionStart?.()
    
    const handleChatkitError = (e: any) => {
      console.error('🚨 ChatKit error event:', e.detail)
      const errorMessage = e.detail?.error?.message || 'An unknown error occurred. Check the server connection.';
      setError(`ChatKit error: ${errorMessage}`)
    }
    
    window.addEventListener('chatkit.error', handleChatkitError as any)
    
    return () => {
      console.log('🔌 ProfessorLockCustom unmounting')
      window.removeEventListener('chatkit.error', handleChatkitError as any)
      onSessionEnd?.()
    }
  }, [onSessionStart, onSessionEnd, user])

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
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/40 via-black/50 to-black/60">
        <div className="text-center max-w-md px-6">
          <div className="mb-4 text-6xl">⚠️</div>
          <h3 className="text-xl font-bold text-white mb-2">Connection Failed</h3>
          <p className="mb-4 text-sm text-red-300 bg-red-950/50 rounded-lg p-3 border border-red-500/30">
            {error}
          </p>
          <div className="mb-4 text-xs text-slate-400 space-y-1">
            <p>🔧 <strong>Troubleshooting:</strong></p>
            <p>• Check if the PyKit server is running on Railway.</p>
            <p>• Verify your environment variables are set correctly on Vercel.</p>
            <p>• Open the browser console for detailed errors.</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  console.log('🎨 Rendering ProfessorLockCustom, control:', control ? 'Present' : 'Missing')
  
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight: '600px', background: '#1a1a1a' }}
    >
      {control ? (
        <>
          <div className="absolute top-2 right-2 z-10 text-xs text-green-400 bg-black/50 px-2 py-1 rounded-full">
            ✅ Connected to Railway
          </div>
          <ChatKit control={control} className="h-full w-full" />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto"></div>
            <p className="text-lg text-slate-300">Connecting to Professor Lock...</p>
            <p className="text-xs text-slate-500 mt-2">Railway Server</p>
          </div>
        </div>
      )}
    </div>
  )
}
