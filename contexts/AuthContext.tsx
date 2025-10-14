'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, UserProfile } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/apiClient'
import { revenueCatWeb } from '@/lib/revenueCatWeb'

interface AuthState {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initializing: boolean
  justSignedUp: boolean
}

interface AuthContextType extends AuthState {
  clearJustSignedUp: () => void
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: false, // For specific actions like signIn/signUp
    initializing: true, // For initial auth state resolution
    justSignedUp: false,
  })
  const router = useRouter()

  useEffect(() => {
    // SSR guard: do nothing on server, immediately mark as not initializing
    if (typeof window === 'undefined') {
      setAuthState(prev => ({ ...prev, initializing: false }))
      return
    }

    let mounted = true
    let sessionCheckInterval: NodeJS.Timeout | null = null

    const fetchUserProfile = async (user: User): Promise<UserProfile | null> => {
      console.log('🚀 Fetching profile via Railway backend for user:', user.id)
      try {
        // Fetch profile from Railway backend API like mobile app does
        const response = await apiClient.get(`/api/user/profile`, { params: { userId: user.id } })
        
        const profile = response?.data?.profile || null
        if (profile) {
          console.log('✅ Profile fetched from backend:', profile.username || profile.email)
          // Ensure admin_role is present even if backend omitted it
          if (typeof (profile as any).admin_role === 'undefined') {
            try {
              const { data: adminCheck, error: adminErr } = await supabase
                .from('profiles')
                .select('admin_role')
                .eq('id', user.id)
                .single()
              if (!adminErr) {
                (profile as any).admin_role = adminCheck?.admin_role ?? false
              }
            } catch (e) {
              console.warn('⚠️ Could not load admin_role from Supabase directly')
            }
          }
          return profile as UserProfile
        }
        
        console.log('⚠️ No profile data returned from backend')
        return null
      } catch (error: any) {
        console.error('❌ Error fetching profile from backend:', error.response?.data || error.message)
        
        // If backend fails, try direct Supabase as fallback
        console.log('🔄 Falling back to direct Supabase query')
        try {
          const { data, error: supabaseError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (supabaseError) {
            console.error('❌ Supabase fallback also failed:', supabaseError)
            return null
          }
          
          console.log('✅ Profile fetched via Supabase fallback:', data.username)
          return data
        } catch (fallbackError) {
          console.error('❌ Both backend and Supabase failed:', fallbackError)
          return null
        }
      }
    }

    // IMMEDIATE auth resolution - no waiting, no hanging
    console.log('🚀 Setting auth as ready immediately')
    setAuthState(prev => ({ ...prev, initializing: false }))
    
    // Try to get session in background without blocking UI
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return
      if (error) {
        console.error('❌ Background getSession error:', error)
        return
      }
      if (session?.user) {
        console.log('✅ Background session found, user:', session.user.id)
        setAuthState(prev => ({
          ...prev,
          session,
          user: session.user,
        }))
        // Fetch profile in background
        fetchUserProfile(session.user).then((profile) => {
          if (!mounted) return
          setAuthState(prev => ({ ...prev, profile }))
        }).catch(console.error)
      }
    }).catch((error) => {
      console.error('❌ Background auth check failed:', error)
    })

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', { event, hasSession: !!session, userId: session?.user?.id })
        
        if (!mounted) return

        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            if (session?.user) {
              setAuthState(prev => ({
                ...prev,
                session,
                user: session.user,
                initializing: false,
                loading: false,
              }))
              
              // Fetch profile in background
              fetchUserProfile(session.user).then(async (profile) => {
                if (!mounted) return
                setAuthState(prev => ({ ...prev, profile }))
                
                // 🎯 Ensure RevenueCat is initialized for existing users without revenuecat_customer_id
                if (profile && !profile.revenuecat_customer_id) {
                  console.log('🔗 Initializing RevenueCat for existing user:', session.user.id)
                  try {
                    await revenueCatWeb.initialize(session.user.id)
                    
                    // Update the profile with RevenueCat customer ID
                    await supabase
                      .from('profiles')
                      .update({ 
                        revenuecat_customer_id: session.user.id,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', session.user.id)
                      
                    console.log('✅ RevenueCat initialized for existing user')
                    
                    // Update local profile state
                    setAuthState(prev => ({
                      ...prev,
                      profile: prev.profile ? {
                        ...prev.profile,
                        revenuecat_customer_id: session.user.id
                      } : prev.profile
                    }))
                  } catch (error) {
                    console.error('⚠️ RevenueCat initialization failed for existing user:', error)
                  }
                }
              }).catch(console.error)
            }
            break
            
          case 'SIGNED_OUT':
            setAuthState(prev => ({
              ...prev,
              session: null,
              user: null,
              profile: null,
              initializing: false,
              loading: false,
            }))
            // Redirect after state update
            setTimeout(() => {
              if (!mounted) return
              router.push('/')
            }, 100)
            break
            
          default:
            // For other events, just update the session
            setAuthState(prev => ({
              ...prev,
              session,
              user: session?.user ?? null,
              initializing: false,
              loading: false,
            }))
        }
      }
    )

    // Periodic session validation (every 30 seconds)
    sessionCheckInterval = setInterval(async () => {
      if (!mounted) return
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session && authState.session) {
          console.log('⚠️ Session lost, clearing auth state')
          setAuthState(prev => ({
            ...prev,
            session: null,
            user: null,
            profile: null,
          }))
        }
      } catch (error) {
        console.error('Session check failed:', error)
      }
    }, 30000)

    return () => {
      mounted = false
      if (sessionCheckInterval) clearInterval(sessionCheckInterval)
      subscription.unsubscribe()
    }
  }, [router])

  const setLoading = (loading: boolean) => {
    setAuthState(prev => ({ ...prev, loading }))
  }

  const setJustSignedUp = (justSignedUp: boolean) => {
    setAuthState(prev => ({ ...prev, justSignedUp }))
  }

  const clearJustSignedUp = () => {
    console.log('🗑️ Clearing justSignedUp flag')
    setJustSignedUp(false)
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setLoading(true)
      console.log('📈 Starting signup process for:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      })

      if (error) {
        console.error('❌ Supabase Auth signup error:', error)
        throw error
      }
      
      if (data.user) {
         // The onAuthStateChange listener will handle setting user and profile
        console.log('✅ Account created! User ID:', data.user.id)
        
        // This upsert is still useful for immediate profile creation
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
          }, { onConflict: 'id' });

        if (profileError) {
          console.error('❌ Error creating/updating profile on signup:', profileError)
          toast.error('Could not create your user profile. Please contact support.')
        } else {
            console.log('✅ Profile created/updated successfully on signup')
        }

        // 🎯 Initialize RevenueCat for new web user
        console.log('🔗 Initializing RevenueCat for new web user:', data.user.id)
        try {
          await revenueCatWeb.initialize(data.user.id)
          
          // Update the profile with RevenueCat customer ID
          await supabase
            .from('profiles')
            .update({ 
              revenuecat_customer_id: data.user.id, // Use user ID as RevenueCat customer ID
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id)
            
          console.log('✅ RevenueCat initialized and profile updated for web user')
        } catch (revenueCatError) {
          console.error('⚠️ RevenueCat initialization failed (non-fatal):', revenueCatError)
          // Don't fail signup if RevenueCat fails
        }

        console.log('🚀 Setting justSignedUp flag to trigger onboarding')
        setJustSignedUp(true)
        
        if (data.user.identities?.length === 0) { // User needs to verify email
           toast.success('Please check your email to confirm your account!')
        } else {
           toast.success('Account created successfully!')
        }
      } else {
        // Handle cases where sign up doesn't return a user (e.g. email verification required)
        toast.success('Confirmation email sent! Please check your inbox.')
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast.error(error.message || 'Failed to sign up')
      throw error // Re-throw to be caught by the calling component
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast.success('Welcome back!')
      // onAuthStateChange will handle the rest
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully')
      // onAuthStateChange will handle the rest
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authState.user) throw new Error('No user logged in')
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authState.user.id)
        .select()
        .single()

      if (error) throw error

      setAuthState(prev => ({ ...prev, profile: data as UserProfile }))
      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Update profile error:', error)
      toast.error('Failed to update profile')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!authState.user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authState.user.id)
        .single()
      if (error) throw error
      setAuthState(prev => ({...prev, profile: data as UserProfile}))
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }
  
  const value: AuthContextType = {
    ...authState,
    clearJustSignedUp,
    signUp,
    signIn,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}