import { Hono } from 'hono'
import type { Context } from 'hono'
import { createSupabaseAuthProvider } from './auth/supabase-auth'
import type { AuthProvider } from './auth/types'
import { readJsonBody, parsePagination } from './lib/http'
import { createSupabaseClient } from './lib/supabase'
import { optionalUser, requireUser } from './middleware/auth'
import { createSupabaseStore } from './store/supabase-store'
import type { CommunityRecord, DataStore, PostRecord } from './store/types'

type AppBindings = {
  Variables: {
    user: {
      id: string
      email: string | null
    } | null
  }
}

type AppDeps = {
  store?: DataStore
  auth?: AuthProvider
}

export function createApp(deps: AppDeps = {}) {
  const app = new Hono<AppBindings>()
  const supabase = deps.store && deps.auth ? null : createSupabaseClient()
  const store = deps.store ?? createSupabaseStore(supabase!)
  const auth = deps.auth ?? createSupabaseAuthProvider(supabase!)

  app.get('/', (c) => c.json({ status: 'ok' }))
  app.get('/ping', (c) => c.text('pong!'))

  app.post('/api/auth/register', async (c) => {
    const body = await readJsonBody<{ email?: string; password?: string }>(c)
    if (!body || !isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
      return c.json({ error: 'bad_request' }, 400)
    }
    try {
      const session = await auth.signUp(body.email, body.password)
      return c.json(session)
    } catch (error) {
      return c.json({ error: 'auth_failed', message: toErrorMessage(error) }, 400)
    }
  })

  app.post('/api/auth/login', async (c) => {
    const body = await readJsonBody<{ email?: string; password?: string }>(c)
    if (!body || !isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
      return c.json({ error: 'bad_request' }, 400)
    }
    try {
      const session = await auth.signIn(body.email, body.password)
      return c.json(session)
    } catch (error) {
      return c.json({ error: 'auth_failed', message: toErrorMessage(error) }, 400)
    }
  })

  app.get('/api/communities', async (c) => {
    try {
      const communities = await store.listCommunities()
      return c.json({
        communities: communities.map(toCommunityResponse),
      })
    } catch (error) {
      return c.json({ error: 'internal_error', message: toErrorMessage(error) }, 500)
    }
  })

  app.post('/api/communities', requireUser(auth), async (c) => {
    const body = await readJsonBody<{
      name?: string
      description?: string | null
      icon?: string | null
      themeColor?: string | null
    }>(c)
    if (!body || !isNonEmptyString(body.name)) {
      return c.json({ error: 'bad_request' }, 400)
    }
    try {
      const community = await store.createCommunity({
        name: body.name.trim(),
        description: normalizeOptionalString(body.description),
        icon: normalizeOptionalString(body.icon),
        themeColor: normalizeOptionalString(body.themeColor),
        createdBy: c.get('user')!.id,
      })
      return c.json({ community: toCommunityResponse(community) })
    } catch (error) {
      return c.json({ error: 'internal_error', message: toErrorMessage(error) }, 500)
    }
  })

  app.post('/api/posts', requireUser(auth), async (c) => {
    const body = await readJsonBody<{
      communityId?: string
      content?: string
      imageUrls?: string[]
    }>(c)
    if (!body || !isNonEmptyString(body.communityId) || !isNonEmptyString(body.content)) {
      return c.json({ error: 'bad_request' }, 400)
    }
    if (body.imageUrls && !isStringArray(body.imageUrls)) {
      return c.json({ error: 'bad_request' }, 400)
    }
    try {
      const community = await store.getCommunityById(body.communityId)
      if (!community) {
        return c.json({ error: 'not_found' }, 404)
      }
      const post = await store.createPost({
        communityId: body.communityId,
        userId: c.get('user')!.id,
        content: body.content.trim(),
        imageUrls: body.imageUrls ?? [],
      })
      return c.json({
        post: toPostResponse(post, 0, false),
      })
    } catch (error) {
      return c.json({ error: 'internal_error', message: toErrorMessage(error) }, 500)
    }
  })

  const listPostsHandler = async (c: Context<AppBindings>) => {
    const pagination = parsePagination(c)
    if ('error' in pagination) {
      return c.json({ error: 'bad_request' }, 400)
    }
    const communityId = c.req.query('communityId') ?? undefined
    try {
      const posts = await store.listPosts({
        communityId: communityId || undefined,
        limit: pagination.limit,
        offset: pagination.offset,
      })
      const postIds = posts.map((post) => post.id)
      const likeCounts = await store.countLikes(postIds)
      const user = c.get('user')
      const likedIds = user
        ? await store.getLikedPostIds(postIds, user.id)
        : new Set<string>()
      return c.json({
        posts: posts.map((post) =>
          toPostResponse(post, likeCounts[post.id] ?? 0, likedIds.has(post.id))
        ),
        limit: pagination.limit,
        offset: pagination.offset,
      })
    } catch (error) {
      return c.json({ error: 'internal_error', message: toErrorMessage(error) }, 500)
    }
  }

  app.get('/api/posts', optionalUser(auth), listPostsHandler)
  app.get('/api/feed', optionalUser(auth), listPostsHandler)

  app.get('/api/posts/:id', optionalUser(auth), async (c) => {
    const postId = c.req.param('id')
    try {
      const post = await store.getPostById(postId)
      if (!post) {
        return c.json({ error: 'not_found' }, 404)
      }
      const likeCounts = await store.countLikes([postId])
      const user = c.get('user')
      const likedIds = user
        ? await store.getLikedPostIds([postId], user.id)
        : new Set<string>()
      return c.json({
        post: toPostResponse(post, likeCounts[postId] ?? 0, likedIds.has(postId)),
      })
    } catch (error) {
      return c.json({ error: 'internal_error', message: toErrorMessage(error) }, 500)
    }
  })

  app.post('/api/likes', requireUser(auth), async (c) => {
    const body = await readJsonBody<{ postId?: string }>(c)
    if (!body || !isNonEmptyString(body.postId)) {
      return c.json({ error: 'bad_request' }, 400)
    }
    try {
      const post = await store.getPostById(body.postId)
      if (!post) {
        return c.json({ error: 'not_found' }, 404)
      }
      const result = await store.likePost(body.postId, c.get('user')!.id)
      if (result === 'exists') {
        return c.json({ error: 'conflict' }, 409)
      }
      return c.json({ liked: true })
    } catch (error) {
      return c.json({ error: 'internal_error', message: toErrorMessage(error) }, 500)
    }
  })

  app.post('/api/likes/unlike', requireUser(auth), async (c) => {
    const body = await readJsonBody<{ postId?: string }>(c)
    if (!body || !isNonEmptyString(body.postId)) {
      return c.json({ error: 'bad_request' }, 400)
    }
    try {
      const post = await store.getPostById(body.postId)
      if (!post) {
        return c.json({ error: 'not_found' }, 404)
      }
      await store.unlikePost(body.postId, c.get('user')!.id)
      return c.json({ liked: false })
    } catch (error) {
      return c.json({ error: 'internal_error', message: toErrorMessage(error) }, 500)
    }
  })

  return app
}

function toCommunityResponse(record: CommunityRecord) {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    icon: record.icon,
    themeColor: record.theme_color,
    createdBy: record.created_by,
    createdAt: record.created_at,
  }
}

function toPostResponse(record: PostRecord, likeCount: number, likedByMe: boolean) {
  return {
    id: record.id,
    communityId: record.community_id,
    userId: record.user_id,
    content: record.content,
    imageUrls: record.image_urls ?? [],
    createdAt: record.created_at,
    likeCount,
    likedByMe,
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return 'unknown_error'
}
