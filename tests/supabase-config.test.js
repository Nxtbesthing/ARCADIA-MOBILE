import test from 'node:test'
import assert from 'node:assert/strict'
import { assertSafeSupabaseBuildConfig, validateSupabaseConfig } from '../src/supabase-config.js'

test('missing Supabase settings are classified without throwing', () => {
  assert.equal(validateSupabaseConfig('', '').status, 'unconfigured')
  assert.equal(validateSupabaseConfig(undefined, 'anon').configured, false)
})

test('invalid project URLs are rejected without exposing the supplied key', () => {
  const result = validateSupabaseConfig('http://project.supabase.co', 'sensitive-test-value')
  assert.equal(result.status, 'unconfigured')
  assert.equal(JSON.stringify(result).includes('sensitive-test-value'), false)
})

test('valid Supabase project configuration is accepted', () => {
  const legacyAnonKey = `e30.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.signature`
  assert.equal(validateSupabaseConfig('https://project.supabase.co', legacyAnonKey).configured, true)
  assert.equal(validateSupabaseConfig('https://project.supabase.co', `sb_publishable_${'a'.repeat(32)}`).configured, true)
})

test('malformed, private, and non-anon JWT keys are rejected without being echoed', () => {
  const serviceRoleJwt = `e30.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`
  const secretKey = `sb_secret_${'s'.repeat(32)}`
  for (const key of ['anon-key', 'sb_publishable_', serviceRoleJwt, secretKey]) {
    const result = validateSupabaseConfig('https://project.supabase.co', key)
    assert.equal(result.configured, false)
    assert.equal(JSON.stringify(result).includes(key), false)
  }
})

test('malformed Supabase URLs are rejected', () => {
  const legacyAnonKey = `e30.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.signature`
  for (const url of ['https://nested.project.supabase.co', 'https://user:pass@project.supabase.co', 'https://project.supabase.co:8443']) {
    assert.equal(validateSupabaseConfig(url, legacyAnonKey).configured, false)
  }
})

test('build configuration rejects invalid keys and privileged VITE variables without echoing values', () => {
  const privileged = `sb_secret_${'x'.repeat(32)}`
  assert.throws(
    () => assertSafeSupabaseBuildConfig({ VITE_SUPABASE_URL: 'https://project.supabase.co', VITE_SUPABASE_ANON_KEY: privileged }),
    (error) => !error.message.includes(privileged)
  )
  assert.throws(
    () => assertSafeSupabaseBuildConfig({ VITE_SUPABASE_SERVICE_ROLE_KEY: 'never-display-this' }),
    (error) => !error.message.includes('never-display-this')
  )
  assert.doesNotThrow(() => assertSafeSupabaseBuildConfig({}))
})