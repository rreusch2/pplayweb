"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Brain, Zap, Play, StopCircle } from 'lucide-react'
import { useProfessorLockSession } from '@/hooks/useProfessorLockSession'
import LiveChatPanel from './LiveChatPanel'
import ToolTimeline from './ToolTimeline'

export default function ProfessorLockShell() {
  // TODO: Replace with actual user data from auth context
  const [userId] = useState('demo-user-123')
  const [tier] = useState('pro')

  const {
    session,
    messages,
    events,
    isStreaming,
    startSession,
    sendMessage,
    endSession,
  } = useProfessorLockSession(userId, tier)

  const handleStartSession = async () => {
    try {
      await startSession({
        sportPreferences: ['MLB', 'WNBA'],
        riskTolerance: 'medium',
      })
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 p-8 backdrop-blur-xl"
        >
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-3">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Professor Lock</h1>
                  <p className="text-slate-300">Advanced AI Sports Betting Assistant</p>
                </div>
              </div>

              {/* Session Control */}
              {session.status === 'idle' ? (
                <button
                  onClick={handleStartSession}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white transition-all hover:from-emerald-600 hover:to-teal-600"
                >
                  <Play className="h-5 w-5" />
                  Start Session
                </button>
              ) : session.status === 'active' ? (
                <button
                  onClick={endSession}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-6 py-3 font-semibold text-white transition-all hover:from-red-600 hover:to-orange-600"
                >
                  <StopCircle className="h-5 w-5" />
                  End Session
                </button>
              ) : session.status === 'connecting' ? (
                <div className="flex items-center gap-2 rounded-xl border border-blue-400/50 bg-blue-500/10 px-6 py-3 font-semibold text-blue-300">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-5 w-5" />
                  </motion.div>
                  Connecting...
                </div>
              ) : null}
            </div>
            <p className="max-w-2xl text-slate-400">
              Powered by xAI Grok-3, Daytona sandboxes, StatMuse, live web search, and Supabase. Watch
              as Professor Lock autonomously researches games, analyzes data, and builds intelligent
              betting strategies in real time.
            </p>
          </div>

          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '200% 200%' }}
          />
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap gap-3"
        >
          {[
            { icon: Brain, label: 'Autonomous Research', color: 'from-blue-400 to-blue-600' },
            { icon: TrendingUp, label: 'Live StatMuse Data', color: 'from-emerald-400 to-emerald-600' },
            { icon: Zap, label: 'Browser Control', color: 'from-purple-400 to-purple-600' },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm"
            >
              <div className={`rounded-full bg-gradient-to-br ${feature.color} p-1.5`}>
                <feature.icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-300">{feature.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid gap-6 lg:grid-cols-3"
        >
          {/* Chat Panel (2 columns on large screens) */}
          <div className="lg:col-span-2">
            <LiveChatPanel
              messages={messages}
              isStreaming={isStreaming}
              onSendMessage={sendMessage}
              disabled={session.status !== 'active'}
            />
          </div>

          {/* Tool Timeline (1 column) */}
          <div className="space-y-6">
            <ToolTimeline events={events} />

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-6 backdrop-blur-xl">
              <h3 className="mb-4 text-lg font-bold text-white">Session Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span
                    className={`font-semibold ${
                      session.status === 'active'
                        ? 'text-emerald-400'
                        : session.status === 'connecting'
                        ? 'text-blue-400'
                        : session.status === 'error'
                        ? 'text-red-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {session.status === 'idle'
                      ? 'Ready'
                      : session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Session ID:</span>
                  <span className="text-slate-300">
                    {session.sessionId ? session.sessionId.slice(0, 8) + '...' : 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Messages:</span>
                  <span className="text-slate-300">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tool Events:</span>
                  <span className="text-slate-300">{events.length}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Note */}
        {session.status === 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-center backdrop-blur-sm"
          >
            <p className="text-sm text-blue-200">
              🚀 Click <strong>"Start Session"</strong> to launch your personal Daytona sandbox and
              watch Professor Lock work in real time.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
