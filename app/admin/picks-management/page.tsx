'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { checkAdminAccess } from '@/lib/adminAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, ArrowLeft, Plus, Download, RefreshCw, Calendar, TrendingUp,
  Trophy, Clock, XCircle, Edit3, Check, X, Search, BarChart3, DollarSign, Percent
} from 'lucide-react'
import PredictionsCenter from '../components/PredictionsCenter'
import toast from 'react-hot-toast'

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
  status: string
  created_at: string
  bet_type: string | null
  roi_estimate: string | null
  value_percentage: string | null
  user?: { email: string }
}

export default function PicksManagementPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [predictions, setPredictions] = useState<AIPrediction[]>([])
  const [stats, setStats] = useState({
    total: 0, pending: 0, won: 0, lost: 0,
    winRate: 0, totalROI: 0, avgConfidence: 0, todayPicks: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sportFilter, setSportFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')
  const [showPredictionsCenter, setShowPredictionsCenter] = useState(false)
  const [editingPick, setEditingPick] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{[key: string]: any}>({})

  useEffect(() => {
    checkAccess()
  }, [user])

  useEffect(() => {
    if (user) {
      loadPredictions()
      loadStats()
    }
  }, [user, statusFilter, sportFilter, dateFilter])

  const checkAccess = async () => {
    if (!user) {
      router.push('/dashboard')
      return
    }
    const hasAccess = await checkAdminAccess(user.id)
    if (!hasAccess) {
      router.push('/dashboard')
      return
    }
    setLoading(false)
  }

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: allPredictions } = await supabase
        .from('ai_predictions')
        .select('*')
      
      if (allPredictions) {
        const todaysPredictions = allPredictions.filter(p => 
          p.created_at.split('T')[0] === today
        )
        const wonCount = allPredictions.filter(p => p.status === 'won').length
        const lostCount = allPredictions.filter(p => p.status === 'lost').length
        const totalCompleted = wonCount + lostCount
        
        setStats({
          total: allPredictions.length,
          pending: allPredictions.filter(p => p.status === 'pending').length,
          won: wonCount,
          lost: lostCount,
          winRate: totalCompleted > 0 ? (wonCount / totalCompleted) * 100 : 0,
          totalROI: allPredictions
            .filter(p => p.roi_estimate)
            .reduce((sum, p) => sum + parseFloat(p.roi_estimate || '0'), 0),
          avgConfidence: allPredictions
            .filter(p => p.confidence)
            .reduce((sum, p, _, arr) => sum + (p.confidence || 0) / arr.length, 0),
          todayPicks: todaysPredictions.length
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadPredictions = async () => {
    try {
      let query = supabase
        .from('ai_predictions')
        .select('*, user:profiles!user_id(email)')
        .order('created_at', { ascending: false })

      if (dateFilter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        query = query.gte('created_at', today)
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('created_at', weekAgo)
      }

      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      if (sportFilter !== 'all') query = query.eq('sport', sportFilter)
      if (searchTerm) {
        query = query.or(`match_teams.ilike.%${searchTerm}%,pick.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setPredictions(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load predictions')
    }
  }

  const updatePrediction = async (id: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('ai_predictions')
        .update(updates)
        .eq('id', id)
      if (error) throw error
      toast.success('Updated successfully')
      loadPredictions()
      loadStats()
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  const exportData = () => {
    const csv = [
      ['Date', 'Sport', 'Teams', 'Pick', 'Odds', 'Confidence', 'Status', 'User'].join(','),
      ...predictions.map(p => [
        p.created_at, p.sport, p.match_teams, p.pick, p.odds,
        p.confidence || '', p.status, p.user?.email || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `predictions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/admin')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div className="flex items-center space-x-3">
                <Target className="w-8 h-8 text-green-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">Picks Management Center</h1>
                  <p className="text-gray-400 text-sm">Comprehensive AI predictions control</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPredictionsCenter(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Run Predictions</span>
              </button>
              <button
                onClick={exportData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          {[
            { icon: BarChart3, color: 'blue', value: stats.total, label: 'Total Picks' },
            { icon: Calendar, color: 'purple', value: stats.todayPicks, label: 'Today' },
            { icon: Trophy, color: 'green', value: stats.won, label: 'Won' },
            { icon: XCircle, color: 'red', value: stats.lost, label: 'Lost' },
            { icon: Clock, color: 'yellow', value: stats.pending, label: 'Pending' },
            { icon: Percent, color: 'cyan', value: `${stats.winRate.toFixed(1)}%`, label: 'Win Rate' },
            { icon: TrendingUp, color: 'orange', value: `${stats.avgConfidence.toFixed(0)}%`, label: 'Avg Conf' },
            { icon: DollarSign, color: 'green', value: `+${stats.totalROI.toFixed(0)}`, label: 'Total ROI' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                <span className="text-xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-gray-400 text-xs">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500"
              />
            </div>
            
            {[
              { value: dateFilter, setter: setDateFilter, options: [
                { value: 'all', label: 'All Time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Last Week' }
              ]},
              { value: statusFilter, setter: setStatusFilter, options: [
                { value: 'all', label: 'All Status' },
                { value: 'pending', label: 'Pending' },
                { value: 'won', label: 'Won' },
                { value: 'lost', label: 'Lost' }
              ]},
              { value: sportFilter, setter: setSportFilter, options: [
                { value: 'all', label: 'All Sports' },
                { value: 'MLB', label: 'MLB' },
                { value: 'NFL', label: 'NFL' },
                { value: 'NBA', label: 'NBA' },
                { value: 'NHL', label: 'NHL' }
              ]}
            ].map((filter, i) => (
              <select
                key={i}
                value={filter.value}
                onChange={(e) => filter.setter(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                {filter.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ))}

            <button
              onClick={() => {
                setSearchTerm('')
                setDateFilter('today')
                setStatusFilter('all')
                setSportFilter('all')
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Predictions Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black/20 border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Sport</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Match</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Pick</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Odds</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Conf</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${
                        p.sport === 'MLB' ? 'blue' : p.sport === 'NFL' ? 'purple' : 'gray'
                      }-500/20 text-${
                        p.sport === 'MLB' ? 'blue' : p.sport === 'NFL' ? 'purple' : 'gray'
                      }-300`}>
                        {p.sport}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-white">{p.match_teams}</td>
                    <td className="px-4 py-4 text-sm text-white">{p.pick}</td>
                    <td className="px-4 py-4 text-sm font-mono text-green-400">{p.odds}</td>
                    <td className="px-4 py-4 text-sm text-gray-400">{p.confidence}%</td>
                    <td className="px-4 py-4">
                      <select
                        value={p.status}
                        onChange={(e) => updatePrediction(p.id, { status: e.target.value })}
                        className={`px-2 py-1 rounded-full text-xs font-medium bg-${
                          p.status === 'won' ? 'green' : p.status === 'lost' ? 'red' : 'yellow'
                        }-500/20 text-${
                          p.status === 'won' ? 'green' : p.status === 'lost' ? 'red' : 'yellow'
                        }-300`}
                      >
                        <option value="pending">Pending</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">{p.user?.email || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Predictions Center Modal */}
      <AnimatePresence>
        {showPredictionsCenter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Run Predictions</h2>
                <button onClick={() => setShowPredictionsCenter(false)} className="p-2 text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <PredictionsCenter />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
