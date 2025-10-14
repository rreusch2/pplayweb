'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Save,
  Image as ImageIcon,
  Link as LinkIcon,
  Calendar,
  DollarSign,
  Target,
  AlertCircle,
  Trophy,
  User
} from 'lucide-react'
import { motion } from 'framer-motion'
import Portal from './Portal'
import ImageSelector from '../components/ImageSelector'

interface AIPrediction {
  id: string
  user_id: string
  match_teams: string
  pick: string
  odds: string
  confidence: number | null
  sport: string
  event_time: string
  reasoning: string | null
  value_percentage: number | null
  roi_estimate: number | null
  status: string | null
  game_id: string | null
  metadata: any
  created_at: string
  updated_at: string
  bet_type: string | null
  player_id: string | null
  prop_market_type: string | null
  line_value: number | null
  prediction_value: number | null
  is_parlay_leg: boolean | null
  parlay_id: string | null
  kelly_stake: number | null
  expected_value: number | null
  risk_level: string | null
  implied_probability: number | null
  fair_odds: string | null
  key_factors: any
  league_logo_url: string | null
  sportsbook_logo_url: string | null
}

interface Props {
  prediction: AIPrediction
  onSave: (prediction: AIPrediction) => void
  onClose: () => void
}

const SPORTS = ['MLB', 'NFL', 'NBA', 'NHL', 'WNBA', 'UFC', 'MMA', 'CFB', 'CBB']
const BET_TYPES = ['moneyline', 'spread', 'total', 'player_prop', 'parlay']
const STATUSES = ['pending', 'won', 'lost', 'push', 'void', 'live']
const RISK_LEVELS = ['low', 'medium', 'high', 'extreme']

// Common prop types for quick selection
const PROP_TYPES = {
  MLB: ['Batter Hits O/U', 'Batter Total Bases O/U', 'Batter Home Runs O/U', 'Batter RBIs O/U', 
        'Batter Runs Scored O/U', 'Pitcher Strikeouts O/U', 'Pitcher Hits Allowed O/U'],
  NFL: ['Passing Yards O/U', 'Passing TDs O/U', 'Rushing Yards O/U', 'Receiving Yards O/U', 
        'Receptions O/U', 'Anytime TD Scorer'],
  NBA: ['Points O/U', 'Rebounds O/U', 'Assists O/U', 'Threes Made O/U', 'PRA O/U'],
  NHL: ['Goals O/U', 'Assists O/U', 'Shots O/U', 'Points O/U', 'Saves O/U'],
  WNBA: ['Points O/U', 'Rebounds O/U', 'Assists O/U', 'Threes Made O/U', 'PRA O/U'],
}

