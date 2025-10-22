"use client"

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { Maximize2, Minimize2 } from 'lucide-react'

// Self-hosted ChatKit component with advanced widgets
const SelfHostedChatKit = dynamic(
  () => import('@/components/professor-lock/SelfHostedChatKit'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto"></div>
          <p className="text-lg text-slate-300">Loading Professor Lock...</p>
          <p className="text-sm text-slate-500 mt-2">Self-hosted • Advanced Widgets • Real-time Analysis</p>
        </div>
      </div>
    )
  }
)

export default function ProfessorLockPage() {
  const { profile } = useAuth()
  const tier = (profile?.subscription_tier || 'free') as 'free' | 'pro' | 'elite'
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-4 pb-8 px-4">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Professor Lock
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            AI-Powered Sports Betting Intelligence • Let's cash in some plays! 💰
          </p>
        </div>

        {/* Toolbar + ChatKit Container */}
        <div className="mx-auto w-full max-w-5xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs rounded-full px-2.5 py-1 border border-white/10 bg-white/5 capitalize">
                {tier} tier
              </span>
              <span className="flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border border-green-500/20 bg-green-500/10 text-green-300">
                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                Self-Hosted
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10 transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" /> Fullscreen
              </button>
            </div>
          </div>

          {!isFullscreen && (
            <div className="flex justify-center">
              <SelfHostedChatKit className="w-full h-[600px]" />
            </div>
          )}
        </div>

        {/* Fullscreen Overlay */}
        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-slate-950/95 p-3 md:p-6">
            <div className="mx-auto h-[92vh] w-full max-w-6xl relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-white/[0.04] backdrop-blur-sm">
              <button
                onClick={() => setIsFullscreen(false)}
                className="absolute top-3 right-3 z-10 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10"
                title="Exit fullscreen"
              >
                <Minimize2 className="w-4 h-4" /> Exit
              </button>
              <SelfHostedChatKit className="w-full h-full" />
            </div>
          </div>
        )}

        {/* Feature Pills */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2">
            <span className="text-sm text-green-300">⚡ Advanced Widgets</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="text-sm text-slate-300">✅ Real-Time Odds</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="text-sm text-slate-300">📊 StatMuse Integration</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="text-sm text-slate-300">🎯 Parlay Builder</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="text-sm text-slate-300">🔍 Live Search</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2">
            <span className="text-sm text-purple-300">🎨 Interactive Cards</span>
          </div>
        </div>
      </div>
    </div>
  )
}
