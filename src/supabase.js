import { createClient } from '@supabase/supabase-js'
import { createAuthState } from './auth-state.js'
import { validateSupabaseConfig } from './supabase-config.js'

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL
const supabasePublicKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env?.VITE_SUPABASE_ANON_KEY
export const supabaseConfiguration = validateSupabaseConfig(supabaseUrl, supabasePublicKey)

export const supabase = supabaseConfiguration.configured
  ? createClient(supabaseUrl.trim(), supabasePublicKey.trim())
  : null
export const supabaseAuthState = createAuthState(supabase)

export async function checkSupabaseConnection() {
  if (!supabaseConfiguration.configured) {
    throw new Error(supabaseConfiguration.message)
  }
  const response = await fetch(`${supabaseUrl.trim()}/auth/v1/health`, {
    headers: { apikey: supabasePublicKey.trim() }
  })

  if (!response.ok) {
    throw new Error(`Supabase health check failed with status ${response.status}.`)
  }

  return true
}