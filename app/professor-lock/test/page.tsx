"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useChatKitSession, useFeatureAccess } from '@/hooks/useChatKit'
import { 
  createPlayerPropWidget, 
  createParlayWidget, 
  createGameAnalysisWidget 
} from '@/lib/chatkit-widgets'

export default function ChatKitTestPage() {
  const { user, profile, session: authSession } = useAuth()
  const { 
    session, 
    isLoading, 
    error, 
    createSession, 
    endSession,
    handleWidgetAction 
  } = useChatKitSession()
  const { tier, canAccess, getMessageLimit, getPicksLimit } = useFeatureAccess()

  const [testResults, setTestResults] = useState<Record<string, any>>({})

  // Test session creation
  const testSessionCreation = async () => {
    setTestResults(prev => ({ ...prev, session: 'Testing...' }))
    const result = await createSession()
    setTestResults(prev => ({ 
      ...prev, 
      session: result ? '✅ Session created' : '❌ Failed to create session' 
    }))
  }

  // Test widget creation
  const testWidgets = () => {
    try {
      const propWidget = createPlayerPropWidget({
        playerName: "Test Player",
        team: "Test Team",
        propType: "Hits O/U",
        line: "1.5",
        odds: "+110",
        confidence: 75,
        reasoning: "Test reasoning for the pick"
      })

      const parlayWidget = createParlayWidget({
        legs: [
          { id: '1', match: 'Team A @ Team B', pick: 'Team A ML', odds: '-150' },
          { id: '2', match: 'Team C @ Team D', pick: 'Over 9.5', odds: '-110' }
        ],
        totalOdds: '+215',
        stake: 50,
        potentialPayout: 157.50
      })

      setTestResults(prev => ({ 
        ...prev, 
        widgets: '✅ Widgets created successfully' 
      }))
    } catch (err) {
      setTestResults(prev => ({ 
        ...prev, 
        widgets: `❌ Widget error: ${err}` 
      }))
    }
  }

  // Test widget action
  const testWidgetAction = async () => {
    setTestResults(prev => ({ ...prev, action: 'Testing...' }))
    try {
      await handleWidgetAction({
        type: 'add_to_betslip',
        payload: {
          playerName: 'Test Player',
          propType: 'Test Prop',
          line: '1.5',
          odds: '+100'
        }
      })
      setTestResults(prev => ({ 
        ...prev, 
        action: '✅ Widget action processed' 
      }))
    } catch (err) {
      setTestResults(prev => ({ 
        ...prev, 
        action: `❌ Action failed: ${err}` 
      }))
    }
  }

  // Test feature access
  const testFeatureAccess = () => {
    const features = {
      basic_chat: canAccess('basic_chat'),
      advanced_analysis: canAccess('advanced_analysis'),
      player_props: canAccess('player_props'),
      parlays: canAccess('parlays'),
      live_betting: canAccess('live_betting'),
      vip_picks: canAccess('vip_picks')
    }

    setTestResults(prev => ({ 
      ...prev, 
      features: features 
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">ChatKit Integration Test Page</h1>

        {/* User Status */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">User Status</h2>
          <div className="space-y-2">
            <p>Logged In: {user ? '✅' : '❌'}</p>
            <p>User ID: {user?.id || 'Not logged in'}</p>
            <p>Email: {user?.email || 'N/A'}</p>
            <p>Subscription Tier: <span className="font-semibold">{tier}</span></p>
            <p>Message Limit: {getMessageLimit() === -1 ? 'Unlimited' : getMessageLimit()}</p>
            <p>Picks Limit: {getPicksLimit()}</p>
            <p>Auth Token: {authSession?.access_token ? '✅ Available' : '❌ Missing'}</p>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <div className="space-y-2">
            <p>OPENAI_API_KEY: {process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}</p>
            <p>OPENAI_WORKFLOW_ID: {process.env.OPENAI_WORKFLOW_ID ? '✅ Set' : '❌ Missing'}</p>
            <p>SUPABASE_SERVICE_ROLE_KEY: {process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'}</p>
            <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testSessionCreation}
              disabled={isLoading || !user}
              className="rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              Test Session Creation
            </button>
            <button
              onClick={testWidgets}
              className="rounded-lg bg-green-600 px-4 py-2 hover:bg-green-700"
            >
              Test Widget Creation
            </button>
            <button
              onClick={testWidgetAction}
              disabled={!user}
              className="rounded-lg bg-purple-600 px-4 py-2 hover:bg-purple-700 disabled:opacity-50"
            >
              Test Widget Action
            </button>
            <button
              onClick={testFeatureAccess}
              className="rounded-lg bg-yellow-600 px-4 py-2 hover:bg-yellow-700"
            >
              Test Feature Access
            </button>
            {session && (
              <button
                onClick={endSession}
                className="rounded-lg bg-red-600 px-4 py-2 hover:bg-red-700"
              >
                End Session
              </button>
            )}
          </div>
        </div>

        {/* Session Status */}
        {session && (
          <div className="mb-8 rounded-lg border border-green-500/30 bg-green-500/10 p-6">
            <h2 className="text-xl font-semibold mb-4">Active Session</h2>
            <div className="space-y-2">
              <p>Session ID: {session.id?.substring(0, 20)}...</p>
              <p>Client Secret: {session.client_secret ? '✅ Available' : '❌ Missing'}</p>
              <p>User Preferences: {JSON.stringify(session.user_preferences)}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-8 rounded-lg border border-red-500/30 bg-red-500/10 p-6">
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="mb-8 rounded-lg border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-2">
              {Object.entries(testResults).map(([key, value]) => (
                <div key={key} className="border-b border-white/10 pb-2">
                  <p className="font-semibold capitalize">{key}:</p>
                  <pre className="text-sm text-gray-300">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
          <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Copy <code className="bg-white/10 px-2 py-1 rounded">.env.chatkit.template</code> to <code className="bg-white/10 px-2 py-1 rounded">.env.local</code></li>
            <li>Add your OpenAI API key from platform.openai.com</li>
            <li>Create an Agent Builder workflow and add the workflow ID</li>
            <li>Add your Supabase service role key</li>
            <li>Run the database migration for chatkit_sessions table</li>
            <li>Install ChatKit: <code className="bg-white/10 px-2 py-1 rounded">npm install @openai/chatkit-react</code></li>
            <li>Restart your development server</li>
            <li>Click the test buttons above to verify everything works</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

