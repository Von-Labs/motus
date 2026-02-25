import { eq, desc } from 'drizzle-orm';
import { getDb, initDatabase as initDb } from '../db/client';
import { conversations, messages, walletTransactions } from '../db/schema';
import type { Conversation, Message, WalletTransaction } from '../db/schema';

// Re-export types
export type { Conversation, Message, WalletTransaction };

// Re-export init function
export const initDatabase = initDb;

// ===== Conversations =====

export async function createConversation(
  title: string,
  model: string
): Promise<number> {
  const now = new Date();

  const result = await getDb().insert(conversations).values({
    title,
    model,
    createdAt: now,
    updatedAt: now,
  }).returning({ id: conversations.id });

  return result[0].id;
}

export async function updateConversation(
  id: number,
  title: string
): Promise<void> {
  const now = new Date();

  await getDb().update(conversations)
    .set({ title, updatedAt: now })
    .where(eq(conversations.id, id));
}

export async function deleteConversation(id: number): Promise<void> {
  await getDb().delete(conversations)
    .where(eq(conversations.id, id));
}

export async function getConversation(id: number): Promise<Conversation | null> {
  const result = await getDb().select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getAllConversations(): Promise<Conversation[]> {
  return await getDb().select()
    .from(conversations)
    .orderBy(desc(conversations.updatedAt));
}

export async function getRecentConversations(limit: number = 5): Promise<Conversation[]> {
  return await getDb().select()
    .from(conversations)
    .orderBy(desc(conversations.updatedAt))
    .limit(limit);
}

// ===== Messages =====

export async function createMessage(
  conversationId: number,
  role: 'user' | 'assistant',
  content: string,
  toolingSteps?: Array<{ icon: string; text: string }>
): Promise<number> {
  const now = new Date();
  const toolingStepsJson = toolingSteps ? JSON.stringify(toolingSteps) : null;

  const result = await getDb().insert(messages).values({
    conversationId,
    role,
    content,
    toolingSteps: toolingStepsJson,
    createdAt: now,
  }).returning({ id: messages.id });

  // Update conversation's updatedAt timestamp
  await getDb().update(conversations)
    .set({ updatedAt: now })
    .where(eq(conversations.id, conversationId));

  return result[0].id;
}

export async function getMessages(conversationId: number): Promise<Message[]> {
  return await getDb().select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

// ===== Utility Functions =====

export async function clearAllData(): Promise<void> {
  await getDb().delete(messages);
  await getDb().delete(conversations);
}

export function generateConversationTitle(firstMessage: string): string {
  const maxLength = 50;
  const trimmed = firstMessage.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return trimmed.substring(0, maxLength - 3) + '...';
}

// Debug function to log all data
export async function debugDatabase(): Promise<void> {
  console.log('🔍 === DATABASE DEBUG ===');

  const allConvs = await getAllConversations();
  console.log('📊 Total Conversations:', allConvs.length);
  allConvs.forEach(conv => {
    console.log(`  - [${conv.id}] ${conv.title} (${conv.model})`);
  });

  for (const conv of allConvs) {
    const msgs = await getMessages(conv.id);
    console.log(`\n💬 Conversation ${conv.id} - ${msgs.length} messages:`);
    msgs.forEach(msg => {
      console.log(`  - [${msg.role}]: ${msg.content.substring(0, 50)}...`);
    });
  }

  const txs = await getAllWalletTransactions();
  console.log(`\n💰 Total Transactions: ${txs.length}`);

  console.log('🔍 === END DEBUG ===');
}

// ===== Wallet Transactions =====

export async function createWalletTransaction(
  type:
    | 'swap'
    | 'trigger_order'
    | 'cancel_order'
    | 'send'
    | 'drift_market_order'
    | 'drift_limit_order'
    | 'drift_stop_loss'
    | 'drift_take_profit'
    | 'drift_close_position'
    | 'drift_cancel_order'
    | 'drift_other',
  signature: string,
  status: 'success' | 'failed',
  details: any,
  signer?: 'hot_wallet' | 'main_wallet'
): Promise<number> {
  const now = new Date();
  const detailsJson = JSON.stringify(details);

  const result = await getDb().insert(walletTransactions).values({
    type,
    signature,
    status,
    details: detailsJson,
    signer: signer ?? null,
    createdAt: now,
  }).returning({ id: walletTransactions.id });

  return result[0].id;
}

export async function getAllWalletTransactions(): Promise<WalletTransaction[]> {
  return await getDb().select()
    .from(walletTransactions)
    .orderBy(desc(walletTransactions.createdAt));
}

export async function getWalletTransactionById(id: number): Promise<WalletTransaction | null> {
  const result = await getDb().select()
    .from(walletTransactions)
    .where(eq(walletTransactions.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getRecentWalletTransactions(limit: number = 10): Promise<WalletTransaction[]> {
  return await getDb().select()
    .from(walletTransactions)
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit);
}

export async function deleteWalletTransaction(id: number): Promise<void> {
  await getDb().delete(walletTransactions)
    .where(eq(walletTransactions.id, id));
}
