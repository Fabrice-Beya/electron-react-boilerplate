import { Message } from "../../types";

export interface MessageResult {
  data: Message | null;
  error: Error | null;
}

export interface MessagesResult {
  data: Message[];
  error: Error | null;
}

export interface DeleteResult {
  success: boolean;
  error: Error | null;
}

export interface IMessagesService {
  // Get all messages for a conversation
  getMessages(conversationId: string): Promise<MessagesResult>;
  
  // Get a specific message
  getMessage(id: string): Promise<MessageResult>;
  
  // Create a new message
  createMessage(
    message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<MessageResult>;
  
  // Update a message (e.g., to mark as liked)
  updateMessage(
    messageId: string,
    messageData: Partial<{
      content: string;
      isLiked: boolean;
      metadata: any;
    }>
  ): Promise<MessageResult>;
  
  // Delete a message
  deleteMessage(id: string): Promise<DeleteResult>;
  
  // Toggle like status for a message
  toggleLike(id: string): Promise<MessageResult>;
  
  // Add a user message and AI response in one operation
  createExchange(
    conversationId: string, 
    userPrompt: string, 
    aiResponse: string,
    metadata?: any
  ): Promise<MessagesResult>;
} 