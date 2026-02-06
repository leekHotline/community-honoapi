# Hobby Community Kit API (MVP)

Base URL: `http://localhost:3000`

## Headers
- `Content-Type: application/json`
- `Authorization: Bearer <access_token>` (required for protected routes)

## Auth
### POST /api/auth/register
Request:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
Response:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 3600,
  "tokenType": "bearer",
  "user": { "id": "...", "email": "user@example.com" }
}
```

### POST /api/auth/login
Request/Response are the same as register.

## Communities
### GET /api/communities
Response:
```json
{
  "communities": [
    {
      "id": "...",
      "name": "Hiking",
      "description": "Hiking lovers",
      "icon": null,
      "themeColor": "#22c55e",
      "createdBy": "...",
      "createdAt": "2026-02-02T12:00:00.000Z"
    }
  ]
}
```

### POST /api/communities (protected)
Request:
```json
{
  "name": "Hiking",
  "description": "Hiking lovers",
  "icon": null,
  "themeColor": "#22c55e"
}
```
Response:
```json
{ "community": { "...": "..." } }
```

## Posts
### POST /api/posts (protected)
Request:
```json
{
  "communityId": "...",
  "content": "New trail this weekend!",
  "imageUrls": [
    "https://<project>.supabase.co/storage/v1/object/public/community/1.png"
  ]
}
```
Response:
```json
{
  "post": {
    "id": "...",
    "communityId": "...",
    "userId": "...",
    "content": "New trail this weekend!",
    "imageUrls": [],
    "createdAt": "2026-02-02T12:00:00.000Z",
    "likeCount": 0,
    "likedByMe": false
  }
}
```

### GET /api/posts
Query params:
- `communityId` (optional)
- `limit` (optional, default 20, max 50)
- `offset` (optional, default 0)

Note: If `Authorization` is provided, `likedByMe` is computed. Otherwise it is `false`.

Response:
```json
{
  "posts": [
    {
      "id": "...",
      "communityId": "...",
      "userId": "...",
      "content": "...",
      "imageUrls": [],
      "createdAt": "...",
      "likeCount": 3,
      "likedByMe": false
    }
  ],
  "limit": 20,
  "offset": 0
}
```

### GET /api/posts/:id
Response:
```json
{ "post": { "...": "..." } }
```

### GET /api/feed
Same as `GET /api/posts`.

## Likes
### POST /api/likes (protected)
Request:
```json
{ "postId": "..." }
```
Response:
```json
{ "liked": true }
```

### POST /api/likes/unlike (protected)
Request:
```json
{ "postId": "..." }
```
Response:
```json
{ "liked": false }
```

## Errors
- `400 { "error": "bad_request" }`
- `401 { "error": "unauthorized" }`
- `404 { "error": "not_found" }`
- `409 { "error": "conflict" }`
- `500 { "error": "internal_error" }`

## Storage Note
Images are uploaded from the Expo client directly to Supabase Storage.
The API only stores `imageUrls` in the `posts` table.
