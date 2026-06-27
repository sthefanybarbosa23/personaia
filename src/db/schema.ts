import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, doublePrecision } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  username: text('username'),
  email: text('email').notNull(),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  joinedDate: timestamp('joined_date').defaultNow(),
});

export const characters = pgTable('characters', {
  id: serial('id').primaryKey(),
  charId: text('char_id').notNull().unique(), // e.g., 'char-nova9'
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  avatarUrl: text('avatar_url').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  initialMessage: text('initial_message').notNull(),
  category: text('category').notNull(), 
  creatorId: integer('creator_id').references(() => users.id),
  isCustom: boolean('is_custom').default(false).notNull(),
  chatsCount: integer('chats_count').default(0).notNull(),
  rating: doublePrecision('rating').default(5.0).notNull(),
  bannerUrl: text('banner_url'),
  isPublic: boolean('is_public').default(true).notNull(),
  tags: text('tags'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  characterId: integer('character_id').references(() => characters.id).notNull(),
  sender: text('sender').notNull(), // 'user' | 'bot'
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  characters: many(characters),
  messages: many(messages),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  creator: one(users, {
    fields: [characters.creatorId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  character: one(characters, {
    fields: [messages.characterId],
    references: [characters.id],
  }),
}));

export const memories = pgTable('memories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  characterId: integer('character_id').references(() => characters.id).notNull(),
  userMemory: text('user_memory').default('').notNull(),
  characterMemory: text('character_memory').default('').notNull(),
  conversationSummary: text('conversation_summary').default('').notNull(),
  relationshipStatus: text('relationship_status').default('Stranger').notNull(),
  relationshipScore: integer('relationship_score').default(0).notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

export const memoriesRelations = relations(memories, ({ one }) => ({
  user: one(users, {
    fields: [memories.userId],
    references: [users.id],
  }),
  character: one(characters, {
    fields: [memories.characterId],
    references: [characters.id],
  }),
}));
