'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase, UserProfile, clearAuthStorage } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface AuthState {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initializing: boolean
  error: Error | null
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Constants for better control
const AUTH_INIT_TIMEOUT = 5000 // 5 seconds max for initial auth check
const PROFILE_FETCH_TIMEOUT = 8000 // 8 seconds max for profile fetch
const MAX_RETRY_ATTEMPTS = 2

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: false,
    initializing: true,
    error: null
  })
  const router = useRouter()
  const initTimeoutRef = useRef<NodeJS.Timeout>()
  const profileFetchRef = useRef<Promise<UserProfile | null>>()
  const mountedRef = useRef(true)
  const hasInitializedRef = useRef(false)

  // Safe state update that checks if component is still mounted
  const safeSetAuthState = useCallback((update: Partial<AuthState> | ((prev: AuthState) => AuthState)) => {
    if (!mountedRef.current) return
    
    if (typeof update === 'function') {
      setAuthState(update)
    } else {
      setAuthState(prev => ({ ...prev, ...update }))
    }
  }, [])

  // Fetch user profile with timeout and retry logic
  const fetchUserProfile = useCallback(async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
    // Reuse in-flight request if exists
    if (profileFetchRef.current) {
      console.log('[Auth] Reusing existing profile fetch')
      return profileFetchRef.current
    }

    console.log(`[Auth] Fetching profile for user: ${userId} (attempt ${retryCount + 1})`)

    const fetchPromise = (async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timeout')), PROFILE_FETCH_TIMEOUT)
        })

        const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

        if (error) {
          console.error('[Auth] Profile fetch error:', error)
          
          // Retry on specific errors
          if (retryCount < MAX_RETRY_ATTEMPTS && (error.code === 'PGRST301' || error.message.includes('timeout'))) {
            console.log(`[Auth] Retrying profile fetch (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
            return fetchUserProfile(userId, retryCount + 1)
          }
          
          return null
        }

        console.log('[Auth] Profile loaded:', {
          id: data?.id,
          username: data?.username,
          subscription_tier: data?.subscription_tier
        })

        return data as UserProfile
      } catch (error) {
        console.error('[Auth] Profile fetch failed:', error)
        
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          console.log(`[Auth] Retrying profile fetch (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
          return fetchUserProfile(userId, retryCount + 1)
        }
        
        return null
      } finally {
        profileFetchRef.current = undefined
      }
    })()

    profileFetchRef.current = fetchPromise
    return fetchPromise
  }, [])

  // Initialize auth state
  useEffect(() => {
    // Prevent re-initialization
    if (hasInitializedRef.current) {
      console.log('[Auth] Already initialized, skipping')
      return
    }
    hasInitializedRef.current = true

    console.log('[Auth] Initializing auth system')
    
    // Set a timeout to ensure we don't hang forever
    initTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current && authState.initializing) {
        console.warn('[Auth] Initialization timeout - forcing ready state')
        safeSetAuthState({ initializing: false, error: new Error('Auth initialization timeout') })
      }
    }, AUTH_INIT_TIMEOUT)

    let authSubscription: { unsubscribe: () => void } | null = null

    const initializeAuth = async () => {
      try {
        console.log('[Auth] Getting initial session')
        
        // Get current session with timeout
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        })

        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ])

        if (sessionError) {
          console.error('[Auth] Session check error:', sessionError)
          // Clear potentially corrupted session data
          await supabase.auth.signOut()
          clearAuthStorage()
        }

        if (session?.user && mountedRef.current) {
          console.log('[Auth] Initial session found:', session.user.id)
          
          safeSetAuthState({
            session,
            user: session.user,
            initializing: false,
          })

          // Fetch profile in background
          fetchUserProfile(session.user.id).then(profile => {
            if (mountedRef.current) {
              safeSetAuthState({ profile })
            }
          }).catch(error => {
            console.error('[Auth] Failed to load profile:', error)
          })
        } else {
          console.log('[Auth] No initial session found')
          safeSetAuthState({
            session: null,
            user: null,
            profile: null,
            initializing: false,
          })
        }

        // Clear the timeout since we completed
        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current)
        }

      } catch (error) {
        console.error('[Auth] Initialization error:', error)
        
        // On error, clear everything and start fresh
        if (error instanceof Error && error.message.includes('timeout')) {
          console.log('[Auth] Timeout detected, clearing auth storage')
          clearAuthStorage()
        }
        
        safeSetAuthState({
          session: null,
          user: null,
          profile: null,
          initializing: false,
          error: error as Error
        })

        if (initTimeoutRef.current) {
          clearTimeout(initTimeoutRef.current)
        }
      }
    }

    // Set up auth state change listener
    const setupAuthListener = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          console.log('[Auth] State change:', event, session?.user?.id || 'no-user')

          if (!mountedRef.current) return

          switch (event) {
            case 'INITIAL_SESSION':
              // We handle this in initializeAuth, so skip to avoid duplication
              console.log('[Auth] Skipping INITIAL_SESSION (handled by initializeAuth)')
              break

            case 'SIGNED_IN':
            case 'TOKEN_REFRESHED':
              if (session?.user) {
                console.log('[Auth] User signed in or token refreshed')
                safeSetAuthState({
                  session,
                  user: session.user,
                  loading: false,
                  initializing: false,
                  error: null
                })

                // Fetch profile
                fetchUserProfile(session.user.id).then(profile => {
                  if (mountedRef.current) {
                    safeSetAuthState({ profile })
                  }
                }).catch(console.error)
              }
              break

            case 'SIGNED_OUT':
              console.log('[Auth] User signed out')
              safeSetAuthState({
                session: null,
                user: null,
                profile: null,
                loading: false,
                initializing: false,
                error: null
              })
              
              // Clear storage and redirect
              clearAuthStorage()
              setTimeout(() => {
                if (mountedRef.current) {
                  router.push('/')
                }
              }, 100)
              break

            case 'USER_UPDATED':
              console.log('[Auth] User updated')
              if (session?.user) {
                safeSetAuthState({
                  session,
                  user: session.user,
                })
                
                // Refresh profile
                fetchUserProfile(session.user.id).then(profile => {
                  if (mountedRef.current) {
                    safeSetAuthState({ profile })
                  }
                }).catch(console.error)
              }
              break

            default:
              console.log('[Auth] Unhandled auth event:', event)
              // Ensure we're not stuck in initializing
              safeSetAuthState({ initializing: false })
          }
        }
      )

      authSubscription = subscription
    }

    // Start initialization
    initializeAuth()
    setupAuthListener()

    // Cleanup
    return () => {
      console.log('[Auth] Cleaning up auth provider')
      mountedRef.current = false
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
      
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
    }
  }, []) // Empty deps - only run once

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    try {
      safeSetAuthState({ loading: true, error: null })
      console.log('[Auth] Starting signup for:', email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      })

      if (error) {
        console.error('[Auth] Signup error:', error)
        throw error
      }

      if (data.user) {
        console.log('[Auth] User created:', data.user.id)

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username,
            email,
            subscription_tier: 'free',
            is_active: true,
            welcome_bonus_claimed: false,
            admin_role: false,
            subscription_status: 'inactive',
            notification_settings: { ai_picks: true }
          }, { onConflict: 'id' })

        if (profileError) {
          console.error('[Auth] Profile creation error:', profileError)
          toast.error('Account created but profile setup failed. Please contact support.')
        } else {
          console.log('[Auth] Profile created successfully')
        }

        if (data.user.identities?.length === 0) {
          toast.success('Please check your email to confirm your account!')
        } else {
          toast.success('Account created successfully!')
        }
      } else {
        toast.success('Confirmation email sent! Please check your inbox.')
      }
    } catch (error: any) {
      console.error('[Auth] Sign up failed:', error)
      const errorMessage = error.message || 'Failed to sign up'
      toast.error(errorMessage)
      safeSetAuthState({ error })
      throw error
    } finally {
      safeSetAuthState({ loading: false })
    }
  }, [safeSetAuthState])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      safeSetAuthState({ loading: true, error: null })
      console.log('[Auth] Signing in:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('[Auth] Sign in error:', error)
        
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password')
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please confirm your email address first')
        } else {
          toast.error(error.message || 'Failed to sign in')
        }
        
        throw error
      }

      if (data.session) {
        console.log('[Auth] Sign in successful')
        toast.success('Welcome back!')
      }
    } catch (error: any) {
      console.error('[Auth] Sign in failed:', error)
      safeSetAuthState({ error })
      throw error
    } finally {
      safeSetAuthState({ loading: false })
    }
  }, [safeSetAuthState])

  const signOut = useCallback(async () => {
    try {
      safeSetAuthState({ loading: true, error: null })
      console.log('[Auth] Signing out')

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('[Auth] Sign out error:', error)
        throw error
      }

      // Clear all auth storage
      clearAuthStorage()
      
      toast.success('Signed out successfully')
      console.log('[Auth] Sign out successful')
    } catch (error: any) {
      console.error('[Auth] Sign out failed:', error)
      toast.error('Failed to sign out')
      
      // Force clear everything anyway
      clearAuthStorage()
      safeSetAuthState({
        session: null,
        user: null,
        profile: null,
        error
      })
    } finally {
      safeSetAuthState({ loading: false })
    }
  }, [safeSetAuthState])

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!authState.user) {
      throw new Error('No user logged in')
    }

    try {
      safeSetAuthState({ loading: true, error: null })
      console.log('[Auth] Updating profile')

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id)
        .select()
        .single()

      if (error) {
        console.error('[Auth] Update profile error:', error)
        throw error
      }

      safeSetAuthState({ profile: data as UserProfile })
      toast.success('Profile updated successfully')
      console.log('[Auth] Profile updated')
    } catch (error: any) {
      console.error('[Auth] Update profile failed:', error)
      toast.error('Failed to update profile')
      safeSetAuthState({ error })
      throw error
    } finally {
      safeSetAuthState({ loading: false })
    }
  }, [authState.user, safeSetAuthState])

  const refreshProfile = useCallback(async () => {
    if (!authState.user) return

    try {
      console.log('[Auth] Refreshing profile')
      const profile = await fetchUserProfile(authState.user.id)
      
      if (profile && mountedRef.current) {
        safeSetAuthState({ profile })
        console.log('[Auth] Profile refreshed')
      }
    } catch (error) {
      console.error('[Auth] Refresh profile failed:', error)
    }
  }, [authState.user, fetchUserProfile, safeSetAuthState])

  const clearError = useCallback(() => {
    safeSetAuthState({ error: null })
  }, [safeSetAuthState])

  const value: AuthContextType = {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a SimpleAuthProvider')
  }
  return context
}
