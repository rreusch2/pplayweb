"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface ChatKitContextType {
  clientSecret: string | null
  sessionId: string | null
  isLoading: boolean
  error: string | null
  initializeSession: (options?: SessionOptions) => Promise<void>
  refreshSession: () => Promise<void>
  endSession: () => void
}

interface SessionOptions {
  sportPreferences?: string[]
  riskTolerance?: 'low' | 'medium' | 'high'
  bettingStyle?: 'conservative' | 'balanced' | 'aggressive'
  customInstructions?: string
}

const ChatKitContext = createContext<ChatKitContextType | undefined>(undefined)

export function ChatKitProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeSession = useCallback(async (options?: SessionOptions) => {
    if (!user?.id) {
      setError('User must be logged in to start a chat session')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chatkit/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          tier: profile?.subscription_tier || 'free',
          preferences: {
            ...options,
            userName: profile?.username || 'Champ',
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create ChatKit session')
      }

      const { client_secret, session_id } = await response.json()
      setClientSecret(client_secret)
      setSessionId(session_id)

      // Store in localStorage for session persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatkit_session', JSON.stringify({
          client_secret,
          session_id,
          timestamp: Date.now(),
        }))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('ChatKit session error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, profile])

  const refreshSession = useCallback(async () => {
    if (!sessionId) {
      await initializeSession()
      return
    }

    // Implement session refresh logic here
    // This would typically check if the current session is still valid
    // and create a new one if needed
    await initializeSession()
  }, [sessionId, initializeSession])

  const endSession = useCallback(() => {
    setClientSecret(null)
    setSessionId(null)
    setError(null)
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatkit_session')
    }
  }, [])

  // Check for existing session on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.id) {
      const stored = localStorage.getItem('chatkit_session')
      if (stored) {
        try {
          const session = JSON.parse(stored)
          // Check if session is less than 24 hours old
          if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
            setClientSecret(session.client_secret)
            setSessionId(session.session_id)
          } else {
            localStorage.removeItem('chatkit_session')
          }
        } catch (err) {
          console.error('Failed to restore ChatKit session:', err)
          localStorage.removeItem('chatkit_session')
        }
      }
    }
  }, [user?.id])

  return (
    <ChatKitContext.Provider
      value={{
        clientSecret,
        sessionId,
        isLoading,
        error,
        initializeSession,
        refreshSession,
        endSession,
      }}
    >
      {children}
    </ChatKitContext.Provider>
  )
}

export function useChatKit() {
  const context = useContext(ChatKitContext)
  if (context === undefined) {
    throw new Error('useChatKit must be used within a ChatKitProvider')
  }
  return context
}
