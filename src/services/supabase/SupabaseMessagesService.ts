import { Message } from '../../types';
import { IMessagesService, MessageResult, MessagesResult, DeleteResult } from '../interfaces/IMessagesService';
import { SupabaseClientWrapper } from './SupabaseClient';

export class SupabaseMessagesService implements IMessagesService {
  private supabase = SupabaseClientWrapper.getInstance().getClient();

  /**
   * Get all messages for a conversation
   * @param conversationId The conversation ID
   * @returns Promise with messages result
   */
  async getMessages(conversationId: string): Promise<MessagesResult> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversationId', conversationId)
        .order('createdAt', { ascending: true });

      if (error) throw error;

      return {
        data: data || [],
        error: null
      };
    } catch (error: any) {
      console.error('Error getting messages:', error.message);
      return {
        data: [],
        error: new Error(error.message || 'Failed to get messages')
      };
    }
  }

  /**
   * Get a specific message
   * @param id The message ID
   * @returns Promise with message result
   */
  async getMessage(id: string): Promise<MessageResult> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data,
        error: null
      };
    } catch (error: any) {
      console.error('Error getting message:', error.message);
      return {
        data: null,
        error: new Error(error.message || 'Failed to get message')
      };
    }
  }

  /**
   * Create a new message
   * @param message The message data
   * @returns Promise with message result
   */
  async createMessage(
    message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MessageResult> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          author: message.author,
          content: message.content,
          conversationId: message.conversationId,
          isLiked: message.isLiked || false,
          metadata: message.metadata || null
        })
        .select()
        .single();

      if (error) throw error;

      // Update the conversation's updatedAt timestamp
      await this.supabase
        .from('conversations')
        .update({ updatedAt: new Date().toISOString() })
        .eq('id', message.conversationId);

      return {
        data,
        error: null
      };
    } catch (error: any) {
      console.error('Error creating message:', error.message);
      return {
        data: null,
        error: new Error(error.message || 'Failed to create message')
      };
    }
  }

  /**
   * Update a message
   * @param messageId The message ID
   * @param messageData The data to update
   * @returns Promise with message result
   */
  async updateMessage(
    messageId: string,
    messageData: Partial<{
      content: string;
      isLiked: boolean;
      metadata: any;
    }>
  ): Promise<MessageResult> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .update({
          ...messageData,
          updatedAt: new Date().toISOString()
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        error: null
      };
    } catch (error: any) {
      console.error('Error updating message:', error.message);
      return {
        data: null,
        error: new Error(error.message || 'Failed to update message')
      };
    }
  }

  /**
   * Delete a message
   * @param id The message ID
   * @returns Promise with delete result
   */
  async deleteMessage(id: string): Promise<DeleteResult> {
    try {
      const { error } = await this.supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        success: true,
        error: null
      };
    } catch (error: any) {
      console.error('Error deleting message:', error.message);
      return {
        success: false,
        error: new Error(error.message || 'Failed to delete message')
      };
    }
  }

  /**
   * Toggle like status for a message
   * @param id The message ID
   * @returns Promise with message result
   */
  async toggleLike(id: string): Promise<MessageResult> {
    try {
      // First get the current message to check its like status
      const { data: currentMessage, error: getError } = await this.supabase
        .from('messages')
        .select('isLiked')
        .eq('id', id)
        .single();

      if (getError) throw getError;

      // Toggle the like status
      const { data, error } = await this.supabase
        .from('messages')
        .update({
          isLiked: !currentMessage.isLiked,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data,
        error: null
      };
    } catch (error: any) {
      console.error('Error toggling like:', error.message);
      return {
        data: null,
        error: new Error(error.message || 'Failed to toggle like')
      };
    }
  }

  /**
   * Add a user message and AI response in one operation
   * @param conversationId The conversation ID
   * @param userPrompt The user's message
   * @param aiResponse The AI's response
   * @param metadata Optional metadata
   * @returns Promise with messages result
   */
  async createExchange(
    conversationId: string,
    userPrompt: string,
    aiResponse: string,
    metadata?: any
  ): Promise<MessagesResult> {
    try {
      // Start a transaction manually instead of using the RPC function
      // Create user message
      const { data: userMessage, error: userError } = await this.supabase
        .from('messages')
        .insert({
          author: 'user',
          content: userPrompt,
          conversationId: conversationId,
          isLiked: false,
          metadata: null
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create AI message
      const { data: aiMessage, error: aiError } = await this.supabase
        .from('messages')
        .insert({
          author: 'ai',
          content: aiResponse,
          conversationId: conversationId,
          isLiked: false,
          metadata: metadata || null
        })
        .select()
        .single();

      if (aiError) throw aiError;

      // Update the conversation's updatedAt timestamp
      await this.supabase
        .from('conversations')
        .update({ updatedAt: new Date().toISOString() })
        .eq('id', conversationId);

      return {
        data: [userMessage, aiMessage],
        error: null
      };
    } catch (error: any) {
      console.error('Error creating exchange:', error.message);
      return {
        data: [],
        error: new Error(error.message || 'Failed to create message exchange')
      };
    }
  }
} 