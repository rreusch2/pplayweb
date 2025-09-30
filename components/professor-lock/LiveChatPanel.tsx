"use client"

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquareText, User, Sparkles, Loader2 } from 'lucide-react'
import type { ProfessorLockMessage } from '@/hooks/useProfessorLockSession'

interface LiveChatPanelProps {
  messages: ProfessorLockMessage[]
  isStreaming: boolean
  onSendMessage: (content: string) => Promise<void>
  disabled?: boolean
}

export default function LiveChatPanel({
  messages,
  isStreaming,
  onSendMessage,
  disabled = false,
}: LiveChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const content = formData.get('message') as string
    
    if (!content.trim() || disabled) return

    try {
      await onSendMessage(content.trim())
      e.currentTarget.reset()
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-2">
            <MessageSquareText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Professor Lock</h3>
            <p className="text-xs text-slate-400">
              {isStreaming ? 'Analyzing...' : 'Ready to assist'}
            </p>
          </div>
        </div>
        {isStreaming && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="h-5 w-5 text-blue-400" />
          </motion.div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6 text-center"
            >
              <div className="mb-3 flex justify-center">
                <div className="rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-3">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-bold text-white">Session Started!</h3>
              <p className="text-sm text-slate-300">
                Ask me anything about today's games, betting strategies, or request a parlay analysis.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                💡 Try: "What are your best picks for today?" or "Build me a 3-leg parlay"
              </p>
            </motion.div>
          )}
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                    : 'bg-gradient-to-br from-blue-400 to-purple-500'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <Sparkles className="h-5 w-5 text-white" />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-white'
                    : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-slate-200'
                } border border-white/10 backdrop-blur-sm`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {new Date(message.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-black/40 px-6 py-4">
        {disabled ? (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-center">
            <p className="text-sm text-yellow-200">
              👆 Click <strong>"Start Session"</strong> above to begin chatting with Professor Lock
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                name="message"
                placeholder="Ask Professor Lock anything..."
                disabled={isStreaming}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-blue-400/50 focus:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isStreaming}
                className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:from-blue-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </form>
            <p className="mt-3 text-xs text-slate-500">
              Professor Lock uses xAI Grok-3 with live sports data, StatMuse, and web search.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
