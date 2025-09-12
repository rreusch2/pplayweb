'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts'

export interface WebTeam {
  id: string
  name: string
  abbreviation?: string
  city?: string
  sport: string
  logo_url?: string | null
}

interface TeamGameStat {
  game_date: string
  opponent_team?: string
  opponent_abbreviation?: string
  is_home: boolean
  team_score: number
  opponent_score: number
  game_result?: string
  margin?: number
  spread_line?: number | null
  total_line?: number | null
}

interface TeamTrendsModalWebProps {
  open: boolean
  onClose: () => void
  team: WebTeam | null
}

const sportPropOptions: Record<string, Array<{ key: string; name: string }>> = {
  MLB: [
    { key: 'points_scored', name: 'Runs Scored' },
    { key: 'points_allowed', name: 'Runs Allowed' },
    { key: 'run_differential', name: 'Run Differential' },
    { key: 'total_score', name: 'Total Runs' },
    { key: 'win_margin', name: 'Win Margin' }
  ],
  NBA: [
    { key: 'points_scored', name: 'Points Scored' },
    { key: 'points_allowed', name: 'Points Allowed' },
    { key: 'point_differential', name: 'Point Differential' },
    { key: 'total_score', name: 'Total Points' },
    { key: 'win_margin', name: 'Win Margin' }
  ],
  WNBA: [
    { key: 'points_scored', name: 'Points Scored' },
    { key: 'points_allowed', name: 'Points Allowed' },
    { key: 'point_differential', name: 'Point Differential' },
    { key: 'total_score', name: 'Total Points' },
    { key: 'win_margin', name: 'Win Margin' }
  ],
  NFL: [
    { key: 'points_scored', name: 'Points Scored' },
    { key: 'points_allowed', name: 'Points Allowed' },
    { key: 'point_differential', name: 'Point Differential' },
    { key: 'total_score', name: 'Total Points' },
    { key: 'win_margin', name: 'Win Margin' }
  ],
  'College Football': [
    { key: 'points_scored', name: 'Points Scored' },
    { key: 'points_allowed', name: 'Points Allowed' },
    { key: 'point_differential', name: 'Point Differential' },
    { key: 'total_score', name: 'Total Points' },
    { key: 'win_margin', name: 'Win Margin' }
  ]
}

