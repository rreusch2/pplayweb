'use client'

import dynamic from 'next/dynamic'
import Script from 'next/script'

// Dynamically import to avoid SSR issues with ChatKit
const ProfessorLockAutoLoad = dynamic(
  () => import('@/components/professor-lock/ProfessorLockAutoLoad'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-purple-500 border-r-transparent mb-4"></div>
          <p className="text-slate-400">Initializing AI Assistant...</p>
        </div>
      </div>
    )
  }
)

export default function ProfessorLockPage() {
  return (
    <>
      {/* Load ChatKit Web Component (required by @openai/chatkit-react) */}
      <Script 
        src="https://unpkg.com/@openai/chatkit@latest/dist/chatkit.js"
        strategy="beforeInteractive"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="container mx-auto px-4 py-6">
          {/* Minimal header - just enough for context */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-slate-200">
              Professor Lock AI
            </h1>
          </div>
          
          {/* ChatKit takes center stage - no wrapper */}
          <div className="max-w-7xl mx-auto">
            <ProfessorLockAutoLoad />
          </div>
        </div>
      </div>
    </>
  )
}
