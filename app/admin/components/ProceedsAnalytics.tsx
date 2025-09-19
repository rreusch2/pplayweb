'use client'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  ComposedChart, Legend
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Target,
  Award,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingDown,
  Zap,
  Trophy,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle
} from 'lucide-react'
import Papa from 'papaparse'

interface ProceedsData {
  Date: string
  Proceeds: number
}

interface ProcessedData {
  date: string
  proceeds: number
  dayOfWeek: string
  month: string
  week: number
  isWeekend: boolean
  cumulativeTotal: number
}

interface MonthlyStats {
  month: string
  total: number
  average: number
  days: number
  revenuedays: number
  bestDay: number
  growthRate?: number
}

interface WeeklyStats {
  week: number
  weekOf: string
  total: number
  average: number
  days: number
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316']

export default function ProceedsAnalytics() {
  const [rawData, setRawData] = useState<ProceedsData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'breakdown' | 'insights'>('overview')

  // Load CSV data
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const response = await fetch('/predictive_play__ai_betting-proceeds-20250701-20250917.csv')
        const csvText = await response.text()
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            // Filter out the header information and get actual data
            const data = results.data
              .filter((row: any) => row.Date && row.Proceeds !== undefined)
              .map((row: any) => ({
                Date: row.Date,
                Proceeds: parseFloat(row.Proceeds) || 0
              }))
            setRawData(data)
            setLoading(false)
          }
        })
      } catch (error) {
        console.error('Error loading CSV:', error)
        setLoading(false)
      }
    }

    loadCSVData()
  }, [])

  // Process data with additional metrics
  const processedData = useMemo(() => {
    let cumulativeTotal = 0
    return rawData.map((item, index) => {
      cumulativeTotal += item.Proceeds
      const date = new Date(item.Date)
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' })
      const month = date.toLocaleDateString('en-US', { month: 'short' })
      const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun'
      
      // Calculate week number
      const startOfYear = new Date(date.getFullYear(), 0, 1)
      const week = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)

      return {
        date: item.Date,
        proceeds: item.Proceeds,
        dayOfWeek,
        month,
        week,
        isWeekend,
        cumulativeTotal
      }
    })
  }, [rawData])

  // Calculate key metrics
  const metrics = useMemo(() => {
    if (processedData.length === 0) return null

    const totalRevenue = processedData[processedData.length - 1]?.cumulativeTotal || 0
    const revenuedays = processedData.filter(d => d.proceeds > 0).length
    const totalDays = processedData.length
    const zeroDays = totalDays - revenuedays

    const revenueData = processedData.filter(d => d.proceeds > 0)
    const avgDailyRevenue = revenuedays > 0 ? totalRevenue / revenuedays : 0
    const avgDailyIncludingZeros = totalRevenue / totalDays

    const bestDay = Math.max(...processedData.map(d => d.proceeds))
    const bestDayData = processedData.find(d => d.proceeds === bestDay)

    const worstDay = Math.min(...revenueData.map(d => d.proceeds))
    
    // Find first revenue day
    const firstRevenueDay = processedData.find(d => d.proceeds > 0)
    
    // Calculate recent trends (last 30 days vs previous 30 days)
    const last30Days = processedData.slice(-30)
    const previous30Days = processedData.slice(-60, -30)
    
    const last30Total = last30Days.reduce((sum, d) => sum + d.proceeds, 0)
    const previous30Total = previous30Days.reduce((sum, d) => sum + d.proceeds, 0)
    
    const growthRate = previous30Total > 0 ? ((last30Total - previous30Total) / previous30Total) * 100 : 0

    // Revenue streaks
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0

    for (let i = processedData.length - 1; i >= 0; i--) {
      if (processedData[i].proceeds > 0) {
        if (currentStreak === 0) currentStreak = tempStreak + 1
        tempStreak++
        longestStreak = Math.max(longestStreak, tempStreak)
      } else {
        tempStreak = 0
      }
    }

    return {
      totalRevenue,
      revenuedays,
      totalDays,
      zeroDays,
      avgDailyRevenue,
      avgDailyIncludingZeros,
      bestDay,
      bestDayData,
      worstDay,
      firstRevenueDay,
      growthRate,
      currentStreak,
      longestStreak,
      last30Total,
      previous30Total
    }
  }, [processedData])

  // Monthly breakdown
  const monthlyStats = useMemo(() => {
    const monthlyData = new Map<string, MonthlyStats>()
    
    processedData.forEach(item => {
      const month = item.month
      if (!monthlyData.has(month)) {
        monthlyData.set(month, {
          month,
          total: 0,
          average: 0,
          days: 0,
          revenuedays: 0,
          bestDay: 0
        })
      }
      
      const stats = monthlyData.get(month)!
      stats.total += item.proceeds
      stats.days += 1
      stats.bestDay = Math.max(stats.bestDay, item.proceeds)
      if (item.proceeds > 0) stats.revenuedays += 1
    })

    const months = Array.from(monthlyData.values()).map(stats => ({
      ...stats,
      average: stats.revenuedays > 0 ? stats.total / stats.revenuedays : 0
    }))

    // Calculate growth rates
    months.forEach((month, index) => {
      if (index > 0) {
        const previousMonth = months[index - 1]
        month.growthRate = previousMonth.total > 0 
          ? ((month.total - previousMonth.total) / previousMonth.total) * 100 
          : 0
      }
    })

    return months
  }, [processedData])

  // Weekly patterns
  const weeklyPatterns = useMemo(() => {
    const dayStats = new Map<string, { total: number, count: number }>()
    
    processedData.forEach(item => {
      const day = item.dayOfWeek
      if (!dayStats.has(day)) {
        dayStats.set(day, { total: 0, count: 0 })
      }
      const stats = dayStats.get(day)!
      stats.total += item.proceeds
      stats.count += 1
    })

    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return daysOrder.map(day => ({
      day,
      average: dayStats.has(day) ? dayStats.get(day)!.total / dayStats.get(day)!.count : 0,
      total: dayStats.has(day) ? dayStats.get(day)!.total : 0
    }))
  }, [processedData])

  // Revenue distribution
  const revenueDistribution = useMemo(() => {
    const ranges = [
      { name: '$0', min: 0, max: 0, count: 0, color: '#6B7280' },
      { name: '$1-10', min: 1, max: 10, count: 0, color: '#3B82F6' },
      { name: '$11-25', min: 11, max: 25, count: 0, color: '#10B981' },
      { name: '$26-50', min: 26, max: 50, count: 0, color: '#F59E0B' },
      { name: '$51-100', min: 51, max: 100, count: 0, color: '#8B5CF6' },
      { name: '$100+', min: 101, max: Infinity, count: 0, color: '#EF4444' }
    ]

    processedData.forEach(item => {
      ranges.forEach(range => {
        if (item.proceeds >= range.min && item.proceeds <= range.max) {
          range.count++
        }
      })
    })

    return ranges.filter(range => range.count > 0)
  }, [processedData])

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading Proceeds Analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-md rounded-xl border border-white/10 p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
              <DollarSign className="w-8 h-8 text-green-400 mr-3" />
              App Proceeds Analytics
            </h2>
            <p className="text-gray-300">Revenue insights and performance metrics</p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'trends', label: 'Trends', icon: TrendingUp },
              { key: 'breakdown', label: 'Breakdown', icon: PieChartIcon },
              { key: 'insights', label: 'Insights', icon: Target }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedView(key as any)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                  selectedView === key
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Overview Dashboard */}
      {selectedView === 'overview' && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-200 text-sm font-medium">Total Revenue</p>
                  <div className="text-3xl font-bold text-white">${metrics?.totalRevenue.toFixed(2)}</div>
                </div>
                <Trophy className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">Best Day</p>
                  <div className="text-3xl font-bold text-white">${metrics?.bestDay.toFixed(2)}</div>
                  <p className="text-xs text-blue-300">{metrics?.bestDayData?.date}</p>
                </div>
                <Award className="w-8 h-8 text-blue-400" />
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
                  <p className="text-purple-200 text-sm font-medium">Avg per Revenue Day</p>
                  <div className="text-3xl font-bold text-white">${metrics?.avgDailyRevenue.toFixed(2)}</div>
                  <p className="text-xs text-purple-300">{metrics?.revenuedays} revenue days</p>
                </div>
                <Star className="w-8 h-8 text-purple-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`bg-gradient-to-br ${
                metrics && metrics.growthRate > 0 
                  ? 'from-emerald-500/20 to-green-600/20 border-emerald-500/30' 
                  : 'from-red-500/20 to-red-600/20 border-red-500/30'
              } backdrop-blur-md rounded-xl p-6 border`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-200 text-sm font-medium">30-Day Growth</p>
                  <div className={`text-3xl font-bold ${metrics && metrics.growthRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {metrics?.growthRate.toFixed(1)}%
                  </div>
                </div>
                {metrics && metrics.growthRate > 0 ? 
                  <ArrowUpRight className="w-8 h-8 text-green-400" /> :
                  <ArrowDownRight className="w-8 h-8 text-red-400" />
                }
              </div>
            </motion.div>
          </div>

          {/* Revenue Timeline and Monthly Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 text-green-400 mr-2" />
                Daily Revenue Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickFormatter={(value) => new Date(value).getMonth() + 1 + '/' + new Date(value).getDate()}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: any) => [`$${value}`, 'Revenue']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativeTotal" 
                    fill="#10B981" 
                    fillOpacity={0.1}
                    stroke="none"
                  />
                  <Bar dataKey="proceeds" fill="#10B981" />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeTotal" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 text-blue-400 mr-2" />
                Monthly Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: any, name: string) => [
                      name === 'total' ? `$${value}` : `$${value.toFixed(2)}`,
                      name === 'total' ? 'Total Revenue' : 'Avg per Day'
                    ]}
                  />
                  <Bar dataKey="total" fill="#3B82F6" name="total" />
                  <Bar dataKey="average" fill="#10B981" name="average" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </>
      )}

      {/* Trends Analysis */}
      {selectedView === 'trends' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Cumulative Revenue Growth</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={processedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: any) => [`$${value}`, 'Cumulative Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cumulativeTotal" 
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Daily Revenue Pattern</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={weeklyPatterns}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: any) => [`$${value.toFixed(2)}`, 'Average Revenue']}
                  />
                  <Bar dataKey="average" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Performance Streaks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">Performance Streaks</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">{metrics?.longestStreak}</div>
                <p className="text-gray-300">Longest Revenue Streak</p>
                <p className="text-sm text-gray-400">consecutive days</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{metrics?.currentStreak}</div>
                <p className="text-gray-300">Current Streak</p>
                <p className="text-sm text-gray-400">recent revenue days</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{metrics?.revenuedays}/{metrics?.totalDays}</div>
                <p className="text-gray-300">Revenue Days Ratio</p>
                <p className="text-sm text-gray-400">{((metrics?.revenuedays || 0) / (metrics?.totalDays || 1) * 100).toFixed(1)}% of days</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Revenue Breakdown */}
      {selectedView === 'breakdown' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Revenue Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                  >
                    {revenueDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: any) => [value, 'Days']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Monthly Comparison</h3>
              <div className="space-y-4">
                {monthlyStats.map((month, index) => (
                  <div key={month.month} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <div className="font-semibold text-white">{month.month}</div>
                      <div className="text-sm text-gray-400">{month.revenuedays}/{month.days} revenue days</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">${month.total.toFixed(2)}</div>
                      {month.growthRate !== undefined && (
                        <div className={`text-sm ${month.growthRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {month.growthRate > 0 ? '+' : ''}{month.growthRate.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Insights */}
      {selectedView === 'insights' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-6">Key Insights & Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-lg p-4 border border-green-500/30">
              <div className="flex items-center mb-3">
                <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                <h4 className="text-lg font-semibold text-white">Revenue Started</h4>
              </div>
              <p className="text-gray-300 text-sm mb-2">
                First revenue generated on <span className="text-green-400 font-medium">{metrics?.firstRevenueDay?.date}</span>
              </p>
              <p className="text-gray-400 text-xs">
                Great milestone - the app started monetizing successfully!
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-lg p-4 border border-blue-500/30">
              <div className="flex items-center mb-3">
                <Trophy className="w-6 h-6 text-blue-400 mr-2" />
                <h4 className="text-lg font-semibold text-white">Peak Performance</h4>
              </div>
              <p className="text-gray-300 text-sm mb-2">
                Best day generated <span className="text-blue-400 font-medium">${metrics?.bestDay}</span>
              </p>
              <p className="text-gray-400 text-xs">
                Analyze what drove this peak to replicate success.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/30">
              <div className="flex items-center mb-3">
                <Activity className="w-6 h-6 text-purple-400 mr-2" />
                <h4 className="text-lg font-semibold text-white">Consistency Rate</h4>
              </div>
              <p className="text-gray-300 text-sm mb-2">
                Revenue on <span className="text-purple-400 font-medium">{((metrics?.revenuedays || 0) / (metrics?.totalDays || 1) * 100).toFixed(0)}%</span> of days
              </p>
              <p className="text-gray-400 text-xs">
                Focus on increasing daily active monetization.
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-lg p-4 border border-yellow-500/30">
              <div className="flex items-center mb-3">
                <Zap className="w-6 h-6 text-yellow-400 mr-2" />
                <h4 className="text-lg font-semibold text-white">Growth Trend</h4>
              </div>
              <p className="text-gray-300 text-sm mb-2">
                {metrics && metrics.growthRate > 0 ? (
                  <>Growing <span className="text-green-400 font-medium">+{metrics.growthRate.toFixed(1)}%</span> (30-day)</>
                ) : (
                  <>Declining <span className="text-red-400 font-medium">{metrics?.growthRate.toFixed(1)}%</span> (30-day)</>
                )}
              </p>
              <p className="text-gray-400 text-xs">
                {metrics && metrics.growthRate > 0 ? 'Maintain momentum with consistent features.' : 'Consider new user acquisition strategies.'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 rounded-lg p-4 border border-indigo-500/30">
              <div className="flex items-center mb-3">
                <Clock className="w-6 h-6 text-indigo-400 mr-2" />
                <h4 className="text-lg font-semibold text-white">Best Day Pattern</h4>
              </div>
              <p className="text-gray-300 text-sm mb-2">
                {weeklyPatterns.find(d => d.average === Math.max(...weeklyPatterns.map(p => p.average)))?.day} performs best
              </p>
              <p className="text-gray-400 text-xs">
                Schedule key features or promotions for peak days.
              </p>
            </div>

            <div className="bg-gradient-to-br from-teal-600/20 to-green-600/20 rounded-lg p-4 border border-teal-500/30">
              <div className="flex items-center mb-3">
                <Target className="w-6 h-6 text-teal-400 mr-2" />
                <h4 className="text-lg font-semibold text-white">Next Milestone</h4>
              </div>
              <p className="text-gray-300 text-sm mb-2">
                Target: <span className="text-teal-400 font-medium">${((metrics?.totalRevenue || 0) + 500).toFixed(0)}</span> total revenue
              </p>
              <p className="text-gray-400 text-xs">
                ${(500 - ((metrics?.totalRevenue || 0) % 500)).toFixed(0)} away from next $500 milestone.
              </p>
            </div>

          </div>
        </motion.div>
      )}
    </div>
  )
}
