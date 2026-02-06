export type AuthUser = {
  id: string
  email: string | null
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
  user: AuthUser
}

export interface AuthProvider {
  signUp(email: string, password: string): Promise<AuthSession>
  signIn(email: string, password: string): Promise<AuthSession>
  getUser(token: string): Promise<AuthUser | null>
}
