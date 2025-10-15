'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Target, Filter, Calendar, Trophy, Clock, ChevronDown, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import MobilePredictionCard from './MobilePredictionCard'

interface PicksModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobilePicksModal({ isOpen, onClose }: PicksModalProps) {
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sportFilter, setSportFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({ total: 0, won: 0, lost: 0, pending: 0 })
  const pageSize = 10

  useEffect(() => {
    if (isOpen) {
      loadPredictions()
    }
  }, [isOpen, currentPage, statusFilter, sportFilter])

  const loadPredictions = async () => {
    try {
      let query = supabase
        .from('ai_predictions')
        .select('*', { count: 'exact' })
        .gte('created_at', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (sportFilter !== 'all') {
        query = query.eq('sport', sportFilter)
      }

      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      setPredictions(data || [])
      
      // Calculate stats
      const allData = data || []
      setStats({
        total: count || 0,
        won: allData.filter(p => p.status === 'won').length,
        lost: allData.filter(p => p.status === 'lost').length,
        pending: allData.filter(p => p.status === 'pending').length
      })
    } catch (error) {
      console.error('Error loading predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 h-[90vh] bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 rounded-t-3xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md border-b border-white/10 rounded-t-3xl">
            {/* Drag Handle */}
            <div className="flex justify-center py-2">
              <div className="w-12 h-1 bg-white/30 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Target className="w-6 h-6 text-purple-400" />
                  <span>Picks Center</span>
                </h2>
                <p className="text-gray-400 text-sm mt-1">Manage AI predictions</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Stats Bar */}
            <div className="px-4 pb-3">
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-green-400">{stats.won}</p>
                  <p className="text-xs text-green-300">Won</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-red-400">{stats.lost}</p>
                  <p className="text-xs text-red-300">Lost</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
                  <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                  <p className="text-xs text-yellow-300">Pending</p>
                </div>
              </div>
            </div>

            {/* Filter Toggle */}
            <div className="px-4 pb-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full flex items-center justify-between px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 font-medium">Filters</span>
                  <div className="flex items-center gap-2">
                    {statusFilter !== 'all' && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                        {statusFilter}
                      </span>
                    )}
                    {sportFilter !== 'all' && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                        {sportFilter}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pb-3 space-y-3 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="won">Won</option>
                      <option value="lost">Lost</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <select
                      value={sportFilter}
                      onChange={(e) => {
                        setSportFilter(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Sports</option>
                      <option value="MLB">MLB</option>
                      <option value="NFL">NFL</option>
                      <option value="NBA">NBA</option>
                      <option value="NHL">NHL</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-400" />
              </div>
            ) : predictions.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg">No predictions found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {predictions.map((prediction, index) => (
                  <MobilePredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    index={index}
                    onUpdate={loadPredictions}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          {predictions.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-white/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">
                  Page {currentPage}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-500 text-white rounded-lg transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={predictions.length < pageSize}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:text-gray-500 text-white rounded-lg transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
