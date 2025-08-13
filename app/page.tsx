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
import Image from 'next/image'

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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative">

      {/* Navigation */}
      <nav className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
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
      <section className="relative z-10 overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            {/* Removed animation for hero text as requested */}
            <div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                <span className="gradient-text">AI-Powered</span>
                <br />
                Sports Betting
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Smarter betting with advanced AI predictions, real-time analytics, 
                and expert insights for all major sports.
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
                className="inline-flex items-center px-5 py-3 rounded-xl bg-white text-black hover:bg-gray-100 transition-colors shadow-md"
                aria-label="Download on the App Store"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" className="h-8 w-auto">
                  <rect width="120" height="40" rx="8" fill="currentColor" className="text-black" />
                  <g transform="translate(12,8)" fill="white">
                    <path d="M19.5 3.9c1.2-1.4 1.9-3.1 1.7-4.9-1.7.1-3.7 1.2-4.9 2.6-1.1 1.3-1.9 3.1-1.7 4.9 1.8.2 3.7-1.1 4.9-2.6z" transform="translate(-6,4)"/>
                    <path d="M17.8 7.1c-2-.1-3.8 1.1-4.8 1.1s-2.5-1.1-4.1-1.1c-2.1 0-4 1.2-5 3.1-2.2 3.8-.6 9.4 1.6 12.5 1.1 1.6 2.4 3.3 4.1 3.3 1.7-.1 2.3-1.1 4.3-1.1s2.5 1.1 4.2 1.1c1.8 0 3-1.6 4.1-3.2.8-1.2 1.5-2.6 2-4 0 0-3.9-1.5-3.9-5.7 0-3.6 3-5 3-5-1.8-2.7-4.5-2.9-5.5-3z" transform="translate(-6,4)"/>
                    <text x="38" y="9" font-size="6" font-weight="600">Download on the</text>
                    <text x="38" y="20" font-size="11" font-weight="800">App Store</text>
                  </g>
                </svg>
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

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-300">
              Start free, upgrade anytime. Cancel without fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative bg-white/5 backdrop-blur-sm rounded-xl p-6 border ${
                  plan.popular 
                    ? 'border-blue-500 ring-2 ring-blue-500/20' 
                    : 'border-white/10'
                } hover:border-blue-500/50 transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">
                      ${plan.price}
                    </span>
                    <span className="text-gray-300">/{plan.period}</span>
                  </div>
                  <p className="text-gray-300 mb-6">
                    {plan.description}
                  </p>
                  
                  <button
                    onClick={() => openAuthModal('signup')}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    Get Started
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <Star className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
              <a href="mailto:predictiveplay2025@gmail.com" className="hover:text-white transition-colors">
                Contact
              </a>
              <a
                href="https://apps.apple.com/us/app/predictive-play/id6748275790"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors text-sm"
                aria-label="Download on the App Store"
              >
                <span className="font-semibold">App Store</span>
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

const pricingPlans = [
  {
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'Get started with core features',
    popular: false,
    features: [
      '2 daily AI picks',
      'Basic trends & insights',
      'Mobile app access'
    ]
  },
  {
    name: 'Pro',
    price: 19.99,
    period: 'month',
    description: 'Most popular for serious bettors',
    popular: true,
    features: [
      'More daily AI picks',
      'Advanced trends & analytics',
      'Professor Lock chat', 
      'Real-time updates'
    ]
  },
  {
    name: 'Elite',
    price: 29.99,
    period: 'month',
    description: 'Premium tools & insights',
    popular: false,
    features: [
      'Maximum daily AI picks',
      'Premium analytics & insights',
      'Lock of the Day',
      'Early feature access'
    ]
  }
]
