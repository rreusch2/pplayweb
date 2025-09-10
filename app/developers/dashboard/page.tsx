'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  BarChart3, 
  Calendar,
  TrendingUp,
  AlertCircle,
  Zap,
  CreditCard,
  ExternalLink
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { createBrowserClient } from '@supabase/ssr'

interface ApiKey {
  id: string
  user_id: string
  key_hash: string
  key_prefix: string
  name: string
  is_active: boolean
  current_month_usage: number
  created_at: string
  last_used_at: string | null
  expires_at: string | null
}

interface DailyUsage {
  date: string
  calls: number
  label: string
}

interface UsageData {
  currentUsage: number
  monthlyLimit: number
  subscriptionTier: string
  dailyUsage: DailyUsage[]
  totalCalls: number
}

export default function DeveloperDashboard() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [showNewKeyModal, setShowNewKeyModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState('')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!user) {
      router.push('/developers')
      return
    }
    fetchAPIKeys()
    fetchUsageData()
  }, [user])

  const fetchAPIKeys = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setApiKeys(data || [])
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }
  }

  const fetchUsageData = async () => {
    if (!user?.id) return
    
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
      
      const { data: usageData, error } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
      
      if (error) throw error
      
      // Get user subscription info
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('api_subscription_tier, api_monthly_limit, api_current_usage')
        .eq('id', user.id)
        .single()
      
      if (userError) throw userError
      
      setUsage({
        currentUsage: userData?.api_current_usage || 0,
        monthlyLimit: userData?.api_monthly_limit || 1000,
        subscriptionTier: userData?.api_subscription_tier || 'free',
        dailyUsage: processDailyUsage(usageData || []),
        totalCalls: usageData?.length || 0
      })
      
    } catch (error) {
      console.error('Error fetching usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processDailyUsage = (usageData: any[]) => {
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayUsage = usageData.filter((call: any) => 
        call.timestamp?.startsWith(dateStr)
      ).length
      
      last7Days.push({
        date: dateStr,
        calls: dayUsage,
        label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : date.toLocaleDateString('en-US', { weekday: 'short' })
      })
    }
    return last7Days
  }

  const generateAPIKey = () => {
    const prefix = 'pk_live_'
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key = prefix
    for (let i = 0; i < 32; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return key
  }

  const createAPIKey = async () => {
    if (!user?.id) return
    
    try {
      const newKey = generateAPIKey()
      const keyPrefix = newKey.substring(0, 12) + '...'
      
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          key_hash: newKey,
          key_prefix: keyPrefix,
          name: newKeyName || 'API Key'
        })
      
      if (error) throw error
      
      setShowNewKeyModal(false)
      setNewKeyName('')
      fetchAPIKeys()
      
      // Show the full key to user (only time they'll see it)
      alert(`Your new API key: ${newKey}\n\nSave this key securely - you won't be able to see it again!`)
      
    } catch (error) {
      console.error('Error creating API key:', error)
      alert('Error creating API key')
    }
  }

  const deleteAPIKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return
    
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId)
      
      if (error) throw error
      fetchAPIKeys()
    } catch (error) {
      console.error('Error deleting API key:', error)
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    const newRevealed = new Set(revealedKeys)
    if (newRevealed.has(keyId)) {
      newRevealed.delete(keyId)
    } else {
      newRevealed.add(keyId)
    }
    setRevealedKeys(newRevealed)
  }

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(keyId)
    setTimeout(() => setCopiedKey(''), 2000)
  }

  const getUsagePercentage = () => {
    if (!usage) return 0
    return Math.min((usage.currentUsage / usage.monthlyLimit) * 100, 100)
  }

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'enterprise': return 'text-purple-400'
      case 'startup': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <a href="/developers" className="text-white hover:text-blue-300 transition-colors">
                ← Back to API Docs
              </a>
              <h1 className="text-xl font-bold text-white">Developer Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">
                {user?.email}
              </span>
              <div className={`px-3 py-1 rounded-full text-sm font-medium bg-white/10 ${getSubscriptionColor(usage?.subscriptionTier || 'free')}`}>
                {usage?.subscriptionTier ? usage.subscriptionTier.charAt(0).toUpperCase() + usage.subscriptionTier.slice(1) : 'Free'}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Usage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Usage */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Monthly Usage</h3>
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Used</span>
                <span className="text-white">{usage?.currentUsage || 0} / {usage?.monthlyLimit || 1000}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${getUsagePercentage()}%` }}
                />
              </div>
              <div className="text-xs text-gray-400">
                {Math.round(getUsagePercentage())}% of monthly limit
              </div>
            </div>
          </div>

          {/* API Calls Today */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Today's Calls</h3>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {usage?.dailyUsage?.[6]?.calls || 0}
            </div>
            <div className="text-sm text-gray-400">
              API requests today
            </div>
          </div>

          {/* Subscription Status */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Subscription</h3>
              <CreditCard className="w-5 h-5 text-purple-400" />
            </div>
            <div className={`text-2xl font-bold mb-2 ${getSubscriptionColor(usage?.subscriptionTier || 'free')}`}>
              {usage?.subscriptionTier ? usage.subscriptionTier.charAt(0).toUpperCase() + usage.subscriptionTier.slice(1) : 'Free'}
            </div>
            <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* Usage Chart */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
          <h3 className="text-lg font-semibold text-white mb-6">7-Day Usage</h3>
          <div className="grid grid-cols-7 gap-2">
            {usage?.dailyUsage?.map((day: DailyUsage, index: number) => (
              <div key={index} className="text-center">
                <div className="bg-gray-700 rounded-lg p-4 mb-2 relative">
                  <div 
                    className="bg-blue-500 rounded-lg absolute bottom-0 left-0 right-0 transition-all duration-300"
                    style={{ 
                      height: `${Math.max((day.calls / ((usage?.monthlyLimit || 1000) / 30)) * 100, 2)}%` 
                    }}
                  />
                  <div className="relative text-white text-sm font-medium">
                    {day.calls}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {day.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Keys Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">API Keys</h3>
            <button
              onClick={() => setShowNewKeyModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create API Key</span>
            </button>
          </div>

          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No API keys yet</p>
              <button
                onClick={() => setShowNewKeyModal(true)}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Create your first API key
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-white">{key.name}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          key.is_active 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {key.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <code className="bg-black/40 text-green-400 px-2 py-1 rounded text-sm font-mono">
                          {revealedKeys.has(key.id) ? key.key_hash : key.key_prefix}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {revealedKeys.has(key.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(key.key_hash, key.id)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {copiedKey === key.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Created {new Date(key.created_at).toLocaleDateString()} • 
                        Last used {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteAPIKey(key.id)}
                      className="text-red-400 hover:text-red-300 transition-colors ml-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Start Guide */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Start</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-white font-medium mb-2">1. Make Your First Request</h4>
              <div className="bg-black/40 rounded-lg p-3 text-sm font-mono text-green-400 overflow-x-auto">
                {`curl -X POST https://api.predictiveplay.com/v1/query \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "LeBron James career points"}'`}
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">2. Useful Links</h4>
              <div className="space-y-2">
                <a href="/developers/docs" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  <span>Full API Documentation</span>
                </a>
                <a href="https://web-production-f090e.up.railway.app/health" target="_blank" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  <span>API Status & Health</span>
                </a>
                <a href="mailto:api@predictiveplay.com" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  <span>API Support</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New API Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Create New API Key</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API Key"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2 text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">You'll only be able to see this key once!</span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createAPIKey}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
