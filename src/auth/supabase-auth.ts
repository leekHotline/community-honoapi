import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthProvider, AuthSession, AuthUser } from './types'

export function createSupabaseAuthProvider(client: SupabaseClient): AuthProvider {
  return {
    async signUp(email, password): Promise<AuthSession> {
      const { data, error } = await client.auth.signUp({ email, password })
      if (error) {
        throw error
      }
      if (!data.session || !data.user) {
        throw new Error('auth_session_missing')
      }
      return toSession(data.session, data.user)
    },
    async signIn(email, password): Promise<AuthSession> {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        throw error
      }
      if (!data.session || !data.user) {
        throw new Error('auth_session_missing')
      }
      return toSession(data.session, data.user)
    },
    async getUser(token: string): Promise<AuthUser | null> {
      const { data, error } = await client.auth.getUser(token)
      if (error || !data.user) {
        return null
      }
      return {
        id: data.user.id,
        email: data.user.email ?? null,
      }
    },
  }
}

function toSession(session: {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}, user: { id: string; email?: string | null }): AuthSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in,
    tokenType: session.token_type,
    user: {
      id: user.id,
      email: user.email ?? null,
    },
  }
}
