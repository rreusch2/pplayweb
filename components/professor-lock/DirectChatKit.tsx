"use client"

import { useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'

interface DirectChatKitProps {
  className?: string
}

export default function DirectChatKit({ 
  className = "h-[600px] w-full"
}: DirectChatKitProps) {
  
  const { user, session, profile } = useAuth()
  const chatKitRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !session) return

    console.log('🎯 DirectChatKit - Loading ChatKit script and creating component')
    
    // Load ChatKit script if not already loaded
    if (!document.querySelector('script[src*="chatkit"]')) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@openai/chatkit-js@latest/dist/index.umd.js'
      script.async = true
      script.onload = () => {
        console.log('✅ ChatKit script loaded')
        createChatKitComponent()
      }
      script.onerror = () => {
        console.error('❌ Failed to load ChatKit script')
      }
      document.head.appendChild(script)
    } else {
      createChatKitComponent()
    }
    
    function createChatKitComponent() {
      // Create the web component
      const chatKitElement = document.createElement('openai-chatkit') as any
      
      // Configure options using setOptions method
      chatKitElement.setOptions({
        api: {
          url: 'https://pykit-production.up.railway.app/chatkit',
          domainKey: 'domain_pk_68ee8f22d84c8190afddda0c6ca72f7c0560633b5555ebb2',
          fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
            console.log('🌐 Direct ChatKit request:', input)
            
            const response = await fetch(input, {
              ...init,
              headers: {
                ...init?.headers,
                'Authorization': `Bearer ${session?.access_token}`,
                'X-User-Id': user?.id || '',
                'X-User-Email': user?.email || '',
                'X-User-Tier': profile?.subscription_tier || 'free',
              },
            })
            
            console.log('🌐 Direct ChatKit response:', response.status)
            return response
          }
        },
        theme: 'dark',
        initialThread: null
      })
      
      // Style the element
      chatKitElement.style.width = '100%'
      chatKitElement.style.height = '100%'
      chatKitElement.style.display = 'block'
      chatKitElement.style.border = '1px solid rgba(255,255,255,0.1)'
      chatKitElement.style.borderRadius = '12px'
      chatKitElement.style.overflow = 'hidden'
      
      // Add to DOM
      if (chatKitRef.current) {
        chatKitRef.current.appendChild(chatKitElement)
      }
      
      console.log('✅ DirectChatKit - Web component created and configured')
    }
    
    return () => {
      // Cleanup
      if (chatKitRef.current) {
        chatKitRef.current.innerHTML = ''
      }
    }
  }, [user, session, profile])

  if (!user) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60">
        <div className="text-center">
          <div className="mb-4 text-6xl">🎯</div>
          <p className="text-lg text-slate-300 mb-2">Please log in to access Professor Lock</p>
          <p className="text-sm text-slate-500">Your AI sports betting assistant</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div 
        ref={chatKitRef}
        className="h-full w-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* Self-hosted indicator */}
      <div className="mt-2 text-xs text-slate-500 text-center flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span>Professor Lock • Direct Web Component</span>
      </div>
    </div>
  )
}
