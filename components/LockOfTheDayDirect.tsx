'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Lock, 
  TrendingUp, 
  Target, 
  Sparkles, 
  Calendar,
  Clock,
  Trophy,
  Zap,
  ChevronRight,
  X
} from 'lucide-react'
import { predictionService, AIPrediction } from '@/services/directPredictionService'

interface LockOfTheDayProps {
  userId: string
}

export default function LockOfTheDayDirect({ userId }: LockOfTheDayProps) {
  const [lockPick, setLockPick] = useState<AIPrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchLockOfTheDay()
  }, [userId])

  const fetchLockOfTheDay = async () => {
    setLoading(true)
    try {
      // Get the highest confidence pick directly from Supabase
      const lock = await predictionService.getLockOfTheDay()
      setLockPick(lock)
    } catch (error) {
      console.error('Error fetching lock of the day:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatEventTime = (eventTime: string) => {
    const date = new Date(eventTime)
    const now = new Date()
    const diffInHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return `Today ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    } else {
      return date.toLocaleDateString([], { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      })
    }
  }

  const formatOdds = (odds: string) => {
    if (!odds) return 'N/A'
    if (odds.startsWith('+') || odds.startsWith('-')) return odds
    return `+${odds}`
  }

  if (loading || !mounted) {
    return (
      <div className="bg-gradient-to-br from-yellow-900/20 via-amber-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/40">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-500/20 rounded-lg"></div>
            <div className="h-6 bg-gray-700 rounded w-32"></div>
          </div>
          <div className="h-20 bg-gray-700/50 rounded"></div>
        </div>
      </div>
    )
  }

  if (!lockPick) {
    return (
      <div className="bg-gradient-to-br from-yellow-900/20 via-amber-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/40">
        <div className="flex items-center space-x-3 mb-4">
          <Lock className="w-8 h-8 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Lock of the Day 🔒</h2>
        </div>
        <p className="text-gray-400">No lock picks available at the moment. Check back later!</p>
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-yellow-900/20 via-amber-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/40 hover:border-yellow-400/60 transition-all duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg">
              <Lock className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Lock of the Day 🔒</h2>
              <p className="text-sm text-yellow-300">Elite's Highest Confidence Pick</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-2xl font-bold text-yellow-400">{lockPick.confidence}%</span>
          </div>
        </div>

        {/* Pick Content */}
        <div className="space-y-4">
          {/* Match Info */}
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 uppercase">{lockPick.sport}</span>
              <div className="flex items-center text-sm text-gray-400">
                <Clock className="w-4 h-4 mr-1" />
                {formatEventTime(lockPick.eventTime)}
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{lockPick.match}</h3>
            
            {/* The Pick */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-lg border border-yellow-500/30">
              <div>
                <p className="text-sm text-yellow-300 mb-1">THE PICK</p>
                <p className="text-lg font-bold text-white">{lockPick.pick}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-yellow-300 mb-1">ODDS</p>
                <p className="text-lg font-bold text-white">{formatOdds(lockPick.odds)}</p>
              </div>
            </div>
          </div>

          {/* Key Factors */}
          {lockPick.key_factors && lockPick.key_factors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400 uppercase">Key Factors</p>
              <div className="grid grid-cols-2 gap-2">
                {lockPick.key_factors.slice(0, 4).map((factor: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-gray-300">{factor}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Button */}
          <button
            onClick={() => setShowAnalysis(true)}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 rounded-lg transition-all duration-300"
          >
            <Sparkles className="w-5 h-5 text-black" />
            <span className="font-bold text-black">View AI Analysis</span>
            <ChevronRight className="w-5 h-5 text-black" />
          </button>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-yellow-500/20">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{lockPick.confidence}%</p>
              <p className="text-xs text-gray-400">Confidence</p>
            </div>
            {lockPick.value_percentage && (
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">+{lockPick.value_percentage}%</p>
                <p className="text-xs text-gray-400">Value Edge</p>
              </div>
            )}
            {lockPick.roi_estimate && (
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{lockPick.roi_estimate}%</p>
                <p className="text-xs text-gray-400">ROI Est.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Analysis Modal */}
      {showAnalysis && lockPick && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-yellow-500/30"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-bold text-white">AI Analysis 🧠</h3>
              <button
                onClick={() => setShowAnalysis(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">The Pick</h4>
                <p className="text-white">{lockPick.pick} @ {formatOdds(lockPick.odds)}</p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">Reasoning</h4>
                <p className="text-gray-300">{lockPick.reasoning}</p>
              </div>

              {lockPick.key_factors && lockPick.key_factors.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-yellow-400 mb-2">Key Factors</h4>
                  <ul className="space-y-2">
                    {lockPick.key_factors.map((factor: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Target className="w-4 h-4 text-yellow-400 mt-1" />
                        <span className="text-gray-300">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 p-4 bg-black/30 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">Confidence</p>
                  <p className="text-xl font-bold text-yellow-400">{lockPick.confidence}%</p>
                </div>
                {lockPick.value_percentage && (
                  <div>
                    <p className="text-sm text-gray-400">Value Edge</p>
                    <p className="text-xl font-bold text-green-400">+{lockPick.value_percentage}%</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
