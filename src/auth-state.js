export function createAuthState(client) {
  const listeners = new Set()
  let session = null
  let authSubscription = null

  const publish = (event, nextSession) => {
    session = nextSession || null
    for (const listener of listeners) listener(event, session)
  }

  const start = () => {
    if (!client || authSubscription || listeners.size === 0) return
    const { data, error } = client.auth.onAuthStateChange((event, nextSession) => publish(event, nextSession))
    if (error) {
      publish('AUTH_ERROR', null)
      return
    }
    authSubscription = data?.subscription || null
  }

  const stop = () => {
    authSubscription?.unsubscribe()
    authSubscription = null
  }

  return {
    getSession() {
      return session
    },
    setSession(nextSession, event = 'SESSION_SET') {
      publish(event, nextSession)
    },
    subscribe(listener) {
      listeners.add(listener)
      start()
      listener('CURRENT_SESSION', session)
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0) stop()
      }
    }
  }
}

export async function restoreAuthSession(client) {
  try {
    const { data, error } = await client.auth.getSession()
    if (error) return { restored: false, session: null }
    return { restored: true, session: data?.session || null }
  } catch {
    return { restored: false, session: null }
  }
}