"use client"

import { useMemo } from 'react'
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

  const serverUrl = useMemo(
    () => process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit',
    []
  )
  const domainKey = useMemo(
    () => process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY || 'domain_pk_68ee8f22d84c8190afddda0c6ca72f7c0560633b5555ebb2',
    []
  )

  const options = useMemo(() => ({
    api: {
      url: serverUrl,
      domainKey,
      fetch: async (url: string, init?: RequestInit) => {
        const headers = {
          ...init?.headers,
          'X-User-Id': user?.id || '',
          'X-User-Email': user?.email || '',
          'X-User-Tier': profile?.subscription_tier || 'free',
        }
        return fetch(url, { ...init, headers })
      },
    },
    header: true as const,
    theme: {
      colorScheme: 'dark' as const,
      radius: 'pill' as const,
      density: 'normal' as const,
      color: {
        grayscale: { hue: 0, tint: 0 as const },
        accent: { primary: '#168aa2', level: 1 as const },
        surface: { background: '#242424', foreground: '#595654' },
      },
      typography: {
        baseSize: 16 as const,
        fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      },
    },
    composer: {
      attachments: { enabled: true, maxCount: 5, maxSize: 10485760 },
      placeholder: "What's the play today, champ? Ask about odds, build parlays, or get the latest insights...",
      tools: [
        {
          id: 'analyze_games',
          label: "Analyze Today's Games",
          icon: 'analytics',
          shortLabel: 'Games',
          placeholderOverride: 'Which sport or specific games should I analyze?',
          pinned: true,
        },
        {
          id: 'build_parlay',
          label: 'Build Smart Parlay',
          icon: 'sparkle',
          shortLabel: 'Parlay',
          placeholderOverride: 'Tell me your preferred legs or let me suggest a parlay',
          pinned: true,
        },
      ],
    },
    startScreen: {
      greeting: "🎯 Professor Lock is locked in! Let's find some winners, champ! 💰",
      prompts: [
        {
          icon: 'star-filled',
          label: "What are today's best value bets?",
          prompt: "Analyze today's games across all sports and give me your top 3 confident picks with the best value",
        },
        {
          icon: 'plus',
          label: 'Build me a 3-leg parlay',
          prompt: "Create a 3-leg parlay with solid confidence levels and good payout potential for tonight's games",
        },
        {
          icon: 'bolt',
          label: 'Find hot player props',
          prompt: "Show me the best player prop bets with strong value and high confidence for today's slate",
        },
      ],
    },
  }) as any, [serverUrl, domainKey, user?.id, user?.email, profile?.subscription_tier])

  const { control } = useChatKit(options)

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight: '600px', height: '600px' }}
    >
      <div className="absolute top-3 right-3 z-10 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        ⚡ Live
      </div>
      <div className="w-full h-full rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-xl">
        <ChatKit control={control} className="w-full h-full" />
      </div>
    </div>
  )
}
