import type { Context } from 'hono'

export async function readJsonBody<T>(c: Context): Promise<T | null> {
  try {
    return (await c.req.json()) as T
  } catch {
    return null
  }
}

export function parsePagination(c: Context) {
  const limitRaw = c.req.query('limit') ?? '20'
  const offsetRaw = c.req.query('offset') ?? '0'
  const limit = Number.parseInt(limitRaw, 10)
  const offset = Number.parseInt(offsetRaw, 10)
  if (!Number.isFinite(limit) || !Number.isFinite(offset)) {
    return { error: 'bad_request' as const }
  }
  const safeLimit = Math.min(Math.max(limit, 1), 50)
  const safeOffset = Math.max(offset, 0)
  return { limit: safeLimit, offset: safeOffset }
}
