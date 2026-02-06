export type CommunityRecord = {
  id: string
  name: string
  description: string | null
  icon: string | null
  theme_color: string | null
  created_by: string
  created_at: string
}

export type PostRecord = {
  id: string
  community_id: string
  user_id: string
  content: string
  image_urls: string[]
  created_at: string
}

export interface DataStore {
  createCommunity(input: {
    name: string
    description?: string | null
    icon?: string | null
    themeColor?: string | null
    createdBy: string
  }): Promise<CommunityRecord>
  listCommunities(): Promise<CommunityRecord[]>
  getCommunityById(id: string): Promise<CommunityRecord | null>
  createPost(input: {
    communityId: string
    userId: string
    content: string
    imageUrls: string[]
  }): Promise<PostRecord>
  listPosts(params: {
    communityId?: string
    limit: number
    offset: number
  }): Promise<PostRecord[]>
  getPostById(id: string): Promise<PostRecord | null>
  likePost(postId: string, userId: string): Promise<'created' | 'exists'>
  unlikePost(postId: string, userId: string): Promise<boolean>
  countLikes(postIds: string[]): Promise<Record<string, number>>
  getLikedPostIds(postIds: string[], userId: string): Promise<Set<string>>
}
