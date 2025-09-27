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
  MessageCircle,
  CheckCircle,
  Clock,
  Users,
  Zap
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'
import { trackSignupStart, trackCTAClick } from '@/lib/analytics'
import Image from 'next/image'
import StripePricingTable from '@/components/StripePricingTable'

export default function PricingPage() {
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
      trackCTAClick('Pricing Page Signup')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative">

      {/* Navigation */}
      <nav role="navigation" className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push('/')}>
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
                onClick={() => router.push('/')}
                className="text-white hover:text-blue-300 transition-colors font-medium"
              >
                Home
              </button>
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
            <div>
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                <span className="gradient-text">Simple</span> Pricing
                <br />
                <span className="text-4xl md:text-5xl text-gray-300">for Serious Bettors</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Choose the perfect plan for your betting strategy. From daily passes to weekly commitments, 
                we have options that fit your style and budget.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => openAuthModal('signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-2 group"
              >
                <span>Start Winning Today</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Main Pricing Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <StripePricingTable 
            showHeader={false}
            className="pricing-page-table"
          />
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What's Included
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Every subscription includes access to our complete AI prediction platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {includedFeatures.map((feature, index) => (
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
                <p className="text-gray-300 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl p-8 md:p-12 border border-blue-500/20">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Why Choose Predictive Play?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">72%+</div>
                  <div className="text-gray-300">Win Rate Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">10K+</div>
                  <div className="text-gray-300">Daily Predictions</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-400 mb-2">24/7</div>
                  <div className="text-gray-300">AI Analysis</div>
                </div>
              </div>
              <p className="text-xl text-gray-300 mb-8">
                Our AI analyzes thousands of data points across NBA, NFL, MLB & Premier League 
                to deliver the most accurate predictions available.
              </p>
              <button
                onClick={() => openAuthModal('signup')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-2 mx-auto group"
              >
                <span>Get Started Now</span>
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-3">{faq.question}</h3>
                <p className="text-gray-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
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
              <span>Choose Your Plan</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
              <button onClick={() => router.push('/privacy')} className="hover:text-white transition-colors">
                Privacy Policy
              </button>
              <button onClick={() => router.push('/terms')} className="hover:text-white transition-colors">
                Terms of Service
              </button>
              <a href="mailto:support@predictive-play.com" className="hover:text-white transition-colors">
                Contact
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

const includedFeatures = [
  {
    title: 'AI Predictions',
    description: 'Advanced machine learning algorithms analyze thousands of data points for accurate predictions.',
    icon: Brain
  },
  {
    title: 'Real-Time Data',
    description: 'Live odds tracking, injury reports, and game analysis updated continuously.',
    icon: BarChart3
  },
  {
    title: 'Multi-Sport Coverage',
    description: 'NBA, NFL, MLB, and Premier League predictions all in one platform.',
    icon: Target
  },
  {
    title: 'Mobile Access',
    description: 'Full mobile app access with push notifications for breaking news.',
    icon: MessageCircle
  },
  {
    title: 'Performance Tracking',
    description: 'Track your wins, losses, and ROI with detailed analytics.',
    icon: Trophy
  },
  {
    title: 'Expert Insights',
    description: 'Professional analysis and betting strategies from seasoned experts.',
    icon: TrendingUp
  },
  {
    title: 'Secure Platform',
    description: 'Bank-grade security with 99.9% uptime guarantee.',
    icon: Shield
  },
  {
    title: 'Cancel Anytime',
    description: 'No long-term commitments. Cancel your subscription anytime.',
    icon: CheckCircle
  }
]

const faqs = [
  {
    question: "How accurate are your predictions?",
    answer: "Our AI models achieve 72%+ accuracy across all sports, with some specific bet types performing even higher. We track and display all performance metrics transparently."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! All subscriptions can be canceled anytime without fees or penalties. Your access continues until the end of your billing period."
  },
  {
    question: "What sports do you cover?",
    answer: "We currently provide predictions for NBA, NFL, MLB, and Premier League. We're constantly expanding to include more sports based on user demand."
  },
  {
    question: "Do you offer refunds?",
    answer: "We offer a satisfaction guarantee. If you're not happy with our service in the first 7 days, contact us for a full refund."
  },
  {
    question: "How do I access predictions on mobile?",
    answer: "Download our mobile app from the App Store or Google Play. All subscription features are available on both web and mobile platforms."
  },
  {
    question: "Is this gambling advice?",
    answer: "No, we provide educational analysis and predictions for entertainment purposes. All betting decisions are your own responsibility. Please bet responsibly."
  }
]
