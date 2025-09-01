'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, HandCoins, Gift, Clock, Crown, Zap, Star } from 'lucide-react'
import { coinsService } from '@/shared/services/coinsService'

interface InviteReferralModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Reward {
  id: string
  reward_name: string
  reward_description: string
  points_cost: number
  reward_type: string
  upgrade_tier?: string
  duration_hours?: number
  is_active: boolean
}

export default function InviteReferralModal({ isOpen, onClose }: InviteReferralModalProps) {
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState<number>(0)
  const [referralCode, setReferralCode] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [claiming, setClaiming] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'invite' | 'rewards'>('invite')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [bal, info, rewardsRes] = await Promise.all([
        coinsService.getBalance(),
        coinsService.getReferralInfo(),
        // Use proper apiClient with auth interceptor instead of direct fetch
        import('@/shared/services/apiClient').then(({ default: apiClient }) => 
          apiClient.get('/api/rewards/catalog').then(res => res.data)
        )
      ])
      setBalance(bal)
      if (info.referral_code) setReferralCode(info.referral_code)
      if (rewardsRes.rewards) setRewards(rewardsRes.rewards)
    } catch (e: any) {
      setError(e?.message || 'Failed to load referral data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const code = await coinsService.generateReferralCode()
      if (code) setReferralCode(code)
    } catch (e: any) {
      setError(e?.message || 'Failed to generate code')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    const url = `${window.location.origin}/signup?ref=${referralCode}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleClaimReward = async (rewardId: string) => {
    setClaiming(rewardId)
    setError(null)
    try {
      const apiClient = (await import('@/shared/services/apiClient')).default
      const { data } = await apiClient.post('/api/rewards/claim', { rewardId })
      
      if (data.success) {
        // Refresh balance and rewards
        const newBalance = await coinsService.getBalance()
        setBalance(newBalance)
        
        // Reload rewards to show updated status
        await loadData()
        
        // Show success message with tier info
        const reward = rewards.find(r => r.id === rewardId)
        const tierName = reward?.upgrade_tier === 'pro' ? 'Pro' : reward?.upgrade_tier === 'elite' ? 'Elite' : 'Premium'
        const duration = reward?.duration_hours ? formatDuration(reward.duration_hours) : 'temporary'
        
        alert(`🎉 Success! You now have ${tierName} access for ${duration}!`)
        
        // Close modal after successful claim
        setTimeout(() => onClose(), 2000)
      } else {
        setError(data.error || 'Failed to claim reward')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to claim reward')
    } finally {
      setClaiming(null)
    }
  }

  const getRewardIcon = (reward: Reward) => {
    if (reward.upgrade_tier === 'pro') return <Crown className="w-5 h-5" />
    if (reward.upgrade_tier === 'elite') return <Star className="w-5 h-5" />
    return <Zap className="w-5 h-5" />
  }

  const getRewardColor = (reward: Reward) => {
    if (reward.upgrade_tier === 'pro') return 'from-blue-500/20 to-purple-500/20'
    if (reward.upgrade_tier === 'elite') return 'from-purple-500/20 to-pink-500/20'
    return 'from-yellow-500/20 to-orange-500/20'
  }

  const formatDuration = (hours: number) => {
    if (hours === 24) return '1 Day'
    if (hours === 48) return '2 Days' 
    if (hours === 72) return '3 Days'
    if (hours === 168) return '1 Week'
    return `${hours}h`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="w-full max-w-4xl rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 p-6"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-300">
                  <HandCoins className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">Referrals & Rewards</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-6 rounded-lg bg-black/40 p-1">
              <button
                onClick={() => setActiveTab('invite')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'invite'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Invite Friends
              </button>
              <button
                onClick={() => setActiveTab('rewards')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'rewards'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Claim Rewards
              </button>
            </div>

            {/* Balance */}
            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Your Coin Balance</div>
                <div className="text-2xl font-bold text-yellow-300">{loading ? '—' : balance}</div>
              </div>
              <Gift className="w-6 h-6 text-yellow-300" />
            </div>

            {activeTab === 'invite' ? (
              /* Invite Tab */
              <div className="space-y-6">
                {/* How it Works */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">How It Works</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</div>
                      <span>Share your referral link with friends</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</div>
                      <span>They sign up and try ParleyApp (25 points)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</div>
                      <span>When they subscribe, you get 100 points!</span>
                    </div>
                  </div>
                </div>

                {/* Referral Code */}
                <div className="space-y-3">
                  <div className="text-sm text-gray-300">Share your referral link:</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={referralCode ? `${window.location.origin}/signup?ref=${referralCode}` : ''}
                      placeholder={loading ? 'Loading…' : 'Generate a referral code'}
                      className="flex-1 rounded-lg bg-black/40 border border-white/10 text-white px-3 py-2 text-sm"
                    />
                    {referralCode ? (
                      <button
                        onClick={handleCopy}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm flex items-center gap-1"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    ) : (
                      <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-sm"
                      >
                        Generate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Rewards Tab */
              <div className="space-y-4">
                <div className="text-sm text-gray-300 mb-4">
                  Redeem your points for temporary Pro & Elite access!
                </div>
                
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading rewards...</div>
                ) : (
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {rewards.map((reward) => (
                      <div
                        key={reward.id}
                        className={`rounded-xl border border-white/10 bg-gradient-to-r ${getRewardColor(reward)} p-4`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              reward.upgrade_tier === 'pro' ? 'bg-blue-500/20 text-blue-300' :
                              reward.upgrade_tier === 'elite' ? 'bg-purple-500/20 text-purple-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {getRewardIcon(reward)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-white">{reward.reward_name}</h4>
                                {reward.duration_hours && (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/30 text-xs text-gray-300">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(reward.duration_hours)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-300 mb-2">{reward.reward_description}</p>
                              <div className="text-lg font-bold text-yellow-300">
                                {reward.points_cost} points
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleClaimReward(reward.id)}
                            disabled={balance < reward.points_cost || claiming === reward.id}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              balance >= reward.points_cost
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {claiming === reward.id ? 'Claiming...' : 
                             balance >= reward.points_cost ? 'Claim' : 'Not Enough Points'}
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {rewards.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        No rewards available at the moment
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {error && <div className="mt-4 text-sm text-red-400">{error}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
