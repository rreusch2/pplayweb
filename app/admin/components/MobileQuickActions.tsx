'use client'
import { motion } from 'framer-motion'
import { LucideIcon, ChevronRight } from 'lucide-react'

interface QuickAction {
  id: string
  label: string
  description?: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'red' | 'yellow'
  onClick: () => void
  badge?: string | number
  disabled?: boolean
}

interface Props {
  actions: QuickAction[]
  title?: string
  layout?: 'grid' | 'list'
  columns?: {
    mobile: number
    tablet: number
    desktop: number
  }
}

export default function MobileQuickActions({ 
  actions, 
  title = "Quick Actions",
  layout = 'grid',
  columns = { mobile: 1, tablet: 2, desktop: 4 }
}: Props) {
  const getColorClasses = (color: QuickAction['color']) => {
    const colorMap: Record<QuickAction['color'], {
      bg: string
      border: string
      icon: string
      hover: string
    }> = {
      blue: {
        bg: 'from-blue-500/10 to-blue-600/20',
        border: 'border-blue-500/20 hover:border-blue-500/40',
        icon: 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30',
        hover: 'hover:bg-blue-500/5'
      },
      green: {
        bg: 'from-green-500/10 to-green-600/20',
        border: 'border-green-500/20 hover:border-green-500/40',
        icon: 'bg-green-500/20 text-green-400 group-hover:bg-green-500/30',
        hover: 'hover:bg-green-500/5'
      },
      purple: {
        bg: 'from-purple-500/10 to-purple-600/20',
        border: 'border-purple-500/20 hover:border-purple-500/40',
        icon: 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500/30',
        hover: 'hover:bg-purple-500/5'
      },
      orange: {
        bg: 'from-orange-500/10 to-orange-600/20',
        border: 'border-orange-500/20 hover:border-orange-500/40',
        icon: 'bg-orange-500/20 text-orange-400 group-hover:bg-orange-500/30',
        hover: 'hover:bg-orange-500/5'
      },
      cyan: {
        bg: 'from-cyan-500/10 to-cyan-600/20',
        border: 'border-cyan-500/20 hover:border-cyan-500/40',
        icon: 'bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/30',
        hover: 'hover:bg-cyan-500/5'
      },
      red: {
        bg: 'from-red-500/10 to-red-600/20',
        border: 'border-red-500/20 hover:border-red-500/40',
        icon: 'bg-red-500/20 text-red-400 group-hover:bg-red-500/30',
        hover: 'hover:bg-red-500/5'
      },
      yellow: {
        bg: 'from-yellow-500/10 to-yellow-600/20',
        border: 'border-yellow-500/20 hover:border-yellow-500/40',
        icon: 'bg-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500/30',
        hover: 'hover:bg-yellow-500/5'
      }
    }
    return colorMap[color] || colorMap.blue
  }

  const ActionButton = ({ action, index }: { action: QuickAction, index: number }) => {
    const colors = getColorClasses(action.color)
    
    return (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={action.onClick}
        disabled={action.disabled}
        className={`
          w-full p-4 sm:p-6 
          bg-gradient-to-br ${colors.bg} 
          backdrop-blur-sm rounded-2xl 
          border ${colors.border} 
          transition-all duration-300 
          text-left group
          ${action.disabled ? 'opacity-50 cursor-not-allowed' : colors.hover}
          ${layout === 'list' ? 'flex items-center space-x-4' : ''}
        `}
      >
        <div className={`
          ${layout === 'list' ? 'flex items-center space-x-4 w-full' : 'flex items-center justify-between mb-3'}
        `}>
          <div className={`
            p-3 rounded-xl 
            ${colors.icon} 
            transition-all duration-300
            ${!action.disabled && 'group-hover:scale-110'}
            ${layout === 'list' ? 'flex-shrink-0' : ''}
          `}>
            <action.icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          
          {layout === 'list' && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-semibold text-sm sm:text-base group-hover:text-white/90 transition-colors">
                    {action.label}
                  </h3>
                  {action.description && (
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">
                      {action.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                  {action.badge && (
                    <span className="px-2 py-1 bg-white/10 text-white text-xs font-medium rounded-full">
                      {action.badge}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          )}
          
          {layout === 'grid' && action.badge && (
            <span className="px-2 py-1 bg-white/10 text-white text-xs font-medium rounded-full">
              {action.badge}
            </span>
          )}
        </div>

        {layout === 'grid' && (
          <div>
            <h3 className="text-white font-semibold text-sm sm:text-base mb-1 group-hover:text-white/90 transition-colors">
              {action.label}
            </h3>
            {action.description && (
              <p className="text-gray-400 text-xs sm:text-sm">
                {action.description}
              </p>
            )}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-gray-500">
                Click to execute
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors group-hover:translate-x-1" />
            </div>
          </div>
        )}
      </motion.button>
    )
  }

  const containerClasses = layout === 'grid' 
    ? `grid gap-4 sm:gap-6 grid-cols-${columns.mobile} sm:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop}`
    : 'space-y-3 sm:space-y-4'

  return (
    <div>
      {title && (
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
          {title}
        </h2>
      )}
      
      <div className={containerClasses}>
        {actions.map((action, index) => (
          <ActionButton 
            key={action.id} 
            action={action} 
            index={index} 
          />
        ))}
      </div>
    </div>
  )
}
