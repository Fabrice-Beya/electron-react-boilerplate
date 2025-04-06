import axios from 'axios';
import OpenAI from 'openai';
import { ServiceFactory } from '../ServiceFactory';
import { Conversation, Message } from '../../types';
import { useEnvStore } from '../../renderer/store/envStore';

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  provider?: 'ollama' | 'deepseek'; // Add provider option
  retries?: number; // Add retries option
  conversationId?: string; // Add conversation ID for persistence
  saveConversation?: boolean; // Whether to save the conversation
  conversationTitle?: string; // Optional title for new conversations
  contextType?: string; // Optional context type
  contextReference?: string; // Optional reference to an entry or other entity
  context?: string; // Optional context for the conversation
}

interface ChatResponse {
  success: boolean;
  text?: string;
  error?: string;
}

interface Entry {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  voicenotes?: Array<{
    id: string;
    transcript?: string | null;
  }>;
}

interface EnvVars {
  DEFAULT_AI_PROVIDER?: 'ollama';
}

// Initialize OpenAI client lazily
let openaiClient: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    const { envVars } = useEnvStore.getState();
    const apiUrl = envVars.LLM_API_URL_DEEPSEEK;
    const apiKey = envVars.LLM_API_KEY_DEEPSEEK;

    if (!apiUrl || !apiKey) {
      throw new Error('DeepSeek API URL or API Key not configured');
    }

    openaiClient = new OpenAI({
      baseURL: apiUrl,
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
  }

  return openaiClient;
};

const serviceFactory = ServiceFactory.getInstance();

