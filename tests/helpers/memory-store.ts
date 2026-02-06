import type { CommunityRecord, DataStore, PostRecord } from '../../src/store/types'

type LikeRecord = {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export function createMemoryStore(): DataStore {
  const communities: CommunityRecord[] = []
  const posts: PostRecord[] = []
  const likes: LikeRecord[] = []

  return {
    async createCommunity(input) {
      const record: CommunityRecord = {
        id: crypto.randomUUID(),
        name: input.name,
        description: input.description ?? null,
        icon: input.icon ?? null,
        theme_color: input.themeColor ?? null,
        created_by: input.createdBy,
        created_at: new Date().toISOString(),
      }
      communities.push(record)
      return record
    },
    async listCommunities() {
      return [...communities].sort((a, b) =>
        a.created_at < b.created_at ? 1 : -1
      )
    },
    async getCommunityById(id) {
      return communities.find((community) => community.id === id) ?? null
    },
    async createPost(input) {
      const record: PostRecord = {
        id: crypto.randomUUID(),
        community_id: input.communityId,
        user_id: input.userId,
        content: input.content,
        image_urls: input.imageUrls ?? [],
        created_at: new Date().toISOString(),
      }
      posts.push(record)
      return record
    },
    async listPosts(params) {
      const filtered = params.communityId
        ? posts.filter((post) => post.community_id === params.communityId)
        : posts
      const sorted = [...filtered].sort((a, b) =>
        a.created_at < b.created_at ? 1 : -1
      )
      return sorted.slice(params.offset, params.offset + params.limit)
    },
    async getPostById(id) {
      return posts.find((post) => post.id === id) ?? null
    },
    async likePost(postId, userId) {
      const exists = likes.some(
        (like) => like.post_id === postId && like.user_id === userId
      )
      if (exists) {
        return 'exists'
      }
      likes.push({
        id: crypto.randomUUID(),
        post_id: postId,
        user_id: userId,
        created_at: new Date().toISOString(),
      })
      return 'created'
    },
    async unlikePost(postId, userId) {
      const index = likes.findIndex(
        (like) => like.post_id === postId && like.user_id === userId
      )
      if (index === -1) {
        return false
      }
      likes.splice(index, 1)
      return true
    },
    async countLikes(postIds) {
      const counts: Record<string, number> = {}
      for (const postId of postIds) {
        counts[postId] = likes.filter((like) => like.post_id === postId).length
      }
      return counts
    },
    async getLikedPostIds(postIds, userId) {
      const set = new Set<string>()
      for (const like of likes) {
        if (like.user_id === userId && postIds.includes(like.post_id)) {
          set.add(like.post_id)
        }
      }
      return set
    },
  }
}
