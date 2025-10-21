'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, UserProfile } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface AuthState {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initializing: boolean
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function SimpleAuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: false,
    initializing: true,
  })
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    // Helper to load user profile
    const loadUserProfile = async (userId: string) => {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profileError) {
        console.error('Error fetching profile:', profileError)
        return null
      }
      
      console.log('Profile loaded:', {
        id: profile?.id,
        username: profile?.username,
        subscription_tier: profile?.subscription_tier
      })
      return profile as UserProfile
    }

    // Initialize auth on mount
    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          console.log('✅ Session found on init')
          const profile = await loadUserProfile(session.user.id)
          setAuthState({
            session,
            user: session.user,
            profile,
            loading: false,
            initializing: false
          })
        } else {
          console.log('❌ No session found on init')
          setAuthState(prev => ({ ...prev, initializing: false }))
        }
      } catch (error) {
        console.error('Auth init error:', error)
        setAuthState(prev => ({ ...prev, initializing: false }))
      }
    }

    initAuth()

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        console.log('🔄 Auth state change:', event, session?.user?.id)
        
        // Handle all events that provide a valid session
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          const profile = await loadUserProfile(session.user.id)
          setAuthState({
            session,
            user: session.user,
            profile,
            loading: false,
            initializing: false
          })
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out')
          setAuthState({
            session: null,
            user: null,
            profile: null,
            loading: false,
            initializing: false
          })
          router.push('/')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      })

      if (error) throw error
      
      if (data.user) {
        // Create profile directly
        await supabase
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
        
        toast.success('Account created successfully!')
      }
    } catch (error: any) {
      console.error('Sign up error:', error)
      toast.error(error.message || 'Failed to sign up')
      throw error
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      // onAuthStateChange handles the rest
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in')
      throw error
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast.success('Signed out successfully')
    } catch (error: any) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
      throw error
    } finally {
      setAuthState(prev => ({ ...prev, loading: false }))
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!authState.user) throw new Error('No user logged in')
    try {
      setAuthState(prev => ({ ...prev, loading: true }))
      
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
      setAuthState(prev => ({ ...prev, loading: false }))
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
      
      if (!error && data) {
        setAuthState(prev => ({ ...prev, profile: data as UserProfile }))
      }
    } catch (error) {
      console.error('Error refreshing profile:', error)
    }
  }
  
  return (
    <AuthContext.Provider value={{
      ...authState,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
