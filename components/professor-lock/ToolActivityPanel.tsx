"use client"
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe2, Newspaper, Brain, LineChart, Search, ImageIcon, Activity } from 'lucide-react'

export type ToolEvent = {
  id: string
  type: string
  message?: string
  timestamp: string
  data?: Record<string, any>
}

export type ScreenshotItem = {
  id: string
  url?: string
  dataUrl?: string
  caption?: string
  timestamp: string
}

interface Props {
  events: ToolEvent[]
  screenshots: ScreenshotItem[]
}

const typeMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  web_search: { label: 'Web Search', icon: <Globe2 className="w-4 h-4" />, color: 'text-blue-300' },
  news_search: { label: 'News', icon: <Newspaper className="w-4 h-4" />, color: 'text-amber-300' },
  team_analysis: { label: 'Team Intel', icon: <Brain className="w-4 h-4" />, color: 'text-purple-300' },
  odds_lookup: { label: 'Odds Lookup', icon: <LineChart className="w-4 h-4" />, color: 'text-emerald-300' },
  insights_analysis: { label: 'Insights', icon: <Search className="w-4 h-4" />, color: 'text-pink-300' },
  progress: { label: 'Progress', icon: <Activity className="w-4 h-4" />, color: 'text-gray-300' },
  screenshot: { label: 'Screenshot', icon: <ImageIcon className="w-4 h-4" />, color: 'text-cyan-300' },
}

export default function ToolActivityPanel({ events, screenshots }: Props) {
  return (
    <div className="w-full h-full rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur p-4">
      <h3 className="text-white font-semibold mb-3">Tool Activity</h3>
      <div className="space-y-3 max-h-64 overflow-auto pr-1">
        <AnimatePresence initial={false}>
          {events.map((ev) => {
            const meta = typeMeta[ev.type] || { label: ev.type, icon: <Activity className="w-4 h-4" />, color: 'text-gray-300' }
            return (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-start gap-2"
              >
                <div className={`mt-1 ${meta.color}`}>{meta.icon}</div>
                <div className="flex-1">
                  <div className="text-sm text-gray-200">
                    <span className="font-medium">{meta.label}:</span> {ev.message || ''}
                  </div>
                  {ev.data?.url && (
                    <a href={ev.data.url} target="_blank" rel="noreferrer" className="text-xs text-blue-300 underline">
                      {ev.data.url}
                    </a>
                  )}
                  <div className="text-[10px] text-gray-400 mt-0.5">{new Date(ev.timestamp).toLocaleTimeString()}</div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {screenshots.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <ImageIcon className="w-4 h-4 text-cyan-300" />
            <h4 className="text-white text-sm font-medium">Live Browser Screenshots</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {screenshots.map((shot) => (
              <div key={shot.id} className="relative group">
                <img
                  src={shot.url || shot.dataUrl}
                  alt={shot.caption || 'screenshot'}
                  className="w-full h-28 object-cover rounded-lg border border-white/10"
                />
                {shot.caption && (
                  <div className="absolute bottom-0 left-0 right-0 text-[10px] text-white/90 bg-black/40 px-1 py-0.5 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    {shot.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
