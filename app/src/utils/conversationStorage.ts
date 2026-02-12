import {
  createConversation,
  createMessage,
  getMessages,
  getConversation,
  generateConversationTitle,
  Conversation,
  Message,
} from './database';

export interface ChatMessage {
  user: string;
  assistant?: string;
  toolingSteps?: Array<{ icon: string; text: string }>;
}

/**
 * Save a complete conversation with its messages
 */
export async function saveConversation(
  conversationId: number | null,
  messages: ChatMessage[],
  model: string
): Promise<number> {
  try {
    let convId = conversationId;

    // Create new conversation if doesn't exist
    if (!convId && messages.length > 0) {
      const title = generateConversationTitle(messages[0].user);
      convId = await createConversation(title, model);
    }

    if (!convId) {
      throw new Error('Failed to create conversation');
    }

    // Get existing messages to avoid duplicates
    const existingMessages = await getMessages(convId);
    const existingCount = existingMessages.length;

    // Only save new messages (skip already saved ones)
    const newMessages = messages.slice(existingCount);

    for (const msg of newMessages) {
      // Save user message
      await createMessage(convId, 'user', msg.user);

      // Save assistant message if exists
      if (msg.assistant) {
        await createMessage(convId, 'assistant', msg.assistant, msg.toolingSteps);
      }
    }

    return convId;
  } catch (error) {
    console.error('Failed to save conversation:', error);
    throw error;
  }
}

/**
 * Load a conversation with all its messages
 */
export async function loadConversation(
  conversationId: number
): Promise<{ conversation: Conversation; messages: ChatMessage[] }> {
  try {
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const dbMessages = await getMessages(conversationId);

    // Convert database messages to chat messages format
    const chatMessages: ChatMessage[] = [];
    let currentUserMessage: string | null = null;

    for (const msg of dbMessages) {
      if (msg.role === 'user') {
        currentUserMessage = msg.content;
      } else if (msg.role === 'assistant' && currentUserMessage) {
        const toolingSteps = msg.toolingSteps
          ? JSON.parse(msg.toolingSteps)
          : undefined;

        chatMessages.push({
          user: currentUserMessage,
          assistant: msg.content,
          toolingSteps,
        });

        currentUserMessage = null;
      }
    }

    // Handle case where last message is a user message without response
    if (currentUserMessage) {
      chatMessages.push({
        user: currentUserMessage,
      });
    }

    return {
      conversation,
      messages: chatMessages,
    };
  } catch (error) {
    console.error('Failed to load conversation:', error);
    throw error;
  }
}

/**
 * Update last assistant message in conversation (for streaming updates)
 */
export async function updateLastAssistantMessage(
  conversationId: number,
  content: string,
  toolingSteps?: Array<{ icon: string; text: string }>
): Promise<void> {
  try {
    const messages = await getMessages(conversationId);
    const lastMessage = messages[messages.length - 1];

    if (lastMessage && lastMessage.role === 'assistant') {
      // Update existing message
      // Note: We need to add an update function to database.ts
      // For now, we'll skip this - messages are saved after completion
    }
  } catch (error) {
    console.error('Failed to update last message:', error);
  }
}
