"use client"

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { toast } from 'react-hot-toast'
import type { ChatKitSession, ChatMessage, WidgetAction } from '@/types/chatkit'

export function useChatKitSession() {
  const { user, session: authSession, profile } = useAuth()
  const [session, setSession] = useState<ChatKitSession | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Create or refresh ChatKit session
  const createSession = useCallback(async (refresh = false) => {
    if (!authSession?.access_token) {
      setError('No authentication token available')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chatkit/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({ refresh })
      })

      if (!response.ok) {
        throw new Error('Failed to create ChatKit session')
      }

      const data = await response.json()
      setSession(data)
      
      // Store session in localStorage for persistence
      localStorage.setItem('chatkit_session', JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }))

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session'
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [authSession])

  // Handle widget actions
  const handleWidgetAction = useCallback(async (action: WidgetAction) => {
    if (!authSession?.access_token) {
      toast.error('Please log in to perform this action')
      return
    }

    try {
      const response = await fetch('/api/chatkit/widget-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({ action })
      })

      if (!response.ok) {
        throw new Error('Failed to process action')
      }

      const result = await response.json()
      
      // Show success feedback
      if (action.type === 'add_to_betslip') {
        toast.success('Added to betslip!')
      } else if (action.type === 'place_parlay') {
        toast.success('Parlay placed successfully!')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed'
      toast.error(errorMessage)
      throw err
    }
  }, [authSession])

  // Add message to local state
  const addMessage = useCallback((message: ChatMessage) => {
    setMessages(prev => [...prev, message])
  }, [])

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  // Check for existing session on mount
  useEffect(() => {
    const storedSession = localStorage.getItem('chatkit_session')
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession)
        // Check if session is less than 24 hours old
        const sessionAge = Date.now() - new Date(parsed.timestamp).getTime()
        const twentyFourHours = 24 * 60 * 60 * 1000
        
        if (sessionAge < twentyFourHours) {
          setSession(parsed)
        } else {
          // Session expired, clear it
          localStorage.removeItem('chatkit_session')
        }
      } catch (err) {
        console.error('Failed to parse stored session:', err)
        localStorage.removeItem('chatkit_session')
      }
    }
  }, [])

  // End session
  const endSession = useCallback(() => {
    setSession(null)
    setMessages([])
    localStorage.removeItem('chatkit_session')
    toast.success('Session ended')
  }, [])

  return {
    session,
    isLoading,
    error,
    messages,
    createSession,
    endSession,
    handleWidgetAction,
    addMessage,
    clearMessages,
    isAuthenticated: !!authSession?.access_token,
    userTier: profile?.subscription_tier || 'free'
  }
}

// Hook to check if user can access specific features
export function useFeatureAccess() {
  const { profile } = useAuth()
  const tier = profile?.subscription_tier || 'free'

  const canAccess = useCallback((feature: string): boolean => {
    const featureTiers: Record<string, string[]> = {
      'basic_chat': ['free', 'pro', 'elite'],
      'advanced_analysis': ['pro', 'elite'],
      'player_props': ['pro', 'elite'],
      'parlays': ['pro', 'elite'],
      'live_betting': ['elite'],
      'vip_picks': ['elite'],
      'unlimited_chat': ['pro', 'elite'],
      'priority_support': ['elite']
    }

    const allowedTiers = featureTiers[feature] || []
    return allowedTiers.includes(tier.toLowerCase())
  }, [tier])

  const getMessageLimit = useCallback((): number => {
    switch (tier.toLowerCase()) {
      case 'elite':
        return -1 // Unlimited
      case 'pro':
        return -1 // Unlimited
      case 'free':
        return 3
      default:
        return 3
    }
  }, [tier])

  const getPicksLimit = useCallback((): number => {
    switch (tier.toLowerCase()) {
      case 'elite':
        return 30
      case 'pro':
        return 20
      case 'free':
        return 2
      default:
        return 2
    }
  }, [tier])

  return {
    tier,
    canAccess,
    getMessageLimit,
    getPicksLimit,
    isElite: tier === 'elite',
    isPro: tier === 'pro' || tier === 'elite',
    isFree: tier === 'free'
  }
}

// Hook to track ChatKit analytics
export function useChatKitAnalytics() {
  const trackEvent = useCallback(async (eventType: string, metadata?: Record<string, any>) => {
    try {
      // Send to your analytics endpoint
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: `chatkit_${eventType}`,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            source: 'chatkit'
          }
        })
      })
    } catch (err) {
      console.error('Failed to track event:', err)
    }
  }, [])

  const trackMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    trackEvent('message', {
      role,
      contentLength: content.length,
      hasWidgets: content.includes('widget')
    })
  }, [trackEvent])

  const trackToolUse = useCallback((toolId: string) => {
    trackEvent('tool_use', { toolId })
  }, [trackEvent])

  const trackWidgetAction = useCallback((actionType: string, payload?: any) => {
    trackEvent('widget_action', { actionType, payload })
  }, [trackEvent])

  return {
    trackEvent,
    trackMessage,
    trackToolUse,
    trackWidgetAction
  }
}

