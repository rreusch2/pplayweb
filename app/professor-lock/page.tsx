import { Metadata } from 'next'
import dynamic from 'next/dynamic'

// Dynamically import ChatKit to avoid SSR issues
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

export const metadata: Metadata = {
  title: 'Professor Lock | Predictive Play',
  description: 'Chat with Professor Lock, the advanced AI sports betting assistant powered by OpenAI.',
}

export default function ProfessorLockPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Professor Lock
          </h1>
          <p className="text-slate-400">
            AI-Powered Sports Betting Intelligence • Let's cash in some plays! 💰
          </p>
        </div>

        {/* ChatKit Container */}
        <ChatKitProfessorLock className="h-[700px] w-full" />

        {/* Feature Pills */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
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
