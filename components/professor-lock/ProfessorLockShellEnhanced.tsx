"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, TrendingUp, Brain, Zap, Shield, DollarSign, ChevronRight, Play, Users, Trophy, Target } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ChatKitProvider } from '@/contexts/ChatKitContext'
import ProfessorLockChatKit from './ProfessorLockChatKit'
import Script from 'next/script'

export default function ProfessorLockShellEnhanced() {
  const { user, profile } = useAuth()
  const [showChat, setShowChat] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 2398,
    activeSessions: 47,
    todaysPicks: 20,
    avgWinRate: 67.3,
  })

  const tier = profile?.subscription_tier || 'free'
  const isElite = tier === 'elite'
  const isPro = tier === 'pro' || isElite

  // Simulate live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeSessions: Math.floor(Math.random() * 20) + 40,
        avgWinRate: Number((Math.random() * 5 + 65).toFixed(1)),
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Load ChatKit Script */}
      <Script
        src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
        strategy="afterInteractive"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 -mt-16 sm:-mt-20 pt-20 sm:pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10 p-8 backdrop-blur-xl mb-8"
          >
            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-4"
                  >
                    <Sparkles className="h-10 w-10 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-5xl font-bold text-white mb-2">Professor Lock</h1>
                    <p className="text-lg text-slate-300">Advanced AI Sports Betting Intelligence</p>
                  </div>
                </div>
                
                {!showChat && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowChat(true)}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4 font-bold text-white shadow-lg transition-all hover:shadow-emerald-500/25"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Start AI Session
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"
                      initial={{ x: '100%' }}
                      whileHover={{ x: 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    />
                  </motion.button>
                )}
              </div>
              
              <p className="max-w-3xl text-slate-400 leading-relaxed">
                Powered by <span className="text-cyan-400 font-semibold">OpenAI GPT-4</span> with{' '}
                <span className="text-purple-400 font-semibold">Agent Builder</span> workflows,{' '}
                <span className="text-emerald-400 font-semibold">real-time web search</span>,{' '}
                <span className="text-yellow-400 font-semibold">StatMuse integration</span>, and{' '}
                <span className="text-pink-400 font-semibold">advanced code analysis</span>. 
                Watch as Professor Lock intelligently researches games, analyzes odds, and builds 
                winning strategies using state-of-the-art AI reasoning.
              </p>
            </div>
            
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute h-1 w-1 bg-white/20 rounded-full"
                  initial={{ 
                    x: Math.random() * 100 + '%', 
                    y: Math.random() * 100 + '%' 
                  }}
                  animate={{
                    x: Math.random() * 100 + '%',
                    y: Math.random() * 100 + '%',
                  }}
                  transition={{
                    duration: Math.random() * 20 + 10,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'linear',
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Live Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {[
              { icon: Users, label: 'Total Users', value: stats.totalUsers.toLocaleString(), color: 'from-blue-400 to-blue-600' },
              { icon: Brain, label: 'Active Sessions', value: stats.activeSessions, color: 'from-emerald-400 to-emerald-600', pulse: true },
              { icon: Trophy, label: "Today's Picks", value: stats.todaysPicks, color: 'from-purple-400 to-purple-600' },
              { icon: Target, label: 'Avg Win Rate', value: `${stats.avgWinRate}%`, color: 'from-yellow-400 to-orange-600' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/50 p-4 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className={`rounded-full p-2 bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                {stat.pulse && (
                  <motion.div
                    className="absolute top-2 right-2"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-4 mb-8"
          >
            {[
              {
                icon: Brain,
                title: 'Agent Builder Workflows',
                description: 'Visual agentic workflows with intelligent decision trees and multi-step reasoning',
                gradient: 'from-blue-500/20 to-purple-500/20',
              },
              {
                icon: Zap,
                title: 'Real-Time Research',
                description: 'Live web search, StatMuse queries, and browser automation for up-to-date insights',
                gradient: 'from-emerald-500/20 to-teal-500/20',
              },
              {
                icon: Shield,
                title: 'Advanced Analytics',
                description: 'Code interpreter for statistical analysis and custom betting model execution',
                gradient: 'from-orange-500/20 to-red-500/20',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br ${feature.gradient} p-6 backdrop-blur-sm`}
              >
                <feature.icon className="h-8 w-8 text-white mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-300">{feature.description}</p>
                <motion.div
                  className="absolute -bottom-2 -right-2 h-20 w-20 rounded-full bg-white/5"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* ChatKit Integration */}
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <ChatKitProvider>
                  <ProfessorLockChatKit />
                </ChatKitProvider>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Subscription Upsell for Free Users */}
          {!isPro && showChat && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 rounded-xl border border-gradient-to-r from-purple-500/50 to-pink-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <DollarSign className="h-8 w-8 text-purple-400" />
                  <div>
                    <h3 className="text-lg font-bold text-white">Upgrade to Pro</h3>
                    <p className="text-sm text-slate-400">
                      Get unlimited AI chats, advanced tools, and exclusive insights
                    </p>
                  </div>
                </div>
                <button className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-semibold text-white transition-all hover:gap-3">
                  Upgrade Now
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 text-center text-sm text-slate-500"
          >
            <p>
              Professor Lock uses OpenAI's latest models with custom Agent Builder workflows.
              {' '}
              <span className="text-slate-400">
                All predictions are for entertainment purposes only.
              </span>
            </p>
            <p className="mt-2">
              🎰 Gamble responsibly. 21+ only. If you have a gambling problem, call 1-800-GAMBLER.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  )
}
