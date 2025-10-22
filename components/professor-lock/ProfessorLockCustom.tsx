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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [connectionAttempted, setConnectionAttempted] = useState(false)
  
  // Store callbacks and values in refs to prevent unnecessary re-renders
  const accessTokenRef = useRef(session?.access_token)
  const onSessionStartRef = useRef(onSessionStart)
  const clientSecretRef = useRef<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const inflightSecretRef = useRef<Promise<string> | null>(null)
  
  useEffect(() => {
    accessTokenRef.current = session?.access_token
    onSessionStartRef.current = onSessionStart
  }, [session?.access_token, onSessionStart])

  // CRITICAL: Memoize getClientSecret and options to prevent ChatKit from reinitializing
  // on every render, which causes the component to mount/unmount repeatedly
  const getClientSecret = useCallback(async (existing: any) => {
    console.log('🔑 getClientSecret called, existing:', existing ? 'YES' : 'NO')
    // Local cache guard: if we already have a client secret, reuse it
    if (clientSecretRef.current) {
      console.log('♻️ Using cached client_secret - NO SERVER CALL')
      return clientSecretRef.current
    }

    // If a request is already in-flight, await and return the same promise
    if (inflightSecretRef.current) {
      console.log('⏳ Reusing in-flight client_secret request')
      return inflightSecretRef.current
    }
    
    try {
      setConnectionAttempted(true)
      
      if (existing) {
        console.log('♻️ Reusing existing Professor Lock session - NO NEW SESSION CREATED')
        clientSecretRef.current = existing
        return existing
      }

      const token = accessTokenRef.current
      
      if (!token) {
        const errorMsg = 'No access token available. Please refresh the page.'
        setError(errorMsg)
        throw new Error(errorMsg)
      }
      
      console.log('🛰 Requesting OpenAI ChatKit session (server stores/reuses in DB)...')
      
      // Use OpenAI-hosted session endpoint (also persists in DB on server)
      inflightSecretRef.current = (async () => {
        const res = await fetch('/api/chatkit/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
          const errorMsg = errorData.error || `Server responded with status ${res.status}`
          console.error('❌ ChatKit session creation failed:', errorMsg)
          setError(`Connection failed: ${errorMsg}`)
          throw new Error(errorMsg)
        }

        const data = await res.json()
        console.log(`✅ OpenAI ChatKit session ready: ${data.session_id}`)
        setSessionData(data)
        setError(null)
        onSessionStartRef.current?.()
        
        // Cache for subsequent calls in this mount
        clientSecretRef.current = data.client_secret
        sessionIdRef.current = data.session_id
        return data.client_secret as string
      })()
      const result = await inflightSecretRef.current
      return result
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to connect to Professor Lock server'
      console.error('❌ Professor Lock session error:', error)
      setError(errorMsg)
      throw error
    }
    finally {
      inflightSecretRef.current = null
    }
  }, []) // Empty deps - function uses refs and doesn't need to be recreated

  // Memoize the entire options object to prevent ChatKit from reinitializing
  // Use supported options for chatkit-react v1: api.getClientSecret
  const options = useMemo(() => ({
    api: {
      getClientSecret,
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
  } as any), [getClientSecret])

  const { control } = useChatKit(options)

  useEffect(() => {
    console.log('🎯 ProfessorLockCustom mounting...')
    console.log('User:', user?.id)
    console.log('Session token:', session?.access_token ? 'Present' : 'Missing')
    
    // Load ChatKit script
    if (!document.querySelector('script[src*="chatkit.js"]')) {
      console.log('📦 Loading ChatKit script...')
      const script = document.createElement('script')
      script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js'
      script.async = true
      script.onload = () => {
        console.log('✅ ChatKit script loaded')
        setIsLoading(false)
      }
      script.onerror = () => {
        console.error('❌ Failed to load ChatKit script')
        setError('Failed to load ChatKit library')
        setIsLoading(false)
      }
      document.head.appendChild(script)
    } else {
      console.log('✅ ChatKit script already loaded')
      setIsLoading(false)
    }
    return () => {
      console.log('🔌 ProfessorLockCustom unmounting')
      onSessionEnd?.()
    }
  }, [onSessionEnd, user, session])

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

  if (error && connectionAttempted) {
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
            <p>• Check if PyKit server is running on Railway</p>
            <p>• Verify PROFESSOR_LOCK_SERVER_URL is correct</p>
            <p>• Check browser console for detailed errors</p>
          </div>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => {
                setError(null)
                setConnectionAttempted(false)
                setIsLoading(true)
                window.location.reload()
              }} 
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
            >
              Retry Connection
            </button>
            <button 
              onClick={() => {
                // Switch to standard ChatKit mode
                window.location.href = '/professor-lock?mode=standard'
              }} 
              className="rounded-lg bg-slate-600 px-4 py-2 text-white hover:bg-slate-700 transition-colors"
            >
              Use Standard Mode
            </button>
          </div>
        </div>
      </div>
    )
  }

  console.log('🎨 Rendering ProfessorLockCustom, control:', control ? 'Present' : 'Missing')

  return (
    <div
      className={`relative resize overflow-hidden ${className}`}
      style={{ width: 420, height: 600, minWidth: 320, minHeight: 420, maxHeight: '85vh' }}
    >
      {control ? (
        <ChatKit control={control} className="h-full w-full" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto"></div>
            <p className="text-lg text-slate-300">Initializing ChatKit...</p>
          </div>
        </div>
      )}
    </div>
  )
}
