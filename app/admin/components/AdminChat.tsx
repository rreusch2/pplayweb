'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Shield, UserCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface ChatMessage {
  id: string
  user_id: string
  content: string
  created_at: string
  profile?: {
    username: string | null
    email: string | null
  }
}

export default function AdminChat() {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const isAdmin = profile?.admin_role === true

  useEffect(() => {
    if (!user) return

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_chats')
          .select('id, user_id, content, created_at, profiles:profiles!inner(username, email)')
          .order('created_at', { ascending: true })
          .limit(200)

        if (error) throw error

        const normalized = (data as any[]).map((row) => ({
          id: row.id,
          user_id: row.user_id,
          content: row.content,
          created_at: row.created_at,
          profile: row.profiles ? { username: row.profiles.username, email: row.profiles.email } : undefined
        }))
        setMessages(normalized)
      } catch (e) {
        console.error('Failed to load admin chat messages', e)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()

    const channel = supabase
      .channel('admin_chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_chats' }, (payload) => {
        const newMsg = payload.new as any
        setMessages((prev) => [
          ...prev,
          { id: newMsg.id, user_id: newMsg.user_id, content: newMsg.content, created_at: newMsg.created_at }
        ])
        scrollToBottom()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages.length])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || !user) return
    try {
      const { error } = await supabase.from('admin_chats').insert({
        user_id: user.id,
        content: input.trim()
      })
      if (error) throw error
      setInput('')
    } catch (e) {
      console.error('Failed to send message', e)
      alert('Failed to send message')
    }
  }

  if (!isAdmin) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
        <div className="text-gray-300">You do not have access to the Admin Chat.</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-400" />
          Admin Chat
        </h3>
      </div>

      <div className="h-80 overflow-y-auto space-y-3 pr-2">
        {loading ? (
          <div className="text-gray-400">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-400">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((m) => {
            const isSelf = m.user_id === user?.id
            const displayName = m.profile?.username || m.profile?.email || 'Admin'
            return (
              <div key={m.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                {!isSelf && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-2">
                    <span className="text-white text-xs font-medium">{displayName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${isSelf ? 'bg-blue-600 text-white' : 'bg-white/10 text-white border border-white/10'}`}>
                  <div className="text-xs text-gray-200 mb-0.5">{displayName}</div>
                  <div>{m.content}</div>
                  <div className="text-[10px] text-gray-300 mt-1">{new Date(m.created_at).toLocaleString()}</div>
                </div>
                {isSelf && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center ml-2">
                    <span className="text-white text-xs font-medium">{(profile?.username || profile?.email || 'You').charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 flex items-center space-x-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
        >
          <Send className="w-4 h-4 mr-1" />
          Send
        </button>
      </div>
    </motion.div>
  )
}
