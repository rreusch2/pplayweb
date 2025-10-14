"use client"

import { useEffect } from 'react'
import { ChatKit, useChatKit as useChatKitReact } from '@openai/chatkit-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function ProfessorLockSimple() {
  const { user, profile } = useAuth()
  
  const tier = profile?.subscription_tier || 'free'
  const isElite = tier === 'elite'
  const isPro = tier === 'pro' || isElite

  // Use ChatKit React hook - automatically creates session on mount
  const { control } = useChatKitReact({
    api: {
      async getClientSecret() {
        if (!user?.id) {
          throw new Error('User not authenticated')
        }

        try {
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
          
          if (!res.ok) {
            const error = await res.json()
            console.error('ChatKit session error:', error)
            throw new Error(error.error || 'Failed to create session')
          }
          
          const { client_secret } = await res.json()
          return client_secret
        } catch (err) {
          console.error('Failed to get client secret:', err)
          toast.error('Failed to connect to AI assistant')
          throw err
        }
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
    },
    composer: {
      placeholder: isElite 
        ? '👑 Ask Professor Lock Elite anything...' 
        : isPro 
          ? '🎯 Ask about picks, parlays, or strategies...'
          : '💬 Ask your betting question...',
    },
    startScreen: {
      greeting: isElite 
        ? '🏆 Welcome to Professor Lock Elite!\n\nI have access to advanced analytics, real-time data, and exclusive betting insights. Ask me anything about sports betting, parlays, or player props.'
        : isPro
          ? '🎯 Hey champ! Ready to make some smart bets?\n\nI can help you analyze games, find value bets, and build winning parlays. What would you like to explore today?'
          : '👋 Welcome to Professor Lock!\n\nI\'m here to help with your sports betting questions. Ask me about games, odds, or betting strategies.',
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
        { 
          label: 'Player Props',
          prompt: 'What are the best player prop bets for tonight?',
        },
        ...(isElite ? [
          { 
            label: 'Elite Insights',
            prompt: 'Show me exclusive data-driven picks with the highest win probability',
          },
        ] : []),
      ]
    },
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[600px] rounded-xl bg-slate-950/50 border border-white/10">
        <div className="text-center p-8">
          <p className="text-lg text-slate-300 mb-4">Sign in to access Professor Lock AI</p>
          <p className="text-sm text-slate-500">Get expert betting insights and analysis</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* ChatKit takes full width and height - it has its own resize controls */}
      <ChatKit control={control} className="min-h-[600px] max-h-[85vh]" />
    </div>
  )
}
