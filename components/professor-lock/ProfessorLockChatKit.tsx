"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, Sparkles, Crown, TrendingUp, Target, BarChart3, 
  Lightbulb, Globe, Search, FileSearch, Code, Monitor,
  Send, X, Maximize2, Minimize2, Settings, History,
  Trophy, Zap, Shield, DollarSign, Activity, ChevronRight
} from 'lucide-react'
import { ChatKit, useChatKit as useChatKitReact } from '@openai/chatkit-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

// Custom Widget Components
const BettingCardWidget = ({ data }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4"
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-emerald-400" />
        <span className="font-semibold text-white">{data.match}</span>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
        data.confidence >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
        data.confidence >= 60 ? 'bg-blue-500/20 text-blue-300' :
        'bg-yellow-500/20 text-yellow-300'
      }`}>
        {data.confidence}% Confidence
      </span>
    </div>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">Pick:</span>
        <span className="text-white font-medium">{data.pick}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">Odds:</span>
        <span className="text-emerald-300 font-mono">{data.odds}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">Bet Type:</span>
        <span className="text-slate-300">{data.betType}</span>
      </div>
    </div>
    {data.reasoning && (
      <p className="mt-3 text-xs text-slate-400 italic">{data.reasoning}</p>
    )}
  </motion.div>
)

const ParlayBuilderWidget = ({ legs }: { legs: any[] }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-purple-400" />
        <span className="font-bold text-white">{legs.length}-Leg Parlay</span>
      </div>
      <span className="text-purple-300 font-mono text-lg">
        +{calculateParlayOdds(legs)}
      </span>
    </div>
    <div className="space-y-2">
      {legs.map((leg, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs text-purple-300">
            {i + 1}
          </div>
          <span className="text-slate-300 flex-1">{leg.pick}</span>
          <span className="text-purple-300 font-mono">{leg.odds}</span>
        </div>
      ))}
    </div>
    <div className="mt-4 pt-3 border-t border-purple-500/20">
      <div className="flex justify-between text-sm">
        <span className="text-slate-400">Potential Payout:</span>
        <span className="text-emerald-300 font-bold">
          ${calculatePayout(100, legs).toFixed(2)}
        </span>
      </div>
    </div>
  </motion.div>
)

const calculateParlayOdds = (legs: any[]) => {
  // Simplified calculation for demo
  return legs.reduce((acc, leg) => {
    const odds = parseInt(leg.odds.replace('+', ''))
    return acc + odds
  }, 0)
}

const calculatePayout = (stake: number, legs: any[]) => {
  // Simplified payout calculation
  return stake * legs.length * 2.5
}

export default function ProfessorLockChatKit() {
  const { user, profile } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const tier = profile?.subscription_tier || 'free'
  const isElite = tier === 'elite'
  const isPro = tier === 'pro' || isElite

  // Use ChatKit React hook
  const { control } = useChatKitReact({
    api: {
      async getClientSecret(existing) {
        if (existing) {
          // Implement session refresh if needed
          return existing
        }

        try {
          const res = await fetch('/api/chatkit/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user?.id,
              tier,
              preferences: {
                sportPreferences: profile?.preferred_sports || ['MLB', 'WNBA'],
                riskTolerance: profile?.risk_tolerance || 'medium',
              }
            }),
          })
          
          if (!res.ok) {
            throw new Error('Failed to create ChatKit session')
          }
          
          const { client_secret } = await res.json()
          return client_secret
        } catch (err) {
          console.error('Failed to get client secret:', err)
          toast.error('Failed to start AI chat session')
          throw err
        }
      },
    },
    theme: {
      colorScheme: 'dark',
      color: {
        accent: {
          primary: isElite ? '#FFD700' : isPro ? '#00E5FF' : '#8B5CF6',
          level: 2
        }
      },
      radius: 'round',
      density: 'normal',
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }
    },
    composer: {
      placeholder: isElite 
        ? 'Ask Professor Lock Elite anything...' 
        : isPro 
          ? 'Ask about picks, parlays, or strategies...'
          : 'Ask your betting question...',
    },
    startScreen: {
      greeting: isElite 
        ? 'Welcome to Professor Lock Elite! I have access to advanced analytics and exclusive insights.'
        : isPro
          ? 'Hey champ! Ready to build some winning parlays?'
          : 'Welcome! Let me help you with your betting questions.',
      prompts: [
        { 
          label: 'Build Smart Parlay',
          prompt: 'Build me a 3-leg parlay with high confidence picks',
        },
        { 
          label: 'Today\'s Best Bets',
          prompt: 'What are your top 5 picks for today?',
        },
        { 
          label: 'Analyze This Game',
          prompt: 'Give me a deep analysis of tonight\'s biggest game',
        },
        ...(isElite ? [
          { 
            label: 'Elite Lock of Day',
            prompt: 'Give me your Elite Lock with full breakdown',
          },
          { 
            label: 'Premium Props',
            prompt: 'Show me the best player props with elite analysis',
          }
        ] : []),
        { 
          label: 'Live Odds Movement',
          prompt: 'Show me significant line movements today',
        },
        { 
          label: 'Quick Picks',
          prompt: 'Give me 3 quick picks I can bet right now',
        }
      ]
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${isExpanded ? 'fixed inset-4 z-50' : 'h-full'}`}
    >
      {/* Custom Header */}
      <div className="rounded-t-2xl border border-b-0 border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className={`rounded-full p-2.5 ${
                isElite 
                  ? 'bg-gradient-to-br from-yellow-400 to-amber-500' 
                  : isPro 
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-500'
                    : 'bg-gradient-to-br from-purple-400 to-purple-600'
              }`}
            >
              {isElite ? (
                <Crown className="h-6 w-6 text-white" />
              ) : (
                <Brain className="h-6 w-6 text-white" />
              )}
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Professor Lock
                {isElite && <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full">ELITE</span>}
                {isPro && !isElite && <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full">PRO</span>}
              </h2>
              <p className="text-xs text-slate-400">
                Powered by OpenAI GPT-4 + Agent Builder
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-emerald-500"
              />
              <span className="text-xs font-medium text-emerald-300">Live</span>
            </div>
            
            {/* Action Buttons */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-400" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4 text-slate-400" />
              ) : (
                <Maximize2 className="h-4 w-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-slate-400">Win Rate:</span>
            <span className="text-emerald-300 font-bold">67%</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-slate-400">Today's Picks:</span>
            <span className="text-blue-300 font-bold">12/15</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <DollarSign className="h-3.5 w-3.5 text-yellow-400" />
            <span className="text-slate-400">ROI:</span>
            <span className="text-yellow-300 font-bold">+24.5%</span>
          </div>
        </div>
      </div>

      {/* ChatKit Container */}
      <div className="relative h-[600px] rounded-b-2xl border border-t-0 border-white/10 bg-slate-950 overflow-hidden">
        <ChatKit control={control} className="h-full w-full" />
      </div>

      {/* Custom Footer with Tool Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-4 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-slate-400">Web Search</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <FileSearch className="h-3.5 w-3.5 text-green-400" />
              <span className="text-slate-400">Data Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Code className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-slate-400">Code Interpreter</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Monitor className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-slate-400">Browser Control</span>
            </div>
          </div>
          
          <div className="text-xs text-slate-500">
            Powered by OpenAI Agent Builder
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
