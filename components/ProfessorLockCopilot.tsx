'use client'
import { CopilotPopup } from '@copilotkit/react-ui'
import { useCopilotAction } from '@copilotkit/react-core'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useEffect, useMemo } from 'react'
import { aiService } from '@/shared/services/aiService'

interface ProfessorLockCopilotProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfessorLockCopilot({ isOpen, onClose }: ProfessorLockCopilotProps) {
  const { subscriptionTier } = useSubscription()

  const title = subscriptionTier === 'elite' ? 'Professor Lock Elite' : 'Professor Lock'

  const instructions = useMemo(() => (
    `You are ${title}, an expert AI sports betting assistant. Stay on-brand: sharp, confident, data-driven, concise. Use tools when helpful. Gate premium actions by tier.`
  ), [title])

  // Actions
  useCopilotAction({
    name: 'getDailyInsights',
    description: 'Fetch and display daily Professor Lock insights',
    parameters: [],
    handler: async () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://zooming-rebirth-production-a305.up.railway.app'
      const res = await fetch(`${backendUrl}/api/insights/daily-professor-lock`)
      const json = await res.json()
      if (!json?.success) throw new Error('Failed to fetch insights')
      const limit = subscriptionTier === 'elite' ? 12 : subscriptionTier === 'pro' ? 8 : 2
      return { insights: (json.insights || []).slice(0, limit) }
    }
  })

  useCopilotAction({
    name: 'getTodaysPicks',
    description: 'Fetch and display today\'s AI picks',
    parameters: [{ name: 'userId', type: 'string', required: false }],
    handler: async ({ userId }: any) => {
      const picks = await aiService.getTodaysPredictions(undefined, subscriptionTier)
      const limit = subscriptionTier === 'elite' ? 30 : subscriptionTier === 'pro' ? 20 : 2
      return { picks: picks.slice(0, limit) }
    }
  })

  useCopilotAction({
    name: 'liveOddsLookup',
    description: 'Lookup current odds for a matchup/team',
    parameters: [{ name: 'query', type: 'string', required: true }],
    handler: async ({ query }: any) => {
      if (subscriptionTier === 'free') {
        return { upgradeRequired: true, feature: 'live_odds' }
      }
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://zooming-rebirth-production-a305.up.railway.app'
      const url = `${backendUrl}/api/sports-events/search?query=${encodeURIComponent(query)}`
      const res = await fetch(url)
      const events = await res.json()
      return { events }
    }
  })

  useCopilotAction({
    name: 'teamAnalysis',
    description: 'Analyze team trends/performance',
    parameters: [
      { name: 'team', type: 'string', required: true },
      { name: 'sport', type: 'string', required: false }
    ],
    handler: async ({ team, sport }: any) => {
      if (subscriptionTier === 'free') {
        return { upgradeRequired: true, feature: 'team_analysis' }
      }
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'https://zooming-rebirth-production-a305.up.railway.app'
      const useSport = (sport || 'MLB').toUpperCase()
      const res = await fetch(`${backendUrl}/api/trends/summary/${encodeURIComponent(useSport)}?tier=pro`)
      const json = await res.json()
      // Optionally filter top trends mentioning the team name
      const lower = (team || '').toLowerCase()
      const top = json?.summary?.top_trends || []
      const filtered = lower ? top.filter((t: any) => JSON.stringify(t).toLowerCase().includes(lower)) : top
      return { summary: json?.summary || null, trends: filtered }
    }
  })

  // Close popup when parent requests
  useEffect(() => {
    if (!isOpen) {
      // CopilotPopup has internal open state; we rely on style to hide when closed
    }
  }, [isOpen])

  return (
    <div className={isOpen ? 'block' : 'hidden'}>
      <CopilotPopup
        instructions={instructions}
        labels={{ title, initial: 'Need any help?' }}
        className="[&_.ck-popup]:bg-gradient-to-br [&_.ck-popup]:from-gray-900 [&_.ck-popup]:via-blue-900/50 [&_.ck-popup]:to-gray-900 [&_.ck-popup]:border [&_.ck-popup]:border-white/10 [&_.ck-popup]:rounded-2xl"
      />
    </div>
  )
}


