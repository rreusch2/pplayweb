'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Shield, 
  Star, 
  ChevronRight, 
  Sparkles,
  Trophy,
  BarChart3,
  MessageCircle
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'
import { trackSignupStart, trackAppStoreClick, trackCTAClick } from '@/lib/analytics'
import Image from 'next/image'
import PredictionsPreview from '@/components/PredictionsPreview'
import StripePricingTable from '@/components/StripePricingTable'

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  // Fix hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && mounted) {
      router.push('/dashboard')
    }
  }, [user, router, mounted])

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
    
    // Track signup intent
    if (mode === 'signup') {
      trackSignupStart()
      trackCTAClick('Signup Button')
    }
  }

  const handleAppStoreClick = () => {
    trackAppStoreClick()
    trackCTAClick('App Store Download')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative">

      {/* Navigation */}
      <nav role="navigation" className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Brand - Matching Internal Nav */}
            <div className="flex items-center space-x-3 group">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-2 ring-white/10 group-hover:ring-blue-500/50 transition-all duration-200">
                <Image
                  src="/icon.png"
                  alt="Predictive Play"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                  Predictive Play
                </span>
                <div className="text-xs text-blue-200">AI Sports Betting</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a
                href="/pricing"
                className="text-white hover:text-blue-300 transition-colors font-medium"
              >
                Pricing
              </a>
              <button
                onClick={() => openAuthModal('login')}
                className="text-white hover:text-blue-300 transition-colors font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section role="banner" className="relative z-10 overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Removed animation for hero text as requested */}
            <div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                <span className="gradient-text">AI-Powered</span>
                <br />
                Sports Betting Predictions
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Predictive Play uses machine learning models trained on historical odds, team stats,
                and live feeds to deliver daily NBA, NFL, MLB & Premier League forecasts with
                <span className="font-semibold"> 72%+ accuracy</span>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <button
                onClick={() => openAuthModal('signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-2 group"
              >
                <span>Start Free Trial</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => openAuthModal('login')}
                className="border border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300"
              >
                Sign In
              </button>
            </div>

            {/* App Store Button */}
            <div className="flex justify-center mb-12">
              <a
                href="https://apps.apple.com/us/app/predictive-play/id6748275790"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleAppStoreClick}
                className="hover:opacity-80 transition-opacity"
                aria-label="Download on the App Store"
              >
                <Image
                  src="/app-store-badge.svg"
                  alt="Download on the App Store"
                  width={180}
                  height={60}
                  className="h-14 w-auto"
                />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose Predictive Play?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Advanced AI technology meets sports expertise to give you the edge in sports betting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How Predictive Play Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Daily AI sports betting predictions powered by multi-source data and transparent scoring — built for smarter decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Data Ingestion */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Multi‑Source Data</h3>
              <p className="text-gray-300 text-sm">
                Aggregates live odds, line movements, injuries, and verified trends to keep the model up‑to‑date.
              </p>
            </div>

            {/* AI Scoring */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Value Scoring</h3>
              <p className="text-gray-300 text-sm">
                Each pick is scored with confidence, value %, and an EV/ROI estimate based on matchup factors and market context.
              </p>
            </div>

            {/* Smart Allocation */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Slate Coverage</h3>
              <p className="text-gray-300 text-sm">
                Distributes picks intelligently across MLB, NFL, WNBA and CFB based on slate depth and opportunity.
              </p>
            </div>

            {/* Transparency & Safety */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Transparent & Practical</h3>
              <p className="text-gray-300 text-sm">
                Clear confidence and risk signals. Educational, not financial advice. You’re always in control.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Predictions Today */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Featured Predictions Today</h2>
            <p className="text-gray-300">Preview a couple of today’s AI picks. Create an account to see more.</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <PredictionsPreview limit={2} />
          </div>
        </div>
      </section>

      {/* Pricing Section - Enhanced with Stripe */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <StripePricingTable 
            headerTitle="Choose Your Subscription"
            headerDescription="Unlock premium AI sports betting predictions. Start winning today with our flexible plans."
          />
          
          {/* Additional Benefits Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Instant Access</h3>
              <p className="text-gray-300">Start receiving AI predictions immediately after subscription activation.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Risk-Free</h3>
              <p className="text-gray-300">Cancel anytime, no questions asked. Your satisfaction is guaranteed.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Premium Support</h3>
              <p className="text-gray-300">Get priority customer support and exclusive betting insights.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Start Winning?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of successful bettors using AI-powered predictions.
            </p>
            <button
              onClick={() => openAuthModal('signup')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-2 mx-auto group"
            >
              <span>Start Your Free Trial</span>
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-2 ring-white/10">
                <Image src="/icon.png" alt="Predictive Play" width={32} height={32} className="w-full h-full object-cover" />
              </div>
              <span className="text-xl font-bold text-white">Predictive Play</span>
            </div>
            
            <div className="flex items-center space-x-6 text-gray-400">
              <a href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="mailto:support@predictive-play.com" className="hover:text-white transition-colors">
                Contact
              </a>
              <a
                href="https://apps.apple.com/us/app/predictive-play/id6748275790"
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleAppStoreClick}
                className="hover:opacity-80 transition-opacity"
                aria-label="Download on the App Store"
              >
                <Image
                  src="/app-store-badge.svg"
                  alt="Download on the App Store"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; 2025 Predictive Play. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  )
}

const features = [
  {
    title: 'AI-Powered Predictions',
    description: 'Advanced machine learning algorithms analyze thousands of data points to deliver highly accurate predictions.',
    icon: Brain
  },
  {
    title: 'Real-Time Analytics',
    description: 'Live odds tracking, injury reports, and game analysis updated in real-time.',
    icon: BarChart3
  },
  {
    title: 'Expert Insights',
    description: 'Professional analysis and betting strategies from seasoned sports experts.',
    icon: Target
  },
  {
    title: 'AI Chat Assistant',
    description: 'Get personalized betting advice and answers to your questions 24/7.',
    icon: MessageCircle
  },
  {
    title: 'Proven Track Record',
    description: 'Transparent performance metrics with verified win rates and ROI tracking.',
    icon: Trophy
  },
  {
    title: 'Secure & Reliable',
    description: 'Bank-grade security with 99.9% uptime to ensure you never miss an opportunity.',
    icon: Shield
  }
]

// Pricing is now handled by Stripe Pricing Table component
