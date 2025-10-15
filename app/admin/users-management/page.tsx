'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { checkAdminAccess } from '@/lib/adminAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, ArrowLeft, Search, Filter, Edit3, Eye, X, Check, Mail,
  Calendar, Crown, Shield, Star, Download, RefreshCw, UserPlus, Ban, CheckCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface UserProfile {
  id: string
  email: string
  subscription_tier: string
  subscription_status: string
  created_at: string
  phone?: string
  display_name?: string
  avatar_url?: string
  lifetime_picks: number
  lifetime_wins: number
  total_spent: number
  last_active?: string
  welcome_bonus_claimed: boolean
  welcome_bonus_expires_at?: string
}

export default function UsersManagementPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    free: 0,
    pro: 0,
    elite: 0,
    active: 0,
    inactive: 0,
    revenue: 0,
    avgLifetimeValue: 0
  })

  useEffect(() => {
    checkAccess()
  }, [user])

  useEffect(() => {
    if (user) {
      loadUsers()
      loadStats()
    }
  }, [user, tierFilter, statusFilter, sortBy])

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
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('*')
      
      if (allUsers) {
        setStats({
          total: allUsers.length,
          free: allUsers.filter(u => u.subscription_tier === 'free').length,
          pro: allUsers.filter(u => u.subscription_tier === 'pro').length,
          elite: allUsers.filter(u => u.subscription_tier === 'elite').length,
          active: allUsers.filter(u => u.subscription_status === 'active').length,
          inactive: allUsers.filter(u => u.subscription_status === 'inactive').length,
          revenue: allUsers.reduce((sum, u) => sum + (u.total_spent || 0), 0),
          avgLifetimeValue: allUsers.length > 0 
            ? allUsers.reduce((sum, u) => sum + (u.total_spent || 0), 0) / allUsers.length
            : 0
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order(sortBy, { ascending: sortBy === 'email' })

      if (tierFilter !== 'all') {
        query = query.eq('subscription_tier', tierFilter)
      }

      if (statusFilter !== 'all') {
        query = query.eq('subscription_status', statusFilter)
      }

      const { data, error } = await query
      if (error) throw error

      let filteredUsers = data || []
      if (searchTerm) {
        filteredUsers = filteredUsers.filter(u => 
          u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.phone?.includes(searchTerm)
        )
      }

      setUsers(filteredUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    }
  }

  const updateUser = async (userId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)

      if (error) throw error
      
      toast.success('User updated successfully')
      loadUsers()
      loadStats()
      setEditingUser(null)
      setShowUserModal(false)
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error
      
      toast.success('User deleted')
      loadUsers()
      loadStats()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const exportUsers = () => {
    const csv = [
      ['Email', 'Name', 'Tier', 'Status', 'Joined', 'Lifetime Picks', 'Wins', 'Total Spent'].join(','),
      ...users.map(u => [
        u.email,
        u.display_name || '',
        u.subscription_tier,
        u.subscription_status,
        u.created_at,
        u.lifetime_picks || 0,
        u.lifetime_wins || 0,
        u.total_spent || 0
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const UserEditModal = () => {
    if (!editingUser) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-slate-800 rounded-2xl max-w-2xl w-full p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Edit User Profile</h2>
            <button onClick={() => setEditingUser(null)} className="p-2 text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Email</label>
              <input
                type="email"
                value={editingUser.email}
                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Display Name</label>
              <input
                type="text"
                value={editingUser.display_name || ''}
                onChange={(e) => setEditingUser({ ...editingUser, display_name: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Phone</label>
              <input
                type="tel"
                value={editingUser.phone || ''}
                onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Subscription Tier</label>
                <select
                  value={editingUser.subscription_tier}
                  onChange={(e) => setEditingUser({ ...editingUser, subscription_tier: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="elite">Elite</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-1 block">Status</label>
                <select
                  value={editingUser.subscription_status}
                  onChange={(e) => setEditingUser({ ...editingUser, subscription_status: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => updateUser(editingUser.id, editingUser)}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  const UserDetailsModal = () => {
    if (!selectedUser) return null

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-slate-800 rounded-2xl max-w-2xl w-full p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">User Details</h2>
            <button onClick={() => setSelectedUser(null)} className="p-2 text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Display Name</p>
                <p className="text-white">{selectedUser.display_name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Phone</p>
                <p className="text-white">{selectedUser.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Joined</p>
                <p className="text-white">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Subscription Tier</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedUser.subscription_tier === 'elite' ? 'bg-purple-500/20 text-purple-300' :
                  selectedUser.subscription_tier === 'pro' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-gray-500/20 text-gray-300'
                }`}>
                  {selectedUser.subscription_tier.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedUser.subscription_status === 'active' ? 'bg-green-500/20 text-green-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {selectedUser.subscription_status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{selectedUser.lifetime_picks || 0}</p>
                <p className="text-gray-400 text-sm">Total Picks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{selectedUser.lifetime_wins || 0}</p>
                <p className="text-gray-400 text-sm">Wins</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">${selectedUser.total_spent || 0}</p>
                <p className="text-gray-400 text-sm">Total Spent</p>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => {
                  setEditingUser(selectedUser)
                  setSelectedUser(null)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={() => deleteUser(selectedUser.id)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete User
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 -mt-16 sm:-mt-20">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-16 sm:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/admin')} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-400" />
              </button>
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-purple-400" />
                <div>
                  <h1 className="text-2xl font-bold text-white">User Management Center</h1>
                  <p className="text-gray-400 text-sm">Comprehensive user control</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportUsers}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          {[
            { icon: Users, color: 'blue', value: stats.total, label: 'Total Users' },
            { icon: Star, color: 'gray', value: stats.free, label: 'Free' },
            { icon: Shield, color: 'blue', value: stats.pro, label: 'Pro' },
            { icon: Crown, color: 'purple', value: stats.elite, label: 'Elite' },
            { icon: CheckCircle, color: 'green', value: stats.active, label: 'Active' },
            { icon: Ban, color: 'red', value: stats.inactive, label: 'Inactive' },
            { icon: Download, color: 'cyan', value: `$${stats.revenue.toFixed(0)}`, label: 'Revenue' },
            { icon: Mail, color: 'orange', value: `$${stats.avgLifetimeValue.toFixed(0)}`, label: 'Avg LTV' }
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
                placeholder="Search users..."
                className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              />
            </div>

            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="all">All Tiers</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="created_at">Join Date</option>
              <option value="email">Email</option>
              <option value="total_spent">Total Spent</option>
              <option value="lifetime_picks">Total Picks</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('')
                setTierFilter('all')
                setStatusFilter('all')
                setSortBy('created_at')
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-black/20 border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Picks</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Spent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 group">
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-white font-medium">{u.email}</p>
                        {u.display_name && (
                          <p className="text-gray-400 text-sm">{u.display_name}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.subscription_tier === 'elite' ? 'bg-purple-500/20 text-purple-300' :
                        u.subscription_tier === 'pro' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {u.subscription_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.subscription_status === 'active' ? 'bg-green-500/20 text-green-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {u.subscription_status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400">{u.lifetime_picks || 0}</td>
                    <td className="px-4 py-4 text-sm text-gray-400">${u.total_spent || 0}</td>
                    <td className="px-4 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1 text-gray-400 hover:text-white"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {editingUser && <UserEditModal />}
        {selectedUser && <UserDetailsModal />}
      </AnimatePresence>
    </div>
  )
}
