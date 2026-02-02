# Hobby Community Kit - Backend Design (MVP)

Date: 2026-02-02

## Summary
The MVP backend delivers a reusable community template with posts, likes, and a feed. It uses Hono on Bun, Supabase Postgres for data, and Supabase Auth for email+password login. The API is intentionally thin and stable so it can serve both the template product (phase 1) and the platform product (phase 2).

## Goals
- Ship a minimal, production-ready API for communities, posts, likes, and feed
- Keep authentication simple: Supabase Auth via backend proxy endpoints
- Support Expo clients with clear request/response shapes
- Enable future platform expansion without breaking MVP routes

## Non-goals
- Advanced social features (comments, notifications, search)
- Complex moderation, paid communities, or recommendation systems
- RLS policy hardening (deferred to later phase)

## Architecture
- Client: Expo (iOS/Android/Web) using fetch
- API: Hono (Bun runtime)
- DB: Supabase Postgres
- Auth: Supabase Auth (email/password), token verification in API
- Storage: Supabase Storage, direct upload from client, API stores image URLs

## Auth Flow
1) Client calls POST /api/auth/register or /api/auth/login
2) API proxies to Supabase Auth, returns access_token
3) Client sends Authorization: Bearer <token> on protected routes
4) API verifies token via supabase.auth.getUser()

## Data Model (MVP)
Tables use uuid PKs, created_at defaults to now().
- communities: id, name, description, icon, theme_color, created_by, created_at
- posts: id, community_id, user_id, content, image_urls (text[]), created_at
- likes: id, post_id, user_id, created_at (unique on post_id + user_id)

## API Endpoints (MVP)
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/communities
- POST /api/communities
- GET  /api/posts?communityId=&limit=&offset=
- GET  /api/posts/:id
- POST /api/posts
- POST /api/likes
- POST /api/likes/unlike
- GET  /api/feed?communityId=&limit=&offset=

## Error Handling
- 400 bad_request for invalid input
- 401 unauthorized for missing/invalid token
- 404 not_found for missing resources
- 409 conflict for duplicate like
- 500 internal_error for unexpected failures

## Testing Strategy
- Vitest request-level tests using app.request()
- Auth mocked in tests for predictable user id
- Repository-level tests for query behavior (limit/offset, filters)
- Coverage: create community, create post, like/unlike, feed listing

## Rollout Notes
- RLS disabled for MVP; API uses Service Role key
- Move to RLS and per-user policies in phase 2
- Add comments, notifications, and search after MVP stability
