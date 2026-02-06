import { createClient } from '@supabase/supabase-js'
import { requireEnv } from './env'

export function createSupabaseClient() {
  const connectionString = requireEnv('SUPABASE_CONNECTION_STRING')
  const url = resolveSupabaseUrl(connectionString)
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
  if (!serviceRoleKey) {
    throw new Error('Missing required env var: SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  })
}

function resolveSupabaseUrl(connectionString: string) {
  const explicitUrl = process.env.SUPABASE_URL
  if (explicitUrl) {
    return explicitUrl
  }
  const inferred = inferSupabaseUrl(connectionString)
  if (!inferred) {
    throw new Error(
      'Unable to infer SUPABASE_URL from SUPABASE_CONNECTION_STRING'
    )
  }
  return inferred
}

function inferSupabaseUrl(connectionString: string): string | null {
  try {
    const url = new URL(connectionString)
    const username = decodeURIComponent(url.username)
    if (username.startsWith('postgres.')) {
      const projectRef = username.slice('postgres.'.length)
      if (projectRef) {
        return `https://${projectRef}.supabase.co`
      }
    }
    const host = url.hostname
    if (host.endsWith('.supabase.co')) {
      const parts = host.split('.')
      if (parts[0] === 'db' && parts.length >= 3) {
        return `https://${parts[1]}.supabase.co`
      }
      if (parts.length >= 3) {
        return `https://${parts[0]}.supabase.co`
      }
    }
    return null
  } catch {
    return null
  }
}
