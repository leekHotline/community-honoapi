import type { MiddlewareHandler } from 'hono'
import type { AuthProvider, AuthUser } from '../auth/types'

export type AuthVariables = {
  user: AuthUser | null
}

export function requireUser(
  auth: AuthProvider
): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (c, next) => {
    const token = getBearerToken(c.req.header('Authorization'))
    if (!token) {
      return c.json({ error: 'unauthorized' }, 401)
    }
    const user = await auth.getUser(token)
    if (!user) {
      return c.json({ error: 'unauthorized' }, 401)
    }
    c.set('user', user)
    await next()
  }
}

export function optionalUser(
  auth: AuthProvider
): MiddlewareHandler<{ Variables: AuthVariables }> {
  return async (c, next) => {
    const token = getBearerToken(c.req.header('Authorization'))
    if (!token) {
      c.set('user', null)
      await next()
      return
    }
    const user = await auth.getUser(token)
    c.set('user', user)
    await next()
  }
}

function getBearerToken(headerValue?: string | null) {
  if (!headerValue) {
    return ''
  }
  if (!headerValue.startsWith('Bearer ')) {
    return ''
  }
  return headerValue.slice('Bearer '.length).trim()
}
