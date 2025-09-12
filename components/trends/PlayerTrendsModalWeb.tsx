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

export interface WebPlayer {
  id: string
  name: string
  team: string
  sport: string
  position?: string
  headshot_url?: string | null
  has_headshot?: boolean
}

interface GameStat {
  game_date: string
  opponent: string
  is_home: boolean
  value: number
  game_result?: string
}

interface PlayerTrendsModalWebProps {
  open: boolean
  onClose: () => void
  player: WebPlayer | null
}

export default function PlayerTrendsModalWeb({ open, onClose, player }: PlayerTrendsModalWebProps) {
  const [loading, setLoading] = useState(false)
  const [propTypes, setPropTypes] = useState<Array<{ key: string; name: string }>>([])
  const [selectedProp, setSelectedProp] = useState<string>('')
  const [gameStats, setGameStats] = useState<GameStat[]>([])
  const [currentLine, setCurrentLine] = useState<number | null>(null)

  useEffect(() => {
    if (!open || !player) return
    const fetchPropTypes = async () => {
      try {
        const { data } = await apiClient.get(`/api/players/${player.id}/prop-types`)
        const props = (data?.propTypes || []) as Array<{ key: string; name: string }>
        setPropTypes(props)
        if (props.length > 0) {
          setSelectedProp(prev => (prev && props.some(p => p.key === prev) ? prev : props[0].key))
        }
      } catch (e) {
        console.error('Failed to load prop types', e)
        setPropTypes([])
      }
    }
    fetchPropTypes()
  }, [open, player?.id])

  useEffect(() => {
    if (!open || !player || !selectedProp) return
    const fetchStats = async () => {
      setLoading(true)
      try {
        const { data } = await apiClient.get(`/api/players/${player.id}/stats`, {
          params: { propType: selectedProp, limit: 10 }
        })
        setGameStats((data?.gameStats || []) as GameStat[])
        setCurrentLine(typeof data?.currentLine === 'number' ? data.currentLine : null)
      } catch (e) {
        console.error('Failed to load player stats', e)
        setGameStats([])
        setCurrentLine(null)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [open, player?.id, selectedProp])

  const formattedData = useMemo(() => {
    return gameStats.map(g => {
      const label = (() => {
        try {
          const d = new Date(g.game_date)
          return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
        } catch {
          return g.game_date
        }
      })()
      return {
        name: label,
        value: g.value || 0,
        over: currentLine != null ? g.value > currentLine : false
      }
    })
  }, [gameStats, currentLine])

  const yAxisMax = useMemo(() => {
    const values = formattedData.map(d => d.value)
    const maxVal = Math.max(...values, currentLine || 0)
    return Math.max(Math.ceil(maxVal) + 1, 5)
  }, [formattedData, currentLine])

  if (!open || !player) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-5xl max-h-[85vh] overflow-y-auto rounded-xl border border-white/10 bg-gray-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-blue-500/50 bg-white/5">
              {player.headshot_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={player.headshot_url} alt={player.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">👤</div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{player.name}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-gray-300">
                <span className="rounded bg-blue-500/20 px-2 py-0.5 text-blue-300">{player.sport}</span>
                <span>•</span>
                <span>{player.team}</span>
                {player.position && (
                  <>
                    <span>•</span>
                    <span>{player.position}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Prop selector */}
        <div className="mb-4">
          <h3 className="mb-2 text-lg font-semibold text-white">Select Prop</h3>
          <div className="flex flex-wrap gap-2">
            {propTypes.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedProp(p.key)}
                className={
                  'rounded-full border px-3 py-1 text-sm transition-colors ' +
                  (selectedProp === p.key
                    ? 'border-blue-400 bg-blue-600 text-white'
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
              <p className="mt-3 text-gray-300">No recent game data available for this prop.</p>
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={{ stroke: '#6B7280' }} />
                  <YAxis
                    domain={[0, yAxisMax]}
                    allowDecimals={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                    axisLine={{ stroke: '#6B7280' }}
                    tickCount={yAxisMax + 1}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} labelStyle={{ color: '#F9FAFB' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {formattedData.map((d, idx) => {
                      const hasLine = currentLine !== null && currentLine !== undefined
                      const fill = hasLine ? (d.value >= (currentLine as number) ? '#22C55E' : '#9CA3AF') : '#9CA3AF'
                      return <Cell key={`cell-${idx}`} fill={fill} />
                    })}
                  </Bar>
                  {currentLine !== null && (
                    <ReferenceLine y={currentLine} label={{ value: `Line: ${currentLine}`, position: 'insideTopLeft', fill: '#F59E0B' }} stroke="#F59E0B" strokeDasharray="5 5" />
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
                    {(() => {
                      try {
                        const d = new Date(g.game_date)
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      } catch {
                        return g.game_date
                      }
                    })()} {g.is_home ? 'vs' : '@'} {g.opponent}
                  </div>
                  <div className="rounded bg-white/10 px-2 py-1 text-sm text-white">
                    {g.value}
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
