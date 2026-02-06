import type { AuthProvider, AuthSession, AuthUser } from '../../src/auth/types'

type UserRecord = {
  id: string
  email: string
  password: string
}

export function createFakeAuthProvider(): AuthProvider {
  const users = new Map<string, UserRecord>()
  const tokens = new Map<string, AuthUser>()

  function toSession(user: UserRecord): AuthSession {
    const accessToken = `token-${user.id}`
    const refreshToken = `refresh-${user.id}`
    tokens.set(accessToken, { id: user.id, email: user.email })
    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      tokenType: 'bearer',
      user: { id: user.id, email: user.email },
    }
  }

  return {
    async signUp(email, password) {
      if (users.has(email)) {
        throw new Error('user_exists')
      }
      const user: UserRecord = {
        id: crypto.randomUUID(),
        email,
        password,
      }
      users.set(email, user)
      return toSession(user)
    },
    async signIn(email, password) {
      const user = users.get(email)
      if (!user || user.password !== password) {
        throw new Error('invalid_credentials')
      }
      return toSession(user)
    },
    async getUser(token) {
      return tokens.get(token) ?? null
    },
  }
}