export default function TeamTrendsModalWeb({ open, onClose, team }: TeamTrendsModalWebProps) {
  const [loading, setLoading] = useState(false)
  const [selectedProp, setSelectedProp] = useState<string>('points_scored')
  const [gameStats, setGameStats] = useState<TeamGameStat[]>([])
  const [bettingLines, setBettingLines] = useState<any[]>([])

  const propOptions = sportPropOptions[team?.sport || 'MLB'] || sportPropOptions.MLB

  useEffect(() => {
    if (!open || !team) return
    // Default prop per sport
    setSelectedProp((prev) => (prev ? prev : propOptions[0]?.key || 'points_scored'))
  }, [open, team?.id])

  useEffect(() => {
    if (!open || !team || !selectedProp) return
    const fetchTrends = async () => {
      setLoading(true)
      try {
        const { data } = await apiClient.get(`/api/teams/${team.id}/trends`, { params: { limit: 10 } })
        const recent = (data?.recent_games || []) as TeamGameStat[]
        setGameStats(recent)
        setBettingLines(data?.betting_lines || [])
      } catch (e) {
        console.error('Failed to load team trends', e)
        setGameStats([])
        setBettingLines([])
      } finally {
        setLoading(false)
      }
    }
    fetchTrends()
  }, [open, team?.id, selectedProp])

  const currentLine = useMemo(() => {
    if (!bettingLines?.length) return null
    // Choose most recent
    const sorted = [...bettingLines].sort((a, b) => new Date(b.event_date || b.last_update || 0).getTime() - new Date(a.event_date || a.last_update || 0).getTime())
    const latest = sorted[0]
    if (!latest) return null

    // Heuristic mapping similar to mobile
    if (selectedProp === 'total_score') return latest.total_line ?? null
    if (selectedProp.includes('differential')) return typeof latest.spread_line === 'number' ? 0 : 0 // neutral line at 0 for diff
    if (selectedProp === 'win_margin') return 0
    // For points_scored/allowed we don't have a direct line; leave null
    return null
  }, [bettingLines, selectedProp])

  const formattedData = useMemo(() => {
    return gameStats.map(g => {
      const label = (() => {
        try {
          const d = new Date(g.game_date)
          return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
        } catch { return g.game_date }
      })()

      let value = 0
      switch (selectedProp) {
        case 'points_scored': value = g.team_score || 0; break
        case 'points_allowed': value = g.opponent_score || 0; break
        case 'total_score': value = (g.team_score || 0) + (g.opponent_score || 0); break
        case 'point_differential':
        case 'run_differential': value = (g.team_score || 0) - (g.opponent_score || 0); break
        case 'win_margin': value = g.game_result === 'W' ? Math.abs((g.team_score || 0) - (g.opponent_score || 0)) : 0; break
        default: value = (g as any)[selectedProp] || 0
      }

      const win = g.game_result ? g.game_result === 'W' : null
      const isAboveLine = currentLine != null ? value >= currentLine : null

      return { name: label, value, win, isAboveLine }
    })
  }, [gameStats, selectedProp, currentLine])

  const [yMin, yMax] = useMemo(() => {
    if (!formattedData.length) return [0, 5]
    const vals = formattedData.map(d => d.value)
    const max = Math.max(...vals, typeof currentLine === 'number' ? currentLine : 0)
    const min = Math.min(...vals, typeof currentLine === 'number' ? currentLine : 0)
    const pad = Math.max(2, Math.ceil((max - min) * 0.1))
    return [Math.min(min - pad, 0), max + pad]
  }, [formattedData, currentLine])

  if (!open || !team) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-xl border border-white/10 bg-gray-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-green-500/50 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="h-12 w-12 object-contain" />
              ) : (
                <span className="text-lg font-bold text-gray-700">{team.abbreviation || team.name?.slice(0,3)}</span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{team.name}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-300">
                <span className="rounded bg-green-500/20 px-2 py-0.5 text-green-300">{team.sport}</span>
                {team.city && (<><span>•</span><span>{team.city}</span></>)}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Prop selector */}
        <div className="mb-4">
          <h3 className="mb-2 text-lg font-semibold text-white">Select Metric</h3>
          <div className="flex flex-wrap gap-2">
            {propOptions.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedProp(p.key)}
                className={
                  'rounded-full border px-3 py-1 text-sm transition-colors ' +
                  (selectedProp === p.key
                    ? 'border-green-400 bg-green-600 text-white'
                    : 'border-white/15 bg-white/5 text-gray-300 hover:bg-white/10')
                }
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="rounded-lg bg-gray-800 p-4">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-gray-400">Loading chart…</div>
          ) : gameStats.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <div className="text-4xl">📉</div>
              <p className="mt-3 text-gray-300">No recent game data available.</p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="barGray" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D1D5DB" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#9CA3AF" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FCA5A5" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#6B7280' }} />
                  <YAxis
                    domain={[yMin, yMax]}
                    allowDecimals={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#6B7280' }}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} labelStyle={{ color: '#F9FAFB' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {formattedData.map((d, idx) => {
                      let fill = 'url(#barGray)'
                      if (d.isAboveLine !== null) {
                        fill = d.isAboveLine ? 'url(#barGreen)' : 'url(#barGray)'
                      } else {
                        if (d.win === true) fill = 'url(#barGreen)'
                        else if (d.win === false) fill = 'url(#barRed)'
                        else fill = 'url(#barGray)'
                      }
                      return <Cell key={`cell-${idx}`} fill={fill} />
                    })}
                  </Bar>
                  {currentLine !== null && (
                    <ReferenceLine y={currentLine} label={{ value: `Line: ${currentLine}`, position: 'insideTopLeft', fill: '#F59E0B' }} stroke="#F59E0B" strokeDasharray="6 4" />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Game by game */}
        {gameStats.length > 0 && (
          <div className="mt-6 rounded-lg border border-white/10 bg-white/5">
            <div className="border-b border-white/10 p-4">
              <h4 className="text-lg font-semibold text-white">Game by Game Breakdown</h4>
            </div>
            <div className="divide-y divide-white/10">
              {gameStats.slice().reverse().map((g, idx) => (
                <div key={idx} className="flex items-center justify-between p-4">
                  <div className="text-sm text-white">
                    {(() => { try { const d = new Date(g.game_date); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) } catch { return g.game_date } })()} {g.is_home ? 'vs' : '@'} {g.opponent_team}
                  </div>
                  <div className="rounded bg-white/10 px-2 py-1 text-sm text-white">
                    {(() => { switch (selectedProp) { case 'points_scored': return g.team_score; case 'points_allowed': return g.opponent_score; case 'total_score': return (g.team_score||0)+(g.opponent_score||0); case 'point_differential': case 'run_differential': return (g.team_score||0)-(g.opponent_score||0); case 'win_margin': return g.game_result==='W'? Math.abs((g.team_score||0)-(g.opponent_score||0)) : 0; default: return (g as any)[selectedProp]||0 } })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
