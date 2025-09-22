'use client'

import React, { useMemo } from 'react'
import { CopilotPopup, useCopilotAction } from '@copilotkit/react-ui'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'

export default function ProfessorLockPage() {
  const { subscriptionTier } = useSubscription()
  const isPro = subscriptionTier !== 'free'

  // Example action: show top picks from ai_predictions
  useCopilotAction({
    name: 'showTopPicks',
    description: 'Show recent top AI picks from ai_predictions',
    parameters: [
      { name: 'limit', type: 'number', description: 'How many picks to show', required: false },
    ],
    render: ({ status, args, result }) => {
      const items = (result as any[]) || []
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {status === 'executing' && (
            <div className="animate-pulse h-24 rounded-xl bg-white/5 border border-white/10" />
          )}
          {items.map((p, idx) => (
            <div key={idx} className="rounded-xl bg-white/5 border border-white/10 p-4">
              <div className="text-sm text-blue-200">{p.sport} • {new Date(p.event_time).toLocaleString()}</div>
              <div className="text-white font-semibold mt-1">{p.match_teams}</div>
              <div className="text-purple-300 mt-1">Pick: {p.pick} • Odds: {p.odds}</div>
              {p.confidence != null && (
                <div className="mt-2 text-xs text-gray-300">Confidence: {Math.round(p.confidence)}%</div>
              )}
              {p.reasoning && (
                <div className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">{p.reasoning}</div>
              )}
            </div>
          ))}
        </div>
      )
    },
    handler: async ({ limit = 6 }) => {
      const { data, error } = await supabase
        .from('ai_predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data || []
    },
  })

  const instructions = useMemo(() => (
    `You are Professor Lock, an elite AI betting expert. Be concise, cite tools you used when relevant (web, odds, picks, insights). Offer quick actions like Top Picks, Smart Parlay, Sharp Money, and Odds Check. Respect user tier: ${subscriptionTier}.`
  ), [subscriptionTier])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-blue-900/40 to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
            Professor Lock
            <span className="ml-3 text-xs md:text-sm px-2 py-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">{isPro ? 'Pro Access' : 'Free'}</span>
          </h1>
          <p className="text-blue-200 mt-1">AI Sports Betting Expert</p>
        </motion.div>

        <CopilotPopup 
          instructions={instructions}
          labels={{ title: 'Professor Lock', initial: 'Ask about picks, parlays, odds, or trends…' }}
        />
      </div>
    </div>
  )
}


