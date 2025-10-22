"use client"

import { useEffect, useRef, useState } from 'react'
import { ChatKit, useChatKit } from '@openai/chatkit-react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { toast } from 'react-hot-toast'

// Import the types for proper typing
declare global {
  interface Window {
    chatkit?: any
  }
}

interface ChatKitProfessorLockProps {
  className?: string
  onSessionStart?: () => void
  onSessionEnd?: () => void
}

export default function ChatKitProfessorLock({ 
  className = "h-[600px] w-full",
  onSessionStart,
  onSessionEnd
}: ChatKitProfessorLockProps) {
  const { user, profile, session } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ChatKit configuration pointing to your Python server on Railway  
  const options = {
    api: {
      // Point directly to your Python ChatKit server
      url: process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit',
      
      // Simple client secret - just return user ID since you control the server
      async getClientSecret(existing: any) {
        try {
          if (existing) {
            console.log('Reusing existing session')
            return existing
          }

          if (!user?.id) {
            throw new Error('No user logged in')
          }
          
          // For self-hosted, the "secret" can just be your user ID
          // Your Python server will get this in requests and can validate
          const clientSecret = `user_${user.id}_${Date.now()}`
          
          console.log('🔐 Created client secret for self-hosted ChatKit:', clientSecret.substring(0, 20) + '...')
          onSessionStart?.()
          
          return clientSecret
        } catch (error) {
          console.error('ChatKit session error:', error)
          setError('Failed to connect to Professor Lock')
          throw error
        }
      },
      
      // Add custom headers to pass user context to your server
      async fetch(url: string, init?: RequestInit) {
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
        fontFamily: '"OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace',
        fontSources: [
          {
            family: 'OpenAI Sans',
            src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Regular.woff2',
            weight: 400,
            style: 'normal' as const,
            display: 'swap' as const
          },
          {
            family: 'OpenAI Sans',
            src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Medium.woff2',
            weight: 500,
            style: 'normal' as const,
            display: 'swap' as const
          },
          {
            family: 'OpenAI Sans',
            src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-SemiBold.woff2',
            weight: 600,
            style: 'normal' as const,
            display: 'swap' as const
          },
          {
            family: 'OpenAI Sans',
            src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Bold.woff2',
            weight: 700,
            style: 'normal' as const,
            display: 'swap' as const
          }
        ]
      }
    },
    composer: {
      attachments: {
        enabled: true,
        maxCount: 5,
        maxSize: 10485760 // 10MB
      },
      placeholder: "Ask about games, odds, injuries, or build a parlay...",
      tools: [
        {
          id: 'odds_lookup',
          label: 'Find Odds',
          icon: 'search',
          shortLabel: 'Odds',
          placeholderOverride: 'Which game or bet type are you looking for?',
          pinned: true
        },
        {
          id: 'parlay_builder',
          label: 'Build Parlay',
          icon: 'sparkle',
          shortLabel: 'Parlay',
          placeholderOverride: 'Describe the legs you want to add',
          pinned: true
        },
        {
          id: 'player_stats',
          label: 'Player Stats',
          icon: 'profile-card',
          shortLabel: 'Stats',
          placeholderOverride: 'Which players are you interested in?',
          pinned: false
        },
        {
          id: 'injury_report',
          label: 'Check Injuries',
          icon: 'lifesaver',
          shortLabel: 'Injuries',
          placeholderOverride: 'Which team\'s injury report?',
          pinned: false
        },
        {
          id: 'general',
          label: 'Ask Anything',
          icon: 'write-alt',
          shortLabel: 'Ask',
          placeholderOverride: 'What would you like to know?',
          pinned: false
        }
      ],
    },
    startScreen: {
      greeting: 'Let\'s cash in some plays! 💰',
      prompts: [
        {
          icon: 'star-filled',
          label: 'What are today\'s best bets?',
          prompt: 'Analyze today\'s MLB and WNBA games and give me your top 3 confident picks',
        },
        {
          icon: 'plus',
          label: 'Build me a smart parlay',
          prompt: 'Build me a 3-leg parlay with good value and reasonable risk for tonight\'s games',
        },
        {
          icon: 'bolt',
          label: 'Hot player props tonight?',
          prompt: 'Which player props offer the best value tonight? Focus on hits and points',
        },
        {
          icon: 'info',
          label: 'Any injury concerns?',
          prompt: 'Are there any significant injuries affecting tonight\'s games I should know about?',
        },
        {
          icon: 'chart',
          label: 'Betting trends today',
          prompt: 'What are the sharp money trends and public betting percentages for today?',
        }
      ],
    },
    entities: {
      async onTagSearch(query: any) {
        try {
          // Search for players, teams, props, etc. based on query
          const results = []
          
          // Example: Add mock results (replace with actual API calls)
          if (query && query.length > 2) {
            results.push(
              {
                id: "team_example", 
                title: "Example Team", 
                group: "Teams", 
                interactive: true,
              },
              {
                id: "player_example", 
                title: "Example Player", 
                group: "Players", 
                interactive: true,
              }
            )
          }
          
          return results
        } catch (error) {
          console.error('Entity search error:', error)
          return []
        }
      },
      // Removed onTagSelect - not a valid property
    }
  } as any

  const { control } = useChatKit(options)

  useEffect(() => {
    // For self-hosted ChatKit, we don't need to load external script
    // The @openai/chatkit-react package handles everything
    console.log('🐍 Using self-hosted ChatKit - no external script needed')
    setIsLoading(false)

    return () => {
      onSessionEnd?.()
    }
  }, [onSessionEnd])

  if (!user) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <p className="text-lg text-slate-300">Please log in to use Professor Lock</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
          <p className="text-lg text-slate-300">Loading Professor Lock...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <p className="mb-4 text-lg text-red-400">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="chatkit-container rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-xl">
      <ChatKit control={control} className={className} />
    </div>
  )
}

