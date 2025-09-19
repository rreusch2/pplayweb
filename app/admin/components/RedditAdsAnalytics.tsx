'use client'
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter,
  AreaChart, Area
} from 'recharts'
import { 
  TrendingUp, 
  DollarSign, 
  Eye, 
  MousePointer, 
  Target, 
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Award,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingDown
} from 'lucide-react'
import Papa from 'papaparse'

interface RedditAdsData {
  'Campaign Name': string
  'Ad Group Name': string
  'Ad Name': string
  'Subreddit': string
  'CPC (USD)': number
  'Impressions': number
  'CTR': number
  'Clicks': number
  'Currency': string
}

interface CampaignMetrics {
  campaign: string
  totalImpressions: number
  totalClicks: number
  totalCost: number
  avgCTR: number
  avgCPC: number
  subredditCount: number
}

interface SubredditMetrics {
  subreddit: string
  impressions: number
  clicks: number
  cost: number
  ctr: number
  cpc: number
  campaigns: number
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316']

export default function RedditAdsAnalytics() {
  const [rawData, setRawData] = useState<RedditAdsData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'campaigns' | 'subreddits' | 'performance'>('overview')

  // Load CSV data
  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const response = await fetch('/redditadsinsights.csv')
        const csvText = await response.text()
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results) => {
            const processedData = results.data.map((row: any) => ({
              'Campaign Name': row['Campaign Name'],
              'Ad Group Name': row['Ad Group Name'], 
              'Ad Name': row['Ad Name'],
              'Subreddit': row['Subreddit'],
              'CPC (USD)': parseFloat(row['CPC (USD)']) || 0,
              'Impressions': parseInt(row['Impressions']) || 0,
              'CTR': parseFloat(row['CTR']) || 0,
              'Clicks': parseInt(row['Clicks']) || 0,
              'Currency': row['Currency'] || ''
            }))
            setRawData(processedData)
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

  // Compute campaign metrics
  const campaignMetrics = useMemo(() => {
    const campaigns = new Map<string, CampaignMetrics>()
    
    rawData.forEach(row => {
      const campaign = row['Campaign Name']
      if (!campaigns.has(campaign)) {
        campaigns.set(campaign, {
          campaign,
          totalImpressions: 0,
          totalClicks: 0,
          totalCost: 0,
          avgCTR: 0,
          avgCPC: 0,
          subredditCount: 0
        })
      }
      
      const metrics = campaigns.get(campaign)!
      metrics.totalImpressions += row.Impressions
      metrics.totalClicks += row.Clicks
      metrics.totalCost += row['CPC (USD)'] * row.Clicks
    })

    // Calculate averages and subreddit counts
    campaigns.forEach((metrics, campaign) => {
      const campaignRows = rawData.filter(row => row['Campaign Name'] === campaign)
      metrics.avgCTR = campaignRows.reduce((sum, row) => sum + row.CTR, 0) / campaignRows.length
      metrics.avgCPC = metrics.totalClicks > 0 ? metrics.totalCost / metrics.totalClicks : 0
      metrics.subredditCount = new Set(campaignRows.map(row => row.Subreddit)).size
    })

    return Array.from(campaigns.values()).sort((a, b) => b.totalImpressions - a.totalImpressions)
  }, [rawData])

  // Compute subreddit metrics
  const subredditMetrics = useMemo(() => {
    const subreddits = new Map<string, SubredditMetrics>()
    
    rawData.forEach(row => {
      const subreddit = row.Subreddit
      if (!subreddits.has(subreddit)) {
        subreddits.set(subreddit, {
          subreddit,
          impressions: 0,
          clicks: 0,
          cost: 0,
          ctr: 0,
          cpc: 0,
          campaigns: 0
        })
      }
      
      const metrics = subreddits.get(subreddit)!
      metrics.impressions += row.Impressions
      metrics.clicks += row.Clicks
      metrics.cost += row['CPC (USD)'] * row.Clicks
    })

    // Calculate averages and campaign counts
    subreddits.forEach((metrics, subreddit) => {
      const subredditRows = rawData.filter(row => row.Subreddit === subreddit)
      metrics.ctr = subredditRows.reduce((sum, row) => sum + row.CTR, 0) / subredditRows.length
      metrics.cpc = metrics.clicks > 0 ? metrics.cost / metrics.clicks : 0
      metrics.campaigns = new Set(subredditRows.map(row => row['Campaign Name'])).size
    })

    return Array.from(subreddits.values()).sort((a, b) => b.impressions - a.impressions)
  }, [rawData])

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    const totalImpressions = rawData.reduce((sum, row) => sum + row.Impressions, 0)
    const totalClicks = rawData.reduce((sum, row) => sum + row.Clicks, 0)
    const totalCost = rawData.reduce((sum, row) => sum + (row['CPC (USD)'] * row.Clicks), 0)
    const avgCTR = rawData.reduce((sum, row) => sum + row.CTR, 0) / rawData.length
    const avgCPC = totalClicks > 0 ? totalCost / totalClicks : 0
    const uniqueSubreddits = new Set(rawData.map(row => row.Subreddit)).size
    const uniqueCampaigns = new Set(rawData.map(row => row['Campaign Name'])).size

    return {
      totalImpressions,
      totalClicks,
      totalCost,
      avgCTR,
      avgCPC,
      uniqueSubreddits,
      uniqueCampaigns
    }
  }, [rawData])

  // Top performing subreddits by different metrics
  const topSubredditsByImpressions = subredditMetrics.slice(0, 10)
  const topSubredditsByClicks = [...subredditMetrics].sort((a, b) => b.clicks - a.clicks).slice(0, 10)
  const topSubredditsByCTR = [...subredditMetrics].filter(s => s.clicks > 0).sort((a, b) => b.ctr - a.ctr).slice(0, 10)
  const topSubredditsByCost = [...subredditMetrics].sort((a, b) => b.cost - a.cost).slice(0, 10)

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white">Loading Reddit Ads Analytics...</p>
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
        className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-md rounded-xl border border-white/10 p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
              <Activity className="w-8 h-8 text-purple-400 mr-3" />
              Reddit Ads Analytics
            </h2>
            <p className="text-gray-300">Campaign performance and subreddit insights</p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'campaigns', label: 'Campaigns', icon: Target },
              { key: 'subreddits', label: 'Subreddits', icon: Users },
              { key: 'performance', label: 'Performance', icon: TrendingUp }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedView(key as any)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                  selectedView === key
                    ? 'bg-blue-600 text-white shadow-lg'
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
              className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">Total Impressions</p>
                  <div className="text-3xl font-bold text-white">{overallMetrics.totalImpressions.toLocaleString()}</div>
                </div>
                <Eye className="w-8 h-8 text-blue-400" />
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
                  <p className="text-green-200 text-sm font-medium">Total Clicks</p>
                  <div className="text-3xl font-bold text-white">{overallMetrics.totalClicks.toLocaleString()}</div>
                </div>
                <MousePointer className="w-8 h-8 text-green-400" />
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
                  <p className="text-purple-200 text-sm font-medium">Avg CTR</p>
                  <div className="text-3xl font-bold text-white">{(overallMetrics.avgCTR * 100).toFixed(3)}%</div>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
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
                  <p className="text-yellow-200 text-sm font-medium">Total Cost</p>
                  <div className="text-3xl font-bold text-white">${overallMetrics.totalCost.toFixed(2)}</div>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-400" />
              </div>
            </motion.div>
          </div>

          {/* Campaign vs Subreddit Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Target className="w-5 h-5 text-blue-400 mr-2" />
                Campaign Performance
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="campaign" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: any, name: string) => [
                      typeof value === 'number' ? value.toLocaleString() : value,
                      name
                    ]}
                  />
                  <Bar dataKey="totalImpressions" fill="#3B82F6" name="Impressions" />
                  <Bar dataKey="totalClicks" fill="#10B981" name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <PieChartIcon className="w-5 h-5 text-purple-400 mr-2" />
                Impressions by Campaign
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={campaignMetrics}
                    dataKey="totalImpressions"
                    nameKey="campaign"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                  >
                    {campaignMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: any) => [value.toLocaleString(), 'Impressions']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </>
      )}

      {/* Campaign Analysis */}
      {selectedView === 'campaigns' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
        >
          <h3 className="text-xl font-bold text-white mb-6">Campaign Performance Analysis</h3>
          
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-3 text-gray-300 font-medium">Campaign</th>
                  <th className="pb-3 text-gray-300 font-medium">Impressions</th>
                  <th className="pb-3 text-gray-300 font-medium">Clicks</th>
                  <th className="pb-3 text-gray-300 font-medium">CTR</th>
                  <th className="pb-3 text-gray-300 font-medium">Avg CPC</th>
                  <th className="pb-3 text-gray-300 font-medium">Total Cost</th>
                  <th className="pb-3 text-gray-300 font-medium">Subreddits</th>
                </tr>
              </thead>
              <tbody>
                {campaignMetrics.map((campaign, index) => (
                  <tr key={campaign.campaign} className="border-b border-white/5">
                    <td className="py-4 text-white font-medium">{campaign.campaign}</td>
                    <td className="py-4 text-gray-300">{campaign.totalImpressions.toLocaleString()}</td>
                    <td className="py-4 text-gray-300">{campaign.totalClicks.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        campaign.avgCTR > 0.005 ? 'bg-green-900 text-green-200' : 
                        campaign.avgCTR > 0.002 ? 'bg-yellow-900 text-yellow-200' : 
                        'bg-red-900 text-red-200'
                      }`}>
                        {(campaign.avgCTR * 100).toFixed(3)}%
                      </span>
                    </td>
                    <td className="py-4 text-gray-300">${campaign.avgCPC.toFixed(2)}</td>
                    <td className="py-4 text-gray-300">${campaign.totalCost.toFixed(2)}</td>
                    <td className="py-4 text-gray-300">{campaign.subredditCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={campaignMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="avgCPC" 
                  stroke="#9CA3AF"
                  name="Avg CPC"
                  label={{ value: 'Average CPC ($)', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  dataKey="avgCTR"
                  stroke="#9CA3AF"
                  name="CTR"
                  label={{ value: 'Click-Through Rate', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value: any, name: string) => [
                    name === 'avgCTR' ? `${(value * 100).toFixed(3)}%` : `$${value.toFixed(2)}`,
                    name === 'avgCTR' ? 'CTR' : 'Avg CPC'
                  ]}
                />
                <Scatter dataKey="totalImpressions" fill="#3B82F6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Subreddit Analysis */}
      {selectedView === 'subreddits' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Top Subreddits by Impressions</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSubredditsByImpressions} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                  <YAxis type="category" dataKey="subreddit" stroke="#9CA3AF" fontSize={10} width={80} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: any) => [value.toLocaleString(), 'Impressions']}
                  />
                  <Bar dataKey="impressions" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Top Subreddits by CTR</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSubredditsByCTR} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                  <YAxis type="category" dataKey="subreddit" stroke="#9CA3AF" fontSize={10} width={80} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                    formatter={(value: any) => [`${(value * 100).toFixed(3)}%`, 'CTR']}
                  />
                  <Bar dataKey="ctr" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
          >
            <h3 className="text-xl font-bold text-white mb-6">Detailed Subreddit Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-3 text-gray-300 font-medium">Subreddit</th>
                    <th className="pb-3 text-gray-300 font-medium">Impressions</th>
                    <th className="pb-3 text-gray-300 font-medium">Clicks</th>
                    <th className="pb-3 text-gray-300 font-medium">CTR</th>
                    <th className="pb-3 text-gray-300 font-medium">Avg CPC</th>
                    <th className="pb-3 text-gray-300 font-medium">Total Cost</th>
                    <th className="pb-3 text-gray-300 font-medium">Campaigns</th>
                  </tr>
                </thead>
                <tbody>
                  {subredditMetrics.slice(0, 15).map((subreddit) => (
                    <tr key={subreddit.subreddit} className="border-b border-white/5">
                      <td className="py-3">
                        <span className="text-blue-400 font-medium">r/{subreddit.subreddit}</span>
                      </td>
                      <td className="py-3 text-gray-300">{subreddit.impressions.toLocaleString()}</td>
                      <td className="py-3 text-gray-300">{subreddit.clicks.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          subreddit.ctr > 0.01 ? 'bg-green-900 text-green-200' : 
                          subreddit.ctr > 0.005 ? 'bg-yellow-900 text-yellow-200' : 
                          'bg-red-900 text-red-200'
                        }`}>
                          {(subreddit.ctr * 100).toFixed(3)}%
                        </span>
                      </td>
                      <td className="py-3 text-gray-300">${subreddit.cpc.toFixed(2)}</td>
                      <td className="py-3 text-gray-300">${subreddit.cost.toFixed(2)}</td>
                      <td className="py-3 text-gray-300">{subreddit.campaigns}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Performance Analysis */}
      {selectedView === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Award className="w-5 h-5 text-green-400 mr-2" />
                  Best CTR
                </h3>
                <ArrowUpRight className="w-5 h-5 text-green-400" />
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">
                  {(topSubredditsByCTR[0]?.ctr * 100 || 0).toFixed(3)}%
                </div>
                <div className="text-green-200 text-sm">
                  r/{topSubredditsByCTR[0]?.subreddit || 'N/A'}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Eye className="w-5 h-5 text-blue-400 mr-2" />
                  Most Impressions
                </h3>
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">
                  {topSubredditsByImpressions[0]?.impressions.toLocaleString() || '0'}
                </div>
                <div className="text-blue-200 text-sm">
                  r/{topSubredditsByImpressions[0]?.subreddit || 'N/A'}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <MousePointer className="w-5 h-5 text-purple-400 mr-2" />
                  Most Clicks
                </h3>
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">
                  {topSubredditsByClicks[0]?.clicks.toLocaleString() || '0'}
                </div>
                <div className="text-purple-200 text-sm">
                  r/{topSubredditsByClicks[0]?.subreddit || 'N/A'}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4">Cost Efficiency Analysis</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart data={subredditMetrics.filter(s => s.clicks > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="cpc" 
                  stroke="#9CA3AF"
                  name="CPC"
                  label={{ value: 'Cost Per Click ($)', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  dataKey="ctr"
                  stroke="#9CA3AF"
                  name="CTR"
                  label={{ value: 'Click-Through Rate', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                  formatter={(value: any, name: string) => [
                    name === 'ctr' ? `${(value * 100).toFixed(3)}%` : `$${value.toFixed(2)}`,
                    name === 'ctr' ? 'CTR' : 'CPC'
                  ]}
                  labelFormatter={(label) => `r/${subredditMetrics.find(s => s.cpc === label)?.subreddit || 'Unknown'}`}
                />
                <Scatter dataKey="impressions" fill="#8B5CF6" />
              </ScatterChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}
    </div>
  )
}
