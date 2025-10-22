"use client"

import { useMemo, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { ChatKit, useChatKit } from '@openai/chatkit-react'

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
  const { user, profile } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const serverUrl = process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit'
  const domainKey = process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY || 'domain_pk_68ee8f22d84c8190afddda0c6ca72f7c0560633b5555ebb2'

  const options = useMemo(() => {
    if (!user) return null

    console.log('🎯 Configuring ChatKit for Custom Backend')
    console.log('🐍 Server URL:', serverUrl)
    console.log('👤 User:', user.id, 'Tier:', profile?.subscription_tier)

    return {
      api: {
        url: serverUrl,
        domainKey: domainKey,
        fetch: (url: string, init?: RequestInit) => {
          const headers = {
            ...init?.headers,
            'X-User-Id': user.id || '',
            'X-User-Email': user.email || '',
            'X-User-Tier': profile?.subscription_tier || 'free',
          }
          console.log('🌐 ChatKit fetch:', url)
          return globalThis.fetch(url, { ...init, headers })
        },
      },
      theme: {
        colorScheme: 'dark' as const,
      },
      composer: {
        placeholder: "What's the play today, champ? Ask about odds, build parlays, or get insights...",
      },
      startScreen: {
        greeting: "🎯 Professor Lock is locked in! Let's find some winners, champ! 💰",
        prompts: [
          { label: "Today's best value bets", prompt: "Analyze today's games and give me top 3 confident picks", icon: 'star' as const },
          { label: 'Build me a 3-leg parlay', prompt: "Build a 3-leg parlay with strong value and reasonable risk", icon: 'write' as const },
          { label: 'Find hot player props', prompt: "Show the best player prop bets with strong value today", icon: 'bolt' as const },
        ],
      },
      onError: ({ error }: any) => {
        console.error('🚨 ChatKit error:', error)
        setError(error?.message || 'An error occurred')
      },
      onLog: ({ name, data }: any) => {
        console.log('🪵 ChatKit log:', name, data)
      },
      onResponseStart: () => {
        console.log('🟢 Response started')
      },
      onResponseEnd: () => {
        console.log('🟣 Response ended')
      },
    }
  }, [user, profile, serverUrl, domainKey])

  const { control } = useChatKit(options || {})

  useEffect(() => {
    if (user) {
      console.log('✅ ChatKit mounted with Custom Backend mode')
      onSessionStart?.()
    }
    return () => {
      onSessionEnd?.()
    }
  }, [user, onSessionStart, onSessionEnd])

  if (!user) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <p className="text-white/60">Please sign in to access Professor Lock</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ minHeight: '600px', height: '600px' }}
    >
      {error && (
        <div className="absolute top-3 right-3 z-10 text-xs px-3 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
          ⚠️ {error}
        </div>
      )}
      <div className="absolute top-3 right-3 z-10 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        ⚡ Custom API
      </div>
      <ChatKit control={control} className="w-full h-full" />
    </div>
  )
}
