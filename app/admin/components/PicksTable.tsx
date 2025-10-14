'use client'

import { useState } from 'react'
import {
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Target,
  Clock,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react'
import { motion } from 'framer-motion'

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
  predictions: AIPrediction[]
  onEdit: (prediction: AIPrediction) => void
  onDelete: (id: string) => void
}

export default function PicksTable({ predictions, onEdit, onDelete }: Props) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const getStatusColor = (status: string | null) => {
    switch(status) {
      case 'won': return 'bg-green-500/20 text-green-400'
      case 'lost': return 'bg-red-500/20 text-red-400'
      case 'push': return 'bg-yellow-500/20 text-yellow-400'
      case 'live': return 'bg-blue-500/20 text-blue-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getRiskColor = (risk: string | null) => {
    switch(risk) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-orange-400'
      case 'extreme': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const formatOdds = (odds: string) => {
    if (odds.startsWith('+')) return <span className="text-green-400">{odds}</span>
    if (odds.startsWith('-')) return <span className="text-red-400">{odds}</span>
    return odds
  }

  return (
    <div className="space-y-2">
      {predictions.map((prediction) => {
        const isExpanded = expandedRows.has(prediction.id)
        
        return (
          <motion.div
            key={prediction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden"
          >
            {/* Main Row */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                {/* Left Section */}
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleRow(prediction.id)}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                  >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>

                  {/* Sport Badge */}
                  <div className="flex items-center gap-2">
                    {prediction.league_logo_url && (
                      <img 
                        src={prediction.league_logo_url} 
                        alt={prediction.sport}
                        className="w-6 h-6 object-contain"
                      />
                    )}
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">
                      {prediction.sport}
                    </span>
                  </div>

                  {/* Teams/Match */}
                  <div className="flex-1 max-w-md">
                    <div className="font-semibold text-white truncate">
                      {prediction.match_teams}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Clock size={12} />
                      {new Date(prediction.event_time).toLocaleDateString()} {new Date(prediction.event_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>

                  {/* Pick */}
                  <div className="min-w-[150px]">
                    <div className="text-green-400 font-bold">{prediction.pick}</div>
                    {prediction.bet_type && (
                      <div className="text-xs text-gray-400 mt-1">
                        {prediction.bet_type.replace('_', ' ')}
                      </div>
                    )}
                  </div>

                  {/* Odds & Value */}
                  <div className="min-w-[100px]">
                    <div className="font-mono font-semibold">{formatOdds(prediction.odds)}</div>
                    {prediction.value_percentage && (
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <TrendingUp size={10} />
                        {prediction.value_percentage.toFixed(1)}% value
                      </div>
                    )}
                  </div>

                  {/* Confidence */}
                  <div className="min-w-[80px]">
                    <div className="flex items-center gap-1">
                      <Target size={14} className="text-yellow-400" />
                      <span className="font-bold">{prediction.confidence || 0}%</span>
                    </div>
                    {prediction.risk_level && (
                      <div className={`text-xs mt-1 ${getRiskColor(prediction.risk_level)}`}>
                        {prediction.risk_level}
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="min-w-[80px]">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(prediction.status)}`}>
                      {prediction.status || 'pending'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onEdit(prediction)}
                    className="p-2 rounded bg-blue-600 hover:bg-blue-700 transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(prediction.id)}
                    className="p-2 rounded bg-red-600 hover:bg-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-4 border-t border-gray-800"
              >
                <div className="grid grid-cols-2 gap-6 mt-4">
                  {/* Left Column */}
                  <div className="space-y-3">
                    {/* ID with Copy */}
                    <div>
                      <label className="text-xs text-gray-400">Prediction ID</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                          {prediction.id.slice(0, 8)}...
                        </code>
                        <button
                          onClick={() => handleCopy(prediction.id)}
                          className="p-1 hover:bg-gray-800 rounded transition-colors"
                        >
                          {copiedId === prediction.id ? (
                            <Check size={14} className="text-green-400" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Player Props Details */}
                    {prediction.bet_type === 'player_prop' && (
                      <>
                        <div>
                          <label className="text-xs text-gray-400">Prop Type</label>
                          <div className="text-sm mt-1">{prediction.prop_market_type || '-'}</div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Line</label>
                          <div className="text-sm mt-1">{prediction.line_value || '-'}</div>
                        </div>
                      </>
                    )}

                    {/* Financial Metrics */}
                    <div>
                      <label className="text-xs text-gray-400">ROI Estimate</label>
                      <div className="text-sm mt-1 flex items-center gap-1">
                        {prediction.roi_estimate ? (
                          <>
                            <DollarSign size={12} />
                            {prediction.roi_estimate.toFixed(2)}%
                          </>
                        ) : '-'}
                      </div>
                    </div>

                    {/* Expected Value */}
                    {prediction.expected_value && (
                      <div>
                        <label className="text-xs text-gray-400">Expected Value</label>
                        <div className="text-sm mt-1">{prediction.expected_value.toFixed(2)}</div>
                      </div>
                    )}

                    {/* Kelly Stake */}
                    {prediction.kelly_stake && (
                      <div>
                        <label className="text-xs text-gray-400">Kelly Stake</label>
                        <div className="text-sm mt-1">{(prediction.kelly_stake * 100).toFixed(1)}%</div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    {/* Reasoning */}
                    {prediction.reasoning && (
                      <div>
                        <label className="text-xs text-gray-400">Analysis</label>
                        <div className="text-sm mt-1 bg-gray-800 rounded p-2 max-h-32 overflow-y-auto">
                          {prediction.reasoning}
                        </div>
                      </div>
                    )}

                    {/* Key Factors */}
                    {prediction.key_factors && Object.keys(prediction.key_factors).length > 0 && (
                      <div>
                        <label className="text-xs text-gray-400">Key Factors</label>
                        <div className="text-sm mt-1 space-y-1">
                          {Object.entries(prediction.key_factors).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex items-center justify-between bg-gray-800 rounded px-2 py-1">
                              <span className="text-xs text-gray-400">{key}:</span>
                              <span className="text-xs">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    {prediction.metadata && (
                      <div>
                        <label className="text-xs text-gray-400">Metadata</label>
                        <pre className="text-xs mt-1 bg-gray-800 rounded p-2 overflow-x-auto">
                          {JSON.stringify(prediction.metadata, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Timestamps */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-gray-400">Created</label>
                        <div className="mt-1">{new Date(prediction.created_at).toLocaleString()}</div>
                      </div>
                      <div>
                        <label className="text-gray-400">Updated</label>
                        <div className="mt-1">{new Date(prediction.updated_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
