'use client'
import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatData {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'red' | 'yellow'
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  format?: 'number' | 'currency' | 'percentage'
}

interface Props {
  stats: StatData[]
  columns?: {
    mobile: number
    tablet: number
    desktop: number
  }
}

export default function ResponsiveStatsGrid({ 
  stats, 
  columns = { mobile: 1, tablet: 2, desktop: 4 } 
}: Props) {
  const formatValue = (value: string | number, format?: string) => {
    if (typeof value === 'string') return value
    
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`
      case 'percentage':
        return `${value}%`
      case 'number':
      default:
        return value.toLocaleString()
    }
  }

  const getColorClasses = (color: StatData['color']) => {
    const colorMap: Record<StatData['color'], {
      bg: string
      border: string
      icon: string
      text: string
      shadow: string
    }> = {
      blue: {
        bg: 'from-blue-500/10 to-blue-600/20',
        border: 'border-blue-500/20 hover:border-blue-500/40',
        icon: 'bg-blue-500/20 text-blue-400',
        text: 'text-blue-200',
        shadow: 'hover:shadow-blue-500/10'
      },
      green: {
        bg: 'from-green-500/10 to-green-600/20',
        border: 'border-green-500/20 hover:border-green-500/40',
        icon: 'bg-green-500/20 text-green-400',
        text: 'text-green-200',
        shadow: 'hover:shadow-green-500/10'
      },
      purple: {
        bg: 'from-purple-500/10 to-purple-600/20',
        border: 'border-purple-500/20 hover:border-purple-500/40',
        icon: 'bg-purple-500/20 text-purple-400',
        text: 'text-purple-200',
        shadow: 'hover:shadow-purple-500/10'
      },
      orange: {
        bg: 'from-orange-500/10 to-orange-600/20',
        border: 'border-orange-500/20 hover:border-orange-500/40',
        icon: 'bg-orange-500/20 text-orange-400',
        text: 'text-orange-200',
        shadow: 'hover:shadow-orange-500/10'
      },
      cyan: {
        bg: 'from-cyan-500/10 to-cyan-600/20',
        border: 'border-cyan-500/20 hover:border-cyan-500/40',
        icon: 'bg-cyan-500/20 text-cyan-400',
        text: 'text-cyan-200',
        shadow: 'hover:shadow-cyan-500/10'
      },
      red: {
        bg: 'from-red-500/10 to-red-600/20',
        border: 'border-red-500/20 hover:border-red-500/40',
        icon: 'bg-red-500/20 text-red-400',
        text: 'text-red-200',
        shadow: 'hover:shadow-red-500/10'
      },
      yellow: {
        bg: 'from-yellow-500/10 to-yellow-600/20',
        border: 'border-yellow-500/20 hover:border-yellow-500/40',
        icon: 'bg-yellow-500/20 text-yellow-400',
        text: 'text-yellow-200',
        shadow: 'hover:shadow-yellow-500/10'
      }
    }
    return colorMap[color] || colorMap.blue
  }

  const gridClasses = `grid gap-4 sm:gap-6 grid-cols-${columns.mobile} sm:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop}`

  return (
    <div className={gridClasses}>
      {stats.map((stat, index) => {
        const colors = getColorClasses(stat.color)
        const TrendIcon = stat.trend?.isPositive ? TrendingUp : TrendingDown
        
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              bg-gradient-to-br ${colors.bg} 
              backdrop-blur-sm rounded-2xl p-4 sm:p-6 
              border ${colors.border} 
              transition-all duration-300 
              hover:shadow-lg ${colors.shadow}
              cursor-pointer
              group
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`
                p-2 sm:p-3 rounded-xl 
                ${colors.icon} 
                group-hover:scale-110 
                transition-transform duration-300
              `}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              
              {stat.trend && (
                <div className={`
                  flex items-center space-x-1 
                  ${stat.trend.isPositive ? 'text-green-400' : 'text-red-400'}
                  text-sm font-medium
                `}>
                  <TrendIcon className="w-4 h-4" />
                  <span>{Math.abs(stat.trend.value)}%</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2 group-hover:scale-105 transition-transform duration-300">
                {formatValue(stat.value, stat.format)}
              </h3>
              <p className={`${colors.text} text-sm sm:text-base font-medium mb-1`}>
                {stat.title}
              </p>
              {stat.subtitle && (
                <p className="text-gray-400 text-xs sm:text-sm">
                  {stat.subtitle}
                </p>
              )}
            </div>

            {/* Mobile-specific trend display */}
            {stat.trend && (
              <div className="mt-3 pt-3 border-t border-white/10 sm:hidden">
                <div className={`
                  flex items-center justify-center space-x-2 
                  ${stat.trend.isPositive ? 'text-green-400' : 'text-red-400'}
                  text-sm font-medium
                `}>
                  <TrendIcon className="w-4 h-4" />
                  <span>
                    {stat.trend.isPositive ? '+' : ''}{stat.trend.value}% this month
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
