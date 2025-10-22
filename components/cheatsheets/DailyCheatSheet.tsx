'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, Target, Zap, Clock } from 'lucide-react'
import type { DailyDigestContent } from '@/lib/cheatSheetData'

interface DailyCheatSheetProps {
  content: DailyDigestContent
  theme?: 'dark_glass' | 'blue_blaze' | 'team_colors'
  watermark?: boolean
  className?: string
}

const THEME_CONFIG = {
  dark_glass: {
    gradient: 'from-slate-900/95 via-gray-900/90 to-slate-900/95',
    cardBg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white',
    accent: 'text-blue-400',
    accentBg: 'bg-blue-500/20',
  },
  blue_blaze: {
    gradient: 'from-blue-950/95 via-indigo-900/90 to-blue-950/95',
    cardBg: 'bg-blue-500/10',
    border: 'border-blue-400/20',
    text: 'text-white',
    accent: 'text-cyan-400',
    accentBg: 'bg-cyan-500/20',
  },
  team_colors: {
    gradient: 'from-gray-900/95 via-emerald-900/80 to-gray-900/95',
    cardBg: 'bg-emerald-500/10',
    border: 'border-emerald-400/20',
    text: 'text-white',
    accent: 'text-emerald-400',
    accentBg: 'bg-emerald-500/20',
  },
}

export default function DailyCheatSheet({
  content,
  theme = 'dark_glass',
  watermark = false,
  className = '',
}: DailyCheatSheetProps) {
  const config = THEME_CONFIG[theme]

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border ${config.border} bg-gradient-to-br ${config.gradient} p-8 backdrop-blur-xl ${className}`}
      style={{ minHeight: 800 }}
    >
      {/* Watermark for free tier */}
      {watermark && (
        <div className="absolute bottom-4 right-4 opacity-30 text-white/50 text-xs font-semibold rotate-[-15deg]">
          PREDICTIVE PLAY
        </div>
      )}

      {/* Header */}
      <div className="mb-8 border-b border-white/10 pb-6">
        <div className="mb-2 flex items-center gap-2">
          <Target className={`h-6 w-6 ${config.accent}`} />
          <h1 className={`text-3xl font-bold ${config.text}`}>{content.title}</h1>
        </div>
        <p className="text-sm text-gray-400">{content.summary}</p>
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(content.generatedAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className={`h-3 w-3 ${config.accent}`} />
            <span>{content.picks.length} AI Picks</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <div className={`rounded-xl ${config.cardBg} border ${config.border} p-4`}>
          <div className="mb-1 text-xs font-medium text-gray-400">Avg Confidence</div>
          <div className={`text-2xl font-bold ${config.accent}`}>{content.avgConfidence}%</div>
        </div>
        <div className={`rounded-xl ${config.cardBg} border ${config.border} p-4`}>
          <div className="mb-1 text-xs font-medium text-gray-400">Total Value</div>
          <div className={`text-2xl font-bold ${config.accent}`}>+{content.totalValue}%</div>
        </div>
        <div className={`rounded-xl ${config.cardBg} border ${config.border} p-4`}>
          <div className="mb-1 text-xs font-medium text-gray-400">Sports Covered</div>
          <div className={`text-2xl font-bold ${config.accent}`}>{content.sportsBreakdown.length}</div>
        </div>
      </div>

      {/* Top Pick Highlight */}
      {content.topPick && (
        <div className={`mb-8 rounded-xl ${config.accentBg} border ${config.border} p-5`}>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className={`h-5 w-5 ${config.accent}`} />
            <h2 className={`text-lg font-bold ${config.text}`}>🔥 Top Pick</h2>
          </div>
          <div className={`mb-2 text-xl font-bold ${config.text}`}>{content.topPick.match_teams}</div>
          <div className="mb-2 flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${config.accentBg} ${config.accent}`}>
              {content.topPick.pick}
            </span>
            <span className="text-lg font-bold text-green-400">{content.topPick.odds}</span>
            <span className={`rounded-full ${config.cardBg} px-2 py-0.5 text-xs font-medium text-gray-300`}>
              {content.topPick.confidence}% Confidence
            </span>
          </div>
          {content.topPick.reasoning && (
            <p className="text-sm text-gray-300">{content.topPick.reasoning.slice(0, 150)}...</p>
          )}
        </div>
      )}

      {/* Confidence Distribution Chart */}
      <div className={`mb-8 rounded-xl ${config.cardBg} border ${config.border} p-5`}>
        <h3 className={`mb-4 text-sm font-semibold ${config.text}`}>Confidence Distribution</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={content.confidenceDistribution}>
            <XAxis dataKey="range" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.5rem',
              }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {content.confidenceDistribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.range.startsWith('80')
                      ? '#10b981'
                      : entry.range.startsWith('70')
                      ? '#3b82f6'
                      : entry.range.startsWith('60')
                      ? '#f59e0b'
                      : '#6b7280'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* All Picks */}
      <div className={`rounded-xl ${config.cardBg} border ${config.border} p-5`}>
        <h3 className={`mb-4 text-sm font-semibold ${config.text}`}>Today's Picks</h3>
        <div className="space-y-3">
          {content.picks.slice(0, 8).map((pick, idx) => (
            <div
              key={pick.id}
              className={`flex items-center justify-between rounded-lg ${config.cardBg} border ${config.border} p-3`}
            >
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`text-xs font-medium ${config.accent}`}>#{idx + 1}</span>
                  <span className="text-xs text-gray-500">{pick.sport}</span>
                </div>
                <div className={`mb-1 text-sm font-semibold ${config.text}`}>{pick.match_teams}</div>
                <div className="text-xs text-gray-400">{pick.pick}</div>
              </div>
              <div className="text-right">
                <div className="mb-1 text-sm font-bold text-green-400">{pick.odds}</div>
                <div className="text-xs text-gray-500">{pick.confidence}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 border-t border-white/10 pt-4 text-center">
        <p className="text-xs text-gray-500">
          Generated by Predictive Play AI · For entertainment purposes only
        </p>
      </div>
    </div>
  )
}