export default function PickEditor({ prediction, onSave, onClose }: Props) {
  const [editedPrediction, setEditedPrediction] = useState<AIPrediction>({ ...prediction })
  const [showImageSelector, setShowImageSelector] = useState<'league' | 'sportsbook' | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'financial' | 'metadata'>('basic')

  const handleFieldChange = (field: keyof AIPrediction, value: any) => {
    setEditedPrediction(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageSelect = (url: string, type: 'league' | 'sportsbook') => {
    if (type === 'league') {
      handleFieldChange('league_logo_url', url)
    } else {
      handleFieldChange('sportsbook_logo_url', url)
    }
    setShowImageSelector(null)
  }

  const handleSave = () => {
    onSave(editedPrediction)
  }

  const handleKeyFactorChange = (key: string, value: string) => {
    const newKeyFactors = { ...(editedPrediction.key_factors || {}), [key]: value }
    if (value === '') {
      delete newKeyFactors[key]
    }
    handleFieldChange('key_factors', newKeyFactors)
  }

  const addKeyFactor = () => {
    const key = prompt('Enter factor name:')
    if (key) {
      handleKeyFactorChange(key, '')
    }
  }

  const getPropTypesForSport = () => {
    return PROP_TYPES[editedPrediction.sport as keyof typeof PROP_TYPES] || []
  }

  // Body scroll lock and Escape to close
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = original
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <>
      <Portal>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[min(640px,calc(100vw-2rem))] max-h-[80vh] bg-gray-900 rounded-lg border border-gray-800 flex flex-col shadow-2xl"
          >
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="text-green-500" size={20} />
            Edit Pick
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 px-6 flex-shrink-0">
          <div className="flex gap-4">
            {(['basic', 'advanced', 'financial', 'metadata'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 capitalize border-b-2 transition-colors ${
                  activeTab === tab 
                    ? 'border-green-500 text-green-500' 
                    : 'border-transparent hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Sport */}
              <div>
                <label className="block text-sm font-medium mb-2">Sport</label>
                <select
                  value={editedPrediction.sport}
                  onChange={(e) => handleFieldChange('sport', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {SPORTS.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>

              {/* Match Teams */}
              <div>
                <label className="block text-sm font-medium mb-2">Match/Teams</label>
                <input
                  type="text"
                  value={editedPrediction.match_teams}
                  onChange={(e) => handleFieldChange('match_teams', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Team A vs Team B"
                />
              </div>

              {/* Pick */}
              <div>
                <label className="block text-sm font-medium mb-2">Pick</label>
                <input
                  type="text"
                  value={editedPrediction.pick}
                  onChange={(e) => handleFieldChange('pick', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Team A / Over / Player Name"
                />
              </div>

              {/* Odds */}
              <div>
                <label className="block text-sm font-medium mb-2">Odds</label>
                <input
                  type="text"
                  value={editedPrediction.odds}
                  onChange={(e) => handleFieldChange('odds', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="+150 or -110"
                />
              </div>

              {/* Confidence */}
              <div>
                <label className="block text-sm font-medium mb-2">Confidence (%)</label>
                <input
                  type="number"
                  value={editedPrediction.confidence || ''}
                  onChange={(e) => handleFieldChange('confidence', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  min="0"
                  max="100"
                />
              </div>

              {/* Event Time */}
              <div>
                <label className="block text-sm font-medium mb-2">Event Time</label>
                <input
                  type="datetime-local"
                  value={editedPrediction.event_time ? new Date(editedPrediction.event_time).toISOString().slice(0, -1) : ''}
                  onChange={(e) => handleFieldChange('event_time', new Date(e.target.value).toISOString())}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={editedPrediction.status || 'pending'}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Reasoning */}
              <div>
                <label className="block text-sm font-medium mb-2">Reasoning/Analysis</label>
                <textarea
                  value={editedPrediction.reasoning || ''}
                  onChange={(e) => handleFieldChange('reasoning', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  rows={4}
                  placeholder="Explain the pick reasoning..."
                />
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-4">
              {/* Bet Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Bet Type</label>
                <select
                  value={editedPrediction.bet_type || 'moneyline'}
                  onChange={(e) => handleFieldChange('bet_type', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {BET_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Player Props Section */}
              {editedPrediction.bet_type === 'player_prop' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Prop Market Type</label>
                    <div className="space-y-2">
                      <select
                        value={editedPrediction.prop_market_type || ''}
                        onChange={(e) => handleFieldChange('prop_market_type', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                      >
                        <option value="">Custom...</option>
                        {getPropTypesForSport().map(prop => (
                          <option key={prop} value={prop}>{prop}</option>
                        ))}
                      </select>
                      {editedPrediction.prop_market_type === '' && (
                        <input
                          type="text"
                          placeholder="Enter custom prop type"
                          className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                          onChange={(e) => handleFieldChange('prop_market_type', e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Line Value</label>
                    <input
                      type="number"
                      step="0.5"
                      value={editedPrediction.line_value || ''}
                      onChange={(e) => handleFieldChange('line_value', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                      placeholder="2.5"
                    />
                  </div>
                </>
              )}

              {/* Risk Level */}
              <div>
                <label className="block text-sm font-medium mb-2">Risk Level</label>
                <select
                  value={editedPrediction.risk_level || 'medium'}
                  onChange={(e) => handleFieldChange('risk_level', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {RISK_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              {/* League Logo */}
              <div>
                <label className="block text-sm font-medium mb-2">League Logo URL</label>
                <div className="flex items-center gap-2">
                  {editedPrediction.league_logo_url && (
                    <img 
                      src={editedPrediction.league_logo_url} 
                      alt="League" 
                      className="w-10 h-10 object-contain bg-gray-800 rounded p-1"
                    />
                  )}
                  <button
                    onClick={() => setShowImageSelector('league')}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded flex items-center gap-2 transition-colors"
                  >
                    <ImageIcon size={16} />
                    Select Logo
                  </button>
                  <input
                    type="text"
                    value={editedPrediction.league_logo_url || ''}
                    onChange={(e) => handleFieldChange('league_logo_url', e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Sportsbook Logo */}
              <div>
                <label className="block text-sm font-medium mb-2">Sportsbook Logo URL</label>
                <div className="flex items-center gap-2">
                  {editedPrediction.sportsbook_logo_url && (
                    <img 
                      src={editedPrediction.sportsbook_logo_url} 
                      alt="Sportsbook" 
                      className="w-10 h-10 object-contain bg-gray-800 rounded p-1"
                    />
                  )}
                  <button
                    onClick={() => setShowImageSelector('sportsbook')}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded flex items-center gap-2 transition-colors"
                  >
                    <ImageIcon size={16} />
                    Select Logo
                  </button>
                  <input
                    type="text"
                    value={editedPrediction.sportsbook_logo_url || ''}
                    onChange={(e) => handleFieldChange('sportsbook_logo_url', e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Key Factors */}
              <div>
                <label className="block text-sm font-medium mb-2">Key Factors</label>
                <div className="space-y-2">
                  {Object.entries(editedPrediction.key_factors || {}).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={key}
                        disabled
                        className="w-1/3 px-3 py-2 bg-gray-700 rounded-lg"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleKeyFactorChange(key, e.target.value)}
                        className="flex-1 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                      />
                      <button
                        onClick={() => handleKeyFactorChange(key, '')}
                        className="p-2 text-red-400 hover:bg-red-900/20 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addKeyFactor}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                  >
                    + Add Factor
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-4">
              {/* Value Percentage */}
              <div>
                <label className="block text-sm font-medium mb-2">Value Percentage (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editedPrediction.value_percentage || ''}
                  onChange={(e) => handleFieldChange('value_percentage', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="15.5"
                />
              </div>

              {/* ROI Estimate */}
              <div>
                <label className="block text-sm font-medium mb-2">ROI Estimate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editedPrediction.roi_estimate || ''}
                  onChange={(e) => handleFieldChange('roi_estimate', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="8.75"
                />
              </div>

              {/* Expected Value */}
              <div>
                <label className="block text-sm font-medium mb-2">Expected Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={editedPrediction.expected_value || ''}
                  onChange={(e) => handleFieldChange('expected_value', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0.125"
                />
              </div>

              {/* Kelly Stake */}
              <div>
                <label className="block text-sm font-medium mb-2">Kelly Stake (0-1)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max="1"
                  value={editedPrediction.kelly_stake || ''}
                  onChange={(e) => handleFieldChange('kelly_stake', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0.025"
                />
              </div>

              {/* Implied Probability */}
              <div>
                <label className="block text-sm font-medium mb-2">Implied Probability (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editedPrediction.implied_probability || ''}
                  onChange={(e) => handleFieldChange('implied_probability', e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="52.5"
                />
              </div>

              {/* Fair Odds */}
              <div>
                <label className="block text-sm font-medium mb-2">Fair Odds</label>
                <input
                  type="text"
                  value={editedPrediction.fair_odds || ''}
                  onChange={(e) => handleFieldChange('fair_odds', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="+110"
                />
              </div>
            </div>
          )}

          {activeTab === 'metadata' && (
            <div className="space-y-4">
              {/* Game ID */}
              <div>
                <label className="block text-sm font-medium mb-2">Game ID</label>
                <input
                  type="text"
                  value={editedPrediction.game_id || ''}
                  onChange={(e) => handleFieldChange('game_id', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              {/* Parlay Settings */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <input
                    type="checkbox"
                    checked={editedPrediction.is_parlay_leg || false}
                    onChange={(e) => handleFieldChange('is_parlay_leg', e.target.checked)}
                    className="mr-2"
                  />
                  Is Parlay Leg
                </label>
                {editedPrediction.is_parlay_leg && (
                  <input
                    type="text"
                    value={editedPrediction.parlay_id || ''}
                    onChange={(e) => handleFieldChange('parlay_id', e.target.value)}
                    className="w-full mt-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Parlay ID"
                  />
                )}
              </div>

              {/* Raw Metadata */}
              <div>
                <label className="block text-sm font-medium mb-2">Custom Metadata (JSON)</label>
                <textarea
                  value={JSON.stringify(editedPrediction.metadata || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      handleFieldChange('metadata', parsed)
                    } catch {
                      // Invalid JSON, don't update
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none font-mono text-xs"
                  rows={10}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="text-xs text-gray-400">
            ID: {editedPrediction.id.slice(0, 8)}...
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
          </motion.div>
        </div>
      </Portal>

      {/* Image Selector Modal */}
      {showImageSelector && (
        <ImageSelector
          type={showImageSelector}
          onSelect={handleImageSelect}
          onClose={() => setShowImageSelector(null)}
        />
      )}
    </>
  )
}
