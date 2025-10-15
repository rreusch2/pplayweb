'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { supabase } from '@/lib/supabase'
import { checkAdminAccess } from '@/lib/adminAuth'
import {
  ArrowLeft,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Trophy,
  Target,
  DollarSign,
  Clock,
  RefreshCw,
  Download,
  Upload,
  Copy,
  Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PicksTable from '../components/PicksTable'
import PickEditor from '../components/PickEditor'
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

const SPORTS = ['MLB', 'NFL', 'NBA', 'NHL', 'WNBA', 'UFC', 'MMA', 'CFB', 'CBB']
const STATUSES = ['pending', 'won', 'lost', 'push', 'void', 'live']

export default function PicksManagement() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [predictions, setPredictions] = useState<AIPrediction[]>([])
  const [filteredPredictions, setFilteredPredictions] = useState<AIPrediction[]>([])
  const [editingPrediction, setEditingPrediction] = useState<AIPrediction | null>(null)
  const [showAddNew, setShowAddNew] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sportFilter, setSportFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  useEffect(() => {
    if (!authLoading) {
      checkAuthorization()
    }
  }, [authLoading, user])

  const checkAuthorization = async () => {
    if (!user) {
      router.push('/admin')
      return
    }
    
    const isAdmin = await checkAdminAccess(user.id)
    if (!isAdmin) {
      router.push('/admin')
      return
    }
    setIsAuthorized(true)
    loadPredictions()
  }

  const loadPredictions = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ai_predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) throw error
      setPredictions(data || [])
      setFilteredPredictions(data || [])
    } catch (error) {
      console.error('Error loading predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    filterPredictions()
  }, [searchTerm, sportFilter, statusFilter, dateFilter, predictions])

  const filterPredictions = () => {
    let filtered = [...predictions]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.match_teams.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.pick.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.reasoning && p.reasoning.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Sport filter
    if (sportFilter !== 'all') {
      filtered = filtered.filter(p => p.sport === sportFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)

      filtered = filtered.filter(p => {
        const eventDate = new Date(p.event_time)
        switch(dateFilter) {
          case 'today':
            return eventDate >= today && eventDate < tomorrow
          case 'tomorrow':
            const dayAfterTomorrow = new Date(tomorrow)
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)
            return eventDate >= tomorrow && eventDate < dayAfterTomorrow
          case 'week':
            return eventDate >= weekAgo
          default:
            return true
        }
      })
    }

    setFilteredPredictions(filtered)
  }

  const handleSave = async (prediction: AIPrediction) => {
    try {
      const { error } = await supabase
        .from('ai_predictions')
        .update({
          ...prediction,
          updated_at: new Date().toISOString()
        })
        .eq('id', prediction.id)

      if (error) throw error

      // Update local state
      setPredictions(prev => prev.map(p => 
        p.id === prediction.id ? prediction : p
      ))
      
      setEditingPrediction(null)
    } catch (error) {
      console.error('Error saving prediction:', error)
      alert('Failed to save changes')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prediction?')) return

    try {
      const { error } = await supabase
        .from('ai_predictions')
        .delete()
        .eq('id', id)

      if (error) throw error

      setPredictions(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting prediction:', error)
      alert('Failed to delete prediction')
    }
  }

  const handleAddNew = async () => {
    const newPrediction: Partial<AIPrediction> = {
      user_id: '00000000-0000-0000-0000-000000000000', // System user
      match_teams: 'Team A vs Team B',
      pick: 'Team A',
      odds: '+100',
      confidence: 60,
      sport: 'MLB',
      event_time: new Date().toISOString(),
      reasoning: 'Manual pick by admin',
      status: 'pending',
      bet_type: 'moneyline',
      metadata: { source: 'admin_manual' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('ai_predictions')
        .insert([newPrediction])
        .select()
        .single()

      if (error) throw error

      setPredictions(prev => [data, ...prev])
      setEditingPrediction(data)
    } catch (error) {
      console.error('Error adding new prediction:', error)
      alert('Failed to add new prediction')
    }
  }

  const exportPredictions = () => {
    const csv = [
      Object.keys(filteredPredictions[0] || {}).join(','),
      ...filteredPredictions.map(p => Object.values(p).map(v => 
        typeof v === 'string' && v.includes(',') ? `"${v}"` : v
      ).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `predictions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (authLoading || loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="text-green-500" />
                  Picks Management Center
                </h1>
                <p className="text-gray-400 text-sm">Manage all AI predictions and picks</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadPredictions}
                className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                title="Refresh"
              >
                <RefreshCw size={20} />
              </button>
              <button
                onClick={exportPredictions}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={handleAddNew}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add New Pick
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search picks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>
            
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="all">All Sports</option>
              {SPORTS.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">Past Week</option>
            </select>

            <div className="px-4 py-2 bg-gray-800 rounded-lg">
              {filteredPredictions.length} picks
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        <PicksTable
          predictions={filteredPredictions}
          onEdit={setEditingPrediction}
          onDelete={handleDelete}
        />
      </div>

      {/* Edit Modal */}
      {editingPrediction && (
        <PickEditor
          prediction={editingPrediction}
          onSave={handleSave}
          onClose={() => setEditingPrediction(null)}
        />
      )}
    </div>
  )
}

