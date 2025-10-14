"use client"

import { useEffect, useState } from 'react'
import { ChatKit, useChatKit as useChatKitReact } from '@openai/chatkit-react'
import { useAuth } from '@/contexts/AuthContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquarePlus, History, Trash2, Archive } from 'lucide-react'

interface Conversation {
  id: string
  session_id: string
  title: string
  last_message: string
  message_count: number
  is_active: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export default function ProfessorLockChatKitV2() {
  const { user, profile } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [showConversations, setShowConversations] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const supabase = createClientComponentClient()

  const tier = profile?.subscription_tier || 'free'
  const isElite = tier === 'elite'
  const isPro = tier === 'pro' || isElite

  // Load existing conversations
  useEffect(() => {
    if (!user?.id) return
    loadConversations()
  }, [user?.id])

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chatkit_conversations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })

      if (!error && data) {
        setConversations(data)
        // Auto-select the most recent conversation or create new if none exist
        if (data.length > 0 && !activeConversationId) {
          setActiveConversationId(data[0].id)
        } else if (data.length === 0) {
          createNewConversation()
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err)
    }
  }

  const createNewConversation = async () => {
    if (isCreatingNew) return
    setIsCreatingNew(true)
    
    try {
      // Create new ChatKit session
      const res = await fetch('/api/chatkit/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          tier,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to create session')
      
      const { session_id, client_secret } = await res.json()
      
      // Save to database
      const { data, error } = await supabase
        .from('chatkit_conversations')
        .insert({
          user_id: user?.id,
          session_id,
          title: 'New Chat',
          last_message: '',
          message_count: 0,
        })
        .select()
        .single()

      if (!error && data) {
        setConversations(prev => [data, ...prev])
        setActiveConversationId(data.id)
      }
    } catch (err) {
      console.error('Failed to create conversation:', err)
      toast.error('Failed to start new conversation')
    } finally {
      setIsCreatingNew(false)
    }
  }

  const archiveConversation = async (convId: string) => {
    try {
      await supabase
        .from('chatkit_conversations')
        .update({ is_archived: true })
        .eq('id', convId)

      setConversations(prev => prev.filter(c => c.id !== convId))
      if (activeConversationId === convId) {
        const remaining = conversations.filter(c => c.id !== convId)
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id)
        } else {
          createNewConversation()
        }
      }
      toast.success('Conversation archived')
    } catch (err) {
      toast.error('Failed to archive conversation')
    }
  }

  // Get current conversation's session
  const activeConversation = conversations.find(c => c.id === activeConversationId)
  
  // Use ChatKit React hook for the active session
  const { control } = useChatKitReact({
    api: {
      async getClientSecret(existing) {
        if (existing && activeConversation) {
          // Use existing session if available
          return existing
        }

        // Get or create session for active conversation
        if (activeConversation) {
          try {
            // First try to get existing session from our backend
            const { data: sessionData } = await supabase
              .from('chatkit_sessions')
              .select('client_secret')
              .eq('session_id', activeConversation.session_id)
              .single()

            if (sessionData?.client_secret) {
              return sessionData.client_secret
            }

            // If not found, create new session
            const res = await fetch('/api/chatkit/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user?.id,
                tier,
                sessionId: activeConversation.session_id, // Reuse existing session ID if possible
              }),
            })
            
            if (!res.ok) throw new Error('Failed to get session')
            
            const { client_secret } = await res.json()
            return client_secret
          } catch (err) {
            console.error('Session error:', err)
            throw err
          }
        }

        // Create new session if no active conversation
        const res = await fetch('/api/chatkit/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            tier,
          }),
        })
        
        if (!res.ok) throw new Error('Failed to create session')
        
        const { client_secret } = await res.json()
        return client_secret
      },
    },
    theme: {
      colorScheme: 'dark',
      color: {
        accent: {
          primary: isElite ? '#FFD700' : isPro ? '#00E5FF' : '#8B5CF6',
          level: 2
        }
      },
      radius: 'round',
      density: 'normal',
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }
    },
    composer: {
      placeholder: isElite 
        ? 'Ask Professor Lock Elite anything...' 
        : isPro 
          ? 'Ask about picks, parlays, or strategies...'
          : 'Ask your betting question...',
    },
    startScreen: {
      greeting: isElite 
        ? '🏆 Welcome to Professor Lock Elite!\n\nYou have access to advanced analytics, real-time data, and exclusive betting insights.'
        : isPro
          ? '🎯 Hey champ! Ready to build some winning parlays?\n\nI can help you analyze games, find value bets, and create smart betting strategies.'
          : '👋 Welcome to Professor Lock!\n\nI\'m here to help with your sports betting questions and analysis.',
      prompts: [
        { 
          label: 'Today\'s Best Bets',
          prompt: 'What are your top 5 picks for today across all sports?',
        },
        { 
          label: 'Build a Parlay',
          prompt: 'Help me build a smart 3-leg parlay with good value',
        },
        { 
          label: 'Game Analysis',
          prompt: 'Give me a detailed breakdown of tonight\'s biggest game',
        },
        ...(isPro ? [
          { 
            label: 'Player Props',
            prompt: 'What are the best player prop bets for tonight?',
          },
        ] : []),
        ...(isElite ? [
          { 
            label: 'Elite Lock',
            prompt: 'Give me your highest confidence Elite Lock for today',
          },
          { 
            label: 'Live Betting',
            prompt: 'What live betting opportunities should I watch for?',
          },
        ] : []),
      ]
    },
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[600px] rounded-2xl border border-white/10 bg-slate-950">
        <p className="text-slate-400">Please sign in to use Professor Lock AI</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Conversation Sidebar - Only for Pro/Elite users */}
      {isPro && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setShowConversations(!showConversations)}
            className="p-2 rounded-lg bg-slate-800/80 backdrop-blur border border-white/10 hover:bg-slate-700/80 transition-colors"
          >
            <History className="h-5 w-5 text-white" />
          </button>

          <AnimatePresence>
            {showConversations && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute top-12 left-0 w-72 max-h-[500px] overflow-y-auto rounded-xl bg-slate-900 border border-white/10 shadow-2xl"
              >
                {/* New Conversation Button */}
                <button
                  onClick={() => {
                    createNewConversation()
                    setShowConversations(false)
                  }}
                  disabled={isCreatingNew}
                  className="w-full p-3 flex items-center gap-2 text-left hover:bg-slate-800 border-b border-white/10 transition-colors"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  <span>New Conversation</span>
                </button>

                {/* Conversation List */}
                <div className="p-2">
                  {conversations.length === 0 ? (
                    <p className="text-sm text-slate-500 p-3 text-center">No conversations yet</p>
                  ) : (
                    conversations.map(conv => (
                      <div
                        key={conv.id}
                        className={`group relative p-3 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors ${
                          activeConversationId === conv.id ? 'bg-slate-800' : ''
                        }`}
                        onClick={() => {
                          setActiveConversationId(conv.id)
                          setShowConversations(false)
                        }}
                      >
                        <div className="pr-8">
                          <p className="font-medium text-sm text-white truncate">
                            {conv.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-1">
                            {conv.last_message || 'Empty conversation'}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {/* Archive button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            archiveConversation(conv.id)
                          }}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-700 rounded"
                        >
                          <Archive className="h-4 w-4 text-slate-400" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Main ChatKit Container - Clean, no wrapper */}
      <div className="h-[700px] rounded-2xl border border-white/10 bg-slate-950 overflow-hidden">
        <ChatKit control={control} className="h-full w-full" />
      </div>

      {/* Tier Indicator */}
      <div className="mt-4 flex justify-center">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
          isElite 
            ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' 
            : isPro 
              ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
              : 'border-purple-500/30 bg-purple-500/10 text-purple-400'
        }`}>
          <span className="text-sm font-medium">
            {isElite ? '👑 Elite' : isPro ? '⭐ Pro' : '🎯 Free'} Member
          </span>
        </div>
      </div>
    </div>
  )
}
