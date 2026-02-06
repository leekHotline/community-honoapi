import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { createFakeAuthProvider } from './helpers/fake-auth'
import { createMemoryStore } from './helpers/memory-store'

function jsonHeaders(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

async function register(app: ReturnType<typeof createApp>, email: string, password: string) {
  const res = await app.request('/api/auth/register', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  return { res, data }
}

describe('Hobby Community Kit API', () => {
  it('registers and logs in', async () => {
    const app = createApp({
      store: createMemoryStore(),
      auth: createFakeAuthProvider(),
    })

    const registerResult = await register(app, 'user@example.com', 'pass123')
    expect(registerResult.res.status).toBe(200)
    expect(registerResult.data.accessToken).toBeTruthy()

    const loginRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email: 'user@example.com', password: 'pass123' }),
    })
    const loginData = await loginRes.json()
    expect(loginRes.status).toBe(200)
    expect(loginData.accessToken).toBeTruthy()
  })

  it('blocks protected routes without auth', async () => {
    const app = createApp({
      store: createMemoryStore(),
      auth: createFakeAuthProvider(),
    })

    const res = await app.request('/api/communities', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ name: 'Hiking' }),
    })
    expect(res.status).toBe(401)
  })

  it('creates community, post, and lists feed', async () => {
    const app = createApp({
      store: createMemoryStore(),
      auth: createFakeAuthProvider(),
    })

    const { data: regData } = await register(app, 'user2@example.com', 'pass123')
    const token = regData.accessToken as string

    const communityRes = await app.request('/api/communities', {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({ name: 'Hiking', themeColor: '#22c55e' }),
    })
    expect(communityRes.status).toBe(200)
    const communityData = await communityRes.json()
    const communityId = communityData.community.id as string

    const postRes = await app.request('/api/posts', {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({
        communityId,
        content: 'Trail this weekend',
        imageUrls: [],
      }),
    })
    expect(postRes.status).toBe(200)

    const feedRes = await app.request(`/api/feed?communityId=${communityId}`)
    expect(feedRes.status).toBe(200)
    const feedData = await feedRes.json()
    expect(feedData.posts.length).toBe(1)
  })

  it('likes and unlikes a post', async () => {
    const app = createApp({
      store: createMemoryStore(),
      auth: createFakeAuthProvider(),
    })

    const { data: regData } = await register(app, 'user3@example.com', 'pass123')
    const token = regData.accessToken as string

    const communityRes = await app.request('/api/communities', {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({ name: 'Running' }),
    })
    const communityData = await communityRes.json()

    const postRes = await app.request('/api/posts', {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({
        communityId: communityData.community.id,
        content: 'Morning run',
      }),
    })
    const postData = await postRes.json()

    const likeRes = await app.request('/api/likes', {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({ postId: postData.post.id }),
    })
    expect(likeRes.status).toBe(200)

    const duplicateLike = await app.request('/api/likes', {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({ postId: postData.post.id }),
    })
    expect(duplicateLike.status).toBe(409)

    const unlikeRes = await app.request('/api/likes/unlike', {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify({ postId: postData.post.id }),
    })
    expect(unlikeRes.status).toBe(200)

    const detailRes = await app.request(`/api/posts/${postData.post.id}`, {
      headers: jsonHeaders(token),
    })
    const detailData = await detailRes.json()
    expect(detailData.post.likeCount).toBe(0)
    expect(detailData.post.likedByMe).toBe(false)
  })
})
