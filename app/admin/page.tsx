'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { checkAdminAccess } from '@/lib/adminAuth'
import { 
  Users, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Crown,
  Star,
  Shield,
  Calendar,
  Mail,
  Settings,
  TrendingUp,
  DollarSign,
  RefreshCw,
  UserCheck,
  UserX,
  Eye,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  ShoppingCart,
  Target,
  Gift,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import AdminCommandPanel from './components/AdminCommandPanel'
import PredictionsCenter from './components/PredictionsCenter'
import QuickActions from './components/QuickActions'
import FeedbackSection from './components/FeedbackSection'
import SupportRequestsSection from './components/SupportRequestsSection'
import TodaysPicksModal from './components/TodaysPicksModal'
import ReportsModal from './components/ReportsModal'
import SendNotificationModal from './components/SendNotificationModal'
import RedditAdsAnalytics from './components/RedditAdsAnalytics'


interface UserData {
  id: string
  username: string | null
  email: string | null
  subscription_tier: 'free' | 'pro' | 'elite'
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'past_due'
  subscription_plan_type: string | null
  subscription_expires_at: string | null
  created_at: string
  admin_role: boolean
  is_active: boolean
  revenuecat_customer_id: string | null
}

interface AdminStats {
  totalUsers: number
  proUsers: number
  eliteUsers: number
  activeSubscriptions: number
  monthlyRevenue: number
  newUsersToday: number
  yearlyPro: number
  monthlyPro: number
  weeklyPro: number
  lifetimePro: number
  yearlyElite: number
  monthlyElite: number
  weeklyElite: number
}

export default function AdminDashboard() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserData[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    proUsers: 0,
    eliteUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    newUsersToday: 0,
    yearlyPro: 0,
    monthlyPro: 0,
    weeklyPro: 0,
    lifetimePro: 0,
    yearlyElite: 0,
    monthlyElite: 0,
    weeklyElite: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro' | 'elite'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)
  const [showTodaysPicksModal, setShowTodaysPicksModal] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [showSendNotificationModal, setShowSendNotificationModal] = useState(false)
  const pageSize = 20

  // Check admin access
  useEffect(() => {
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

    checkAccess()
  }, [user, router])

  // Load dashboard data
  useEffect(() => {
    if (!loading) {
      loadDashboardData()
    }
  }, [loading, currentPage, searchTerm, tierFilter, statusFilter])

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadUsers(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('id, username, email, subscription_tier, subscription_status, subscription_plan_type, subscription_expires_at, created_at, admin_role, is_active, revenuecat_customer_id', { count: 'exact' })

      // Apply filters
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      }

      if (tierFilter !== 'all') {
        query = query.eq('subscription_tier', tierFilter)
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'active') {
          query = query.eq('subscription_status', 'active')
        } else {
          query = query.neq('subscription_status', 'active')
        }
      }

      // Apply pagination
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to).order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      setUsers(data || [])
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadStats = async () => {
    try {
      // Get ALL data without any limits - directly query the full table
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status, created_at, subscription_plan_type')

      if (error) throw error

      const today = new Date().toDateString()
      const newUsersToday = data?.filter(user => 
        new Date(user.created_at).toDateString() === today
      ).length || 0

      const activeSubscriptions = data?.filter(user => 
        user.subscription_status === 'active' && user.subscription_tier !== 'free'
      ).length || 0

      const proUsers = data?.filter(user => user.subscription_tier === 'pro').length || 0
      const eliteUsers = data?.filter(user => user.subscription_tier === 'elite').length || 0

      // Correct pricing from RevenueCat service
      const activeSubs = data?.filter(user => user.subscription_status === 'active') || []
      const proSubs = activeSubs.filter(user => user.subscription_tier === 'pro')
      const eliteSubs = activeSubs.filter(user => user.subscription_tier === 'elite')

      const yearlyPro = proSubs.filter(u => u.subscription_plan_type === 'yearly').length
      const monthlyPro = proSubs.filter(u => u.subscription_plan_type === 'monthly').length
      const weeklyPro = proSubs.filter(u => u.subscription_plan_type === 'weekly').length
      const lifetimePro = proSubs.filter(u => u.subscription_plan_type === 'lifetime').length
      const daypassPro = proSubs.filter(u => u.subscription_plan_type === 'daypass').length
      
      const yearlyElite = eliteSubs.filter(u => u.subscription_plan_type === 'yearly').length
      const monthlyElite = eliteSubs.filter(u => u.subscription_plan_type === 'monthly').length
      const weeklyElite = eliteSubs.filter(u => u.subscription_plan_type === 'weekly').length
      const daypassElite = eliteSubs.filter(u => u.subscription_plan_type === 'daypass').length

      // Correct pricing from actual RevenueCat service
      // Pro: weekly: 9.99, monthly: 19.99, yearly: 199.99, daypass: 4.99, lifetime: 349.99
      // Elite: daypass: 8.99, weekly: 14.99, monthly: 29.99, yearly: 199.99
      const monthlyRevenue = 
        (weeklyPro * 9.99 * 4.33) + // Weekly to monthly
        (monthlyPro * 19.99) +
        (yearlyPro * 199.99 / 12) + // Yearly to monthly
        (daypassPro * 4.99 * 30) + // Daily to monthly (rough estimate)
        (lifetimePro * 349.99 / 60) + // Lifetime amortized over 5 years
        (weeklyElite * 14.99 * 4.33) + // Weekly to monthly
        (monthlyElite * 29.99) +
        (yearlyElite * 199.99 / 12) + // Yearly to monthly
        (daypassElite * 8.99 * 30) // Daily to monthly (rough estimate)

      setStats({
        totalUsers: data?.length || 0, // This should now show the real count (1354+)
        proUsers,
        eliteUsers,
        activeSubscriptions,
        monthlyRevenue: Math.round(monthlyRevenue),
        newUsersToday,
        yearlyPro,
        monthlyPro,
        weeklyPro,
        lifetimePro,
        yearlyElite,
        monthlyElite,
        weeklyElite,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  // Rest of your functions (updateUserTier, handleSendNotification, etc.) remain the same...
  const updateUserTier = async (userId: string, newTier: 'free' | 'pro' | 'elite') => {
    if (updating) return
    
    setUpdating(userId)
    try {
      // Prepare comprehensive update data to match payment flow
      const now = new Date().toISOString()
      
      const updateData: any = {
        subscription_tier: newTier,
        subscription_status: newTier === 'free' ? 'inactive' : 'active',
        updated_at: now
      }

      if (newTier === 'free') {
        // Downgrade to free - clear all subscription fields
        updateData.max_daily_picks = 2
        updateData.subscription_plan_type = null
        updateData.subscription_product_id = null
        updateData.subscription_expires_at = null
        updateData.auto_renew_enabled = null
        updateData.revenuecat_customer_id = null
        // Clear welcome bonus to prevent UI override
        updateData.welcome_bonus_claimed = false
        updateData.welcome_bonus_expires_at = null
      } else if (newTier === 'pro') {
        // Upgrade to Pro - set Pro-specific fields
        updateData.max_daily_picks = 20
        updateData.subscription_plan_type = 'admin_manual'
        updateData.subscription_product_id = 'admin_override_pro'
        updateData.subscription_expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        updateData.auto_renew_enabled = false
        updateData.subscription_started_at = now
        updateData.subscription_renewed_at = now
        updateData.revenuecat_customer_id = `admin_${userId}`
        // Clear welcome bonus to prevent UI override
        updateData.welcome_bonus_claimed = false
        updateData.welcome_bonus_expires_at = null
      } else if (newTier === 'elite') {
        // Upgrade to Elite - set Elite-specific fields
        updateData.max_daily_picks = 30
        updateData.subscription_plan_type = 'admin_manual'
        updateData.subscription_product_id = 'admin_override_elite'
        updateData.subscription_expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
        updateData.auto_renew_enabled = false
        updateData.subscription_started_at = now
        updateData.subscription_renewed_at = now
        updateData.revenuecat_customer_id = `admin_${userId}`
        // Clear welcome bonus to prevent UI override
        updateData.welcome_bonus_claimed = false
        updateData.welcome_bonus_expires_at = null
      }

      console.log('🔧 Admin: Updating user subscription with comprehensive data:', updateData)

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) throw error

      // Refresh data
      await loadDashboardData()
      alert(`✅ User subscription updated to ${newTier}! All subscription fields have been properly set.`)
    } catch (error) {
      console.error('Error updating user tier:', error)
      alert('❌ Error updating user subscription')
    } finally {
      setUpdating(null)
    }
  }

  const handleSendNotification = () => {
    setShowSendNotificationModal(true)
  }

  const handleExportData = async () => {
    alert('📊 Data export feature would be implemented here')
  }

  const handleBackupDatabase = async () => {
    alert('💾 Database backup feature would be implemented here')
  }

  const handleOpenTodaysPicks = () => {
    setShowTodaysPicksModal(true)
  }
  
  const handleOpenReports = () => {
    setShowReportsModal(true)
  }

  const formatDate = (dateString: string) => {
    try {
      const dt = new Date((dateString || '').replace(' ', 'T'))
      return dt.toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'N/A'
    }
  }

  const formatDateOnly = (dateString: string) => {
    try {
      const dt = new Date((dateString || '').replace(' ', 'T'))
      return dt.toLocaleDateString('en-US', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'bg-blue-500'
      case 'elite': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'inactive': return 'bg-gray-500'
      case 'cancelled': return 'bg-red-500'
      case 'expired': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center space-x-3">
            <Shield className="w-10 h-10 text-blue-400" />
            <span>Admin Dashboard</span>
          </h1>
          <p className="text-gray-400">Manage users, monitor subscriptions, and track key metrics</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm font-medium">Total Users</p>
                <div className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm font-medium">Active Subs</p>
                <div className="text-3xl font-bold text-white">{stats.activeSubscriptions}</div>
              </div>
              <UserCheck className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium">Pro Users</p>
                <div className="text-3xl font-bold text-white">{stats.proUsers}</div>
              </div>
              <Star className="w-8 h-8 text-purple-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-md rounded-xl p-6 border border-yellow-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm font-medium">Elite Users</p>
                <div className="text-3xl font-bold text-white">{stats.eliteUsers}</div>
              </div>
              <Crown className="w-8 h-8 text-yellow-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 backdrop-blur-md rounded-xl p-6 border border-emerald-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-sm font-medium">Est. Monthly Revenue</p>
                <div className="text-3xl font-bold text-white">${stats.monthlyRevenue.toFixed(0)}</div>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 backdrop-blur-md rounded-xl p-6 border border-cyan-500/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-200 text-sm font-medium">New Today</p>
                <div className="text-3xl font-bold text-white">{stats.newUsersToday}</div>
              </div>
              <TrendingUp className="w-8 h-8 text-cyan-400" />
            </div>
          </motion.div>
        </div>

        {/* Subscription Breakdown */}
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Subscription Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="lg:col-span-4">
                    <h3 className="text-xl font-semibold text-blue-300 mb-4">Pro Tier</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
                            <div className="flex items-center justify-between"><div><p className="text-blue-200 text-sm font-medium">Weekly Pro</p><div className="text-3xl font-bold text-white">{stats.weeklyPro}</div></div><Calendar className="w-8 h-8 text-blue-400" /></div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
                            <div className="flex items-center justify-between"><div><p className="text-blue-200 text-sm font-medium">Monthly Pro</p><div className="text-3xl font-bold text-white">{stats.monthlyPro}</div></div><Calendar className="w-8 h-8 text-blue-400" /></div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
                            <div className="flex items-center justify-between"><div><p className="text-blue-200 text-sm font-medium">Yearly Pro</p><div className="text-3xl font-bold text-white">{stats.yearlyPro}</div></div><Calendar className="w-8 h-8 text-blue-400" /></div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
                            <div className="flex items-center justify-between"><div><p className="text-blue-200 text-sm font-medium">Lifetime Pro</p><div className="text-3xl font-bold text-white">{stats.lifetimePro}</div></div><Award className="w-8 h-8 text-blue-400" /></div>
                        </motion.div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-4">
                    <h3 className="text-xl font-semibold text-purple-300 mb-4">Elite Tier</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
                            <div className="flex items-center justify-between"><div><p className="text-purple-200 text-sm font-medium">Weekly Elite</p><div className="text-3xl font-bold text-white">{stats.weeklyElite}</div></div><Calendar className="w-8 h-8 text-purple-400" /></div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
                            <div className="flex items-center justify-between"><div><p className="text-purple-200 text-sm font-medium">Monthly Elite</p><div className="text-3xl font-bold text-white">{stats.monthlyElite}</div></div><Calendar className="w-8 h-8 text-purple-400" /></div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
                            <div className="flex items-center justify-between"><div><p className="text-purple-200 text-sm font-medium">Yearly Elite</p><div className="text-3xl font-bold text-white">{stats.yearlyElite}</div></div><Calendar className="w-8 h-8 text-purple-400" /></div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>

        {/* Quick Actions and Activity Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <QuickActions 
            onSendNotification={handleSendNotification}
            onExportData={handleExportData}
            onBackupDatabase={handleBackupDatabase}
            onOpenTodaysPicks={handleOpenTodaysPicks}
            onOpenReports={handleOpenReports}
          />
          <PredictionsCenter />
        </div>



        {/* User Management Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-md rounded-xl border border-blue-500/30 p-6 mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center space-x-3">
                <Users className="w-8 h-8 text-blue-400" />
                <span>User Management</span>
              </h3>
              <p className="text-blue-200 mb-4">
                Comprehensive user administration with advanced filtering, editing, and bulk operations
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-blue-200 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-purple-200 text-sm">Pro + Elite</p>
                  <p className="text-2xl font-bold text-white">{stats.proUsers + stats.eliteUsers}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-green-200 text-sm">Active Subs</p>
                  <p className="text-2xl font-bold text-white">{stats.activeSubscriptions}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <button
                onClick={() => router.push('/admin/users')}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
              >
                <Users className="w-5 h-5" />
                <span>Manage Users</span>
              </button>
              <p className="text-blue-200 text-sm mt-2">
                Advanced user management tools
              </p>
            </div>
          </div>
        </motion.div>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">User Details</h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="text-white">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Username</p>
                  <p className="text-white">{selectedUser.username || 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Subscription Tier</p>
                  <p className="text-white capitalize">{selectedUser.subscription_tier}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Subscription Status</p>
                  <p className="text-white capitalize">{selectedUser.subscription_status}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Plan Type</p>
                  <p className="text-white">{selectedUser.subscription_plan_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Expires At</p>
                  <p className="text-white">{selectedUser.subscription_expires_at ? formatDate(selectedUser.subscription_expires_at) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Joined</p>
                  <p className="text-white">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">RevenueCat ID</p>
                  <p className="text-white text-xs font-mono">{selectedUser.revenuecat_customer_id || 'Not linked'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Notification Modal */}
        {showSendNotificationModal && (
          <SendNotificationModal 
            open={showSendNotificationModal} 
            onClose={() => setShowSendNotificationModal(false)} 
          />
        )}

        {/* Reddit Ads Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <BarChart3 className="w-6 h-6 text-red-400" />
              <span>Reddit Ads Analytics</span>
            </h2>
          </div>
          <RedditAdsAnalytics />
        </motion.div>

        {/* Admin Chat Section */}

        {/* Feedback Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <Mail className="w-6 h-6 text-blue-400" />
              <span>User Feedback</span>
            </h2>
          </div>
          <FeedbackSection />
        </motion.div>

        {/* Support Requests Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <Settings className="w-6 h-6 text-green-400" />
              <span>Support Requests</span>
            </h2>
          </div>
          <SupportRequestsSection />
        </motion.div>

        {/* Today's Picks Modal */}
        <TodaysPicksModal 
          isOpen={showTodaysPicksModal}
          onClose={() => setShowTodaysPicksModal(false)}
        />
        
        {/* Reports Modal */}
        <ReportsModal 
          isOpen={showReportsModal}
          onClose={() => setShowReportsModal(false)}
        />
      </div>
    </div>
  )
}
