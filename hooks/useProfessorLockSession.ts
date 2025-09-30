"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

export interface ProfessorLockMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface ToolEvent {
  id: string
  agentEventId: string
  phase: 'thinking' | 'tool_invocation' | 'result' | 'completed'
  tool?: string
  title?: string
  message?: string
  payload?: Record<string, unknown>
  timestamp: string
  artifacts?: Array<{
    storagePath: string
    contentType?: string
    caption?: string
  }>
}

export interface SessionStatus {
  sessionId: string | null
  status: 'idle' | 'connecting' | 'active' | 'completed' | 'error'
  error?: string
}

export function useProfessorLockSession(userId: string, tier: string) {
  const [session, setSession] = useState<SessionStatus>({
    sessionId: null,
    status: 'idle',
  })
  const [messages, setMessages] = useState<ProfessorLockMessage[]>([])
  const [events, setEvents] = useState<ToolEvent[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const startSession = useCallback(async (preferences?: Record<string, unknown>) => {
    try {
      setSession({ sessionId: null, status: 'connecting' })
      
      const response = await fetch('/api/professor-lock/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier, preferences }),
      })

      if (!response.ok) {
        throw new Error('Failed to create session')
      }

      const data = await response.json()
      setSession({ sessionId: data.sessionId, status: 'active' })
      
      // Connect to SSE stream
      connectToStream(data.sessionId)
      
      return data.sessionId
    } catch (error) {
      setSession({ 
        sessionId: null, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw error
    }
  }, [userId, tier])

  const connectToStream = useCallback((sessionId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(`/api/professor-lock/stream?sessionId=${sessionId}`)
    eventSourceRef.current = eventSource
    
    const currentStatus = session.status

    eventSource.onopen = () => {
      setIsStreaming(true)
    }

    eventSource.addEventListener('message', (e) => {
      try {
        const data = JSON.parse(e.data)
        
        if (data.type === 'chat_message') {
          setMessages(prev => [...prev, {
            id: data.id || crypto.randomUUID(),
            role: data.role,
            content: data.content,
            timestamp: data.timestamp || new Date().toISOString(),
          }])
        } else if (data.type === 'tool_event') {
          setEvents(prev => [...prev, {
            id: data.id || crypto.randomUUID(),
            agentEventId: data.agentEventId,
            phase: data.phase,
            tool: data.tool,
            title: data.title,
            message: data.message,
            payload: data.payload,
            timestamp: data.timestamp || new Date().toISOString(),
            artifacts: data.artifacts,
          }])
        } else if (data.type === 'session_complete') {
          setSession(prev => ({ ...prev, status: 'completed' }))
          eventSource.close()
          setIsStreaming(false)
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err)
      }
    })

    eventSource.onerror = () => {
      setIsStreaming(false)
      eventSource.close()
      
      // Attempt reconnect after 3 seconds if session is still active
      if (currentStatus === 'active') {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectToStream(sessionId)
        }, 3000)
      }
    }
  }, [])

  const sendMessage = useCallback(async (content: string) => {
    if (!session.sessionId) {
      throw new Error('No active session')
    }

    // Optimistically add user message
    const userMessage: ProfessorLockMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetch('/api/professor-lock/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          userId,
          message: content,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
      throw error
    }
  }, [session.sessionId, userId])

  const endSession = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    setIsStreaming(false)
    setSession({ sessionId: null, status: 'idle' })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    session,
    messages,
    events,
    isStreaming,
    startSession,
    sendMessage,
    endSession,
  }
}
