'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { checkAdminAccess } from '@/lib/adminAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, ArrowLeft, Plus, Download, RefreshCw, Calendar, TrendingUp,
  Trophy, Clock, XCircle, Edit3, Check, X, Search, BarChart3, DollarSign, Percent,
  Filter as FilterIcon, ChevronDown, ChevronUp, Eye
} from 'lucide-react'
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
  const [showAddPickModal, setShowAddPickModal] = useState(false)
  const [newPick, setNewPick] = useState({
    match_teams: '',
    pick: '',
    odds: '',
    sport: 'NFL',
    confidence: 75,
    reasoning: '',
    bet_type: 'moneyline'
  })
  const [editingPick, setEditingPick] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{[key: string]: any}>({})
  const [showFilters, setShowFilters] = useState(false)
  const [expandedPickId, setExpandedPickId] = useState<string | null>(null)

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
      // First get predictions
      let query = supabase
        .from('ai_predictions')
        .select('*')
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
      
      // Then get user emails separately if needed
      if (data && data.length > 0) {
        const userIds = Array.from(new Set(data.map(p => p.user_id).filter(Boolean)))
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email')
            .in('id', userIds)
          
          if (profiles) {
            const userMap = Object.fromEntries(profiles.map(p => [p.id, p.email]))
            data.forEach(prediction => {
              if (prediction.user_id && userMap[prediction.user_id]) {
                prediction.user = { email: userMap[prediction.user_id] }
              }
            })
          }
        }
      }
      
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 pb-20">
      {/* Mobile-Optimized Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
              <button 
                onClick={() => router.push('/admin')} 
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Back to admin"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-white truncate">Picks Center</h1>
                  <p className="text-gray-400 text-xs sm:text-sm hidden sm:block">AI predictions control</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowAddPickModal(true)}
                className="p-2 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all duration-200 active:scale-95 flex items-center space-x-1 sm:space-x-2 shadow-lg"
                aria-label="Add new pick"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Add Pick</span>
              </button>
              <button
                onClick={exportData}
                className="p-2 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 active:scale-95 flex items-center space-x-1 sm:space-x-2 shadow-lg"
                aria-label="Export data"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Stats Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
          {[
            { icon: BarChart3, color: 'blue', value: stats.total, label: 'Total', mobileLabel: 'Total' },
            { icon: Calendar, color: 'purple', value: stats.todayPicks, label: 'Today', mobileLabel: 'Today' },
            { icon: Trophy, color: 'green', value: stats.won, label: 'Won', mobileLabel: 'Won' },
            { icon: XCircle, color: 'red', value: stats.lost, label: 'Lost', mobileLabel: 'Lost' },
            { icon: Clock, color: 'yellow', value: stats.pending, label: 'Pending', mobileLabel: 'Pending' },
            { icon: Percent, color: 'cyan', value: `${stats.winRate.toFixed(1)}%`, label: 'Win Rate', mobileLabel: 'Win%' },
            { icon: TrendingUp, color: 'orange', value: `${stats.avgConfidence.toFixed(0)}%`, label: 'Avg Conf', mobileLabel: 'Conf' },
            { icon: DollarSign, color: 'green', value: `+${stats.totalROI.toFixed(0)}`, label: 'Total ROI', mobileLabel: 'ROI' }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/10 hover:border-white/20 transition-all duration-200 hover:bg-white/10"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}-400 mb-1 sm:mb-0`} />
                <span className="text-lg sm:text-xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-gray-400 text-[10px] sm:text-xs mt-1">
                <span className="sm:hidden">{stat.mobileLabel}</span>
                <span className="hidden sm:inline">{stat.label}</span>
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mobile-Optimized Collapsible Filters */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 mb-4 sm:mb-6">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full sm:hidden flex items-center justify-between p-4 text-white hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <FilterIcon className="w-5 h-5 text-gray-400" />
              <span className="font-medium">Filters</span>
              {(searchTerm || dateFilter !== 'today' || statusFilter !== 'all' || sportFilter !== 'all') && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                  Active
                </span>
              )}
            </div>
            {showFilters ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {/* Filter Content */}
          <div className={`${showFilters || 'hidden sm:block'} p-4 border-t border-white/10 sm:border-t-0`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="relative col-span-1 sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search teams or picks..."
                  className="w-full pl-10 pr-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/40 transition-colors"
                />
              </div>
              
              {[
                { value: dateFilter, setter: setDateFilter, label: 'Time', options: [
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Today' },
                  { value: 'week', label: 'Last Week' }
                ]},
                { value: statusFilter, setter: setStatusFilter, label: 'Status', options: [
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'won', label: 'Won' },
                  { value: 'lost', label: 'Lost' }
                ]},
                { value: sportFilter, setter: setSportFilter, label: 'Sport', options: [
                  { value: 'all', label: 'All Sports' },
                  { value: 'MLB', label: 'MLB' },
                  { value: 'NFL', label: 'NFL' },
                  { value: 'NBA', label: 'NBA' },
                  { value: 'NHL', label: 'NHL' }
                ]}
              ].map((filter, i) => (
                <div key={i} className="relative">
                  <label className="block text-xs text-gray-400 mb-1 sm:hidden">{filter.label}</label>
                  <select
                    value={filter.value}
                    onChange={(e) => filter.setter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors"
                  >
                    {filter.options.map(opt => (
                      <option key={opt.value} value={opt.value} className="bg-gray-900">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none sm:top-[50%]" />
                </div>
              ))}

              <button
                onClick={() => {
                  setSearchTerm('')
                  setDateFilter('today')
                  setStatusFilter('all')
                  setSportFilter('all')
                  setShowFilters(false)
                }}
                className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white rounded-lg transition-all duration-200 font-medium"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Cards / Desktop Table View */}
        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-3">
          {predictions.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-4 bg-black/20 border-b border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${
                      p.sport === 'MLB' ? 'blue' : p.sport === 'NFL' ? 'purple' : p.sport === 'NBA' ? 'orange' : 'gray'
                    }-500/20 text-${
                      p.sport === 'MLB' ? 'blue' : p.sport === 'NFL' ? 'purple' : p.sport === 'NBA' ? 'orange' : 'gray'
                    }-300`}>
                      {p.sport}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'won' ? 'bg-green-500/20 text-green-300' : 
                      p.status === 'lost' ? 'bg-red-500/20 text-red-300' : 
                      'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </div>
                  <button
                    onClick={() => setExpandedPickId(expandedPickId === p.id ? null : p.id)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {expandedPickId === p.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="space-y-1">
                  <h3 className="text-white font-medium">{p.match_teams}</h3>
                  <p className="text-gray-400 text-sm">{p.pick}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Odds</p>
                    <p className="text-green-400 font-mono font-medium">{p.odds}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Confidence</p>
                    <div className="flex items-center space-x-1">
                      <span className="text-white font-medium">{p.confidence || 0}%</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-yellow-400 to-green-400"
                          style={{ width: `${p.confidence || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-1">Date</p>
                    <p className="text-gray-300 text-sm">
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedPickId === p.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/10 pt-3 space-y-3"
                    >
                      {p.reasoning && (
                        <div>
                          <p className="text-gray-500 text-xs mb-1">Reasoning</p>
                          <p className="text-gray-300 text-sm">{p.reasoning}</p>
                        </div>
                      )}
                      {p.user?.email && (
                        <div>
                          <p className="text-gray-500 text-xs mb-1">User</p>
                          <p className="text-gray-300 text-sm">{p.user.email}</p>
                        </div>
                      )}
                      <div className="flex space-x-2">
                        <select
                          value={p.status}
                          onChange={(e) => updatePrediction(p.id, { status: e.target.value })}
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                        </select>
                        <button
                          onClick={() => {
                            setEditingPick(p.id)
                            setEditValues({
                              [p.id]: {
                                match_teams: p.match_teams,
                                pick: p.pick,
                                odds: p.odds,
                                confidence: p.confidence
                              }
                            })
                          }}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
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
                    <td className="px-4 py-4">
                      {editingPick === p.id && editValues[p.id]?.editingTeams ? (
                        <input
                          type="text"
                          value={editValues[p.id]?.match_teams || p.match_teams}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            [p.id]: { ...editValues[p.id], match_teams: e.target.value }
                          })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updatePrediction(p.id, { match_teams: editValues[p.id].match_teams })
                              setEditValues({
                                ...editValues,
                                [p.id]: { ...editValues[p.id], editingTeams: false }
                              })
                            } else if (e.key === 'Escape') {
                              setEditValues({
                                ...editValues,
                                [p.id]: { ...editValues[p.id], editingTeams: false }
                              })
                            }
                          }}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm w-full"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="text-sm text-white cursor-pointer hover:text-blue-400"
                          onClick={() => {
                            setEditingPick(p.id)
                            setEditValues({
                              ...editValues,
                              [p.id]: { ...editValues[p.id], match_teams: p.match_teams, editingTeams: true }
                            })
                          }}
                        >
                          {p.match_teams}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingPick === p.id && editValues[p.id]?.editingPick ? (
                        <input
                          type="text"
                          value={editValues[p.id]?.pick || p.pick}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            [p.id]: { ...editValues[p.id], pick: e.target.value }
                          })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updatePrediction(p.id, { pick: editValues[p.id].pick })
                              setEditValues({
                                ...editValues,
                                [p.id]: { ...editValues[p.id], editingPick: false }
                              })
                            } else if (e.key === 'Escape') {
                              setEditValues({
                                ...editValues,
                                [p.id]: { ...editValues[p.id], editingPick: false }
                              })
                            }
                          }}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm w-full"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="text-sm text-white cursor-pointer hover:text-blue-400"
                          onClick={() => {
                            setEditingPick(p.id)
                            setEditValues({
                              ...editValues,
                              [p.id]: { ...editValues[p.id], pick: p.pick, editingPick: true }
                            })
                          }}
                        >
                          {p.pick}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingPick === p.id && editValues[p.id]?.editingOdds ? (
                        <input
                          type="text"
                          value={editValues[p.id]?.odds || p.odds}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            [p.id]: { ...editValues[p.id], odds: e.target.value }
                          })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updatePrediction(p.id, { odds: editValues[p.id].odds })
                              setEditValues({
                                ...editValues,
                                [p.id]: { ...editValues[p.id], editingOdds: false }
                              })
                            } else if (e.key === 'Escape') {
                              setEditValues({
                                ...editValues,
                                [p.id]: { ...editValues[p.id], editingOdds: false }
                              })
                            }
                          }}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-green-400 font-mono text-sm w-20"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="text-sm font-mono text-green-400 cursor-pointer hover:text-green-300"
                          onClick={() => {
                            setEditingPick(p.id)
                            setEditValues({
                              ...editValues,
                              [p.id]: { ...editValues[p.id], odds: p.odds, editingOdds: true }
                            })
                          }}
                        >
                          {p.odds}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {editingPick === p.id && editValues[p.id]?.editingConfidence ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editValues[p.id]?.confidence || p.confidence || 0}
                          onChange={(e) => setEditValues({
                            ...editValues,
                            [p.id]: { ...editValues[p.id], confidence: parseInt(e.target.value) }
                          })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updatePrediction(p.id, { confidence: editValues[p.id].confidence })
                              setEditValues({
                                ...editValues,
                                [p.id]: { ...editValues[p.id], editingConfidence: false }
                              })
                            } else if (e.key === 'Escape') {
                              setEditValues({
                                ...editValues,
                                [p.id]: { ...editValues[p.id], editingConfidence: false }
                              })
                            }
                          }}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm w-16"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="text-sm text-gray-400 cursor-pointer hover:text-white"
                          onClick={() => {
                            setEditingPick(p.id)
                            setEditValues({
                              ...editValues,
                              [p.id]: { ...editValues[p.id], confidence: p.confidence || 0, editingConfidence: true }
                            })
                          }}
                        >
                          {p.confidence || 0}%
                        </div>
                      )}
                    </td>
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

      {/* Mobile-Optimized Add Pick Modal */}
      <AnimatePresence>
        {showAddPickModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-end sm:items-center justify-center"
            onClick={() => setShowAddPickModal(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-slate-800 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Mobile Drag Indicator */}
              <div className="sticky top-0 bg-slate-800 border-b border-white/10 p-4 sm:p-6">
                <div className="w-12 h-1 bg-gray-500 rounded-full mx-auto mb-4 sm:hidden" />
                <div className="flex justify-between items-center">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Add New Pick</h2>
                  <button 
                    onClick={() => setShowAddPickModal(false)} 
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[calc(90vh-120px)] sm:max-h-[calc(85vh-100px)]">
                <div>
                  <label className="text-gray-400 text-xs sm:text-sm mb-1.5 block font-medium">Match/Teams</label>
                  <input
                    type="text"
                    value={newPick.match_teams}
                    onChange={(e) => setNewPick({...newPick, match_teams: e.target.value})}
                    placeholder="e.g., Lakers vs Warriors"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>
                
                <div>
                  <label className="text-gray-400 text-xs sm:text-sm mb-1.5 block font-medium">Pick</label>
                  <input
                    type="text"
                    value={newPick.pick}
                    onChange={(e) => setNewPick({...newPick, pick: e.target.value})}
                    placeholder="e.g., Lakers -5.5 or Over 220.5"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/40 transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm mb-1.5 block font-medium">Sport</label>
                    <select
                      value={newPick.sport}
                      onChange={(e) => setNewPick({...newPick, sport: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors"
                    >
                      <option value="NFL">NFL</option>
                      <option value="NBA">NBA</option>
                      <option value="MLB">MLB</option>
                      <option value="NHL">NHL</option>
                      <option value="NCAAF">College Football</option>
                      <option value="NCAAB">College Basketball</option>
                      <option value="WNBA">WNBA</option>
                      <option value="UFC">UFC/MMA</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-gray-400 text-xs sm:text-sm mb-1.5 block font-medium">Odds</label>
                    <input
                      type="text"
                      value={newPick.odds}
                      onChange={(e) => setNewPick({...newPick, odds: e.target.value})}
                      placeholder="e.g., -110 or +150"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/40 transition-colors font-mono"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-xs sm:text-sm mb-2 block font-medium">Confidence ({newPick.confidence}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={newPick.confidence}
                    onChange={(e) => setNewPick({...newPick, confidence: parseInt(e.target.value)})}
                    className="w-full accent-green-500"
                  />
                  <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-green-400 transition-all duration-300"
                      style={{ width: `${newPick.confidence}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-400 text-xs sm:text-sm mb-1.5 block font-medium">Reasoning (optional)</label>
                  <textarea
                    value={newPick.reasoning}
                    onChange={(e) => setNewPick({...newPick, reasoning: e.target.value})}
                    placeholder="Why this pick is a good bet..."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-white/40 transition-colors resize-none"
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="sticky bottom-0 bg-slate-800 border-t border-white/10 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 sm:px-6 py-4">
                  <div className="flex space-x-3">
                  <button
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('ai_predictions')
                          .insert({
                            ...newPick,
                            user_id: user?.id,
                            event_time: new Date().toISOString(),
                            status: 'pending'
                          })
                        
                        if (error) throw error
                        
                        toast.success('Pick added successfully')
                        setShowAddPickModal(false)
                        setNewPick({
                          match_teams: '',
                          pick: '',
                          odds: '',
                          sport: 'NFL',
                          confidence: 75,
                          reasoning: '',
                          bet_type: 'moneyline'
                        })
                        loadPredictions()
                        loadStats()
                      } catch (error) {
                        console.error('Error adding pick:', error)
                        toast.error('Failed to add pick')
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg transition-all duration-200 font-medium shadow-lg"
                  >
                    Add Pick
                  </button>
                  <button
                    onClick={() => setShowAddPickModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white rounded-lg transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

