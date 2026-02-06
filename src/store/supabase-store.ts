import type { SupabaseClient } from '@supabase/supabase-js'
import type { CommunityRecord, DataStore, PostRecord } from './types'

export function createSupabaseStore(client: SupabaseClient): DataStore {
  return {
    async createCommunity(input) {
      const { data, error } = await client
        .from('communities')
        .insert({
          name: input.name,
          description: input.description ?? null,
          icon: input.icon ?? null,
          theme_color: input.themeColor ?? null,
          created_by: input.createdBy,
        })
        .select('*')
        .single()
      if (error || !data) {
        throw error ?? new Error('failed_to_create_community')
      }
      return data as CommunityRecord
    },
    async listCommunities() {
      const { data, error } = await client
        .from('communities')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        throw error
      }
      return (data ?? []) as CommunityRecord[]
    },
    async getCommunityById(id) {
      const { data, error } = await client
        .from('communities')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) {
        throw error
      }
      return (data ?? null) as CommunityRecord | null
    },
    async createPost(input) {
      const { data, error } = await client
        .from('posts')
        .insert({
          community_id: input.communityId,
          user_id: input.userId,
          content: input.content,
          image_urls: input.imageUrls ?? [],
        })
        .select('*')
        .single()
      if (error || !data) {
        throw error ?? new Error('failed_to_create_post')
      }
      return data as PostRecord
    },
    async listPosts(params) {
      const to = params.offset + params.limit - 1
      let query = client
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(params.offset, to)
      if (params.communityId) {
        query = query.eq('community_id', params.communityId)
      }
      const { data, error } = await query
      if (error) {
        throw error
      }
      return (data ?? []) as PostRecord[]
    },
    async getPostById(id) {
      const { data, error } = await client
        .from('posts')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (error) {
        throw error
      }
      return (data ?? null) as PostRecord | null
    },
    async likePost(postId, userId) {
      const { error } = await client
        .from('likes')
        .insert({ post_id: postId, user_id: userId })
        .select('id')
        .single()
      if (error) {
        if (error.code === '23505') {
          return 'exists'
        }
        throw error
      }
      return 'created'
    },
    async unlikePost(postId, userId) {
      const { data, error } = await client
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId)
        .select('id')
      if (error) {
        throw error
      }
      return (data ?? []).length > 0
    },
    async countLikes(postIds) {
      if (postIds.length === 0) {
        return {}
      }
      const { data, error } = await client
        .from('likes')
        .select('post_id, count:count()')
        .in('post_id', postIds)
      if (error) {
        throw error
      }
      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        const postId = (row as { post_id: string }).post_id
        const countValue = Number((row as { count: number }).count ?? 0)
        counts[postId] = countValue
      }
      return counts
    },
    async getLikedPostIds(postIds, userId) {
      if (postIds.length === 0) {
        return new Set()
      }
      const { data, error } = await client
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds)
      if (error) {
        throw error
      }
      const ids = new Set<string>()
      for (const row of data ?? []) {
        ids.add((row as { post_id: string }).post_id)
      }
      return ids
    },
  }
}
