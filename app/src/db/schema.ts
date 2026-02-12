import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Conversations table
export const conversations = sqliteTable('conversations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  model: text('model').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
});

// Messages table
export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  conversationId: integer('conversationId')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  toolingSteps: text('toolingSteps'), // JSON string
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
});

// Wallet transactions table
export const walletTransactions = sqliteTable('wallet_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: ['swap', 'trigger_order', 'cancel_order'] }).notNull(),
  signature: text('signature').notNull(),
  status: text('status', { enum: ['success', 'failed'] }).notNull(),
  details: text('details').notNull(), // JSON string with transaction details
  createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
});

// Export types
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type NewWalletTransaction = typeof walletTransactions.$inferInsert;
