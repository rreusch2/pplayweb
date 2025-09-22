'use client'

import React, { useMemo, useRef, useState, useEffect } from 'react'
import { useCopilotAction, useCopilotChat } from '@copilotkit/react-core'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Brain, MessageCircle, Send, Sparkles, Trophy, Zap, Globe, Lightbulb } from 'lucide-react'

export default function ProfessorLockPage() {
  const { subscriptionTier } = useSubscription()
  const isPro = subscriptionTier !== 'free'

  const instructions = useMemo(() => (
    `You are Professor Lock, an elite AI betting expert. Be concise, structured, and on-brand.
Use concise bullets, add short rationale lines, and avoid slang. Tools you can use: showTopPicks.
User tier: ${subscriptionTier}.`
  ), [subscriptionTier])

  // Headless chat hook
  const { visibleMessages, appendMessage } = useCopilotChat()

  // Example action: show top picks from ai_predictions
  useCopilotAction({
    name: 'showTopPicks',
    description: 'Show recent top AI picks from ai_predictions',
    parameters: [
      { name: 'limit', type: 'number', description: 'How many picks to show', required: false },
    ],
    render: ({ status, result }) => {
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

  // Page-level input
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleMessages.length])

  const send = async () => {
    const t = text.trim()
    if (!t) return
    setText('')
    await appendMessage({ role: 'user', content: t, instructions })
  }

  const quickPrompts = [
    { icon: <Trophy className="w-4 h-4 text-yellow-400" />, text: "Today's Best", prompt: 'What are your top confidence picks today?' },
    { icon: <Zap className="w-4 h-4 text-cyan-400" />, text: 'Smart Parlay', prompt: 'Build me a balanced 3-leg parlay with good value' },
    { icon: <Globe className="w-4 h-4 text-emerald-400" />, text: 'Breaking News', prompt: 'Any breaking news that could affect today\'s games?' },
    { icon: <Lightbulb className="w-4 h-4 text-amber-400" />, text: 'Pro Insights', prompt: "Show me today's most important betting insights" },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-blue-900/40 to-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
            <Brain className="w-6 h-6 mr-2 text-white" />
            Professor Lock
            <span className="ml-3 text-xs md:text-sm px-2 py-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white">{isPro ? 'Pro Access' : 'Free'}</span>
          </h1>
          <p className="text-blue-200 mt-1">AI Sports Betting Expert</p>
        </motion.div>

        {/* Quick actions */}
        <div className="mb-4 flex flex-wrap gap-2">
          {quickPrompts.map((q, i) => (
            <button
              key={i}
              onClick={() => setText(q.prompt)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-100 hover:bg-white/10 transition"
            >
              {q.icon}
              <span className="text-sm">{q.text}</span>
            </button>
          ))}
        </div>

        {/* Conversation */}
        <div className="rounded-2xl border border-white/10 bg-black/20 h-[60vh] overflow-y-auto p-4 space-y-4">
          {/* Welcome bubble if empty */}
          {visibleMessages.length === 0 && (
            <div className="max-w-xl bg-white/5 border border-white/10 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-purple-400">Professor Lock</span>
              </div>
              <div className="text-sm text-gray-100">
                🎯 I analyze picks, parlays, odds, and market trends. Ask away or use a quick action above.
              </div>
            </div>
          )}

          {visibleMessages.map((m, idx) => {
            const isUser = m.role === 'user'
            const content = typeof m.content === 'string' ? m.content : (m.content as any[]).map((c: any) => c.text || '').join(' ')
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-lg ${isUser ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-100 border border-white/10'}`}>
                  {!isUser && (
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-medium text-purple-400">Professor Lock</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap text-sm">{content}</div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="mt-4 flex items-center space-x-3">
          <div className="flex-1">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={isPro ? 'Ask about picks, parlays, odds, or trends…' : 'Free plan: limited chat'}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={send}
            disabled={!text.trim()}
            className="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  )
}


