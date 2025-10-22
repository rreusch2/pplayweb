'use client'
import { useState, useEffect, useMemo, memo } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { useDirectPredictions } from '@/hooks/useDirectPredictions'
import { motion } from 'framer-motion'
import { 
  Zap, 
  Target,
  Activity,
  BarChart3,
  MessageCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Brain,
  Crown,
  Lock
} from 'lucide-react'
import TierEnhancedUI, { TierGatedContent, NoUpgradePrompts, TierButton } from '@/components/TierEnhancedUI'
import { getTierStyling } from '@/lib/subscriptionUtils'

// Row component for virtualized list
const PredictionRow = memo(function PredictionRow({
  prediction,
  subscriptionTier,
  onClick,
}: {
  prediction: any
  subscriptionTier: 'free' | 'pro' | 'elite' | string
  onClick: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.25 }}
      className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group mb-4"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${
              (prediction?.confidence ?? 0) >= 80 ? 'bg-green-500' :
              (prediction?.confidence ?? 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors">
              {prediction?.match || prediction?.match_teams || prediction?.title || 'Prediction'}
            </h3>
            {prediction?.sport || prediction?.league ? (
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                {prediction?.sport || prediction?.league}
              </span>
            ) : null}
            {(prediction?.confidence ?? 0) >= 80 && (
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full flex items-center">
                <Sparkles className="w-3 h-3 mr-1" />
                HIGH CONFIDENCE
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <p className="text-gray-400 text-sm">Pick</p>
              <p className="text-white font-medium">{prediction?.pick ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Odds</p>
              <p className="text-white font-medium">{prediction?.odds ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Confidence</p>
              <p className={`font-bold ${
                (prediction?.confidence ?? 0) >= 80 ? 'text-green-400' :
                (prediction?.confidence ?? 0) >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {prediction?.confidence ?? 0}%
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Value</p>
              <p className="text-green-400 font-medium">
                {prediction?.value_percentage ? `${prediction.value_percentage}%` : 'TBD'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">ROI Est.</p>
              <p className="text-blue-400 font-medium">
                {prediction?.roi_estimate ? `${prediction.roi_estimate}%` : 'TBD'}
              </p>
            </div>
          </div>

          {prediction?.reasoning && (
            <div className="bg-black/20 rounded-lg p-3 mb-3">
              <p className="text-gray-300 text-sm line-clamp-2 group-hover:line-clamp-none transition-all">
                {prediction.reasoning}
              </p>
            </div>
          )}

          {subscriptionTier !== 'free' && prediction?.key_factors && (
            <div className="flex flex-wrap gap-2">
              {prediction.key_factors.slice(0, 3).map((factor: string, idx: number) => (
                <span key={idx} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                  {factor}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <MessageCircle className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      {subscriptionTier === 'free' && (
        <div className="mt-4 p-3 bg-gray-600/20 rounded-lg border border-gray-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Advanced analytics locked</span>
            </div>
            <div className="flex items-center space-x-1">
              <Crown className="w-3 h-3 text-yellow-400" />
              <span className="text-xs text-gray-400">Pro Feature</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
})

export default function PredictionsPage() {
  const { user, profile, initializing } = useAuth()
  const { subscriptionTier } = useSubscription()
  const [activeTab, setActiveTab] = useState<'all' | 'team' | 'props'>('all')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  const {
    predictions,
    teamPicks,
    propsPicks: playerPropsPicks,
    loading: isLoading,
    error,
    fetchPredictions,
    fetchLockOfTheDay,
    highConfidencePicks,
    averageConfidence
  } = useDirectPredictions()
  
  // Aliases for compatibility
  const isLoadingTeam = isLoading
  const isLoadingProps = isLoading
  const refreshing = isLoading
  const refreshAll = fetchPredictions
  const generatePredictions = async () => {
    // This can be handled server-side
    console.log('Generate predictions not implemented in direct mode')
  }

  const tierStyling = getTierStyling(subscriptionTier as any)

  useEffect(() => {
    if (!initializing && !user) {
      router.push('/')
      return
    }
    if (user) {
      setMounted(true)
    }
  }, [user, initializing, router])

  // Combine team + props for All tab
  const combinedAll = useMemo(() => {
    return [...teamPicks, ...playerPropsPicks]
  }, [teamPicks, playerPropsPicks])

  const combinedLoading = isLoadingTeam || isLoadingProps

  const combinedAvgConfidence = useMemo(() => {
    if (combinedAll.length === 0) return 0
    const sum = combinedAll.reduce((acc, p) => acc + (p.confidence || 0), 0)
    return sum / combinedAll.length
  }, [combinedAll])

  const combinedHighConfidenceCount = useMemo(() => {
    return combinedAll.filter(p => (p.confidence || 0) >= 80).length
  }, [combinedAll])

  const currentPredictions = activeTab === 'all' ? combinedAll : 
                            activeTab === 'team' ? teamPicks : playerPropsPicks
  const currentLoading = activeTab === 'all' ? combinedLoading :
                        activeTab === 'team' ? isLoadingTeam : isLoadingProps

  if (initializing || !mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect via useEffect
  }

  return (
    <TierEnhancedUI>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        {/* Enhanced Header with tier-based styling */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className={`mb-8 p-6 rounded-xl ${
            subscriptionTier === 'elite' ? 'bg-gradient-to-r from-yellow-900/20 to-amber-900/20 border border-yellow-500/30' :
            subscriptionTier === 'pro' ? 'bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30' :
            'bg-gray-800/30 border border-gray-700/30'
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-4xl font-bold text-white">AI Predictions</h1>
                <TierGatedContent requiredTier="pro">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    subscriptionTier === 'elite' ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-black' :
                    'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  }`}>
                    {subscriptionTier.toUpperCase()} TIER
                  </div>
                </TierGatedContent>
              </div>
              <p className={`text-xl ${
                subscriptionTier === 'elite' ? 'text-yellow-300' :
                subscriptionTier === 'pro' ? 'text-purple-300' :
                'text-gray-300'
              }`}>
                {subscriptionTier === 'elite' ? 'Elite AI analytics with premium machine learning models 🏆' :
                 subscriptionTier === 'pro' ? 'Professional AI analytics powered by advanced machine learning 🚀' :
                 'Advanced analytics powered by machine learning'}
              </p>
            </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshAll}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            

          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Total Predictions</h3>
                <div className="text-2xl font-bold text-blue-400">
                  {combinedLoading ? (
                    <div className="animate-pulse bg-gray-600 h-6 w-8 rounded"></div>
                  ) : (
                    combinedAll.length
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Avg Confidence</h3>
                <div className="text-2xl font-bold text-green-400">
                  {combinedLoading ? (
                    <div className="animate-pulse bg-gray-600 h-6 w-12 rounded"></div>
                  ) : (
                    `${combinedAvgConfidence.toFixed(1)}%`
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">High Confidence</h3>
                <div className="text-2xl font-bold text-purple-400">
                  {combinedLoading ? (
                    <div className="animate-pulse bg-gray-600 h-6 w-8 rounded"></div>
                  ) : (
                    combinedHighConfidenceCount
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Team Picks</h3>
                <div className="text-2xl font-bold text-yellow-400">
                  {isLoadingTeam ? (
                    <div className="animate-pulse bg-gray-600 h-6 w-8 rounded"></div>
                  ) : (
                    teamPicks.length
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-8 sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-black/20 bg-black/10 rounded-lg"
      >
        <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-lg p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            All Predictions ({combinedAll.length})
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'team'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Team Picks ({teamPicks.length})
          </button>
          <button
            onClick={() => setActiveTab('props')}
            className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 ${
              activeTab === 'props'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            Player Props ({playerPropsPicks.length})
          </button>
        </div>
      </motion.div>

      {/* Predictions Display (Virtualized) */}
      <div className="min-h-[300px]">
        {currentLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-white font-medium">Loading AI predictions...</span>
            </div>
          </div>
        )}

        {!currentLoading && currentPredictions.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center"
          >
            <Brain className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              No {activeTab === 'all' ? '' : activeTab === 'team' ? 'team ' : 'player props '}predictions available
            </h3>
            <p className="text-gray-400 mb-4">Check back soon for the latest AI predictions</p>
          </motion.div>
        )}

        {!currentLoading && currentPredictions.length > 0 && (
          <Virtuoso
            data={currentPredictions}
            style={{ height: 'calc(100vh - 320px)' }}
            itemContent={(index, prediction) => (
              <PredictionRow
                key={prediction.id}
                prediction={prediction}
                subscriptionTier={subscriptionTier as any}
                onClick={() => router.push('/chat')}
              />
            )}
            increaseViewportBy={{ top: 200, bottom: 400 }}
          />
        )}
      </div>
      </div>
    </TierEnhancedUI>
  )
}
