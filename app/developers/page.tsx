'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Code, 
  Zap, 
  Shield, 
  TrendingUp, 
  Brain, 
  MessageCircle,
  ChevronRight,
  Copy,
  Check,
  Play,
  ExternalLink,
  Database,
  Cpu,
  Globe
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import AuthModal from '@/components/AuthModal'
import Image from 'next/image'

export default function DevelopersPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [mounted, setMounted] = useState(false)
  const [copiedCode, setCopiedCode] = useState('')
  const [activeTab, setActiveTab] = useState<'javascript' | 'python' | 'curl'>('javascript')
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  const goToDashboard = () => {
    if (user) {
      router.push('/developers/dashboard')
    } else {
      openAuthModal('signup')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation */}
      <nav className="relative z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              {/* Logo */}
              <a href="/" className="flex items-center space-x-3 group">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-2 ring-white/10 group-hover:ring-blue-500/50 transition-all duration-200">
                  <Image src="/icon.png" alt="Predictive Play" width={32} height={32} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    Predictive Play
                  </span>
                  <div className="text-xs text-blue-200">Developer API</div>
                </div>
              </a>
              
              {/* Nav Links */}
              <div className="hidden md:flex items-center space-x-6">
                <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
                <a href="#examples" className="text-gray-300 hover:text-white transition-colors">Examples</a>
                <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
                <a href="#docs" className="text-gray-300 hover:text-white transition-colors">Docs</a>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <button
                  onClick={goToDashboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Dashboard
                </button>
              ) : (
                <>
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
                    Get API Key
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Code className="w-4 h-4" />
              <span>StatMuse Sports Data API</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              <span className="gradient-text">Sports Data</span>
              <br />
              Made Simple
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Integrate real-time sports statistics, player data, and AI-powered insights 
              into your applications with our powerful REST API. Built on StatMuse's reliable data platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={goToDashboard}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-2 group"
              >
                <span>Get Started Free</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="#examples"
                className="border border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>View Examples</span>
              </a>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">99.9%</div>
                <div className="text-gray-300">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">&lt;200ms</div>
                <div className="text-gray-300">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">All Sports</div>
                <div className="text-gray-300">MLB, NBA, NFL, WNBA</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Example Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Simple. Powerful. Reliable.</h2>
            <p className="text-xl text-gray-300">Get sports data in seconds with our intuitive API</p>
          </div>

          <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
            {/* Code Tabs */}
            <div className="border-b border-white/10 bg-black/40">
              <div className="flex space-x-1 p-2">
                {(['javascript', 'python', 'curl'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Content */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm text-gray-400">
                  {activeTab === 'javascript' && 'Node.js / React / Next.js'}
                  {activeTab === 'python' && 'Python / Django / Flask'}
                  {activeTab === 'curl' && 'cURL / Terminal'}
                </div>
                <button
                  onClick={() => copyCode(codeExamples[activeTab], activeTab)}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  {copiedCode === activeTab ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="text-sm">Copy</span>
                </button>
              </div>
              
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{codeExamples[activeTab]}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built for Developers
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Power your applications with real-time sports data and AI insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <div
                key={useCase.title}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <useCase.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {useCase.title}
                </h3>
                <p className="text-gray-300 mb-4">
                  {useCase.description}
                </p>
                <div className="space-y-2">
                  {useCase.examples.map((example, idx) => (
                    <div key={idx} className="text-sm text-blue-300 bg-blue-600/20 px-3 py-1 rounded-full inline-block mr-2">
                      {example}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Examples Section */}
      <section id="examples" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">API Examples</h2>
            <p className="text-xl text-gray-300">See what's possible with our StatMuse API</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {apiExamples.map((example, index) => (
              <div key={index} className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2">{example.title}</h3>
                  <p className="text-gray-300 text-sm">{example.description}</p>
                </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    <div className="text-sm text-gray-400 mb-2">Request:</div>
                    <div className="bg-black/40 rounded-lg p-3 text-sm text-green-400 font-mono">
                      {example.request}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Response:</div>
                    <div className="bg-black/40 rounded-lg p-3 text-sm text-blue-300 font-mono overflow-x-auto">
                      <pre>{example.response}</pre>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Developer Pricing
            </h2>
            <p className="text-xl text-gray-300">
              Start free, scale as you grow. Pay only for what you use.
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
                
                <div className="text-center mb-6">
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
                    onClick={goToDashboard}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    Get Started
                  </button>
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
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
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Start Building Today
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Get your API key and start integrating sports data in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={goToDashboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-2 mx-auto group"
            >
              <span>Get API Key Free</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="https://web-production-f090e.up.railway.app/health"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center space-x-2 mx-auto"
            >
              <ExternalLink className="w-5 h-5" />
              <span>View Live API</span>
            </a>
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
              <div>
                <span className="text-xl font-bold text-white">Predictive Play</span>
                <div className="text-xs text-blue-200">Developer API</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6 text-gray-400">
              <a href="/developers/docs" className="hover:text-white transition-colors">
                Documentation
              </a>
              <a href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="mailto:api@predictiveplay.com" className="hover:text-white transition-colors">
                API Support
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-400">
            <p>&copy; 2025 Predictive Play Developer API. All rights reserved.</p>
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

// Code Examples
const codeExamples: Record<'javascript' | 'python' | 'curl', string> = {
  javascript: `// Install: npm install axios
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.predictiveplay.com/v1',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

// Query player stats  
const response = await api.post('/query', {
  query: "Aaron Judge home runs this season"
});

console.log(response.data);
// {
//   "success": true,
//   "answer": "Aaron Judge has 62 home runs this season",
//   "source": "StatMuse",
//   "timestamp": "2025-01-10T08:26:19Z"
// }`,

  python: `# Install: pip install requests
import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

# Query player stats
response = requests.post(
    'https://api.predictiveplay.com/v1/query',
    headers=headers,
    json={'query': 'Caitlin Clark points per game this season'}
)

data = response.json()
print(data['answer'])
# "Caitlin Clark averages 18.7 points per game this season"`,

  curl: `# Query player stats
curl -X POST https://api.predictiveplay.com/v1/query \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "LeBron James career points"
  }'

# Response:
# {
#   "success": true,  
#   "answer": "LeBron James has 39,412 career points",
#   "source": "StatMuse",
#   "timestamp": "2025-01-10T08:26:19Z"
# }`
}

// Use Cases
const useCases = [
  {
    title: 'AI Chat Applications',
    description: 'Build intelligent sports chatbots and AI assistants that can answer any sports question with real data.',
    icon: MessageCircle,
    examples: ['Sports chatbots', 'AI assistants', 'Voice interfaces']
  },
  {
    title: 'Fantasy Sports Apps',
    description: 'Power fantasy sports platforms with real-time player stats, injury reports, and performance analytics.',
    icon: TrendingUp,
    examples: ['Player rankings', 'Injury tracking', 'Performance metrics']
  },
  {
    title: 'Sports Analytics',
    description: 'Build dashboards and analytics tools with comprehensive sports data and AI-powered insights.',
    icon: Database,
    examples: ['Team analysis', 'Player comparisons', 'Season trends']
  },
  {
    title: 'Betting Applications',
    description: 'Integrate real-time odds, game analysis, and AI predictions into sports betting platforms.',
    icon: Brain,
    examples: ['Live odds', 'Game predictions', 'Player props']
  },
  {
    title: 'News & Media',
    description: 'Enhance sports journalism with instant access to player stats, game data, and historical records.',
    icon: Globe,
    examples: ['Article automation', 'Fact checking', 'Data journalism']
  },
  {
    title: 'Mobile Apps',
    description: 'Create engaging mobile experiences with sports trivia, stats games, and fan engagement features.',
    icon: Cpu,
    examples: ['Sports trivia', 'Stats games', 'Fan apps']
  }
]

// API Examples
const apiExamples = [
  {
    title: 'Player Career Stats',
    description: 'Get comprehensive career statistics for any player',
    request: 'POST /v1/query\n{"query": "LeBron James career stats"}',
    response: `{
  "success": true,
  "answer": "LeBron James career stats: 39,412 points, 10,210 rebounds, 10,688 assists in 1,421 games",
  "query": "LeBron James career stats",
  "source": "StatMuse",
  "timestamp": "2025-01-10T08:26:19Z"
}`
  },
  {
    title: 'Current Season Performance',
    description: 'Query current season stats for players and teams',
    request: 'POST /v1/query\n{"query": "Patrick Mahomes passing yards this season"}',
    response: `{
  "success": true,
  "answer": "Patrick Mahomes has 4,183 passing yards this season",
  "query": "Patrick Mahomes passing yards this season",
  "source": "StatMuse", 
  "timestamp": "2025-01-10T08:26:19Z"
}`
  },
  {
    title: 'Team Performance',
    description: 'Get team statistics and performance metrics',
    request: 'POST /v1/query\n{"query": "Lakers wins and losses this season"}',
    response: `{
  "success": true,
  "answer": "The Los Angeles Lakers are 22-16 this season",
  "query": "Lakers wins and losses this season",
  "source": "StatMuse",
  "timestamp": "2025-01-10T08:26:19Z"
}`
  },
  {
    title: 'Historical Comparisons',
    description: 'Compare players across different eras and seasons',
    request: 'POST /v1/query\n{"query": "Michael Jordan vs LeBron James career points"}',
    response: `{
  "success": true,
  "answer": "LeBron James has 39,412 career points vs Michael Jordan's 32,292 career points",
  "query": "Michael Jordan vs LeBron James career points",
  "source": "StatMuse",
  "timestamp": "2025-01-10T08:26:19Z"
}`
  }
]

// Pricing Plans
const pricingPlans = [
  {
    name: 'Developer',
    price: 0,
    period: 'month',
    description: 'Perfect for testing and small projects',
    popular: false,
    features: [
      '1,000 API calls/month',
      'Basic rate limiting',
      'Email support',
      'API documentation access'
    ]
  },
  {
    name: 'Startup',
    price: 29,
    period: 'month', 
    description: 'Great for growing applications',
    popular: true,
    features: [
      '25,000 API calls/month',
      'Higher rate limits',
      'Priority email support',
      'Usage analytics dashboard',
      'Custom integrations'
    ]
  },
  {
    name: 'Enterprise',
    price: 99,
    period: 'month',
    description: 'For high-volume applications',
    popular: false,
    features: [
      '100,000 API calls/month',
      'No rate limits',
      'Phone & email support',
      'Advanced analytics',
      'Custom endpoints',
      'SLA guarantee'
    ]
  }
]
