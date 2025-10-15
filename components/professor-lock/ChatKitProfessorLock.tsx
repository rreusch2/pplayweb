"use client"

import { useEffect, useRef, useState } from 'react'
import { ChatKit, useChatKit } from '@openai/chatkit-react'
import { useAuth } from '@/contexts/AuthContext'
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

  // ChatKit configuration with your custom theme
  const options = {
    api: {
      async getClientSecret(existing: any) {
        try {
          if (existing) {
            // Implement session refresh logic
            console.log('Refreshing ChatKit session...')
          }

          const token = session?.access_token
          
          if (!token) {
            throw new Error('No access token available')
          }
          
          const res = await fetch('/api/chatkit/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          })

          if (!res.ok) {
            throw new Error('Failed to get ChatKit session')
          }

          const { client_secret } = await res.json()
          onSessionStart?.()
          return client_secret
        } catch (error) {
          console.error('ChatKit session error:', error)
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
          shortLabel: 'Odds',
          placeholderOverride: 'Which game or bet type are you looking for?',
          // Removed icon - causing runtime error
          pinned: true
        },
        {
          id: 'parlay_builder',
          label: 'Build Parlay',
          shortLabel: 'Parlay',
          placeholderOverride: 'Describe the legs you want to add',
          // Removed icon - causing runtime error
          pinned: true
        },
        {
          id: 'player_stats',
          label: 'Player Stats',
          shortLabel: 'Stats',
          placeholderOverride: 'Which players are you interested in?',
          // Removed icon - causing runtime error
          pinned: false
        },
        {
          id: 'injury_report',
          label: 'Check Injuries',
          shortLabel: 'Injuries',
          placeholderOverride: 'Which team\'s injury report?',
          // Removed icon - causing runtime error
          pinned: false
        }
      ],
    },
    startScreen: {
      greeting: 'Let\'s cash in some plays! 💰',
      prompts: [
        {
          icon: 'sparkle-double' as any,
          label: 'What are today\'s best bets?',
          prompt: 'Analyze today\'s MLB and WNBA games and give me your top 3 confident picks'
        },
        {
          icon: 'sparkle' as any,
          label: 'Build me a smart parlay',
          prompt: 'Build me a 3-leg parlay with good value and reasonable risk for tonight\'s games'
        },
        {
          icon: 'user' as any,
          label: 'Hot player props tonight?',
          prompt: 'Which player props offer the best value tonight? Focus on hits and points'
        },
        {
          icon: 'circle-question' as any,
          label: 'Any injury concerns?',
          prompt: 'Are there any significant injuries affecting tonight\'s games I should know about?'
        },
        {
          icon: 'sparkle' as any,
          label: 'Betting trends today',
          prompt: 'What are the sharp money trends and public betting percentages for today?'
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
