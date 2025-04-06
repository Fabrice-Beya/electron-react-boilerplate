import { Conversation } from '../../types';
import { IConversationsService, ConversationResult, ConversationsResult, DeleteResult } from '../interfaces/IConversationsService';
import { SupabaseClientWrapper } from './SupabaseClient';

export class SupabaseConversationsService implements IConversationsService {
  private supabase = SupabaseClientWrapper.getInstance().getClient();

  /**
   * Get all conversations for a user
   * @param userId The user ID
   * @returns Promise with conversations result
   */
  async getConversations(userId: string): Promise<ConversationsResult> {
    try {
      // Get conversations from the database
      const { data, error } = await this.supabase
        .from('conversations')
        .select(`
          id,
          userId,
          title,
          context,
          contextType,
          contextReference,
          provider,
          model,
          isArchived,
          createdAt,
          updatedAt
        `)
        .eq('userId', userId)
        .order('updatedAt', { ascending: false });

      if (error) throw error;

      // For each conversation, get its messages
      const conversationsWithMessages = await Promise.all(
        data.map(async (conversation) => {
          const { data: messages, error: messagesError } = await this.supabase
            .from('messages')
            .select('*')
            .eq('conversationId', conversation.id)
            .order('createdAt', { ascending: true });

          if (messagesError) throw messagesError;

          return {
            ...conversation,
            messages: messages || []
          } as Conversation;
        })
      );

      return {
        data: conversationsWithMessages,
        error: null
      };
    } catch (error: any) {
      console.error('Error getting conversations:', error.message);
      return {
        data: [],
        error: new Error(error.message || 'Failed to get conversations')
      };
    }
  }

