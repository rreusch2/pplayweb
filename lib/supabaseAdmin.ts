import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing Supabase admin environment variables',
    JSON.stringify({ hasUrl: !!supabaseUrl, hasServiceRoleKey: !!serviceRoleKey })
  )
}

export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : (() => {
      throw new Error('Supabase admin client cannot be initialized without URL and service role key')
    })()
