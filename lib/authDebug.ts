/**
 * Auth Debug Utilities
 * 
 * Helper functions to diagnose and fix authentication issues
 */

import { supabase, isStorageAvailable, clearAuthStorage } from './supabase'

export interface AuthDiagnostics {
  storageAvailable: boolean
  hasLocalStorage: boolean
  supabaseKeysFound: string[]
  sessionValid: boolean
  sessionData: any
  errors: string[]
  warnings: string[]
  recommendations: string[]
}

/**
 * Run comprehensive auth diagnostics
 */
export async function runAuthDiagnostics(): Promise<AuthDiagnostics> {
  const diagnostics: AuthDiagnostics = {
    storageAvailable: false,
    hasLocalStorage: false,
    supabaseKeysFound: [],
    sessionValid: false,
    sessionData: null,
    errors: [],
    warnings: [],
    recommendations: []
  }

  // Check if we're in browser
  if (typeof window === 'undefined') {
    diagnostics.errors.push('Running on server side - diagnostics only work in browser')
    return diagnostics
  }

  // Check localStorage availability
  diagnostics.storageAvailable = isStorageAvailable()
  diagnostics.hasLocalStorage = typeof window.localStorage !== 'undefined'

  if (!diagnostics.storageAvailable) {
    diagnostics.errors.push('localStorage is not available')
    diagnostics.recommendations.push('Check if you are in private browsing mode')
    diagnostics.recommendations.push('Check browser settings for localStorage permissions')
  }

  // Check for Supabase keys in localStorage
  if (diagnostics.hasLocalStorage) {
    try {
      const allKeys = Object.keys(window.localStorage)
      diagnostics.supabaseKeysFound = allKeys.filter(key => key.startsWith('sb-'))
      
      if (diagnostics.supabaseKeysFound.length === 0) {
        diagnostics.warnings.push('No Supabase session data found in localStorage')
        diagnostics.recommendations.push('You may need to sign in again')
      } else if (diagnostics.supabaseKeysFound.length > 10) {
        diagnostics.warnings.push(`Found ${diagnostics.supabaseKeysFound.length} Supabase keys (possibly corrupted)`)
        diagnostics.recommendations.push('Consider clearing auth storage and signing in again')
      }
    } catch (error) {
      diagnostics.errors.push(`Error reading localStorage: ${error}`)
    }
  }

  // Check current session
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      diagnostics.errors.push(`Session error: ${error.message}`)
      diagnostics.recommendations.push('Clear auth storage and sign in again')
    } else if (session) {
      diagnostics.sessionValid = true
      diagnostics.sessionData = {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: new Date(session.expires_at! * 1000).toISOString(),
        isExpired: Date.now() > (session.expires_at! * 1000)
      }

      if (diagnostics.sessionData.isExpired) {
        diagnostics.warnings.push('Session has expired')
        diagnostics.recommendations.push('Refresh the page to get a new session')
      }
    } else {
      diagnostics.warnings.push('No active session found')
      diagnostics.recommendations.push('Sign in to create a new session')
    }
  } catch (error: any) {
    diagnostics.errors.push(`Error checking session: ${error.message}`)
    diagnostics.recommendations.push('Clear auth storage and try again')
  }

  return diagnostics
}

/**
 * Attempt to fix common auth issues
 */
export async function attemptAuthRecovery(): Promise<{
  success: boolean
  message: string
  actions: string[]
}> {
  const actions: string[] = []

  try {
    // Step 1: Run diagnostics
    actions.push('Running diagnostics...')
    const diagnostics = await runAuthDiagnostics()

    // Step 2: Clear corrupted data
    if (diagnostics.supabaseKeysFound.length > 0) {
      actions.push('Clearing auth storage...')
      clearAuthStorage()
    }

    // Step 3: Sign out to ensure clean state
    try {
      actions.push('Signing out...')
      await supabase.auth.signOut()
    } catch (error) {
      // Ignore sign out errors
    }

    // Step 4: Verify storage is working
    if (!diagnostics.storageAvailable) {
      return {
        success: false,
        message: 'localStorage is not available. Check browser settings or disable private browsing.',
        actions
      }
    }

    actions.push('Recovery complete')
    return {
      success: true,
      message: 'Auth storage cleared successfully. You can now sign in again.',
      actions
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Recovery failed: ${error.message}`,
      actions
    }
  }
}

/**
 * Export auth state for debugging
 */
export async function exportAuthState(): Promise<string> {
  const diagnostics = await runAuthDiagnostics()
  
  const report = {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    diagnostics,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
    }
  }

  return JSON.stringify(report, null, 2)
}

/**
 * Log auth state to console (development only)
 */
export async function logAuthState() {
  if (process.env.NODE_ENV !== 'development') return

  console.group('🔐 Auth State Diagnostics')
  
  const diagnostics = await runAuthDiagnostics()
  
  console.log('Storage Available:', diagnostics.storageAvailable)
  console.log('Session Valid:', diagnostics.sessionValid)
  
  if (diagnostics.sessionData) {
    console.log('Session Data:', diagnostics.sessionData)
  }
  
  if (diagnostics.errors.length > 0) {
    console.error('Errors:', diagnostics.errors)
  }
  
  if (diagnostics.warnings.length > 0) {
    console.warn('Warnings:', diagnostics.warnings)
  }
  
  if (diagnostics.recommendations.length > 0) {
    console.info('Recommendations:', diagnostics.recommendations)
  }
  
  console.groupEnd()
}

// Auto-log in development when this module is imported
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run after a short delay to not block initial load
  setTimeout(() => {
    logAuthState()
  }, 1000)
}