const aiService = {
  /**
   * Send a chat message to the LLM API and get a response
   * @param prompt - The user's message/prompt
   * @param options - Optional parameters for the API call
   * @returns Promise with the LLM response
   */
  chat: async (
    prompt: string,
    fullPrompt: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> => {
    const { envVars } = useEnvStore.getState();

    // Set default options
    const defaultOptions: ChatOptions = {
      model: options.provider === 'deepseek' ? "deepseek-chat" : "gemma3:12b",
      temperature: 0.7,
      maxTokens: 1024,
      stream: false,
      provider: envVars.DEFAULT_AI_PROVIDER,
      retries: 2,
      saveConversation: false
    };

    // Merge default options with provided options
    const finalOptions = { ...defaultOptions, ...options };

    try {
      // Use the specified provider to get a response
      let response: ChatResponse;
      if (finalOptions.provider === 'deepseek') {
        response = await chatWithDeepSeek(fullPrompt, finalOptions);
      } else {
        response = await chatWithOllama(fullPrompt, finalOptions);
      }

      // If the chat was successful and we want to save the conversation
      if (response.success && finalOptions.saveConversation) {
        await saveConversation(prompt, response.text || '', finalOptions);
      }

      return response;
    } catch (error) {
      console.error('Error in chat:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Send a new chat message to the LLM API and get a response
   * @param prompt - The user's message/prompt
   * @param options - Optional parameters for the API call
   * @returns Promise with the LLM response
   */
  newChat: async (
    prompt: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> => {
    const entriesService = ServiceFactory.getEntriesService();
    const authService = serviceFactory.getAuthService();
    const user = await authService.getCurrentUser();
    const entries = await entriesService.getEntries(user?.id || '');
    const entriesContext = buildEntriesContext(entries.data);
    const fullPrompt = `
    You are an AI assistant for a journaling app.
    You have access to the user's journal entries.
    USER'S JOURNAL ENTRIES:
    ${entriesContext}
    `;
    return await aiService.chat(prompt, fullPrompt, options);
  },
  /**
   * Send a chat message with journal entries as context
   * @param prompt - The user's message/prompt
   * @param entries - Array of journal entries to use as context
   * @param options - Optional parameters for the API call
   * @returns Promise with the LLM response
   */
  chatWithEntry: async (
    prompt: string,
    entry: Entry,
    options: ChatOptions = {}
  ): Promise<ChatResponse> => {
    try {
      // Build context from entries
      const entriesContext = buildEntriesContext([entry]);

      // Create a prompt that includes the entries context
      const fullPrompt = `
You are an AI assistant for a journaling app. You have access to the user's journal entries.

USER'S JOURNAL ENTRIES:
${entriesContext}

Based on the journal entries above, please respond to the following question or request:
${prompt}

When referencing specific entries, mention them by title and date. If the question isn't related to any specific entry, provide a helpful response based on general knowledge.
`;

      // Set context information for saving
      const contextOptions: ChatOptions = {
        ...options,
        provider: 'ollama',
        saveConversation: options.saveConversation !== false, // Default to true for entry-based chats
        contextType: 'entries',
        contextReference: entry.id,
        conversationTitle: options.conversationTitle || generateConversationTitle(prompt, [entry]),
        context: fullPrompt
      };

      // Call the regular chat function with the enhanced prompt
      return await aiService.chat(
        prompt,
        fullPrompt, {
        ...contextOptions,
        // Increase max tokens to accommodate longer responses that reference entries
        maxTokens: options.maxTokens || 2048
      });
    } catch (error) {
      console.error('Error in chatWithEntry:', error);

      let errorMessage = 'Failed to process entry and generate response';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  },
  /**
   * Send a chat message with journal entries as context
   * @param prompt - The user's message/prompt
   * @param entries - Array of journal entries to use as context
   * @param options - Optional parameters for the API call
   * @returns Promise with the LLM response
   */
  chatWithEntries: async (
    prompt: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> => {
    try {
      const entriesService = ServiceFactory.getEntriesService();
      const authService = serviceFactory.getAuthService();
      const user = await authService.getCurrentUser();
      const entries = await entriesService.getEntries(user?.id || '');
      const entriesContext = buildEntriesContext(entries.data);

      // Create a prompt that includes the entries context
      const fullPrompt = `
You are an AI assistant for a journaling app. You have access to the user's journal entries.

USER'S JOURNAL ENTRIES:
${entriesContext}

Based on the journal entries above, please respond to the following question or request:
${prompt}

When referencing specific entries, mention them by title and date and quote the content of the entry. If the question isn't related to any specific entry, provide a helpful response based on general knowledge.
`;

      // Set context information for saving
      const contextOptions: ChatOptions = {
        ...options,
        provider: 'ollama',
        saveConversation: options.saveConversation !== false, // Default to true for entry-based chats
        contextType: 'entries',
        contextReference: entries.data.length === 1 ? entries.data[0].id : undefined,
        conversationTitle: options.conversationTitle || generateConversationTitle(prompt, entries.data),
        context: fullPrompt
      };

      // Call the regular chat function with the enhanced prompt
      return await aiService.chat(
        prompt,
        fullPrompt, {
        ...contextOptions,
        // Increase max tokens to accommodate longer responses that reference entries
        maxTokens: options.maxTokens || 2048
      });
    } catch (error) {
      console.error('Error in chatWithEntries:', error);

      let errorMessage = 'Failed to process entries and generate response';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Analyze journal entries to provide insights
   * @param entries - Array of journal entries to analyze
   * @param options - Optional parameters for the API call
   * @returns Promise with the analysis response
   */
  analyzeEntries: async (
    entries: Entry[],
    options: ChatOptions = {}
  ): Promise<ChatResponse> => {
    try {
      // Build context from entries
      const entriesContext = buildEntriesContext(entries);

      // Create a prompt for analysis
      const analysisPrompt = `
You are an AI assistant for a journaling app. Analyze the following journal entries and provide insights:

USER'S JOURNAL ENTRIES:
${entriesContext}

Please provide:
1. A summary of key themes and patterns
2. Emotional trends you notice
3. Potential areas for personal growth
4. Any helpful observations or suggestions

Be supportive, empathetic, and constructive in your analysis.
`;

      // Call the regular chat function with the analysis prompt
      return await aiService.chat(analysisPrompt, analysisPrompt, {
        ...options,
        context: entriesContext,
        // Use higher temperature for more creative insights
        temperature: options.temperature || 0.8,
        maxTokens: options.maxTokens || 2048
      });
    } catch (error) {
      console.error('Error in analyzeEntries:', error);

      let errorMessage = 'Failed to analyze journal entries';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Continue an existing conversation
   * @param conversationId - The ID of the conversation to continue
   * @param prompt - The user's new message
   * @param options - Optional parameters for the API call
   * @returns Promise with the LLM response
   */
  continueConversation: async (
    conversationId: string,
    prompt: string,
    options: ChatOptions = {}
  ): Promise<ChatResponse> => {
    try {
      // Get the conversation service
      const conversationsService = ServiceFactory.getConversationsService();

      // Get the conversation with its messages
      const { data: conversation, error } = await conversationsService.getConversation(conversationId);

      if (error || !conversation) {
        throw new Error(error?.message || 'Conversation not found');
      }

      // Build context from previous messages
      const messagesContext = buildMessagesContext(conversation.messages);

      // Create a prompt that includes the conversation context
      const fullPrompt = `
You are an AI assistant for a journaling app. This is a continuation of a conversation.

PREVIOUS CONVERSATION:
${messagesContext}

Please respond to the user's latest message:
${prompt}
`;

      // Call the regular chat function with the conversation context
      const response = await aiService.chat(prompt, fullPrompt, {
        ...options,
        context: fullPrompt,
        provider: conversation.provider as 'ollama' | 'deepseek' || options.provider,
        model: conversation.model || options.model,
        conversationId: conversationId,
        saveConversation: true
      });

      return response;
    } catch (error) {
      console.error('Error in continueConversation:', error);

      let errorMessage = 'Failed to continue conversation';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  },

  /**
   * Get all conversations for the current user
   * @returns Promise with conversations
   */
  getConversations: async (): Promise<{ data: Conversation[], error: Error | null }> => {
    try {
      const conversationsService = ServiceFactory.getConversationsService();
      const authService = serviceFactory.getAuthService();

      // Get the current user
      const user = await authService.getCurrentUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get all conversations for the user
      return await conversationsService.getConversations(user.id);
    } catch (error) {
      console.error('Error getting conversations:', error);

      return {
        data: [],
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  /**
   * Get a specific conversation with its messages
   * @param conversationId - The ID of the conversation to get
   * @returns Promise with the conversation
   */
  getConversation: async (conversationId: string): Promise<{ data: Conversation | null, error: Error | null }> => {
    try {
      const conversationsService = ServiceFactory.getConversationsService();

      // Get the conversation
      return await conversationsService.getConversation(conversationId);
    } catch (error) {
      console.error('Error getting conversation:', error);

      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  },

  /**
   * Get a conversation for a specific entry
   * @param entryId - The ID of the entry
   * @returns Promise with the conversation
   */
  getConversationByEntryId: async (entryId: string): Promise<{ data: Conversation | null, error: Error | null }> => {
    try {
      const conversationsService = ServiceFactory.getConversationsService();
      const authService = serviceFactory.getAuthService();

      // Get the current user
      const user = await authService.getCurrentUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the conversation for this entry
      return await conversationsService.getConversationByEntryId(user.id, entryId);
    } catch (error) {
      console.error('Error getting conversation for entry:', error);

      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }
};

/**
 * Chat with Ollama LLM
 * @param prompt - The user's message/prompt
 * @param options - Options for the API call
 * @returns Promise with the LLM response
 */
async function chatWithOllama(
  prompt: string,
  options: ChatOptions
): Promise<ChatResponse> {
  let lastError: any;
  const maxRetries = options.retries || 2;
  const { envVars } = useEnvStore.getState();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {

      const llmApiUrl = 'http://100.101.151.91:11434'

      if (!llmApiUrl) {
        throw new Error('Ollama API URL not configured');
      }

      // Make the API request
      const response = await axios.post(`${llmApiUrl}/api/generate`, {
        model: options.model,
        prompt: prompt,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        stream: options.stream
      });

      // Check if response is valid
      if (!response.data || !response.data.response) {
        throw new Error('Invalid response from Ollama API');
      }

      return {
        success: true,
        text: response.data.response
      };
    } catch (error) {
      lastError = error;
      console.error(`Ollama attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Wait before retrying with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all attempts failed
  console.error('All Ollama retry attempts failed');

  // Extract error message
  let errorMessage = 'Failed to get response from Ollama';

  if (axios.isAxiosError(lastError)) {
    // Handle Axios errors
    errorMessage = lastError.response?.data?.error ||
      lastError.message ||
      'Network error during Ollama request';
  } else if (lastError instanceof Error) {
    errorMessage = lastError.message;
  }

  return {
    success: false,
    error: errorMessage
  };
}

/**
 * Chat with DeepSeek LLM using OpenAI library
 * @param prompt - The user's message/prompt
 * @param options - Options for the API call
 * @returns Promise with the LLM response
 */
async function chatWithDeepSeek(
  prompt: string,
  options: ChatOptions
): Promise<ChatResponse> {
  let lastError: any;
  const maxRetries = options.retries || 2;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {

      // Get OpenAI client
      const openai = getOpenAIClient();

      // Create chat completion
      const completion = await openai.chat.completions.create({
        model: options.model || "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant for a journaling app."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: options.temperature,
        max_tokens: options.maxTokens,
        // Ensure stream is false to get a direct response
        stream: false
      });

      // Check if the response is a ChatCompletion (not a stream)
      if (!completion.choices || !Array.isArray(completion.choices) || completion.choices.length === 0) {
        throw new Error('Invalid response format from DeepSeek API');
      }

      // Extract content from response
      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new Error('Empty response from DeepSeek API');
      }

      return {
        success: true,
        text: content
      };
    } catch (error) {
      lastError = error;
      console.error(`DeepSeek attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all attempts failed
  console.error('All DeepSeek retry attempts failed');

  // Extract error message
  let errorMessage = 'Failed to get response from DeepSeek';

  if (lastError instanceof Error) {
    errorMessage = lastError.message;
  }

  return {
    success: false,
    error: errorMessage
  };
}

/**
 * Build a formatted string of entries for context
 * @param entries - Array of journal entries
 * @returns Formatted string with entry details
 */
function buildEntriesContext(entries: Entry[]): string {
  if (!entries || entries.length === 0) {
    return "No journal entries available.";
  }

  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Format each entry
  return sortedEntries.map((entry, index) => {
    // Format date
    const entryDate = new Date(entry.createdAt);
    const formattedDate = entryDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get voice note transcripts if they exist
    const transcripts = entry.voicenotes
      ?.filter(vn => vn.transcript)
      .map(vn => `Voice Note Transcript: ${vn.transcript}`)
      .join('\n\n');

    // Build the entry text
    return `ENTRY ${index + 1} - ${entry.title} (${formattedDate})
Content: ${entry.content}
${transcripts ? `\n${transcripts}` : ''}
${'='.repeat(50)}`;
  }).join('\n\n');
}

/**
 * Save a conversation and its messages to the database
 * @param prompt - The user's message
 * @param response - The AI's response
 * @param options - Options containing conversation details
 */
async function saveConversation(
  prompt: string,
  response: string,
  options: ChatOptions
): Promise<void> {
  try {
    const conversationsService = ServiceFactory.getConversationsService();
    const messagesService = ServiceFactory.getMessagesService();
    const authService = serviceFactory.getAuthService();

    // Get the current user
    const user = await authService.getCurrentUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // If we have a conversation ID, add messages to the existing conversation
    if (options.conversationId) {
      await messagesService.createExchange(
        options.conversationId,
        prompt,
        response,
        { model: options.model, provider: options.provider }
      );
    } else {
      // Create a new conversation
      const { data: conversation, error } = await conversationsService.createConversation({
        userId: user.id,
        title: options.conversationTitle || generateConversationTitle(prompt),
        context: options.context || null,
        contextType: options.contextType || 'general',
        contextReference: options.contextReference || null,
        provider: options.provider || null,
        model: options.model || null,
        isArchived: false,
      });

      if (error || !conversation) {
        throw new Error(error?.message || 'Failed to create conversation');
      }

      // Add the messages to the new conversation
      await messagesService.createExchange(
        conversation.id,
        prompt,
        response,
        { model: options.model, provider: options.provider }
      );
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
    // Don't throw, just log the error
  }
}

/**
 * Generate a title for a new conversation based on the first message
 * @param prompt - The user's first message
 * @param entries - Optional entries for context
 * @returns A generated title
 */
function generateConversationTitle(prompt: string, entries?: Entry[]): string {
  // If the prompt is too long, truncate it
  if (prompt.length > 50) {
    return prompt.substring(0, 47) + '...';
  }

  // If we have entries and there's only one, use its title
  if (entries && entries.length === 1) {
    return `About "${entries[0].title}"`;
  }

  // Otherwise, just use the prompt as the title
  return prompt;
}

/**
 * Build a formatted string of messages for context
 * @param messages - Array of messages
 * @returns Formatted string with message details
 */
function buildMessagesContext(messages: Message[]): string {
  if (!messages || messages.length === 0) {
    return "No previous messages.";
  }

  // Format each message
  return messages.map((message) => {
    const author = message.author === 'user' ? 'USER' : 'AI';
    return `${author}: ${message.content}`;
  }).join('\n\n');
}

export default aiService;
