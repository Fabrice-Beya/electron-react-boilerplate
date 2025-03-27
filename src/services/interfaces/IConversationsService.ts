import { Conversation } from "../../types";

export interface ConversationResult {
  data: Conversation | null;
  error: Error | null;
}

export interface ConversationsResult {
  data: Conversation[];
  error: Error | null;
}

export interface DeleteResult {
  success: boolean;
  error: Error | null;
}

export interface IConversationsService {
  // Get all conversations for a user
  getConversations(userId: string): Promise<ConversationsResult>;

  // Get a conversation for a specific entry
  getConversationByEntryId(userId: string, entryId: string): Promise<ConversationResult>;
  
  // Get a specific conversation with its messages
  getConversation(id: string): Promise<ConversationResult>;
  
  // Create a new conversation
  createConversation(
    conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'messages'>,
  ): Promise<ConversationResult>;
  
  // Update conversation details (title, isArchived, etc.)
  updateConversation(
    conversationId: string,
    conversationData: Partial<{
      title: string;
      context: string | null;
      contextType: string | null;
      contextReference: string | null;
      isArchived: boolean;
    }>
  ): Promise<ConversationResult>;
  
  // Delete a conversation and all its messages
  deleteConversation(id: string): Promise<DeleteResult>;
  
  // Archive a conversation (convenience method)
  archiveConversation(id: string): Promise<ConversationResult>;
  
  // Search conversations by title or content
  searchConversations(userId: string, searchQuery: string): Promise<ConversationsResult>;
} 