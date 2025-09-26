"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { BACKEND_URL } from '@/lib/config'
import { supabase } from '@/lib/supabase'
import ToolActivityPanel, { ToolEvent, ScreenshotItem } from './ToolActivityPanel'
import { Send, Sparkles, Wand2, Brain, Newspaper, LineChart } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export default function ChatClient() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([])
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const userTier = profile?.subscription_tier || 'free'

  const scrollToEnd = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToEnd()
  }, [messages, streaming, scrollToEnd])

  const addToolEvent = useCallback((evt: Omit<ToolEvent, 'id' | 'timestamp'>) => {
    const id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random()}`)
    setToolEvents((prev) => [
      { id, timestamp: new Date().toISOString(), ...evt },
      ...prev
    ].slice(0, 50)) // keep recent
  }, [])

  const addScreenshot = useCallback((shot: Omit<ScreenshotItem, 'id' | 'timestamp'>) => {
    const id = (globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random()}`)
    setScreenshots((prev) => [
      { id, timestamp: new Date().toISOString(), ...shot },
      ...prev
    ].slice(0, 24)) // keep recent
  }, [])

  const startAssistantMessage = useCallback(() => {
    setMessages((prev) => ([...prev, { role: 'assistant', content: '', timestamp: new Date().toISOString() }]))
  }, [])

  const appendAssistantChunk = useCallback((chunk: string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      if (last.role !== 'assistant') return prev
      const updated = { ...last, content: last.content + chunk }
      return [...prev.slice(0, -1), updated]
    })
  }, [])

  const handleSend = useCallback(async (text?: string) => {
    const message = (text ?? input).trim()
    if (!message || !user?.id || streaming) return

    setError(null)
    setInput('')

    // push user message
    setMessages((prev) => ([...prev, { role: 'user', content: message, timestamp: new Date().toISOString() }]))

    try {
      // Validate daily chat limit for free users
      if (userTier !== 'pro') {
        const token = (await supabase.auth.getSession()).data.session?.access_token
        const validateRes = await fetch(`${BACKEND_URL}/api/ai/chat/validate-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        })
        if (!validateRes.ok) {
          const json = await validateRes.json().catch(() => ({}))
          throw new Error(json?.error || 'Unable to validate chat usage')
        }
        const json = await validateRes.json()
        if (!json.canSendMessage && json.remainingMessages === 0) {
          setMessages((prev) => ([...prev, {
            role: 'assistant',
            content: 'You reached your free daily chat limit (3). Upgrade to Pro for unlimited chats and premium analysis.',
            timestamp: new Date().toISOString()
          }]))
          return
        }
      }

      setStreaming(true)
      startAssistantMessage()
      addToolEvent({ type: 'progress', message: 'Initializing analysis...', data: {} })

      const token = (await supabase.auth.getSession()).data.session?.access_token
      const resp = await fetch(`${BACKEND_URL}/api/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message,
          userId: user.id,
          context: { userTier },
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp }))
        }),
      })

      if (!resp.ok || !resp.body) {
        const txt = await resp.text().catch(() => '')
        throw new Error(txt || 'Streaming init failed')
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      const processLine = (line: string) => {
        const trimmed = line.trim()
        if (!trimmed) return
        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.slice(5).trim()
          try {
            const evt = JSON.parse(jsonStr)
            // handle event
            if (evt.type === 'start') {
              addToolEvent({ type: 'progress', message: evt.message || 'Starting...', data: {} })
            } else if (evt.type === 'chunk' && typeof evt.content === 'string') {
              appendAssistantChunk(evt.content)
            } else if (evt.type === 'complete') {
              addToolEvent({ type: 'progress', message: 'Analysis complete', data: { toolsUsed: evt.toolsUsed } })
            } else if (evt.type === 'error') {
              setError(evt.content || 'Streaming error')
            } else if (
              evt.type === 'web_search' || evt.type === 'news_search' || evt.type === 'team_analysis' ||
              evt.type === 'odds_lookup' || evt.type === 'insights_analysis' || evt.type === 'progress'
            ) {
              addToolEvent({ type: evt.type, message: evt.message, data: evt.data || {} })
            } else if (evt.type === 'screenshot') {
              // Support future screenshot push from tools
              if (evt.data?.url || evt.data?.dataUrl) {
                addScreenshot({ url: evt.data.url, dataUrl: evt.data.dataUrl, caption: evt.data?.caption })
              }
            }
          } catch (e) {
            // ignore malformed lines
          }
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split(/\n\n/)
        buffer = parts.pop() || ''
        for (const part of parts) {
          const lines = part.split(/\n/)
          for (const line of lines) processLine(line)
        }
      }

      // increment usage after success (free users only)
      if (userTier !== 'pro') {
        const token2 = (await supabase.auth.getSession()).data.session?.access_token
        await fetch(`${BACKEND_URL}/api/ai/chat/increment-message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token2 ? { 'Authorization': `Bearer ${token2}` } : {}),
          },
        }).catch(() => {})
      }

    } catch (err: any) {
      console.error('Chat error:', err)
      setError(err?.message || 'Failed to send message')
      setMessages((prev) => ([...prev, { role: 'assistant', content: 'Sorry, hit a technical issue with streaming. Try again in a sec! 🔧', timestamp: new Date().toISOString() }]))
    } finally {
      setStreaming(false)
    }
  }, [input, messages, user?.id, userTier, streaming, startAssistantMessage, appendAssistantChunk, addToolEvent, addScreenshot])

  const quickPrompts = useMemo(() => ([
    { icon: <Sparkles className="w-4 h-4" />, text: 'Build me a smart parlay from your latest predictions' },
    { icon: <Newspaper className="w-4 h-4" />, text: 'Any breaking injury or lineup news affecting value today?' },
    { icon: <LineChart className="w-4 h-4" />, text: 'What are the safest 2 legs right now? Keep it high-confidence.' },
    { icon: <Brain className="w-4 h-4" />, text: 'Deep dive one matchup you love and why' },
    { icon: <Wand2 className="w-4 h-4" />, text: 'Find me a spicy long-shot with real logic' },
  ]), [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chat panel (2/3) */}
      <div className="lg:col-span-2">
        <div className="rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur flex flex-col h-[70vh]">
          {/* Quick prompts */}
          <div className="p-3 border-b border-white/10 flex gap-2 overflow-auto">
            {quickPrompts.map((q, i) => (
              <button key={i} onClick={() => handleSend(q.text)} disabled={streaming}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200 text-sm flex items-center gap-2 border border-white/10 transition-colors">
                {q.icon}
                <span>{q.text}</span>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto p-4 space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((m, idx) => (
                <motion.div key={idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={`max-w-[85%] ${m.role === 'user' ? 'ml-auto' : ''}`}
                >
                  <div className={`px-3 py-2 rounded-lg border text-sm leading-relaxed ${m.role === 'user'
                    ? 'bg-blue-600/80 text-white border-blue-500/50'
                    : 'bg-white/5 text-gray-100 border-white/10'}`}>
                    {m.content}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">{new Date(m.timestamp).toLocaleTimeString()}</div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/10">
            {error && <div className="text-sm text-red-400 mb-2">{error}</div>}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={streaming ? 'Professor Lock is thinking...' : 'Ask Professor Lock anything (bets, parlays, odds, news)'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                disabled={streaming}
              />
              <button
                onClick={() => handleSend()}
                disabled={streaming || !input.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tools panel (1/3) */}
      <div className="lg:col-span-1">
        <ToolActivityPanel events={toolEvents} screenshots={screenshots} />
      </div>
    </div>
  )
}
