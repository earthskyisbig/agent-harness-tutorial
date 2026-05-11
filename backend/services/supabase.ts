import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? ''
const supabaseKey  = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? ''
const serviceKey   = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? ''

if (!supabaseUrl) {
  console.warn('NEXT_PUBLIC_SUPABASE_URL is not set')
}

// Public client (respects RLS) — for client-side and user-scoped API routes
export const supabase = createClient(supabaseUrl, supabaseKey)

// Service role client (bypasses RLS) — for server-side admin operations only
export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
