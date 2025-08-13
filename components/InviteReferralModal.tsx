'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, HandCoins, Gift } from 'lucide-react'
import { coinsService } from '@/shared/services/coinsService'

interface InviteReferralModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function InviteReferralModal({ isOpen, onClose }: InviteReferralModalProps) {
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState<number>(0)
  const [referralCode, setReferralCode] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [bal, info] = await Promise.all([
        coinsService.getBalance(),
        coinsService.getReferralInfo(),
      ])
      setBalance(bal)
      if (info.referral_code) setReferralCode(info.referral_code)
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
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900 p-6"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-300">
                  <HandCoins className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-white">Invite & Earn Coins</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
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
              {error && <div className="text-sm text-red-400">{error}</div>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
