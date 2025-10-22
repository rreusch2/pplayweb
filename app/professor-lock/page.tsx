"use client"

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { Maximize2, Minimize2, LayoutPanelTop } from 'lucide-react'

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
  const { profile } = useAuth()
  const tier = (profile?.subscription_tier || 'free') as 'free' | 'pro' | 'elite'
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [compact, setCompact] = useState(false)

  const heightClass = compact ? 'h-[65vh] md:h-[68vh]' : 'h-[72vh] md:h-[75vh]'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 pt-2 md:pt-3 pb-8 px-4">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-2 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-0.5">
            Professor Lock
          </h1>
          <p className="text-slate-400 text-sm md:text-base">
            AI-Powered Sports Betting Intelligence • Let's cash in some plays! 💰
          </p>
        </div>

        {/* Toolbar + ChatKit Container */}
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs rounded-full px-2.5 py-1 border border-white/10 bg-white/5 capitalize">
                {tier} tier
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompact((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10"
                title="Toggle compact height"
              >
                <LayoutPanelTop className="w-4 h-4" /> {compact ? 'Normal height' : 'Compact height'}
              </button>
              <button
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" /> Fullscreen
              </button>
            </div>
          </div>

          {!isFullscreen && (
            <div className={`relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-white/[0.04] backdrop-blur-sm ${heightClass}`}>
              {process.env.NEXT_PUBLIC_USE_CUSTOM_PROFESSOR_LOCK === 'true' ? (
                <ProfessorLockCustom className="w-full h-full" />
              ) : (
                <ChatKitProfessorLock className="w-full h-full" />
              )}
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
              {process.env.NEXT_PUBLIC_USE_CUSTOM_PROFESSOR_LOCK === 'true' ? (
                <ProfessorLockCustom className="w-full h-full" />
              ) : (
                <ChatKitProfessorLock className="w-full h-full" />
              )}
            </div>
          </div>
        )}

        {/* Feature Pills */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="text-sm text-slate-300">✅ Real-Time Odds</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="text-sm text-slate-300">📊 StatMuse Data</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="text-sm text-slate-300">🎯 Smart Parlays</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <span className="text-sm text-slate-300">🔥 Player Props</span>
          </div>
        </div>
      </div>
    </div>
  )
}
