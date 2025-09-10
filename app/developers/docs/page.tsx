'use client'
import { useState, useEffect } from 'react'
import { 
  Book, 
  Code, 
  Play, 
  Copy, 
  Check, 
  ChevronRight,
  ExternalLink,
  Zap,
  Shield,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import Image from 'next/image'

interface TestResult {
  error?: string
  data?: any
  success?: boolean
  message?: string
}

export default function APIDocs() {
  const [activeSection, setActiveSection] = useState('getting-started')
  const [activeTab, setActiveTab] = useState<'javascript' | 'python' | 'curl'>('javascript')
  const [copiedCode, setCopiedCode] = useState('')
  const [testQuery, setTestQuery] = useState('LeBron James career points')
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testLoading, setTestLoading] = useState(false)

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const runLiveTest = async () => {
    setTestLoading(true)
    try {
      // This would call your live API endpoint
      const response = await fetch('https://web-production-f090e.up.railway.app/v1/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo_key_for_docs'
        },
        body: JSON.stringify({ query: testQuery })
      })
      
      if (response.ok) {
        const data = await response.json()
        setTestResult(data)
      } else {
        setTestResult({ error: 'Authentication required - Get your API key to test live queries' })
      }
    } catch (error) {
      setTestResult({ error: 'API currently unavailable' })
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <a href="/developers" className="flex items-center space-x-3 group">
                <div className="relative w-8 h-8 rounded-lg overflow-hidden ring-2 ring-white/10 group-hover:ring-blue-500/50 transition-all duration-200">
                  <Image src="/icon.png" alt="Predictive Play" width={32} height={32} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                    API Documentation
                  </span>
                </div>
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              <a
                href="https://web-production-f090e.up.railway.app/health"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors"
              >
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm">API Status</span>
              </a>
              <a
                href="/developers/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Get API Key
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Documentation</h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-8">
              {/* Getting Started */}
              {activeSection === 'getting-started' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-4">Getting Started</h1>
                    <p className="text-xl text-gray-300">
                      Welcome to the Predictive Play StatMuse API. Get real-time sports data and AI-powered insights in seconds.
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h2 className="text-2xl font-semibold text-white mb-4">Quick Start</h2>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 text-gray-300">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">1</div>
                        <span>Get your API key from the <a href="/developers/dashboard" className="text-blue-400 hover:text-blue-300">Developer Dashboard</a></span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-300">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">2</div>
                        <span>Make your first API request</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-300">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">3</div>
                        <span>Start building amazing sports applications</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h2 className="text-2xl font-semibold text-white mb-4">Base URL</h2>
                    <div className="bg-black/40 rounded-lg p-4">
                      <code className="text-green-400 font-mono">https://api.predictiveplay.com/v1</code>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h2 className="text-2xl font-semibold text-white mb-4">Authentication</h2>
                    <p className="text-gray-300 mb-4">
                      All API requests require authentication using your API key in the Authorization header:
                    </p>
                    <div className="bg-black/40 rounded-lg p-4">
                      <code className="text-green-400 font-mono">Authorization: Bearer YOUR_API_KEY</code>
                    </div>
                  </div>
                </div>
              )}

              {/* API Reference */}
              {activeSection === 'api-reference' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-4">API Reference</h1>
                    <p className="text-xl text-gray-300">
                      Complete reference for all API endpoints and parameters.
                    </p>
                  </div>

                  {/* Query Endpoint */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium">POST</span>
                      <code className="text-green-400 font-mono">/v1/query</code>
                    </div>
                    
                    <p className="text-gray-300 mb-6">
                      Query sports statistics using natural language. Ask about any player, team, or game.
                    </p>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Request Body</h3>
                        <div className="bg-black/40 rounded-lg p-4">
                          <pre className="text-sm text-gray-300">
{`{
  "query": "LeBron James career points"
}`}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Response</h3>
                        <div className="bg-black/40 rounded-lg p-4">
                          <pre className="text-sm text-gray-300">
{`{
  "success": true,
  "answer": "LeBron James has 39,412 career points",
  "query": "LeBron James career points",
  "source": "StatMuse",
  "timestamp": "2025-01-10T08:26:19Z"
}`}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Parameters</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left text-white p-2">Parameter</th>
                                <th className="text-left text-white p-2">Type</th>
                                <th className="text-left text-white p-2">Required</th>
                                <th className="text-left text-white p-2">Description</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-white/5">
                                <td className="text-blue-400 p-2 font-mono">query</td>
                                <td className="text-gray-300 p-2">string</td>
                                <td className="text-green-400 p-2">Yes</td>
                                <td className="text-gray-300 p-2">Natural language sports query</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Code Examples */}
              {activeSection === 'examples' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-4">Code Examples</h1>
                    <p className="text-xl text-gray-300">
                      Ready-to-use code snippets in popular programming languages.
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                    {/* Language Tabs */}
                    <div className="border-b border-white/10 bg-black/40">
                      <div className="flex space-x-1 p-2">
                        {(Object.keys(codeExamples) as Array<keyof typeof codeExamples>).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setActiveTab(lang)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              activeTab === lang
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            {lang.charAt(0).toUpperCase() + lang.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

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
                      
                      <div className="bg-black/40 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-300">
                          <code>{codeExamples[activeTab]}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Live Testing */}
              {activeSection === 'testing' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-4">Live API Testing</h1>
                    <p className="text-xl text-gray-300">
                      Test API calls directly from the documentation.
                    </p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h2 className="text-2xl font-semibold text-white mb-4">Try It Now</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Query</label>
                        <input
                          type="text"
                          value={testQuery}
                          onChange={(e) => setTestQuery(e.target.value)}
                          placeholder="Enter your sports query..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      
                      <button
                        onClick={runLiveTest}
                        disabled={testLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>{testLoading ? 'Testing...' : 'Test Query'}</span>
                      </button>
                      
                      {testResult && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-2">Response</h3>
                          <div className="bg-black/40 rounded-lg p-4">
                            <pre className="text-sm text-gray-300 overflow-x-auto">
                              {JSON.stringify(testResult, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Rate Limits */}
              {activeSection === 'rate-limits' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-4">Rate Limits & Pricing</h1>
                    <p className="text-xl text-gray-300">
                      Understand API usage limits and subscription tiers.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pricingTiers.map((tier) => (
                      <div key={tier.name} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                        <h3 className="text-xl font-semibold text-white mb-2">{tier.name}</h3>
                        <div className="text-3xl font-bold text-blue-400 mb-4">${tier.price}/month</div>
                        <div className="space-y-2">
                          <div className="text-gray-300">
                            <strong>{tier.requests.toLocaleString()}</strong> requests/month
                          </div>
                          <div className="text-gray-300">
                            Rate limit: <strong>{tier.rateLimit}</strong>
                          </div>
                          <div className="text-gray-300">
                            Support: <strong>{tier.support}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h2 className="text-2xl font-semibold text-white mb-4">Rate Limit Headers</h2>
                    <p className="text-gray-300 mb-4">
                      Every API response includes rate limit information in the headers:
                    </p>
                    <div className="bg-black/40 rounded-lg p-4">
                      <pre className="text-sm text-green-400">
{`X-RateLimit-Limit: 25000
X-RateLimit-Remaining: 24856
X-RateLimit-Reset: 1641859200`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const sections = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'api-reference', title: 'API Reference' },
  { id: 'examples', title: 'Code Examples' },
  { id: 'testing', title: 'Live Testing' },
  { id: 'rate-limits', title: 'Rate Limits' }
]

const codeExamples = {
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

const pricingTiers = [
  {
    name: 'Developer',
    price: 0,
    requests: 1000,
    rateLimit: '10/minute',
    support: 'Email'
  },
  {
    name: 'Startup',
    price: 29,
    requests: 25000,
    rateLimit: '100/minute',
    support: 'Priority Email'
  },
  {
    name: 'Enterprise',
    price: 99,
    requests: 100000,
    rateLimit: 'Unlimited',
    support: 'Phone & Email'
  }
]
