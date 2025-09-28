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
  Crown,
  Zap,
  Check,
  ArrowRight,
  Gem,
  Infinity,
  Clock
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'
import TieredSubscriptionModal from '@/components/TieredSubscriptionModal'
import { trackSignupStart, trackAppStoreClick, trackCTAClick } from '@/lib/analytics'
import { createCheckoutSession, redirectToCheckout } from '@/lib/stripe'
import { PLANS, Plan } from '@/lib/plans'
import Image from 'next/image'
import PredictionsPreview from '@/components/PredictionsPreview'

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [mounted, setMounted] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
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

  const handlePlanSelect = async (plan: Plan) => {
    if (!user) {
      // User needs to sign up first
      setSelectedPlan(plan)
      openAuthModal('signup')
      return
    }

    // User is logged in, proceed to checkout
    await handleDirectCheckout(plan)
  }

  const handleDirectCheckout = async (plan: Plan) => {
    if (!plan.stripePriceId) {
      alert('Stripe price ID missing for this plan – please contact support.')
      return
    }

    try {
      setLoading(plan.id)
      trackCTAClick(`${plan.tier}_${plan.interval}_checkout`)
      
      const sessionId = await createCheckoutSession(
        plan.stripePriceId, 
        user!.id,
        `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        `${window.location.origin}/dashboard`
      )
      await redirectToCheckout(sessionId)
    } catch (err) {
      console.error(err)
      alert('Unable to initiate checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  // Redirect after signup to checkout if plan was selected
  useEffect(() => {
    if (user && selectedPlan && mounted) {
      handleDirectCheckout(selectedPlan)
      setSelectedPlan(null)
    }
  }, [user, selectedPlan, mounted])

  const handleAppStoreClick = () => {
    trackAppStoreClick()
    trackCTAClick('App Store Download')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${10 + Math.random() * 20}s`
              }}
            />
          ))}
        </div>
      </div>

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
                <span>Start Winning</span>
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

      {/* Enhanced Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full mb-6 animate-pulse">
              <Clock className="w-5 h-5 text-orange-400 mr-2" />
              <span className="text-orange-300 text-sm font-semibold">Limited Time: 50% OFF All Plans</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Choose Your <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Winning Plan</span>
            </h2>
            <p className="text-xl text-gray-300 mb-4">
              Join 50,000+ successful bettors using AI-powered predictions
            </p>
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">73%</div>
                <div className="text-xs text-slate-400">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">$2.1M</div>
                <div className="text-xs text-slate-400">Won This Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">50K+</div>
                <div className="text-xs text-slate-400">Active Users</div>
              </div>
            </div>
          </div>


          {/* Pro & Elite Plans */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Pro Tier */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-full border border-blue-500/30">
                  <Crown className="w-5 h-5 text-blue-400 mr-2" />
                  <span className="text-blue-300 font-semibold">Pro Tier</span>
                  <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">MOST POPULAR</span>
                </div>
              </div>
              
              {PLANS.filter(p => p.tier === 'pro').map((plan) => (
                <div key={plan.id} className="relative bg-gradient-to-br from-blue-500/10 to-blue-900/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group hover:scale-105">
                  {plan.savings && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {plan.savings}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1">{plan.name}</h4>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-black text-white">${plan.price}</span>
                        <span className="text-blue-200 ml-2">/{plan.interval}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      {plan.interval === 'one_time' ? (
                        <Infinity className="w-6 h-6 text-white" />
                      ) : (
                        <Crown className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center">
                        <Check className="w-4 h-4 text-blue-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePlanSelect(plan)}
                    disabled={loading === plan.id}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/25 disabled:opacity-50"
                  >
                    {loading === plan.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Start Winning Now
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Elite Tier */}
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
                  <Gem className="w-5 h-5 text-purple-400 mr-2" />
                  <span className="text-purple-300 font-semibold">Elite Tier</span>
                  <span className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-2 py-1 rounded-full font-bold">PREMIUM</span>
                </div>
              </div>
              
              {PLANS.filter(p => p.tier === 'elite').map((plan) => (
                <div key={plan.id} className="relative bg-gradient-to-br from-purple-500/10 to-pink-900/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group hover:scale-105">
                  {plan.savings && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      {plan.savings}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-1">{plan.name}</h4>
                      <div className="flex items-baseline">
                        <span className="text-3xl font-black text-white">${plan.price}</span>
                        <span className="text-purple-200 ml-2">/{plan.interval}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <Gem className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center">
                        <Check className="w-4 h-4 text-purple-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePlanSelect(plan)}
                    disabled={loading === plan.id}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/25 disabled:opacity-50"
                  >
                    {loading === plan.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Start Winning Elite
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="mt-12 flex items-center justify-center text-gray-400">
            <Shield className="w-5 h-5 mr-2 text-green-400" />
            <span>30-day money-back guarantee • Cancel anytime • Secure checkout</span>
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
              <span>Start Winning Today</span>
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

      {/* Subscription Modal */}
      <TieredSubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        onContinueFree={() => {
          setSubscriptionModalOpen(false)
          openAuthModal('signup')
        }}
      />
      
      {/* Custom Styles for Animations */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
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

// Pricing plans moved to lib/plans.ts for better organization
