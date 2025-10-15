'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Clock, XCircle, X, Edit3, Check, TrendingUp, ChevronDown, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface MobilePredictionCardProps {
  prediction: any
  index: number
  onUpdate: () => void
}

export default function MobilePredictionCard({ prediction, index, onUpdate }: MobilePredictionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [editingPick, setEditingPick] = useState(false)
  const [editingReasoning, setEditingReasoning] = useState(false)
  const [editValues, setEditValues] = useState({ pick: prediction.pick, reasoning: prediction.reasoning })
  const [updating, setUpdating] = useState(false)

  const updateStatus = async (newStatus: string) => {
    if (updating) return
    
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('ai_predictions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', prediction.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const updateField = async (field: string, value: string) => {
    if (updating) return
    
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('ai_predictions')
        .update({ 
          [field]: value,
          updated_at: new Date().toISOString()
        })
        .eq('id', prediction.id)

      if (error) throw error
      
      onUpdate()
      if (field === 'pick') setEditingPick(false)
      if (field === 'reasoning') setEditingReasoning(false)
    } catch (error) {
      console.error(`Error updating ${field}:`, error)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'won': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'lost': return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'cancelled': return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'won': return <Trophy className="w-4 h-4" />
      case 'lost': return <XCircle className="w-4 h-4" />
      case 'cancelled': return <X className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getSportColor = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'mlb': return 'bg-blue-600'
      case 'nfl': return 'bg-purple-600'
      case 'nba': return 'bg-orange-600'
      case 'nhl': return 'bg-indigo-600'
      default: return 'bg-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden"
    >
      {/* Main Content */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
        disabled={updating}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getSportColor(prediction.sport)}`}>
              {prediction.sport}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${getStatusColor(prediction.status)}`}>
              {getStatusIcon(prediction.status)}
              <span>{prediction.status.toUpperCase()}</span>
            </span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>

        {/* Teams */}
        <h3 className="text-white font-semibold text-lg mb-2">{prediction.match_teams}</h3>

        {/* Pick */}
        <div className="bg-white/5 rounded-lg p-3 mb-3">
          <p className="text-white font-medium">{prediction.pick}</p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 text-sm">
          {prediction.confidence && (
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">{prediction.confidence}%</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-mono">
              {prediction.odds > '0' ? '+' : ''}{prediction.odds}
            </span>
          </div>
          <span className="text-gray-500 text-xs ml-auto">
            {formatDate(prediction.created_at)}
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4 space-y-4 border-t border-white/10"
        >
          {/* Edit Pick */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300 text-sm font-medium">Pick:</label>
              <button
                onClick={() => setEditingPick(!editingPick)}
                disabled={updating}
                className="text-blue-400 hover:text-blue-300 disabled:text-gray-500"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            
            {editingPick ? (
              <div className="space-y-2">
                <textarea
                  value={editValues.pick}
                  onChange={(e) => setEditValues({ ...editValues, pick: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={2}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updateField('pick', editValues.pick)}
                    disabled={updating}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingPick(false)
                      setEditValues({ ...editValues, pick: prediction.pick })
                    }}
                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-white">{prediction.pick}</p>
              </div>
            )}
          </div>

          {/* Edit Reasoning */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-300 text-sm font-medium">Reasoning:</label>
              <button
                onClick={() => setEditingReasoning(!editingReasoning)}
                disabled={updating}
                className="text-blue-400 hover:text-blue-300 disabled:text-gray-500"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
            
            {editingReasoning ? (
              <div className="space-y-2">
                <textarea
                  value={editValues.reasoning}
                  onChange={(e) => setEditValues({ ...editValues, reasoning: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={4}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => updateField('reasoning', editValues.reasoning)}
                    disabled={updating}
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingReasoning(false)
                      setEditValues({ ...editValues, reasoning: prediction.reasoning })
                    }}
                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-lg p-3">
                <p className="text-gray-300 text-sm leading-relaxed">
                  {prediction.reasoning || 'No reasoning provided'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {prediction.status === 'pending' && (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
              <button
                onClick={() => updateStatus('won')}
                disabled={updating}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Trophy className="w-4 h-4" />
                Won
              </button>
              <button
                onClick={() => updateStatus('lost')}
                disabled={updating}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                Lost
              </button>
              <button
                onClick={() => updateStatus('cancelled')}
                disabled={updating}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs text-gray-400">
            {prediction.roi_estimate && (
              <div>ROI: {prediction.roi_estimate}%</div>
            )}
            {prediction.value_percentage && (
              <div>Value: {prediction.value_percentage}%</div>
            )}
            {prediction.bet_type && (
              <div>Type: {prediction.bet_type}</div>
            )}
            <div>Event: {formatDate(prediction.event_time)}</div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
