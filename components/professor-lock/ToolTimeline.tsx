"use client"

import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe,
  Database,
  BarChart3,
  Search,
  Image as ImageIcon,
  Terminal,
  Brain,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import type { ToolEvent } from '@/hooks/useProfessorLockSession'

interface ToolTimelineProps {
  events: ToolEvent[]
}

const toolIcons: Record<string, React.ElementType> = {
  browser_use: Globe,
  statmuse_query: BarChart3,
  supabase_query: Database,
  web_search: Search,
  chart_builder: BarChart3,
  shell: Terminal,
  default: Brain,
}

const phaseColors: Record<string, string> = {
  thinking: 'from-yellow-400 to-orange-500',
  tool_invocation: 'from-blue-400 to-purple-500',
  result: 'from-emerald-400 to-teal-500',
  completed: 'from-slate-400 to-slate-600',
}

const phaseLabels: Record<string, string> = {
  thinking: 'Analyzing',
  tool_invocation: 'Executing',
  result: 'Complete',
  completed: 'Done',
}

export default function ToolTimeline({ events }: ToolTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 p-8 text-center backdrop-blur-xl">
        <div className="space-y-3">
          <Brain className="mx-auto h-12 w-12 text-slate-600" />
          <p className="text-sm text-slate-400">
            Tool activity will appear here as Professor Lock works
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 px-6 py-4">
        <h3 className="text-lg font-bold text-white">Tool Activity</h3>
        <p className="text-xs text-slate-400">
          {events.length} event{events.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* Timeline */}
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        <AnimatePresence mode="popLayout">
          {events.map((event, index) => {
            const Icon = toolIcons[event.tool || 'default'] || toolIcons.default
            const gradient = phaseColors[event.phase] || phaseColors.thinking
            const label = phaseLabels[event.phase] || event.phase

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative"
              >
                {/* Timeline connector */}
                {index < events.length - 1 && (
                  <div className="absolute left-5 top-12 h-full w-0.5 bg-gradient-to-b from-white/20 to-transparent" />
                )}

                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient}`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {event.title || event.tool || 'Processing'}
                      </span>
                      <span
                        className={`rounded-full bg-gradient-to-r ${gradient} px-2 py-0.5 text-xs font-medium text-white`}
                      >
                        {label}
                      </span>
                    </div>

                    {event.message && (
                      <p className="text-sm text-slate-300">{event.message}</p>
                    )}

                    {/* Artifacts (screenshots, charts, etc.) */}
                    {event.artifacts && event.artifacts.length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {event.artifacts.map((artifact, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 * i }}
                            className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 backdrop-blur-sm transition-all hover:border-blue-400/50 hover:bg-white/10"
                          >
                            <div className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-blue-400" />
                              <span className="truncate text-xs text-slate-300">
                                {artifact.caption || 'Artifact'}
                              </span>
                            </div>
                            {artifact.contentType?.startsWith('image/') && (
                              <div className="mt-2 text-xs text-slate-500">
                                Click to view
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-slate-500">
                      {new Date(event.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Status indicator */}
                  <div className="shrink-0">
                    {event.phase === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : event.phase === 'tool_invocation' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="h-5 w-5 text-blue-400" />
                      </motion.div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
