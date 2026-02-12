import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync } from 'expo-sqlite';
import * as schema from './schema';

// Open SQLite database
let expoDb: any = null;
let drizzleDb: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

// Async initialization
export async function initDrizzle() {
  // If already initialized, return existing instance
  if (drizzleDb) {
    return drizzleDb;
  }

  // If currently initializing, wait for that to complete
  if (isInitializing && initPromise) {
    return initPromise;
  }

  // Start initialization
  isInitializing = true;
  initPromise = (async () => {
    try {
      expoDb = await openDatabaseAsync('defi-agent.db');
      drizzleDb = drizzle(expoDb, { schema });
      return drizzleDb;
    } finally {
      isInitializing = false;
    }
  })();

  return initPromise;
}

// Export db getter
export const getDb = () => {
  if (!drizzleDb) {
    throw new Error('Database not initialized. Call initDrizzle() first.');
  }
  return drizzleDb;
};

// Track if database tables have been initialized
let tablesInitialized = false;

// Initialize database tables
export async function initDatabase() {
  // Prevent duplicate initialization
  if (tablesInitialized) {
    return;
  }

  try {

    // Initialize Drizzle first
    await initDrizzle();

    // Create conversations table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        model TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);

    // Create messages table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversationId INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        toolingSteps TEXT,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (conversationId) REFERENCES conversations (id) ON DELETE CASCADE
      );
    `);

    // Create index for faster queries
    await expoDb.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation
      ON messages (conversationId);
    `);

    // Create wallet transactions table
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        signature TEXT NOT NULL,
        status TEXT NOT NULL,
        details TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );
    `);

    // Create index for wallet transactions
    await expoDb.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created
      ON wallet_transactions (createdAt DESC);
    `);

    tablesInitialized = true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}
