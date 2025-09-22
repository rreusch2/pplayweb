// Use the unified Supabase client without performing env checks at module load time.
// This prevents build-time crashes if env vars are not injected yet (e.g., during Next build).
export { supabase } from './supabase'