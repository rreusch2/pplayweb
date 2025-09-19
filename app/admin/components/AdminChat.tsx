'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, 
  Send, 
  Users, 
  Clock,
  Edit3,
  Trash2,
  Reply,
  AlertCircle,
  CheckCircle,
  User,
  Crown
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

interface AdminChatMessage {
  id: string
  user_id: string
  message: string
  message_type: 'text' | 'system' | 'notification'
  is_edited: boolean
  edited_at?: string
  reply_to_message_id?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  // Joined data from profiles
  user_profile?: {
    username: string | null
    email: string | null
    avatar_url: string | null
    admin_role: boolean
  }
  // Reply data if replying to a message
  reply_to_message?: AdminChatMessage
}

interface AdminChatProps {
  className?: string
}

export default function AdminChat({ className = '' }: AdminChatProps) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<AdminChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [connectedAdmins, setConnectedAdmins] = useState(0)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [replyingTo, setReplyingTo] = useState<AdminChatMessage | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  // Load initial messages
  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_chat_messages')
        .select(`
          *,
          user_profile:profiles!user_id (
            username,
            email,
            avatar_url,
            admin_role
          ),
          reply_to_message:admin_chat_messages!reply_to_message_id (
            id,
            message,
            user_id,
            user_profile:profiles!user_id (
              username,
              email
            )
          )
        `)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      setMessages(data as AdminChatMessage[])
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load chat messages')
    } finally {
      setLoading(false)
    }
  }, [])

  // Send a new message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !user || !profile?.admin_role) return

    setSending(true)
    try {
      const messageData = {
        user_id: user.id,
        message: newMessage.trim(),
        message_type: 'text' as const,
        reply_to_message_id: replyingTo?.id || null,
        metadata: {}
      }

      const { error } = await supabase
        .from('admin_chat_messages')
        .insert([messageData])

      if (error) throw error

      setNewMessage('')
      setReplyingTo(null)
      toast.success('Message sent!')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Edit a message
  const editMessage = async (messageId: string) => {
    if (!editingText.trim()) return

    try {
      const { error } = await supabase
        .from('admin_chat_messages')
        .update({
          message: editingText.trim(),
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('user_id', user?.id)

      if (error) throw error

      setEditingMessageId(null)
      setEditingText('')
      toast.success('Message updated!')
    } catch (error) {
      console.error('Error editing message:', error)
      toast.error('Failed to edit message')
    }
  }

  // Delete a message
  const deleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const { error } = await supabase
        .from('admin_chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user?.id)

      if (error) throw error

      toast.success('Message deleted!')
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    if (!profile?.admin_role) return

    loadMessages()

    // Subscribe to new messages
    const subscription = supabase
      .channel('admin_chat')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_chat_messages'
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the complete message with profile data
            const { data, error } = await supabase
              .from('admin_chat_messages')
              .select(`
                *,
                user_profile:profiles!user_id (
                  username,
                  email,
                  avatar_url,
                  admin_role
                ),
                reply_to_message:admin_chat_messages!reply_to_message_id (
                  id,
                  message,
                  user_id,
                  user_profile:profiles!user_id (
                    username,
                    email
                  )
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (!error && data) {
              setMessages(prev => [...prev, data as AdminChatMessage])
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === payload.new.id
                  ? { ...msg, ...payload.new }
                  : msg
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev =>
              prev.filter(msg => msg.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [profile?.admin_role, loadMessages])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Get user avatar/initials
  const getUserAvatar = (message: AdminChatMessage) => {
    const profile = message.user_profile
    if (profile?.avatar_url) {
      return (
        <img
          src={profile.avatar_url}
          alt={profile.username || 'Admin'}
          className="w-8 h-8 rounded-full object-cover"
        />
      )
    }

    const initials = (profile?.username || profile?.email || 'A').charAt(0).toUpperCase()
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
        <span className="text-white text-sm font-medium">{initials}</span>
      </div>
    )
  }

  // Format timestamp
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (!profile?.admin_role) {
    return (
      <div className={`${className} bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6`}>
        <div className="text-center text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <p>Access Denied</p>
          <p className="text-sm">You need admin privileges to access the chat.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className} bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden`}>
      {/* Chat Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Admin Chat</h3>
              <p className="text-sm text-gray-300">Real-time communication for administrators</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <Users className="w-4 h-4" />
            <span>{messages.filter(m => m.message_type === 'text').length} messages</span>
          </div>
        </div>
      </div>

      {/* Reply Banner */}
      {replyingTo && (
        <div className="p-3 bg-blue-600/20 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300">
                Replying to <span className="font-medium text-white">
                  {replyingTo.user_profile?.username || replyingTo.user_profile?.email}
                </span>
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-1 truncate">
            {replyingTo.message}
          </p>
        </div>
      )}

      {/* Messages Container */}
      <div 
        ref={chatContainerRef}
        className="h-96 overflow-y-auto p-4 space-y-4"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-gray-400">
            <div>
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${
                  message.user_id === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] ${
                    message.user_id === user?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-100'
                  } rounded-lg p-3 relative group`}
                >
                  {/* Reply context */}
                  {message.reply_to_message && (
                    <div className="mb-2 p-2 bg-black/20 rounded text-xs border-l-2 border-blue-400">
                      <div className="text-gray-300">
                        Reply to {message.reply_to_message.user_profile?.username || message.reply_to_message.user_profile?.email}:
                      </div>
                      <div className="text-gray-400 truncate">
                        {message.reply_to_message.message}
                      </div>
                    </div>
                  )}

                  {/* Message content */}
                  {editingMessageId === message.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full bg-black/20 border border-white/20 rounded px-2 py-1 text-sm text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') editMessage(message.id)
                          if (e.key === 'Escape') {
                            setEditingMessageId(null)
                            setEditingText('')
                          }
                        }}
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => editMessage(message.id)}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-xs rounded"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingMessageId(null)
                            setEditingText('')
                          }}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-xs rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="break-words">
                      {message.message}
                      {message.is_edited && (
                        <span className="text-xs opacity-70 ml-2">(edited)</span>
                      )}
                    </div>
                  )}

                  {/* Message actions */}
                  {message.user_id === user?.id && editingMessageId !== message.id && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                      <button
                        onClick={() => {
                          setEditingMessageId(message.id)
                          setEditingText(message.message)
                        }}
                        className="p-1 bg-black/20 hover:bg-black/40 rounded"
                        title="Edit message"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => deleteMessage(message.id)}
                        className="p-1 bg-black/20 hover:bg-red-600 rounded"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* User info and timestamp */}
                  <div className={`flex items-center justify-between mt-2 text-xs ${
                    message.user_id === user?.id ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {getUserAvatar(message)}
                      <span className="font-medium">
                        {message.user_profile?.username || message.user_profile?.email || 'Admin'}
                      </span>
                      {message.user_profile?.admin_role && (
                        <Crown className="w-3 h-3 text-yellow-400" title="Administrator" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(message.created_at)}</span>
                      {message.user_id !== user?.id && (
                        <button
                          onClick={() => setReplyingTo(message)}
                          className="p-1 hover:bg-white/10 rounded"
                          title="Reply to message"
                        >
                          <Reply className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              disabled={sending}
              maxLength={1000}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              {newMessage.length}/1000
            </div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {sending ? 'Sending...' : 'Send'}
            </span>
          </button>
        </form>
      </div>
    </div>
  )
}
