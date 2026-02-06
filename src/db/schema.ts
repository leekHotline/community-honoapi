import { desc, sql } from 'drizzle-orm'
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const communities = pgTable('communities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),
  themeColor: text('theme_color'),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    communityId: uuid('community_id')
      .notNull()
      .references(() => communities.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    content: text('content').notNull(),
    imageUrls: text('image_urls')
      .array()
      .notNull()
      .default(sql`'{}'`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    communityCreatedAtIdx: index('idx_posts_community_created_at').on(
      table.communityId,
      desc(table.createdAt)
    ),
    createdAtIdx: index('idx_posts_created_at').on(desc(table.createdAt)),
  })
)

export const likes = pgTable(
  'likes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    postIdx: index('idx_likes_post').on(table.postId),
    userIdx: index('idx_likes_user').on(table.userId),
    postUserUnique: uniqueIndex('likes_post_user_unique').on(
      table.postId,
      table.userId
    ),
  })
)
