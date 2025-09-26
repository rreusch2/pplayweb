'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { checkAdminAccess } from '@/lib/adminAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Crown,
  Star,
  Shield,
  ArrowLeft,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Calendar,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Plus,
  Settings,
  Check,
  AlertTriangle
} from 'lucide-react'

interface UserProfile {
  id: string
  username: string | null
  email: string | null
  phone_number: string | null
  avatar_url: string | null
  subscription_tier: 'free' | 'pro' | 'elite'
  subscription_status: string
  subscription_plan_type: string | null
  subscription_expires_at: string | null
  subscription_product_id: string | null
  revenuecat_customer_id: string | null
  created_at: string
  updated_at: string
  admin_role: boolean
  is_active: boolean
  welcome_bonus_claimed: boolean
  welcome_bonus_expires_at: string | null
  risk_tolerance: string
  favorite_teams: string[]
  favorite_players: string[]
  preferred_bet_types: string[]
  preferred_sports: string[]
  max_daily_picks: number
  sport_preferences: any
  phone_verified: boolean
  referral_code: string | null
  referred_by: string | null
  referral_points: number
  day_pass_tier: string | null
  day_pass_expires_at: string | null
}

export default function UserManagement() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'pro' | 'elite'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'created_at' | 'subscription_tier' | 'email'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [totalPages, setTotalPages] = useState(1)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<UserProfile>>({})
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

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

  // Load users when filters change
  useEffect(() => {
    if (!loading) {
      loadUsers()
    }
  }, [loading, currentPage, searchTerm, tierFilter, statusFilter, sortBy, sortOrder, pageSize])

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })

      // Apply search filter
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`)
      }

      // Apply tier filter
      if (tierFilter !== 'all') {
        query = query.eq('subscription_tier', tierFilter)
      }

      // Apply status filter
      if (statusFilter === 'active') {
        query = query.eq('subscription_status', 'active')
      } else if (statusFilter === 'inactive') {
        query = query.neq('subscription_status', 'active')
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Apply pagination
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      setUsers(data || [])
      setTotalUsers(count || 0)
      setTotalPages(Math.ceil((count || 0) / pageSize))
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user.id)
    setEditData({ ...user })
  }

  const handleSave = async (userId: string) => {
    if (!editData) return
    setUpdating(userId)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editData.username,
          email: editData.email,
          phone_number: editData.phone_number,
          subscription_tier: editData.subscription_tier,
          subscription_status: editData.subscription_status,
          subscription_plan_type: editData.subscription_plan_type,
          admin_role: editData.admin_role,
          is_active: editData.is_active,
          risk_tolerance: editData.risk_tolerance,
          max_daily_picks: editData.max_daily_picks,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      
      setEditingUser(null)
      setEditData({})
      await loadUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user')
    } finally {
      setUpdating(null)
    }
  }

  const handleCancel = () => {
    setEditingUser(null)
    setEditData({})
  }

  const updateUserTier = async (userId: string, newTier: 'free' | 'pro' | 'elite') => {
    setUpdating(userId)
    try {
      const now = new Date().toISOString()
      const updateData: any = {
        subscription_tier: newTier,
        subscription_status: newTier === 'free' ? 'inactive' : 'active',
        updated_at: now
      }

      if (newTier === 'free') {
        updateData.max_daily_picks = 2
        updateData.subscription_plan_type = null
        updateData.subscription_product_id = null
        updateData.subscription_expires_at = null
      } else if (newTier === 'pro') {
        updateData.max_daily_picks = 20
        updateData.subscription_plan_type = 'admin_manual'
        updateData.subscription_expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      } else if (newTier === 'elite') {
        updateData.max_daily_picks = 30
        updateData.subscription_plan_type = 'admin_manual'
        updateData.subscription_expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
    } catch (error) {
      console.error('Error updating user tier:', error)
      alert('Error updating user tier')
    } finally {
      setUpdating(null)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    
    setUpdating(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user')
    } finally {
      setUpdating(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid Date'
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
          <p className="text-white">Loading user management...</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-4xl font-bold text-white flex items-center space-x-3">
                  <Users className="w-10 h-10 text-blue-400" />
                  <span>User Management</span>
                </h1>
                <p className="text-gray-400">Comprehensive user administration and profile management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-400">{totalUsers} total users</span>
              <button
                onClick={loadUsers}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by username, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value as any)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Tiers</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="elite">Elite</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field as any)
                  setSortOrder(order as any)
                }}
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="email-asc">Email A-Z</option>
                <option value="email-desc">Email Z-A</option>
                <option value="subscription_tier-desc">Tier: Elite → Free</option>
                <option value="subscription_tier-asc">Tier: Free → Elite</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">User</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Contact</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Subscription</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Status</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Joined</th>
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.email?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          {editingUser === user.id ? (
                            <input
                              type="text"
                              value={editData.username || ''}
                              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                              placeholder="Username"
                            />
                          ) : (
                            <p className="text-white font-medium">{user.username || 'No username'}</p>
                          )}
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getTierBadgeColor(user.subscription_tier)}`}>
                              {user.subscription_tier.toUpperCase()}
                            </span>
                            {user.admin_role && (
                              <Shield className="w-4 h-4 text-yellow-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        {editingUser === user.id ? (
                          <>
                            <input
                              type="email"
                              value={editData.email || ''}
                              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-full"
                              placeholder="Email"
                            />
                            <input
                              type="tel"
                              value={editData.phone_number || ''}
                              onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-full"
                              placeholder="Phone"
                            />
                          </>
                        ) : (
                          <>
                            <p className="text-white text-sm">{user.email}</p>
                            <p className="text-gray-400 text-xs">{user.phone_number || 'No phone'}</p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getTierBadgeColor(user.subscription_tier)}`}>
                            {user.subscription_tier.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusBadgeColor(user.subscription_status)}`}>
                            {user.subscription_status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs">{user.subscription_plan_type || 'N/A'}</p>
                        <p className="text-gray-400 text-xs">
                          Expires: {user.subscription_expires_at ? formatDate(user.subscription_expires_at) : 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          {user.is_active ? (
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          ) : (
                            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          )}
                          <span className="text-white text-sm">
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {user.phone_verified && (
                          <div className="flex items-center space-x-1">
                            <Check className="w-3 h-3 text-green-400" />
                            <span className="text-green-400 text-xs">Phone Verified</span>
                          </div>
                        )}
                        {user.referral_code && (
                          <p className="text-blue-400 text-xs">Referral: {user.referral_code}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <p className="text-white text-sm">{formatDate(user.created_at)}</p>
                        <p className="text-gray-400 text-xs">Updated: {formatDate(user.updated_at)}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {editingUser === user.id ? (
                          <>
                            <button
                              onClick={() => handleSave(user.id)}
                              disabled={updating === user.id}
                              className="p-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded transition-colors"
                            >
                              <Save className="w-4 h-4 text-white" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                            >
                              <X className="w-4 h-4 text-white" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                            >
                              <Edit className="w-4 h-4 text-white" />
                            </button>
                            <div className="flex space-x-1">
                              <button
                                onClick={() => updateUserTier(user.id, 'pro')}
                                disabled={updating === user.id || user.subscription_tier === 'pro'}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                              >
                                Pro
                              </button>
                              <button
                                onClick={() => updateUserTier(user.id, 'elite')}
                                disabled={updating === user.id || user.subscription_tier === 'elite'}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                              >
                                Elite
                              </button>
                              <button
                                onClick={() => updateUserTier(user.id, 'free')}
                                disabled={updating === user.id || user.subscription_tier === 'free'}
                                className="px-2 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                              >
                                Free
                              </button>
                            </div>
                            <button
                              onClick={() => deleteUser(user.id)}
                              disabled={updating === user.id}
                              className="p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white/5 px-6 py-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-500 text-white rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4 py-2 bg-blue-600 text-white rounded">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-500 text-white rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
