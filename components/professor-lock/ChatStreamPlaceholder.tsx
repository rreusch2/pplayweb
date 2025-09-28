"use client"

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { MessageSquareText, Sparkles, Send } from 'lucide-react'

interface ChatStreamPlaceholderProps {
  sessionId?: string
  isStreaming?: boolean
  messageCount?: number
}

export default function ChatStreamPlaceholder({
  sessionId,
  isStreaming = false,
  messageCount = 0,
}: ChatStreamPlaceholderProps) {
  const placeholderMessages = useMemo(
    () => [
      {
        role: 'system',
        content: 'Professor Lock is powering up a Daytona sandbox and prepping research tools...'
      },
      {
        role: 'assistant',
        content: 'Once the agent spins up, this panel will stream real-time analysis, picks, and bankroll coaching.'
      },
      {
        role: 'assistant',
        content: 'Tool timelines will highlight StatMuse dives, browser captures, and Supabase lookups as they happen.'
      }
    ],
    []
  )

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/50">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <MessageSquareText className="h-4 w-4 text-blue-300" />
          <span>Conversation Stream</span>
        </div>
        <div className="text-xs text-slate-400">
          Session ID: {sessionId ? sessionId.slice(0, 8) + '…' : 'pending'}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6 text-sm text-slate-200">
        {placeholderMessages.map((entry, index) => (
          <motion.div
            key={`${entry.role}-${index}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            className={`max-w-lg rounded-xl border border-white/5 bg-white/5 px-4 py-3 backdrop-blur ${
              entry.role === 'system' ? 'text-blue-200' : 'text-slate-200'
            }`}
          >
            <div className="mb-1 text-xs uppercase tracking-wider text-slate-400/70">
              {entry.role === 'assistant' ? 'Professor Lock' : 'System'}
            </div>
            <p className="leading-relaxed text-slate-200">{entry.content}</p>
          </motion.div>
        ))}

        {messageCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200"
          >
            {messageCount} message{messageCount === 1 ? '' : 's'} persisted via `/api/professor-lock/message`
          </motion.div>
        )}
      </div>

      <div className="border-t border-white/10 bg-black/60 px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <Sparkles className="h-4 w-4 text-blue-200" />
          <span className="flex-1">
            User input UI will mount here. The submit handler already points to `/api/professor-lock/message`.
          </span>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1 rounded-lg bg-blue-500/70 px-3 py-1 text-xs font-semibold text-white opacity-50"
          >
            <Send className="h-3 w-3" />
            Send
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {isStreaming
            ? 'Streaming placeholder active. Tool outputs will appear above once the agent emits events.'
            : 'Streaming idle. Kick off a session to see the full chat experience.'}
        </p>
      </div>
    </div>
  )
}