  /**
   * Get a specific conversation with its messages
   * @param id The conversation ID
   * @returns Promise with conversation result
   */
  async getConversation(id: string): Promise<ConversationResult> {
    try {
      // Get the conversation
      const { data: conversation, error } = await this.supabase
        .from('conversations')
        .select(`
          id,
          userId,
          title,
          context,
          contextType,
          contextReference,
          provider,
          model,
          isArchived,
          createdAt,
          updatedAt
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      // Get the messages for this conversation
      const { data: messages, error: messagesError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversationId', id)
        .order('createdAt', { ascending: true });

      if (messagesError) throw messagesError;

      // Combine conversation with messages
      const conversationWithMessages: Conversation = {
        ...conversation,
        messages: messages || []
      };

      return {
        data: conversationWithMessages,
        error: null
      };
    } catch (error: any) {
      console.error('Error getting conversation:', error.message);
      return {
        data: null,
        error: new Error(error.message || 'Failed to get conversation')
      };
    }
  }

  /**
   * Create a new conversation
   * @param conversation The conversation data
   * @returns Promise with conversation result
   */
  async createConversation(
    conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'messages'>
  ): Promise<ConversationResult> {
    try {
      // Insert the conversation
      const { data, error } = await this.supabase
        .from('conversations')
        .insert({
          userId: conversation.userId,
          title: conversation.title,
          context: conversation.context,
          contextType: conversation.contextType,
          contextReference: conversation.contextReference,
          provider: conversation.provider,
          model: conversation.model,
          isArchived: conversation.isArchived || false
        })
        .select()
        .single();

      if (error) throw error;

      // Return the created conversation with empty messages array
      return {
        data: {
          ...data,
          messages: []
        } as Conversation,
        error: null
      };
    } catch (error: any) {
      console.error('Error creating conversation:', error.message);
      return {
        data: null,
        error: new Error(error.message || 'Failed to create conversation')
      };
    }
  }

  /**
   * Update conversation details
   * @param conversationId The conversation ID
   * @param conversationData The data to update
   * @returns Promise with conversation result
   */
  async updateConversation(
    conversationId: string,
    conversationData: Partial<{
      title: string;
      context: string | null;
      contextType: string | null;
      contextReference: string | null;
      isArchived: boolean;
    }>
  ): Promise<ConversationResult> {
    try {
      // Update the conversation
      const { data, error } = await this.supabase
        .from('conversations')
        .update({
          ...conversationData,
          updatedAt: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;

      // Get the messages for this conversation
      const { data: messages, error: messagesError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversationId', conversationId)
        .order('createdAt', { ascending: true });

      if (messagesError) throw messagesError;

      // Combine conversation with messages
      const conversationWithMessages: Conversation = {
        ...data,
        messages: messages || []
      };

      return {
        data: conversationWithMessages,
        error: null
      };
    } catch (error: any) {
      console.error('Error updating conversation:', error.message);
      return {
        data: null,
        error: new Error(error.message || 'Failed to update conversation')
      };
    }
  }

  /**
   * Delete a conversation and all its messages
   * @param id The conversation ID
   * @returns Promise with delete result
   */
  async deleteConversation(id: string): Promise<DeleteResult> {
    try {
      // Delete the conversation (messages will be deleted via cascade)
      const { error } = await this.supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        error: null
      };
    } catch (error: any) {
      console.error('Error deleting conversation:', error.message);
      return {
        success: false,
        error: new Error(error.message || 'Failed to delete conversation')
      };
    }
  }

  /**
   * Archive a conversation (convenience method)
   * @param id The conversation ID
   * @returns Promise with conversation result
   */
  async archiveConversation(id: string): Promise<ConversationResult> {
    return this.updateConversation(id, { isArchived: true });
  }

  /**
   * Search conversations by title or content
   * @param userId The user ID
   * @param searchQuery The search query
   * @returns Promise with conversations result
   */
  async searchConversations(userId: string, searchQuery: string): Promise<ConversationsResult> {
    try {
      // Search conversations by title
      const { data, error } = await this.supabase
        .from('conversations')
        .select(`
          id,
          userId,
          title,
          context,
          contextType,
          contextReference,
          provider,
          model,
          isArchived,
          createdAt,
          updatedAt
        `)
        .eq('userId', userId)
        .ilike('title', `%${searchQuery}%`)
        .order('updatedAt', { ascending: false });

      if (error) throw error;

      // For each conversation, get its messages
      const conversationsWithMessages = await Promise.all(
        data.map(async (conversation) => {
          const { data: messages, error: messagesError } = await this.supabase
            .from('messages')
            .select('*')
            .eq('conversationId', conversation.id)
            .order('createdAt', { ascending: true });

          if (messagesError) throw messagesError;

          return {
            ...conversation,
            messages: messages || []
          } as Conversation;
        })
      );

      // Also search in message content
      const { data: messageMatches, error: messageError } = await this.supabase
        .from('messages')
        .select(`
          conversationId
        `)
        .eq('author', 'user')
        .ilike('content', `%${searchQuery}%`);

      if (messageError) throw messageError;

      // Get unique conversation IDs from message matches
      const conversationIds = [...new Set(messageMatches.map(m => m.conversationId))];

      // Get conversations from message matches that aren't already in the results
      const existingIds = conversationsWithMessages.map(c => c.id);
      const additionalIds = conversationIds.filter(id => !existingIds.includes(id));

      if (additionalIds.length > 0) {
        const { data: additionalConversations, error: additionalError } = await this.supabase
          .from('conversations')
          .select(`
            id,
            userId,
            title,
            context,
            contextType,
            contextReference,
            provider,
            model,
            isArchived,
            createdAt,
            updatedAt
          `)
          .eq('userId', userId)
          .in('id', additionalIds)
          .order('updatedAt', { ascending: false });

        if (additionalError) throw additionalError;

        // For each additional conversation, get its messages
        const additionalWithMessages = await Promise.all(
          additionalConversations.map(async (conversation) => {
            const { data: messages, error: messagesError } = await this.supabase
              .from('messages')
              .select('*')
              .eq('conversationId', conversation.id)
              .order('createdAt', { ascending: true });

            if (messagesError) throw messagesError;

            return {
              ...conversation,
              messages: messages || []
            } as Conversation;
          })
        );

        // Combine results
        conversationsWithMessages.push(...additionalWithMessages);
      }

      return {
        data: conversationsWithMessages,
        error: null
      };
    } catch (error: any) {
      console.error('Error searching conversations:', error.message);
      return {
        data: [],
        error: new Error(error.message || 'Failed to search conversations')
      };
    }
  }

  /**
   * Get a conversation by entry ID
   * @param userId The user ID
   * @param entryId The entry ID
   * @returns Promise with conversation result
   */
  async getConversationByEntryId(userId: string, entryId: string): Promise<ConversationResult> {
    try {
      // Get the conversation for this entry
      const { data, error } = await this.supabase
        .from('conversations')
        .select(`
          id,
          userId,
          title,
          context,
          contextType,
          contextReference,
          provider,
          model,
          isArchived,
          createdAt,
          updatedAt
        `)
        .eq('userId', userId)
        .eq('contextType', 'entries')
        .eq('contextReference', entryId)
        .single();

      if (error) {
        // If no conversation found, return null without error
        if (error.code === 'PGRST116') {
          return {
            data: null,
            error: null
          };
        }
        throw error;
      }

      // Get the messages for this conversation
      const { data: messages, error: messagesError } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversationId', data.id)
        .order('createdAt', { ascending: true });

      if (messagesError) throw messagesError;

      // Combine conversation with messages
      const conversationWithMessages: Conversation = {
        ...data,
        messages: messages || []
      };

      return {
        data: conversationWithMessages,
        error: null
      };
    } catch (error: any) {
      console.error('Error getting conversation by entry ID:', error.message);
      return {
        data: null,
        error: new Error(error.message || 'Failed to get conversation for entry')
      };
    }
  }
} 