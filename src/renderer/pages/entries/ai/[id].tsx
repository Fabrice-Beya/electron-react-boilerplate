import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  ContentCopy as ContentCopyIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { ServiceFactory } from '../../../../services/ServiceFactory';
import aiService from '../../../../services/common/aiService';
import { Conversation, Entry } from '../../../../types';

interface ChatMessage {
  prompt: string;
  response: string;
  timestamp: Date;
}

const EntryAIScreen = () => {
  const { id } = useParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());

  const navigate = useNavigate();
  const entriesService = ServiceFactory.getEntriesService();
  const messagesService = ServiceFactory.getMessagesService();

  useEffect(() => {
    if (id) {
      fetchEntry(id);
    }
  }, [id]);

  const fetchEntry = async (entryId: string) => {
    try {
      setLoading(true);
      const { data, error } = await entriesService.getEntry(entryId);

      if (error) {
        setError(`Failed to load entry: ${error}`);
      } else if (data) {
        setEntry(data);

        // Check if a conversation already exists for this entry
        const conversationResult = await aiService.getConversationByEntryId(entryId);

        if (conversationResult.data) {
          // Existing conversation found
          setCurrentConversation(conversationResult.data);

          // Convert messages to chat history format
          const newChatHistory = conversationResult.data.messages.reduce((acc, message, index, array) => {
            if (
              message.author === 'user' &&
              index < array.length - 1 &&
              array[index + 1].author === 'ai'
            ) {
              acc.push({
                prompt: message.content,
                response: array[index + 1].content,
                timestamp: new Date()
              });
            }
            return acc;
          }, [] as ChatMessage[]);

          // If we have messages, use them
          if (newChatHistory.length > 0) {
            setChatHistory(newChatHistory);

            // Initialize liked messages
            const liked = new Set<string>();
            conversationResult.data.messages.forEach(message => {
              if (message.isLiked) {
                liked.add(message.id);
              }
            });
            setLikedMessages(liked);
          } else {
            // Add an initial AI message if no messages exist
            setChatHistory([
              {
                prompt: "Initial context",
                response: `I'm ready to discuss your journal entry "${data.title}". What would you like to know or explore about it?`,
                timestamp: new Date()
              }
            ]);
          }
        } else {
          // No existing conversation, add an initial AI message
          setChatHistory([
            {
              prompt: "Initial context",
              response: `I'm ready to discuss your journal entry "${data.title}". What would you like to know or explore about it?`,
              timestamp: new Date()
            }
          ]);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred while loading the entry');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim() || !entry) return;

    setAiLoading(true);
    setError(null);

    try {
      // Add user message to chat history immediately
      const userPrompt = prompt.trim();
      setChatHistory(prev => [
        ...prev,
        {
          prompt: userPrompt,
          response: "...", // Placeholder until we get the real response
          timestamp: new Date()
        }
      ]);

      // Clear input field
      setPrompt('');

      let result;

      // If we have a current conversation, continue it
      if (currentConversation) {
        result = await aiService.continueConversation(
          currentConversation.id,
          userPrompt,
          {
            provider: (currentConversation.provider as 'deepseek' | 'ollama') || 'deepseek'
          }
        );
      } else {
        // Start a new conversation with the entry as context
        result = await aiService.chatWithEntry(
          userPrompt,
          entry,
          {
            temperature: 0.7,
            provider: 'ollama',
            model: 'gemma3:4b',
            saveConversation: true,
            contextType: 'entry',
            contextReference: id as string,
            conversationTitle: `About "${entry.title}"`
          }
        );

        // If this was a new conversation, load it
        if (result.success) {
          const conversationResult = await aiService.getConversationByEntryId(id as string);
          if (conversationResult.data) {
            setCurrentConversation(conversationResult.data);
          }
        }
      }

      // Update the last message with the real response
      if (result.success && result.text) {
        setChatHistory(prev => {
          const updated = [...prev];
          updated[updated.length - 1].response = result.text || "No response received";
          return updated;
        });
      } else {
        setChatHistory(prev => {
          const updated = [...prev];
          updated[updated.length - 1].response = result.error || "Failed to get a response";
          return updated;
        });
        setError(result.error || "Failed to get a response from AI");
      }
    } catch (err) {
      console.error("Error calling AI service:", err);
      setError("An unexpected error occurred while communicating with the AI");

      // Update the last message with the error
      setChatHistory(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1].response = "Sorry, I encountered an error while processing your request.";
        }
        return updated;
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleLikeMessage = async (messageId: string) => {
    try {
      const result = await messagesService.toggleLike(messageId);

      if (result.error) {
        console.error('Error toggling like:', result.error);
        return;
      }

      setLikedMessages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(messageId)) {
          newSet.delete(messageId);
        } else {
          newSet.add(messageId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error liking message:', error);
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
          aria-label="back"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          AI Chat: {entry?.title}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          flex: 1,
          overflow: 'auto',
        }}
      >
        {/* Entry Summary Card */}
        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'background.default' }}>
          <Typography variant="subtitle1" color="primary">
            Discussing: {entry?.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {entry?.createdAt ? new Date(entry.createdAt).toLocaleDateString() : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {entry?.content}
          </Typography>
        </Paper>

        {chatHistory.length > 0 ? (
          chatHistory.map((chat, index) => {
            // Skip the initial context message in the UI
            if (index === 0 && chat.prompt === "Initial context") {
              return (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '80%',
                      backgroundColor: 'background.default',
                    }}
                  >
                    <Typography variant="body1">{chat.response}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyMessage(chat.response)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                </Box>
              );
            }

            const userMessageId = currentConversation?.messages.find(
              m => m.author === 'user' && m.content === chat.prompt
            )?.id;

            const aiMessageId = currentConversation?.messages.find(
              m => m.author === 'ai' && m.content === chat.response
            )?.id;

            const isAiMessageLiked = aiMessageId ? likedMessages.has(aiMessageId) : false;

            return (
              <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* User message */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '80%',
                      backgroundColor: 'background.paper',
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="body1">{chat.prompt}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        {formatTimestamp(chat.timestamp)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyMessage(chat.prompt)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                </Box>

                {/* AI response */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '80%',
                      backgroundColor: 'background.default',
                    }}
                  >
                    <Typography variant="body1">
                      {chat.response === "..." ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          <Typography variant="caption">Thinking...</Typography>
                        </Box>
                      ) : (
                        chat.response
                      )}
                    </Typography>
                    {chat.response !== "..." && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 1 }}>
                        {aiMessageId && (
                          <IconButton
                            size="small"
                            onClick={() => handleLikeMessage(aiMessageId)}
                          >
                            {isAiMessageLiked ? (
                              <FavoriteIcon fontSize="small" color="primary" />
                            ) : (
                              <FavoriteBorderIcon fontSize="small" />
                            )}
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleCopyMessage(chat.response)}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                  </Paper>
                </Box>
              </Box>
            );
          })
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Start by asking a question about this journal entry.
            </Typography>
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask about this entry..."
          disabled={aiLoading}
        />
        <IconButton
          color="primary"
          onClick={handleSubmit}
          disabled={!prompt.trim() || aiLoading}
        >
          {aiLoading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default EntryAIScreen; 