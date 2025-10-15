'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { checkAdminAccess } from '@/lib/adminAuth'
import toast from 'react-hot-toast'
import { 
  Users, 
  Search, 
  Menu,
  X,
  Crown,
  Star,
  Shield,
  Calendar,
  Settings,
  TrendingUp,
  DollarSign,
  RefreshCw,
  UserCheck,
  BarChart3,
  Award,
  Bell,
  FileText,
  Upload,
  Download,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Activity,
  Target,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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

const NAVIGATION_ITEMS = [
  { id: 'overview', label: 'Overview', icon: BarChart3, color: 'blue' },
  { id: 'users', label: 'Users', icon: Users, color: 'purple' },
  { id: 'picks', label: 'Picks', icon: Target, color: 'green' },
  { id: 'notifications', label: 'Notifications', icon: Bell, color: 'orange' },
  { id: 'reports', label: 'Reports', icon: FileText, color: 'cyan' },
  { id: 'settings', label: 'Settings', icon: Settings, color: 'gray' },
]

const QUICK_ACTIONS = [
  { id: 'send-notification', label: 'Send Notification', icon: Bell, color: 'blue' },
  { id: 'add-picks', label: 'Add Picks', icon: Plus, color: 'green' },
  { id: 'export-data', label: 'Export Data', icon: Download, color: 'purple' },
  { id: 'view-reports', label: 'View Reports', icon: FileText, color: 'orange' },
]

export default function AdminPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
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
  const [users, setUsers] = useState<UserData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showPicksModal, setShowPicksModal] = useState(false)

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
  }, [loading])

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
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, subscription_tier, subscription_status, subscription_plan_type, subscription_expires_at, created_at, admin_role, is_active, revenuecat_customer_id')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadStats = async () => {
    try {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const startOfDayISO = startOfDay.toISOString()

      const [
        totalUsersRes,
        proUsersRes,
        eliteUsersRes,
        activeSubsRes,
        newTodayRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'pro'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'elite'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active').in('subscription_tier', ['pro', 'elite']),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', startOfDayISO),
      ])

      const totalUsers = totalUsersRes.count || 0
      const proUsers = proUsersRes.count || 0
      const eliteUsers = eliteUsersRes.count || 0
      const activeSubscriptions = activeSubsRes.count || 0
      const newUsersToday = newTodayRes.count || 0
      const monthlyRevenue = (proUsers * 19.99) + (eliteUsers * 29.99) // Simplified calculation

      setStats({
        totalUsers,
        proUsers,
        eliteUsers,
        activeSubscriptions,
        monthlyRevenue: Math.round(monthlyRevenue),
        newUsersToday,
        yearlyPro: 0,
        monthlyPro: 0,
        weeklyPro: 0,
        lifetimePro: 0,
        yearlyElite: 0,
        monthlyElite: 0,
        weeklyElite: 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-${color}-500/10 to-${color}-600/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-${color}-500/20 hover:border-${color}-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-${color}-500/10`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-xl bg-${color}-500/20`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${color}-400`} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-${color}-400 text-sm`}>
            <TrendingUp className="w-4 h-4" />
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</h3>
        <p className={`text-${color}-200 text-sm font-medium`}>{title}</p>
        {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
      </div>
    </motion.div>
  )

  const handleQuickAction = (actionId: string) => {
    switch(actionId) {
      case 'send-notification':
        toast.success('Notification center coming soon!')
        break
      case 'add-picks':
        router.push('/admin/picks-management')
        break
      case 'export-data':
        exportUserData()
        break
      case 'view-reports':
        toast.success('Reports section coming soon!')
        break
    }
  }

  const exportUserData = () => {
    const csv = [
      ['Email', 'Tier', 'Status', 'Joined'].join(','),
      ...users.map(u => [
        u.email,
        u.subscription_tier,
        u.subscription_status,
        u.created_at
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const QuickActionCard = ({ action }: any) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleQuickAction(action.id)}
      className={`w-full p-4 bg-gradient-to-br from-${action.color}-500/10 to-${action.color}-600/20 backdrop-blur-sm rounded-xl border border-${action.color}-500/20 hover:border-${action.color}-500/40 transition-all duration-300 text-left group`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg bg-${action.color}-500/20 group-hover:bg-${action.color}-500/30 transition-colors`}>
          <action.icon className={`w-5 h-5 text-${action.color}-400`} />
        </div>
        <div>
          <h3 className="text-white font-medium">{action.label}</h3>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 ml-auto group-hover:text-white transition-colors" />
      </div>
    </motion.button>
  )

  const UserRow = ({ user }: { user: UserData }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300"
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
          {user.email?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">{user.email}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.subscription_tier === 'pro'
                  ? 'bg-blue-500/20 text-blue-300'
                  : user.subscription_tier === 'elite'
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-gray-500/20 text-gray-300'
              }`}
            >
              {user.subscription_tier}
            </span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.subscription_status === 'active'
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
              }`}
            >
              {user.subscription_status}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={() => router.push('/admin/users-management')}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button 
          onClick={() => router.push('/admin/users-management')}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Edit User"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Mobile Header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 bg-black/20 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Admin</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="fixed top-0 left-0 w-80 h-full bg-slate-900/95 backdrop-blur-md border-r border-white/10 z-50 lg:hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <Shield className="w-8 h-8 text-blue-400" />
                    <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="space-y-2">
                  {NAVIGATION_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id)
                        setSidebarOpen(false)
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeTab === item.id
                          ? `bg-${item.color}-500/20 text-${item.color}-300 border border-${item.color}-500/30`
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Layout */}
      <div className="lg:flex">
        {/* Desktop Sidebar */}
        <div 
          className={`hidden lg:block h-screen bg-slate-900/50 backdrop-blur-md border-r border-white/10 fixed left-0 top-0 pt-16 transition-all duration-300 ${
            sidebarCollapsed ? 'w-20' : ''
          }`}
          style={{ width: sidebarCollapsed ? '80px' : `${sidebarWidth}px` }}
        >
          {/* Resize Handle */}
          {!sidebarCollapsed && (
            <div
              className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500/50 transition-colors"
              onMouseDown={(e) => {
                setIsResizing(true)
                e.preventDefault()
              }}
            />
          )}
          
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <div className={`flex items-center space-x-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <Shield className="w-10 h-10 text-blue-400 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <div>
                    <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                    <p className="text-gray-400 text-sm">ParleyApp Management</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
              </button>
            </div>
            
            <nav className="space-y-2">
              {NAVIGATION_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-xl transition-all duration-200 ${
                    activeTab === item.id
                      ? `bg-${item.color}-500/20 text-${item.color}-300 border border-${item.color}-500/30`
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  title={sidebarCollapsed ? item.label : ''}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div 
          className="flex-1 transition-all duration-300"
          style={{ marginLeft: sidebarCollapsed ? '80px' : `${sidebarWidth}px` }}
        >
          <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="hidden lg:block mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                {NAVIGATION_ITEMS.find(item => item.id === activeTab)?.label || 'Overview'}
              </h1>
              <p className="text-gray-400">
                {activeTab === 'overview' && 'Monitor your app performance and user metrics'}
                {activeTab === 'users' && 'Manage user accounts and subscriptions'}
                {activeTab === 'picks' && 'Manage daily picks and predictions'}
                {activeTab === 'notifications' && 'Send notifications to users'}
                {activeTab === 'reports' && 'View detailed analytics and reports'}
                {activeTab === 'settings' && 'Configure admin panel settings'}
              </p>
            </div>

            {/* Overview Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6 lg:space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <StatCard
                    title="Total Users"
                    value={stats.totalUsers.toLocaleString()}
                    icon={Users}
                    color="blue"
                    trend="+12%"
                  />
                  <StatCard
                    title="Active Subscriptions"
                    value={stats.activeSubscriptions}
                    icon={UserCheck}
                    color="green"
                    trend="+8%"
                  />
                  <StatCard
                    title="Monthly Revenue"
                    value={`$${stats.monthlyRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="purple"
                    trend="+23%"
                  />
                  <StatCard
                    title="New Today"
                    value={stats.newUsersToday}
                    icon={TrendingUp}
                    color="orange"
                    subtitle="users joined"
                  />
                </div>

                {/* Quick Actions */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {QUICK_ACTIONS.map((action) => (
                      <QuickActionCard key={action.id} action={action} />
                    ))}
                  </div>
                </div>

                {/* Recent Users */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Recent Users</h2>
                    <button className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
                      View All →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <UserRow key={user.id} user={user} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Picks Tab Content */}
            {activeTab === 'picks' && (
              <div className="space-y-6 lg:space-y-8">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-4">Picks Management Center</h2>
                  <p className="text-gray-400 mb-6">Comprehensive AI predictions and picks control</p>
                  <button
                    onClick={() => router.push('/admin/picks-management')}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-xl transition-all flex items-center gap-2"
                  >
                    <Target className="w-5 h-5" />
                    Open Picks Management Center
                  </button>
                </div>
              </div>
            )}

            {/* Users Tab Content */}
            {activeTab === 'users' && (
              <div className="space-y-6 lg:space-y-8">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-4">User Management Center</h2>
                  <p className="text-gray-400 mb-6">Comprehensive user account control and analytics</p>
                  <button
                    onClick={() => router.push('/admin/users-management')}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium rounded-xl transition-all flex items-center gap-2"
                  >
                    <Users className="w-5 h-5" />
                    Open User Management Center
                  </button>
                </div>
              </div>
            )}

            {/* Other tabs content */}
            {activeTab !== 'overview' && activeTab !== 'picks' && activeTab !== 'users' && (
              <div className="text-center py-16">
                <div className="text-6xl text-gray-600 mb-4">🚧</div>
                <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
                <p className="text-gray-400">
                  The {NAVIGATION_ITEMS.find(item => item.id === activeTab)?.label} section is under development.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mouse Events for Resize */}
      {isResizing && (
        <div
          className="fixed inset-0 z-50 cursor-ew-resize"
          onMouseMove={(e) => {
            const newWidth = Math.max(200, Math.min(500, e.clientX))
            setSidebarWidth(newWidth)
          }}
          onMouseUp={() => setIsResizing(false)}
        />
      )}
    </div>
  )
}
