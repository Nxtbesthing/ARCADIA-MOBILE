import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuthState, restoreAuthSession } from '../src/auth-state.js'

function createFakeClient() {
  const fake = { callback: null, starts: 0, stops: 0 }
  fake.client = {
    auth: {
      onAuthStateChange(callback) {
        fake.starts += 1
        fake.callback = callback
        return { data: { subscription: { unsubscribe() { fake.stops += 1 } } }, error: null }
      }
    }
  }
  return fake
}

test('auth state uses one underlying subscription and propagates customer sign-in and sign-out', () => {
  const fake = createFakeClient()
  const authState = createAuthState(fake.client)
  const events = []
  const unsubscribeFirst = authState.subscribe((event, session) => events.push(['first', event, session?.user?.id || null]))
  const unsubscribeSecond = authState.subscribe((event, session) => events.push(['second', event, session?.user?.id || null]))
  const session = { user: { id: 'customer-1' } }
  fake.callback('SIGNED_IN', session)
  assert.equal(fake.starts, 1)
  assert.equal(authState.getSession(), session)
  assert.deepEqual(events.slice(-2), [['first', 'SIGNED_IN', 'customer-1'], ['second', 'SIGNED_IN', 'customer-1']])
  fake.callback('SIGNED_OUT', null)
  assert.equal(authState.getSession(), null)
  unsubscribeFirst()
  unsubscribeSecond()
  assert.equal(fake.stops, 1)
})

test('auth state stops listening when its final subscriber is removed and can restart', () => {
  const fake = createFakeClient()
  const authState = createAuthState(fake.client)
  const unsubscribe = authState.subscribe(() => {})
  unsubscribe()
  authState.subscribe(() => {})
  assert.equal(fake.starts, 2)
})

test('auth state restores an existing session for its first subscriber', () => {
  const fake = createFakeClient()
  const authState = createAuthState(fake.client)
  const restoredSession = { user: { id: 'customer-restored' } }
  const events = []
  authState.setSession(restoredSession, 'SESSION_RESTORED')
  authState.subscribe((event, session) => events.push([event, session?.user?.id || null]))
  assert.deepEqual(events, [['CURRENT_SESSION', 'customer-restored']])
  assert.equal(authState.getSession(), restoredSession)
  assert.equal(fake.starts, 1)
})

test('admin sign-in and sign-out propagate through the same shared auth state', () => {
  const fake = createFakeClient()
  const authState = createAuthState(fake.client)
  const events = []
  authState.subscribe((event, session) => events.push([event, session?.user?.app_metadata?.role || null]))
  fake.callback('SIGNED_IN', { user: { id: 'admin-1', app_metadata: { role: 'admin' } } })
  fake.callback('SIGNED_OUT', null)
  assert.deepEqual(events.slice(-2), [['SIGNED_IN', 'admin'], ['SIGNED_OUT', null]])
  assert.equal(authState.getSession(), null)
})

test('session restoration handles success, returned errors, and thrown failures', async () => {
  const restoredSession = { user: { id: 'restored-user' } }
  assert.deepEqual(await restoreAuthSession({ auth: { getSession: async () => ({ data: { session: restoredSession }, error: null }) } }), {
    restored: true,
    session: restoredSession
  })
  assert.deepEqual(await restoreAuthSession({ auth: { getSession: async () => ({ data: null, error: new Error('private detail') }) } }), {
    restored: false,
    session: null
  })
  assert.deepEqual(await restoreAuthSession({ auth: { getSession: async () => { throw new Error('network detail') } } }), {
    restored: false,
    session: null
  })
})