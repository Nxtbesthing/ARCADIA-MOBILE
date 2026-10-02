import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment configuration is missing.')
}

if (!/^https:\/\/[^/]+\.supabase\.co$/.test(supabaseUrl)) {
  throw new Error('VITE_SUPABASE_URL must be the Supabase project URL.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function checkSupabaseConnection() {
  const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: { apikey: supabaseAnonKey }
  })

  if (!response.ok) {
    throw new Error(`Supabase health check failed with status ${response.status}.`)
  }

  return true
}