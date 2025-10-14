"use client"

import { useEffect, useRef, useState } from 'react'
import { ChatKit, useChatKit } from '@openai/chatkit-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import type { ChatKitOptions } from '@openai/chatkit'

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
  const options: ChatKitOptions = {
    api: {
      async getClientSecret(existing) {
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
      colorScheme: 'dark',
      radius: 'pill',
      density: 'normal',
      color: {
        grayscale: {
          hue: 0,
          tint: 0
        },
        accent: {
          primary: '#168aa2',
          level: 1
        },
        surface: {
          background: '#242424',
          foreground: '#595654'
        }
      },
      typography: {
        baseSize: 16,
        fontFamily: '"OpenAI Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
        fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace',
        fontSources: [
          {
            family: 'OpenAI Sans',
            src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Regular.woff2',
            weight: 400,
            style: 'normal',
            display: 'swap'
          },
          {
            family: 'OpenAI Sans',
            src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Medium.woff2',
            weight: 500,
            style: 'normal',
            display: 'swap'
          },
          {
            family: 'OpenAI Sans',
            src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-SemiBold.woff2',
            weight: 600,
            style: 'normal',
            display: 'swap'
          },
          {
            family: 'OpenAI Sans',
            src: 'https://cdn.openai.com/common/fonts/openai-sans/v2/OpenAISans-Bold.woff2',
            weight: 700,
            style: 'normal',
            display: 'swap'
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
          id: 'analyze_games',
          label: 'Analyze Today\'s Games',
          shortLabel: 'Games',
          placeholderOverride: 'Which games should I analyze?',
          icon: 'sparkle-double',
          pinned: true
        },
        {
          id: 'build_parlay',
          label: 'Build Smart Parlay',
          shortLabel: 'Parlay',
          placeholderOverride: 'What risk level for your parlay?',
          icon: 'sparkle',
          pinned: true
        },
        {
          id: 'player_props',
          label: 'Find Player Props',
          shortLabel: 'Props',
          placeholderOverride: 'Which players are you interested in?',
          icon: 'user',
          pinned: false
        },
        {
          id: 'injury_report',
          label: 'Check Injuries',
          shortLabel: 'Injuries',
          placeholderOverride: 'Which team\'s injury report?',
          icon: 'sparkle',
          pinned: false
        }
      ],
    },
    startScreen: {
      greeting: 'Let\'s cash in some plays! 💰',
      prompts: [
        {
          icon: 'sparkle-double',
          label: 'What are today\'s best bets?',
          prompt: 'Analyze today\'s MLB and WNBA games and give me your top 3 confident picks'
        },
        {
          icon: 'sparkle',
          label: 'Build me a smart parlay',
          prompt: 'Build me a 3-leg parlay with good value and reasonable risk for tonight\'s games'
        },
        {
          icon: 'user',
          label: 'Hot player props tonight?',
          prompt: 'Which player props offer the best value tonight? Focus on hits and points'
        },
        {
          icon: 'circle-question',
          label: 'Any injury concerns?',
          prompt: 'Are there any significant injuries affecting tonight\'s games I should know about?'
        },
        {
          icon: 'sparkle',
          label: 'Betting trends today',
          prompt: 'What are the sharp money trends and public betting percentages for today?'
        }
      ],
    },
    entities: {
      async onTagSearch(query) {
        // Search for players, teams, games
        try {
          const results = []
          
          // Search players
          if (query.length > 1) {
            // You can implement actual player search from your Supabase
            results.push(
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
      onClick: (entity) => {
        // Handle entity clicks (navigate to player/team page, etc.)
        console.log('Entity clicked:', entity)
      },
    },
    widgets: {
      async onAction(action, item) {
        // Handle widget actions
        console.log('Widget action:', action, item)
        
        // Send to your backend to process
        await fetch('/api/chatkit/widget-action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, itemId: item?.id }),
        })
      },
    }
  }

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
