'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Search, User, Users, Loader2, Sparkles } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import PlayerTrendsModalWeb, { WebPlayer } from './PlayerTrendsModalWeb'
import TeamTrendsModalWeb, { WebTeam } from './TeamTrendsModalWeb'

const sports = [
  { key: 'all', name: 'All', emoji: '🏆' },
  { key: 'MLB', name: 'MLB', emoji: '⚾' },
  { key: 'WNBA', name: 'WNBA', emoji: '🏀' },
  { key: 'NBA', name: 'NBA', emoji: '🏀' },
  { key: 'NFL', name: 'NFL', emoji: '🏈' },
  { key: 'College Football', name: 'CFB', emoji: '🏈' },
  { key: 'UFC', name: 'UFC', emoji: '🥊' },
]

type SearchMode = 'players' | 'teams'

export default function TrendsSearch() {
  const [mode, setMode] = useState<SearchMode>('players')
  const [sport, setSport] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [players, setPlayers] = useState<WebPlayer[]>([])
  const [teams, setTeams] = useState<WebTeam[]>([])
  const [playerModalOpen, setPlayerModalOpen] = useState(false)
  const [teamModalOpen, setTeamModalOpen] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<WebPlayer | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<WebTeam | null>(null)
  const debounceRef = useRef<number | null>(null)

  const results = useMemo(() => (mode === 'players' ? players : teams), [mode, players, teams])

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setPlayers([])
      setTeams([])
      return
    }
    debounceRef.current = window.setTimeout(() => {
      search(trimmed)
    }, 300)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sport, mode])

  const search = async (q: string) => {
    setLoading(true)
    try {
      if (mode === 'players') {
        const { data } = await apiClient.get('/api/players/search', {
          params: { query: q, sport, limit: 20 },
        })
        const list = (data?.players || []) as any[]

        // Deduplicate by name+sport; prefer more recent games, headshot, longer team, has position
        const score = (p: any) =>
          (p.recent_games_count || 0) * 1000 +
          (p.has_headshot ? 500 : 0) +
          ((p.team && p.team.length > 3) ? 100 : 0) +
          (p.position ? 50 : 0)

        const dedup: Record<string, any> = {}
        for (const p of list) {
          const key = `${(p.name || '').toLowerCase()}|${p.sport || ''}`
          if (!dedup[key] || score(p) > score(dedup[key])) dedup[key] = p
        }
        const deduped = Object.values(dedup) as WebPlayer[]

        // sort prefix matches first
        const ql = q.toLowerCase()
        deduped.sort((a: any, b: any) => {
          const aStarts = a.name?.toLowerCase().startsWith(ql)
          const bStarts = b.name?.toLowerCase().startsWith(ql)
          if (aStarts && !bStarts) return -1
          if (!aStarts && bStarts) return 1
          // Secondary: higher score first to show better record
          const sa = score(a)
          const sb = score(b)
          if (sa !== sb) return sb - sa
          return a.name.localeCompare(b.name)
        })
        setPlayers(deduped)
      } else {
        const { data } = await apiClient.get('/api/teams/search', {
          params: { query: q, sport, limit: 20 },
        })
        const list = (data?.teams || []) as WebTeam[]
        const ql = q.toLowerCase()
        list.sort((a: any, b: any) => {
          const aStarts = (a.name || '').toLowerCase().startsWith(ql) || (a.city || '').toLowerCase().startsWith(ql)
          const bStarts = (b.name || '').toLowerCase().startsWith(ql) || (b.city || '').toLowerCase().startsWith(ql)
          if (aStarts && !bStarts) return -1
          if (!aStarts && bStarts) return 1
          return (a.name || '').localeCompare(b.name || '')
        })
        setTeams(list)
      }
    } catch (e) {
      console.error('Search failed', e)
      setPlayers([])
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  const sportBadgeColor = (s: string) => {
    switch (s) {
      case 'MLB': return 'bg-blue-600 text-white'
      case 'WNBA':
      case 'NBA': return 'bg-red-600 text-white'
      case 'NFL': return 'bg-green-600 text-white'
      case 'UFC': return 'bg-orange-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Trends Search</h1>
          <p className="text-xl text-gray-300">Search any player or team and explore last 10 games with sportsbook line overlays</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/20 px-3 py-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">Live data</span>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="sticky top-0 z-20 mb-4 rounded-lg bg-black/10 backdrop-blur supports-[backdrop-filter]:bg-black/20">
        <div className="flex gap-1 rounded-lg bg-white/5 p-1">
          <button
            onClick={() => { setMode('players'); setQuery('') }}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 ${mode === 'players' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          >
            <User className="h-4 w-4" /> Players
          </button>
          <button
            onClick={() => { setMode('teams'); setQuery('') }}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center gap-2 ${mode === 'teams' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          >
            <Users className="h-4 w-4" /> Teams
          </button>
        </div>
      </div>

      {/* Sports filter */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 rounded-lg bg-white/5 p-2">
          {sports.map((s) => (
            <button
              key={s.key}
              onClick={() => setSport(s.key)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${sport === s.key ? 'bg-blue-600 text-white shadow' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
            >
              <span className="mr-1">{s.emoji}</span> {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-[#121214] shadow">
        <div className="flex items-center gap-3 px-4 py-3">
          <Search className={`h-5 w-5 ${query.length ? 'text-blue-400' : 'text-gray-500'}`} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'players' ? 'Search any player (Aaron Judge, Caitlin Clark...)' : 'Search any team (Yankees, Lakers, Chiefs...)'}
            className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-500"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
        </div>
      </div>

      {/* Results */}
      {query.trim().length >= 2 && (
        <div className="space-y-3">
          {mode === 'players' && players.map((p: any) => (
            <button
              key={p.id}
              onClick={() => { setSelectedPlayer(p); setPlayerModalOpen(true) }}
              className="group w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-purple-500/40"
            >
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-purple-500/40 bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {p.headshot_url ? <img src={p.headshot_url} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-gray-400">👤</div>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold group-hover:text-purple-300">{p.name}</h3>
                    <span className={`rounded px-2 py-0.5 text-xs ${sportBadgeColor(p.sport)}`}>{p.sport}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-300">
                    {p.team}{p.position ? ` • ${p.position}` : ''}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {mode === 'teams' && teams.map((t: any) => (
            <button
              key={t.id}
              onClick={() => { setSelectedTeam(t); setTeamModalOpen(true) }}
              className="group w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-green-500/40"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-green-500/40 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {t.logo_url ? <img src={t.logo_url} alt={t.name} className="h-10 w-10 object-contain" /> : <span className="text-sm font-bold text-gray-700">{t.abbreviation || (t.name || '').slice(0,3)}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold group-hover:text-green-300">{t.name}</h3>
                    <span className={`rounded px-2 py-0.5 text-xs ${sportBadgeColor(t.sport)}`}>{t.sport}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-300">
                    {(t.city || '') + (t.abbreviation ? ` • ${t.abbreviation}` : '')}
                  </div>
                </div>
              </div>
            </button>
          ))}

          {!loading && results.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
              <div className="text-5xl">🔎</div>
              <p className="mt-3 text-gray-300">No results yet. Try refining your search.</p>
            </div>
          )}
        </div>
      )}

      {selectedPlayer && (
        <PlayerTrendsModalWeb open={playerModalOpen} onClose={() => setPlayerModalOpen(false)} player={selectedPlayer} />
      )}
      {selectedTeam && (
        <TeamTrendsModalWeb open={teamModalOpen} onClose={() => setTeamModalOpen(false)} team={selectedTeam} />
      )}
    </div>
  )
}
