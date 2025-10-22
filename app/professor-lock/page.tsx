"use client"

import dynamic from 'next/dynamic'
import { useState } from 'react'

// Dynamically import ChatKit components to avoid SSR issues
const ChatKitProfessorLock = dynamic(
  () => import('@/components/professor-lock/ChatKitProfessorLock'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto"></div>
          <p className="text-lg text-slate-300">Loading Professor Lock...</p>
        </div>
      </div>
    )
  }
)

const ProfessorLockCustom = dynamic(
  () => import('@/components/professor-lock/ProfessorLockCustom'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto"></div>
          <p className="text-lg text-slate-300">Loading Professor Lock Custom Server...</p>
        </div>
      </div>
    )
  }
)

export default function ProfessorLockPage() {
  const [showHelp, setShowHelp] = useState(false)

  const quickPrompts = [
    { emoji: '🎯', label: 'Analyze Games', prompt: 'Analyze today\'s games and give me your top picks with analysis' },
    { emoji: '💎', label: 'Build Parlay', prompt: 'Build me a smart 3-leg parlay with good value for tonight\'s games' },
    { emoji: '⚡', label: 'Hot Props', prompt: 'Show me the hottest player props with high confidence for today' },
    { emoji: '📊', label: 'Trends', prompt: 'What are the key betting trends and line movements I should know about?' },
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Compact Header with Status */}
        <div className="pt-6 pb-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Live</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Professor Lock
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto">
            AI-Powered Sports Betting Intelligence • Let's cash in some plays! 💰
          </p>
        </div>

        {/* Quick Actions Bar with Help Toggle */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {quickPrompts.map((action, idx) => (
            <button 
              key={idx}
              onClick={() => {
                // In a real implementation, this would send the prompt to ChatKit
                console.log('Quick prompt:', action.prompt)
              }}
              className={`group flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all ${
                idx === 0 ? 'border-blue-500/20 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:border-blue-500/40' :
                idx === 1 ? 'border-purple-500/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/40' :
                idx === 2 ? 'border-pink-500/20 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20 hover:border-pink-500/40' :
                'border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/40'
              }`}
            >
              <span className="text-base">{action.emoji}</span>
              <span>{action.label}</span>
            </button>
          ))}
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="flex items-center gap-1 rounded-lg border border-slate-500/20 bg-slate-500/10 px-2 py-1.5 text-xs text-slate-300 transition-all hover:bg-slate-500/20 hover:border-slate-500/40"
          >
            <span>💡</span>
            <span className="hidden sm:inline">Help</span>
          </button>
        </div>

        {/* Help Panel */}
        {showHelp && (
          <div className="mb-4 mx-auto max-w-2xl rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-300 flex items-center gap-2">
                <span>💡</span>
                <span>Quick Tips</span>
              </h3>
              <button 
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <p><strong className="text-blue-300">Ask anything:</strong> "What are tonight's best bets?" or "Build me a parlay"</p>
              <p><strong className="text-blue-300">Get specific:</strong> "Show me Lakers props" or "NBA trends this week"</p>
              <p><strong className="text-blue-300">Upload files:</strong> Attach images or documents for analysis</p>
              <p><strong className="text-blue-300">Resize:</strong> Drag the bottom-right corner to adjust chat size</p>
            </div>
          </div>
        )}

        {/* ChatKit Container - Use Custom Server if available */}
        <div className="flex justify-center">
          {process.env.NEXT_PUBLIC_USE_CUSTOM_PROFESSOR_LOCK === 'true' ? (
            <ProfessorLockCustom className="h-[700px] w-full max-w-[520px]" />
          ) : (
            <ChatKitProfessorLock className="h-[700px] w-full max-w-[520px]" />
          )}
        </div>

        {/* Stats Bar */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>99.9% Uptime</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span>⚡</span>
            <span>Avg 1.2s Response</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span>🔒</span>
            <span>Secure & Private</span>
          </div>
        </div>

        {/* Feature Pills - Refined */}
        <div className="mt-4 pb-8 flex flex-wrap justify-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-xs">✅</span>
            <span className="text-xs font-medium text-emerald-300">Real-Time Odds</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-xs">📊</span>
            <span className="text-xs font-medium text-cyan-300">StatMuse Data</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-xs">🎯</span>
            <span className="text-xs font-medium text-violet-300">Smart Parlays</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-xs">🔥</span>
            <span className="text-xs font-medium text-orange-300">Player Props</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-xs">🧠</span>
            <span className="text-xs font-medium text-rose-300">AI Analysis</span>
          </div>
        </div>
      </div>
    </div>
  )
}
