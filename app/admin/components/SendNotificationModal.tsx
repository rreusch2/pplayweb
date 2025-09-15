"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  open: boolean
  onClose: () => void
}

type NotificationType = 'pick' | 'insight' | 'news' | 'custom'

export default function SendNotificationModal({ open, onClose }: Props) {
  const [type, setType] = useState<NotificationType>('pick')
  const [entityId, setEntityId] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  if (!open) return null

  const reset = () => {
    setType('pick')
    setEntityId('')
    setTitle('')
    setMessage('')
  }

  const handleSend = async () => {
    try {
      // Validation for custom
      if (type === 'custom') {
        if (!title.trim() || !message.trim()) {
          alert('Title and message are required for custom notifications')
          return
        }
      }

      setSending(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('Not authenticated')
        return
      }

      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://zooming-rebirth-production-a305.up.railway.app'
      const body: any = { type }
      if (type === 'pick' || type === 'insight') {
        if (entityId.trim()) body.entityId = entityId.trim()
        if (title.trim()) body.title = title.trim()
        if (message.trim()) body.message = message.trim()
      } else if (type === 'news') {
        if (title.trim()) body.title = title.trim()
        if (message.trim()) body.message = message.trim()
      } else if (type === 'custom') {
        body.title = title.trim()
        body.message = message.trim()
      }

      const res = await fetch(`${baseUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        alert(`✅ Sent to ${data.sent} devices\nTitle: ${data.title}\nMessage: ${data.body}`)
        reset()
        onClose()
      } else {
        alert(`❌ Failed: ${data.error || 'Unknown error'}`)
      }
    } catch (e) {
      console.error('Send notification error:', e)
      alert('❌ Error sending notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-slate-800 rounded-xl border border-white/10 shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white text-lg font-semibold">Send Push Notification</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
              className="w-full bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2"
            >
              <option value="pick">Pick</option>
              <option value="insight">Insight</option>
              <option value="news">News</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {(type === 'pick' || type === 'insight') && (
            <div>
              <label className="block text-sm text-gray-300 mb-1">Entity ID (optional)</label>
              <input
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder={`Enter ${type} ID or leave blank to auto-pick top item`}
                className="w-full bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 placeholder-gray-400"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-1">Title {type === 'custom' ? '(required)' : '(optional)'}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'news' ? 'Optional news title' : type === 'custom' ? 'Enter title' : 'Optional title override'}
              className="w-full bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Message {type === 'custom' ? '(required)' : '(optional)'}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={type === 'news' ? 'Optional news message' : type === 'custom' ? 'Enter message' : 'Optional message override'}
              className="w-full bg-white/10 border border-white/20 rounded-lg text-white px-3 py-2 placeholder-gray-400 min-h-[90px]"
            />
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50"
          >
            <Send className={`w-4 h-4 ${sending ? 'animate-pulse' : ''}`} />
            <span>{sending ? 'Sending…' : 'Send'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  )
}
