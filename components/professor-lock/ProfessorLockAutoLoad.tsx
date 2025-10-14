"use client"

import { useEffect, useState } from 'react'
import { ChatKit, useChatKit as useChatKitReact } from '@openai/chatkit-react'
import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function ProfessorLockAutoLoad() {
  const { user, profile } = useAuth()
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isDebugMode, setIsDebugMode] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  const tier = profile?.subscription_tier || 'free'
  const isElite = tier === 'elite'
  const isPro = tier === 'pro' || isElite

  // Test configuration on mount (only in development)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      fetch('/api/chatkit/test')
        .then(res => res.json())
        .then(data => {
          setDebugInfo(data)
          if (!data.configuration.hasApiKey || !data.configuration.hasWorkflowId) {
            setSessionError('ChatKit not configured. Check console for details.')
            console.error('ChatKit Configuration:', data)
          }
        })
        .catch(err => console.error('Config test failed:', err))
    }
  }, [])

  // Use ChatKit React hook with auto-initialization
  const { control } = useChatKitReact({
    api: {
      async getClientSecret() {
        setSessionError(null)
        
        if (!user?.id) {
          const error = 'Please sign in to use Professor Lock AI'
          setSessionError(error)
          throw new Error(error)
        }

        try {
          console.log('Creating ChatKit session for user:', user.id)
          
          const res = await fetch('/api/chatkit/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              tier,
            }),
          })
          
          const data = await res.json()
          
          if (!res.ok) {
            console.error('Session creation failed:', data)
            const errorMsg = data.details || data.error || 'Failed to create session'
            setSessionError(errorMsg)
            
            // Show more helpful error messages
            if (res.status === 401) {
              throw new Error('Authentication failed. Please sign in again.')
            } else if (res.status === 500 && data.details?.includes('workflow')) {
              throw new Error('ChatKit workflow not found. Please check your configuration.')
            } else if (res.status === 500 && data.details?.includes('API key')) {
              throw new Error('Invalid OpenAI API key. Please check your configuration.')
            }
            throw new Error(errorMsg)
          }
          
          if (!data.client_secret) {
            throw new Error('No client secret received from server')
          }
          
          console.log('ChatKit session created successfully:', data.session_id)
          return data.client_secret
        } catch (err: any) {
          console.error('ChatKit initialization error:', err)
          setSessionError(err.message || 'Failed to connect to AI assistant')
          throw err
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
          tint: 0,
        },
        accent: {
          primary: '#168aa2',
          level: 1,
        },
        surface: {
          background: '#242424',
          foreground: '#595654',
        },
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
            display: 'swap',
          },
        ],
      },
    },
    composer: {
      attachments: {
        enabled: true,
        maxCount: 5,
        maxSize: 10485760,
      },
      tools: [
        {
          id: 'create_theme',
          label: 'Create theme',
          shortLabel: 'Theme',
          placeholderOverride: 'Describe your chat application',
          icon: 'sparkle-double',
          pinned: false,
        },
      ],
    },
    startScreen: {
      greeting: "Let's cash in some plays!",
      prompts: [
        {
          icon: 'circle-question',
          label: 'What is ChatKit?',
          prompt: 'What is ChatKit?',
        },
      ],
    },
  })

  // Show debug panel in development
  const showDebugPanel = isDebugMode && debugInfo && typeof window !== 'undefined' && window.location.hostname === 'localhost'

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[600px] rounded-xl bg-slate-950/80 backdrop-blur border border-white/10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <AlertCircle className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <p className="text-lg text-slate-200 mb-2">Sign in to access Professor Lock AI</p>
          <p className="text-sm text-slate-400">Get expert betting insights powered by AI</p>
        </motion.div>
      </div>
    )
  }

  if (sessionError) {
    return (
      <div className="flex items-center justify-center min-h-[600px] rounded-xl bg-slate-950/80 backdrop-blur border border-red-500/20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 max-w-md"
        >
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-lg text-red-300 mb-2">Connection Error</p>
          <p className="text-sm text-slate-400 mb-4">{sessionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Retry Connection
          </button>
          
          {/* Debug toggle for development */}
          {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
            <button
              onClick={() => setIsDebugMode(!isDebugMode)}
              className="ml-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
            >
              {isDebugMode ? 'Hide' : 'Show'} Debug Info
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Debug Panel - Only in development */}
      {showDebugPanel && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 rounded-lg bg-slate-900/90 border border-yellow-500/30 text-xs font-mono"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-400 font-bold">Debug Info</span>
            <button
              onClick={() => setIsDebugMode(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-slate-300">
            <div>API Key: {debugInfo.configuration.hasApiKey ? '✅ Set' : '❌ Missing'}</div>
            <div>Workflow ID: {debugInfo.configuration.hasWorkflowId ? `✅ ${debugInfo.configuration.workflowId}` : '❌ Missing'}</div>
            <div>API Test: {debugInfo.apiTest.success ? '✅ Connected' : `❌ ${debugInfo.apiTest.message}`}</div>
            {debugInfo.apiTest.details && (
              <div>ChatKit: {debugInfo.apiTest.details.chatkitWorking ? '✅ Working' : `❌ ${debugInfo.apiTest.details.error || 'Failed'}`}</div>
            )}
          </div>
        </motion.div>
      )}

      {/* Main ChatKit Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {/* ChatKit with its native features - resizable, full-featured */}
        <ChatKit control={control} className="min-h-[600px] max-h-[85vh]" />
      </motion.div>

    </div>
  )
}
