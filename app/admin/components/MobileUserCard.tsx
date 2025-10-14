'use client'
import { motion } from 'framer-motion'
import { Eye, Edit, Trash2, Crown, Star, User, Calendar, Mail, DollarSign } from 'lucide-react'

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

interface Props {
  user: UserData
  onView?: (user: UserData) => void
  onEdit?: (user: UserData) => void
  onDelete?: (user: UserData) => void
}

export default function MobileUserCard({ user, onView, onEdit, onDelete }: Props) {
  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'elite': return Crown
      case 'pro': return Star
      default: return User
    }
  }

  const getTierColors = (tier: string) => {
    switch (tier) {
      case 'elite': return {
        bg: 'from-purple-500/20 to-purple-600/30',
        border: 'border-purple-500/30',
        text: 'text-purple-300',
        icon: 'text-purple-400'
      }
      case 'pro': return {
        bg: 'from-blue-500/20 to-blue-600/30',
        border: 'border-blue-500/30',
        text: 'text-blue-300',
        icon: 'text-blue-400'
      }
      default: return {
        bg: 'from-gray-500/20 to-gray-600/30',
        border: 'border-gray-500/30',
        text: 'text-gray-300',
        icon: 'text-gray-400'
      }
    }
  }

  const getStatusColors = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'expired': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'N/A'
    }
  }

  const TierIcon = getTierIcon(user.subscription_tier)
  const tierColors = getTierColors(user.subscription_tier)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${tierColors.bg} backdrop-blur-sm rounded-2xl p-4 border ${tierColors.border} hover:border-opacity-60 transition-all duration-300 shadow-lg hover:shadow-xl`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${tierColors.bg} border ${tierColors.border}`}>
            <TierIcon className={`w-5 h-5 ${tierColors.icon}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${tierColors.text} bg-white/10 border border-current border-opacity-30`}>
                {user.subscription_tier}
              </span>
              {user.admin_role && (
                <span className="px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-red-300 bg-red-500/20 border border-red-500/30">
                  Admin
                </span>
              )}
            </div>
            <p className="text-white font-medium truncate text-sm">
              {user.username || user.email?.split('@')[0] || 'Unknown User'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {onView && (
            <button
              onClick={() => onView(user)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(user)}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(user)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-300 text-sm truncate">{user.email}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-300 text-sm">
            Joined {formatDate(user.created_at)}
          </span>
        </div>

        {user.subscription_plan_type && (
          <div className="flex items-center space-x-3">
            <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-300 text-sm capitalize">
              {user.subscription_plan_type} Plan
            </span>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <div className="mt-4 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColors(user.subscription_status)}`}>
            {user.subscription_status.charAt(0).toUpperCase() + user.subscription_status.slice(1)}
          </span>
          
          {user.subscription_expires_at && (
            <span className="text-xs text-gray-400">
              Expires {formatDate(user.subscription_expires_at)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
