'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { toast } from 'react-hot-toast'
import { Loader2 } from 'lucide-react'

export default function CheatSheetTestPage() {
  const { user, profile, session } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const [sheetType, setSheetType] = useState<'daily_digest'>('daily_digest')
  const [sports, setSports] = useState<string[]>([])
  const [picksLimit, setPicksLimit] = useState(10)
  const [minConfidence, setMinConfidence] = useState(60)
  const [theme, setTheme] = useState<'dark_glass' | 'blue_blaze' | 'team_colors'>('dark_glass')

  const handleGenerate = async () => {
    if (!session?.access_token) {
      toast.error('Please log in first')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/cheat-sheets/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sheet_type: sheetType,
          sports: sports.length > 0 ? sports : undefined,
          picks_limit: picksLimit,
          min_confidence: minConfidence,
          theme,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate cheat sheet')
      }

      setResult(data)
      toast.success('Cheat sheet generated!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSport = (sport: string) => {
    setSports(prev =>
      prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please Log In</h1>
          <p className="text-gray-400">You need to be logged in to test cheat sheet generation</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Cheat Sheet Generator Test</h1>
          <p className="text-gray-400">
            Test the cheat sheet generation API and see the results
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Tier: <span className="font-semibold text-blue-400">{profile?.subscription_tier || 'free'}</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>

          {/* Sheet Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sheet Type
            </label>
            <select
              value={sheetType}
              onChange={(e) => setSheetType(e.target.value as any)}
              className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-2 text-white"
            >
              <option value="daily_digest">Daily Digest</option>
              <option value="player_prop" disabled>Player Prop (Phase 2)</option>
              <option value="game_matchup" disabled>Game Matchup (Phase 3)</option>
              <option value="parlay_blueprint" disabled>Parlay Blueprint (Phase 3)</option>
            </select>
          </div>

          {/* Sports Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sports Filter (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {['MLB', 'NBA', 'NFL', 'NHL', 'WNBA', 'UFC', 'CFB'].map(sport => (
                <button
                  key={sport}
                  onClick={() => toggleSport(sport)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    sports.includes(sport)
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>
            {sports.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">All sports will be included</p>
            )}
          </div>

          {/* Picks Limit */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Picks Limit: {picksLimit}
            </label>
            <input
              type="range"
              min="3"
              max="20"
              value={picksLimit}
              onChange={(e) => setPicksLimit(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Min Confidence */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Min Confidence: {minConfidence}%
            </label>
            <input
              type="range"
              min="50"
              max="95"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Theme */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Theme {profile?.subscription_tier !== 'elite' && '(Elite only for custom themes)'}
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-2 text-white"
              disabled={profile?.subscription_tier !== 'elite' && theme !== 'dark_glass'}
            >
              <option value="dark_glass">Dark Glass (Default)</option>
              <option value="blue_blaze" disabled={profile?.subscription_tier !== 'elite'}>
                Blue Blaze (Elite)
              </option>
              <option value="team_colors" disabled={profile?.subscription_tier !== 'elite'}>
                Team Colors (Elite)
              </option>
            </select>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Cheat Sheet'
            )}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">✅ Success!</h2>
            
            <div className="space-y-3 mb-4">
              <div>
                <span className="text-sm text-gray-400">Title:</span>
                <p className="text-white font-medium">{result.title}</p>
              </div>
              <div>
                <span className="text-sm text-gray-400">Summary:</span>
                <p className="text-white">{result.summary}</p>
              </div>
              <div>
                <span className="text-sm text-gray-400">Share ID:</span>
                <p className="text-white font-mono text-sm">{result.share_id}</p>
              </div>
            </div>

            <a
              href={result.share_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-white/10 border border-white/10 px-6 py-3 text-white font-semibold hover:bg-white/20 transition-colors"
            >
              Open Cheat Sheet →
            </a>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-white">
                View Raw Response
              </summary>
              <pre className="mt-2 rounded-lg bg-black/50 p-4 text-xs text-gray-300 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">ℹ️ Testing Notes</h3>
          <ul className="text-xs text-gray-300 space-y-1">
            <li>• Free tier: 1 cheat sheet per day</li>
            <li>• Pro tier: Unlimited cheat sheets</li>
            <li>• Elite tier: Unlimited + custom themes</li>
            <li>• Data is pulled from real ai_predictions and ai_trends tables</li>
            <li>• Share page includes PNG download functionality</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
