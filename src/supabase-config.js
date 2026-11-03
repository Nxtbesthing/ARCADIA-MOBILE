const INVALID_CONFIG_MESSAGE = 'Supabase configuration is invalid. Use a Supabase publishable key or legacy anon key.'

function isLegacyAnonKey(key) {
  const segments = key.split('.')
  if (segments.length !== 3 || segments.some((segment) => !segment)) return false

  try {
    const payload = segments[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '='))
    const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0))
    const claims = JSON.parse(new TextDecoder().decode(bytes))
    return claims.role === 'anon'
  } catch {
    return false
  }
}

function isPublicSupabaseKey(key) {
  if (/^sb_secret_/i.test(key) || /^sb_publishable_/i.test(key)) {
    return /^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(key)
  }
  return isLegacyAnonKey(key)
}

export function validateSupabaseConfig(url, publicKey) {
  if (typeof url !== 'string' || !url.trim() || typeof publicKey !== 'string' || !publicKey.trim()) {
    return { configured: false, status: 'unconfigured', message: 'Supabase configuration is missing.' }
  }

  const normalizedKey = publicKey.trim()
  if (!isPublicSupabaseKey(normalizedKey)) {
    return { configured: false, status: 'unconfigured', message: INVALID_CONFIG_MESSAGE }
  }

  try {
    const parsedUrl = new URL(url.trim())
    if (parsedUrl.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/i.test(parsedUrl.hostname) || parsedUrl.pathname !== '/' || parsedUrl.search || parsedUrl.hash || parsedUrl.username || parsedUrl.password || parsedUrl.port) {
      return { configured: false, status: 'unconfigured', message: 'Supabase configuration is invalid.' }
    }
  } catch {
    return { configured: false, status: 'unconfigured', message: 'Supabase configuration is invalid.' }
  }

  return { configured: true, status: 'configured', message: '' }
}

export function assertSafeSupabaseBuildConfig(environment) {
  const privilegedVariableExists = Object.entries(environment || {}).some(([name, value]) =>
    /(?:SERVICE_ROLE|SECRET|PRIVATE_KEY)/i.test(name) && typeof value === 'string' && value.trim()
  )
  if (privilegedVariableExists) {
    throw new Error('Privileged Supabase credentials must not use VITE_ environment variables.')
  }

  const url = environment?.VITE_SUPABASE_URL
  const publicKey = environment?.VITE_SUPABASE_PUBLISHABLE_KEY ?? environment?.VITE_SUPABASE_ANON_KEY
  if ((typeof url === 'string' && url.trim()) || (typeof publicKey === 'string' && publicKey.trim())) {
    const result = validateSupabaseConfig(url, publicKey)
    if (!result.configured) throw new Error(result.message)
  }
}
