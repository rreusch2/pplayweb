'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  AlertCircle,
  TrendingUp,
  Clock,
  ExternalLink,
  Activity,
  User,
  Zap,
  Calendar,
  Flame,
  Eye,
  ChevronRight,
  AlertTriangle,
  Trophy,
  BarChart3,
  Newspaper,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface NewsItem {
  id: string
  title: string
  summary: string
  content?: string
  type: 'trade' | 'lineup' | 'weather' | 'breaking' | 'analysis' | 'injury'
  sport: string
  league?: string
  team?: string
  player?: string
  timestamp: string
  source?: string
  url?: string
  priority: number
  tags?: string[]
  metadata?: any
}

interface LatestNewsFeedProps {
  limit?: number
  sport?: string
  showHeader?: boolean
  onNewsClick?: (news: NewsItem) => void
}

export default function LatestNewsFeed({ 
  limit = 12, // Increased to fetch more news for expansion
  sport, 
  showHeader = true, 
  onNewsClick 
}: LatestNewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  
  // Show 6 news cards initially, expand to show all when clicked
  const initialNewsCount = 6
  const displayedNews = isExpanded ? news : news.slice(0, initialNewsCount)
  const hasMoreNews = news.length > initialNewsCount

  useEffect(() => {
    setMounted(true)
    fetchNews()
  }, [sport])

  const fetchNews = async () => {
    setLoading(true)
    try {
      setError(null)
      
      // Get authentication token (same as mobile app)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      // Build API URL with parameters (same as mobile app)
      const params = new URLSearchParams()
      if (sport) params.append('sport', sport)
      params.append('limit', (limit * 2).toString()) // Get more items to ensure we have enough after filtering

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Use the same endpoint as mobile app
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://zooming-rebirth-production-a305.up.railway.app'
      const response = await fetch(`${baseUrl}/api/news?${params}`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Filter out injury and weather news items (same as mobile app)
        const filteredNews = (data.news || []).filter((item: NewsItem) => 
          item.type !== 'injury' && item.type !== 'weather'
        )
        setNews(filteredNews.slice(0, limit)) // Apply limit after filtering
      } else {
        setError('Failed to fetch news')
        setNews([])
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      setError('Unable to load news. Please try again.')
      setNews([])
    } finally {
      setLoading(false)
    }
  }

  const getNewsIcon = (type: string) => {
    switch (type) {
      case 'trade': return <TrendingUp className="w-4 h-4 text-blue-400" />
      case 'injury': return <AlertTriangle className="w-4 h-4 text-red-400" />
      case 'lineup': return <User className="w-4 h-4 text-green-400" />
      case 'weather': return <Activity className="w-4 h-4 text-yellow-400" />
      case 'breaking': return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'analysis': return <BarChart3 className="w-4 h-4 text-purple-400" />
      default: return <Newspaper className="w-4 h-4 text-gray-400" />
    }
  }

  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Unknown'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const handleNewsClick = (newsItem: NewsItem) => {
    if (onNewsClick) {
      onNewsClick(newsItem)
    } else if (newsItem.url) {
      window.open(newsItem.url, '_blank')
    }
  }

  const getSentimentColor = (score?: number) => {
    if (!score) return 'text-gray-400'
    if (score > 0.1) return 'text-green-400'
    if (score < -0.1) return 'text-red-400'
    return 'text-yellow-400'
  }

  if (!mounted) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Section Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold text-white">📰 Latest News</h3>
            <div className="flex items-center space-x-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
              <Activity className="w-3 h-3" />
              <span>LIVE</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Breaking news and updates</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center"
        >
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h4 className="text-white font-semibold mb-2">Unable to Load News</h4>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchNews}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      )}

      {/* News List */}
      {!loading && !error && news.length > 0 && (
        <div className="space-y-4">
          {displayedNews.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group"
              onClick={() => handleNewsClick(item)}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-gray-700 transition-colors">
                  {getNewsIcon(item.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <div className="flex items-center space-x-2 ml-3 flex-shrink-0">
                      {item.url && (
                        <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                  
                  {item.summary && (
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {item.summary.substring(0, 150)}...
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeAgo(item.timestamp)}</span>
                      </div>
                      <span>•</span>
                      <span>{item.source || item.sport}</span>
                      {item.priority > 7 && (
                        <>
                          <span>•</span>
                          <span className="text-red-400">
                            Breaking
                          </span>
                        </>
                      )}
                    </div>
                    
                    {item.priority > 8 && (
                      <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                        <Flame className="w-3 h-3" />
                        <span>Hot</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {(item.team || item.player || item.tags) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.team && (
                        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                          {item.team}
                        </span>
                      )}
                      {item.player && (
                        <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                          {item.player}
                        </span>
                      )}
                      {item.tags?.slice(0, 2).map((tag: string, idx: number) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* View More Button */}
          {hasMoreNews && !isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center pt-4"
            >
              <button
                onClick={() => setIsExpanded(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ChevronDown className="w-4 h-4" />
                <span>View More News ({news.length - initialNewsCount} more)</span>
              </button>
            </motion.div>
          )}
          
          {/* View Less Button */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center pt-4"
            >
              <button
                onClick={() => setIsExpanded(false)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ChevronUp className="w-4 h-4" />
                <span>View Less</span>
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && news.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center"
        >
          <Newspaper className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-white mb-2">
            No News Available
          </h4>
          <p className="text-gray-400 mb-4">
            Check back soon for the latest updates and breaking news
          </p>
          <button
            onClick={fetchNews}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh News
          </button>
        </motion.div>
      )}

      {/* View All CTA */}
      {!loading && !error && news.length > 0 && showHeader && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <button
            onClick={() => router.push('/news')}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
          >
            <Newspaper className="w-4 h-4" />
            <span>Read More News</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}