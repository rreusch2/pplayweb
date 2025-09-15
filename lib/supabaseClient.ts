import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or anonymous key')
}

// Re-export the unified Supabase client to prevent multiple instances
// This avoids the warning: "Multiple GoTrueClient instances detected"
export { supabase } from './supabase'