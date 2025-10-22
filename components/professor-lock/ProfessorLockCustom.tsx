"use client"

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'

interface ProfessorLockCustomProps {
  className?: string
  onSessionStart?: () => void
  onSessionEnd?: () => void
}

export default function ProfessorLockCustom({ 
  className = "",
  onSessionStart,
  onSessionEnd
}: ProfessorLockCustomProps) {
  const { user, profile } = useAuth()
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load ChatKit Web Component script
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Check if already loaded
    if (window.customElements?.get('openai-chatkit')) {
      setScriptLoaded(true)
      return
    }

    console.log('📦 Loading ChatKit Web Component...')
    
    const script = document.createElement('script')
    script.src = 'https://cdn.platform.openai.com/deployments/chatkit/chatkit.js'
    script.type = 'module'
    script.async = true
    
    script.onload = () => {
      console.log('✅ ChatKit Web Component loaded')
      setScriptLoaded(true)
    }
    
    script.onerror = (e) => {
      console.error('❌ Failed to load ChatKit:', e)
      setError('Failed to load ChatKit library')
    }
    
    document.head.appendChild(script)
    
    return () => {
      // Keep script for other instances
    }
  }, [])

  // Initialize ChatKit element
  useEffect(() => {
    if (!scriptLoaded || !user || !containerRef.current) return

    const serverUrl = process.env.NEXT_PUBLIC_CHATKIT_SERVER_URL || 'https://pykit-production.up.railway.app/chatkit'
    const domainKey = process.env.NEXT_PUBLIC_CHATKIT_DOMAIN_KEY || 'domain_pk_68ee8f22d84c8190afddda0c6ca72f7c0560633b5555ebb2'

    console.log('🎯 Creating ChatKit element...')
    console.log('🐍 Server:', serverUrl)
    console.log('👤 User:', user.id, 'Tier:', profile?.subscription_tier)

    const element = document.createElement('openai-chatkit') as any
    
    // Configure Custom API mode
    element.apiURL = serverUrl
    element.domainKey = domainKey
    
    // Pass user context via custom headers
    element.addEventListener('chatkit:request', (e: any) => {
      if (e.detail?.headers) {
        e.detail.headers['X-User-Id'] = user.id || ''
        e.detail.headers['X-User-Email'] = user.email || ''
        e.detail.headers['X-User-Tier'] = profile?.subscription_tier || 'free'
      }
    })
    
    // Style
    element.style.width = '100%'
    element.style.height = '100%'
    element.style.display = 'block'
    
    // Clear and mount
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(element)
    
    console.log('✅ ChatKit element mounted')
    onSessionStart?.()

    return () => {
      onSessionEnd?.()
    }
  }, [scriptLoaded, user, profile, onSessionStart, onSessionEnd])

  if (!user) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-lg text-slate-300 mb-2">Please log in to access Professor Lock</p>
          <p className="text-sm text-slate-500">Your AI sports betting assistant</p>
        </div>
      </div>
    )
  }

  if (!scriptLoaded) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-500/20 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-slate-200">Loading Professor Lock...</p>
          <p className="text-xs text-slate-400 mt-2">Initializing ChatKit</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center max-w-md">
          <div className="text-5xl text-red-500 mb-4">⚠️</div>
          <p className="text-lg text-red-400 mb-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ minHeight: '600px', height: '600px' }}>
      <div className="absolute top-3 right-3 z-10 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
        ⚡ Live
      </div>
      <div 
        ref={containerRef}
        className="w-full h-full rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 overflow-hidden"
      />
    </div>
  )
}
