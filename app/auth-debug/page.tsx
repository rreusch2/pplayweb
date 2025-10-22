'use client'
import { useState, useEffect } from 'react'
import { runAuthDiagnostics, attemptAuthRecovery, exportAuthState, AuthDiagnostics } from '@/lib/authDebug'
import { AlertTriangle, CheckCircle, Info, Download, RefreshCw, Trash2 } from 'lucide-react'

export default function AuthDebugPage() {
  const [diagnostics, setDiagnostics] = useState<AuthDiagnostics | null>(null)
  const [loading, setLoading] = useState(false)
  const [recoveryResult, setRecoveryResult] = useState<any>(null)

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const result = await runAuthDiagnostics()
      setDiagnostics(result)
    } catch (error) {
      console.error('Failed to run diagnostics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecovery = async () => {
    setLoading(true)
    try {
      const result = await attemptAuthRecovery()
      setRecoveryResult(result)
      
      // Re-run diagnostics after recovery
      setTimeout(() => {
        runDiagnostics()
      }, 1000)
    } catch (error) {
      console.error('Recovery failed:', error)
      setRecoveryResult({
        success: false,
        message: 'Recovery failed with an unexpected error',
        actions: []
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const report = await exportAuthState()
      const blob = new Blob([report], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `auth-debug-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Authentication Diagnostics</h1>
          <p className="text-gray-400 mb-6">
            Use this page to diagnose and fix authentication issues
          </p>

          <div className="flex gap-4 mb-8">
            <button
              onClick={runDiagnostics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Running...' : 'Run Diagnostics'}
            </button>

            <button
              onClick={handleRecovery}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Auth & Recover
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>

          {recoveryResult && (
            <div className={`mb-6 p-4 rounded-lg ${
              recoveryResult.success 
                ? 'bg-green-900/30 border border-green-700/50' 
                : 'bg-red-900/30 border border-red-700/50'
            }`}>
              <div className="flex items-start gap-3">
                {recoveryResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={recoveryResult.success ? 'text-green-200' : 'text-red-200'}>
                    {recoveryResult.message}
                  </p>
                  {recoveryResult.actions.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-400 space-y-1">
                      {recoveryResult.actions.map((action: string, i: number) => (
                        <li key={i}>• {action}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {diagnostics && (
            <div className="space-y-6">
              {/* Status Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {diagnostics.storageAvailable ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-white font-medium">Storage</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {diagnostics.storageAvailable ? 'Available' : 'Not Available'}
                  </p>
                </div>

                <div className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {diagnostics.sessionValid ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    )}
                    <span className="text-white font-medium">Session</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {diagnostics.sessionValid ? 'Valid' : 'No Session'}
                  </p>
                </div>
              </div>

              {/* Session Data */}
              {diagnostics.sessionData && (
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Session Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">User ID:</span>
                      <span className="text-white font-mono">{diagnostics.sessionData.userId?.substring(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">{diagnostics.sessionData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Expires At:</span>
                      <span className={`${diagnostics.sessionData.isExpired ? 'text-red-400' : 'text-white'}`}>
                        {new Date(diagnostics.sessionData.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {diagnostics.errors.length > 0 && (
                <div className="p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                  <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Errors
                  </h3>
                  <ul className="space-y-2">
                    {diagnostics.errors.map((error, i) => (
                      <li key={i} className="text-sm text-red-200">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {diagnostics.warnings.length > 0 && (
                <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Warnings
                  </h3>
                  <ul className="space-y-2">
                    {diagnostics.warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-yellow-200">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {diagnostics.recommendations.length > 0 && (
                <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {diagnostics.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-blue-200">• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Storage Keys */}
              {diagnostics.supabaseKeysFound.length > 0 && (
                <div className="p-4 bg-gray-700/30 rounded-lg">
                  <h3 className="text-white font-semibold mb-3">
                    Supabase Keys in Storage ({diagnostics.supabaseKeysFound.length})
                  </h3>
                  <div className="max-h-48 overflow-auto">
                    <ul className="space-y-1 text-xs font-mono text-gray-400">
                      {diagnostics.supabaseKeysFound.map((key, i) => (
                        <li key={i}>{key}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          <h2 className="text-xl font-bold text-white mb-4">Common Issues & Solutions</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="text-white font-semibold mb-2">🔄 Infinite Loading Spinner</h3>
              <p className="text-gray-400 mb-2">
                If you see an infinite loading spinner, your session might be corrupted.
              </p>
              <p className="text-gray-300">
                <strong>Solution:</strong> Click "Clear Auth & Recover" above, then refresh the page and sign in again.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">🚫 Can't Sign In</h3>
              <p className="text-gray-400 mb-2">
                If sign in fails repeatedly, localStorage might be blocked or corrupted.
              </p>
              <p className="text-gray-300">
                <strong>Solution:</strong> Check if you're in private browsing mode, or try clearing your browser data for this site.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">🔓 Logged Out After Refresh</h3>
              <p className="text-gray-400 mb-2">
                If you get logged out every time you refresh, session persistence isn't working.
              </p>
              <p className="text-gray-300">
                <strong>Solution:</strong> Ensure localStorage is enabled in your browser settings and you're not in private mode.
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
            <p className="text-gray-400 text-sm">
              <strong className="text-white">Still having issues?</strong> Export your diagnostic report and contact support with the file.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}

