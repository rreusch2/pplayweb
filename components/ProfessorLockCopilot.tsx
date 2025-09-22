'use client'
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Brain, 
  Sparkles,
  Search,
  TrendingUp,
  BarChart3,
  Activity,
  Database,
  Globe,
  Zap,
  Target,
  DollarSign,
  AlertTriangle,
  Users,
  Calendar,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { CopilotKit } from '@copilotkit/react-core'
import { CopilotSidebar } from '@copilotkit/react-ui'
import '@copilotkit/react-ui/styles.css'
import { useSubscription } from '@/contexts/SubscriptionContext'

interface ProfessorLockCopilotProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProfessorLockCopilot({ isOpen, onClose }: ProfessorLockCopilotProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { subscriptionTier } = useSubscription()
  const isPro = subscriptionTier !== 'free'

  if (!isOpen) return null

  const quickActions = [
    {
      icon: TrendingUp,
      label: "Today's Top Picks",
      prompt: "Show me today's highest confidence AI predictions with reasoning",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Search,
      label: "Player Analysis",
      prompt: "Help me analyze a specific player's prop bet with recent stats and trends",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: BarChart3,
      label: "Team Trends",
      prompt: "Show me team performance trends and betting analytics for upcoming games",
      color: "from-purple-500 to-violet-600"
    },
    {
      icon: Globe,
      label: "Breaking News",
      prompt: "Search for breaking sports news and injury reports that could affect betting",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: Target,
      label: "Value Finder",
      prompt: "Find value betting opportunities with high ROI potential",
      color: "from-yellow-500 to-amber-600"
    },
    {
      icon: Activity,
      label: "Live Insights",
      prompt: "Get today's Professor Lock insights and daily analysis",
      color: "from-pink-500 to-rose-600"
    }
  ]

  const features = [
    { icon: Database, label: "Live Data Access", desc: "Real-time odds, stats, and predictions" },
    { icon: Brain, label: "AI Analysis", desc: "Advanced machine learning insights" },
    { icon: Search, label: "Web Search", desc: "Breaking news and line movements" },
    { icon: TrendingUp, label: "Trend Analysis", desc: "Player and team performance trends" },
    { icon: AlertTriangle, label: "Injury Reports", desc: "Real-time injury updates" },
    { icon: DollarSign, label: "Value Detection", desc: "Identify profitable betting opportunities" }
  ]

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative ${
            isExpanded ? 'w-full h-full' : 'w-full max-w-6xl h-[90vh]'
          } bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center">
                  Professor Lock AI
                  <Sparkles className="w-5 h-5 ml-2 text-yellow-400 animate-pulse" />
                </h2>
                <p className="text-sm text-blue-200">
                  Elite Sports Betting Intelligence • Powered by xAI Grok
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Pro Badge */}
              {isPro && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-yellow-200 font-medium">
                    {subscriptionTier.toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Expand/Minimize */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={isExpanded ? "Minimize" : "Expand"}
              >
                {isExpanded ? (
                  <Minimize2 className="w-5 h-5 text-gray-400" />
                ) : (
                  <Maximize2 className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {/* Close */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Features Bar */}
          <div className="px-6 py-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-b border-white/5">
            <div className="flex items-center justify-center space-x-6 overflow-x-auto">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs text-gray-300 whitespace-nowrap">
                  <feature.icon className="w-4 h-4 text-blue-400" />
                  <span>{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Quick Actions Sidebar */}
            <div className="w-80 border-r border-white/10 bg-black/10 p-6 overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-xl bg-gradient-to-r ${action.color} text-white text-left transition-all duration-200 hover:shadow-lg group`}
                    onClick={() => {
                      // This would trigger the CopilotKit chat with the prompt
                      console.log('Quick action clicked:', action.prompt)
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <action.icon className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-sm">{action.label}</div>
                        <div className="text-xs opacity-90 group-hover:opacity-100">
                          Click to start analysis
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Stats Section */}
              <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30">
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Today's Performance
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">AI Predictions</span>
                    <span className="text-green-400 font-medium">30 Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Win Rate</span>
                    <span className="text-green-400 font-medium">67.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Avg Confidence</span>
                    <span className="text-blue-400 font-medium">78.5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">ROI</span>
                    <span className="text-green-400 font-medium">+15.2%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CopilotKit Chat Area */}
            <div className="flex-1 relative">
              <CopilotKit 
                runtimeUrl="/api/copilot"
                agent="professor-lock"
              >
                <CopilotSidebar
                  instructions={`You are Professor Lock, an elite sports betting AI. Use your tools to provide data-driven betting insights. Always explain your reasoning and give confidence levels for your recommendations. Help users find value in the betting markets while emphasizing responsible gambling.`}
                  defaultOpen={true}
                  clickOutsideToClose={false}
                  labels={{
                    title: "Professor Lock AI",
                    initial: "What's the play today? 🎯",
                  }}
                  className="h-full border-none bg-transparent"
                />
              </CopilotKit>
              
              {/* Upgrade Prompt for Free Users */}
              {!isPro && (
                <div className="absolute bottom-4 left-4 right-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">
                          Unlock Full Professor Lock AI
                        </p>
                        <p className="text-purple-100 text-xs">
                          Get unlimited access to all AI tools and advanced analysis
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors">
                        Upgrade
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
