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
  Menu as MenuIcon,
  Add as AddIcon,
  ContentCopy as ContentCopyIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ServiceFactory } from '../../../services/ServiceFactory';
import aiService from '../../../services/common/aiService';
import { Conversation } from '../../../types';
import ConversationDrawer from '../../components/ai/ConversationDrawer';

interface ChatMessage {
  prompt: string;
  response: string;
  timestamp: Date;
}

const AIScreen = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());

  const navigate = useNavigate();
  const messagesService = ServiceFactory.getMessagesService();

  useEffect(() => {
    loadCurrentConversation();
  }, []);

  const loadCurrentConversation = async () => {
    try {
      const result = await aiService.getConversations();
      if (result.data && result.data.length > 0) {
        const sortedConversations = [...result.data].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setCurrentConversation(sortedConversations[0]);
        
        // Convert messages to chat history
        const newChatHistory = sortedConversations[0].messages.reduce((acc, message, index, array) => {
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

        setChatHistory(newChatHistory);

        // Initialize liked messages
        const liked = new Set<string>();
        sortedConversations[0].messages.forEach(message => {
          if (message.isLiked) {
            liked.add(message.id);
          }
        });
        setLikedMessages(liked);
      }
    } catch (err) {
      console.error("Error loading current conversation:", err);
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      let result;

      // Continue or start a new conversation
      if (currentConversation) {
        result = await aiService.continueConversation(
          currentConversation.id,
          prompt,
          {
            provider: (currentConversation.provider as 'deepseek' | 'ollama') || 'deepseek'
          }
        );
      } else {
        result = await aiService.newChat(prompt, {
          provider: 'ollama',
          model: 'gemma3:4b',
          saveConversation: true
        });
      }

      if (result.success && result.text) {
        // Append to chat history
        setChatHistory(prev => [
          ...prev,
          {
            prompt: prompt.trim(),
            response: result.text || "No response received",
            timestamp: new Date()
          }
        ]);

        // If this was a new conversation, load it
        if (!currentConversation) {
          loadCurrentConversation();
        }
      } else {
        setError(result.error || "Failed to get a response from AI");
      }
    } catch (err) {
      console.error("Error calling AI service:", err);
      setError("An unexpected error occurred while communicating with the AI");
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setDrawerVisible(false);

    // If it's the same conversation, do nothing
    if (currentConversation?.id === conversation.id) {
      return;
    }

    // Switch to the selected conversation
    setCurrentConversation(conversation);

    // Convert the messages to chatHistory
    const newChatHistory = conversation.messages.reduce((acc, message, index, array) => {
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

    setChatHistory(newChatHistory);

    // Initialize liked messages
    const liked = new Set<string>();
    conversation.messages.forEach(message => {
      if (message.isLiked) {
        liked.add(message.id);
      }
    });
    setLikedMessages(liked);
  };

  const handleNewConversation = () => {
    setCurrentConversation(null);
    setChatHistory([]);
    setPrompt('');
    setError(null);
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

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={() => setDrawerVisible(true)}
          sx={{ mr: 2 }}
          aria-label="menu"
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          AI Assistant
        </Typography>
        <IconButton
          onClick={handleNewConversation}
          aria-label="new conversation"
        >
          <AddIcon />
        </IconButton>
      </Box>

      {currentConversation && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>
          {currentConversation.title}
        </Typography>
      )}

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
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
          Ask questions about your journal entries or get help with writing and reflection.
        </Typography>

        {chatHistory.length > 0 ? (
          chatHistory.map((chat, index) => {
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
                    <Typography variant="body1">{chat.response}</Typography>
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
                  </Paper>
                </Box>
              </Box>
            );
          })
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No conversations yet. Start by asking a question or requesting help with your journaling.
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
          placeholder="Ask me anything..."
          disabled={loading}
        />
        <IconButton
          color="primary"
          onClick={handleSubmit}
          disabled={!prompt.trim() || loading}
        >
          {loading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>

      <ConversationDrawer
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSelectConversation={handleSelectConversation}
      />
    </Box>
  );
};

export default AIScreen; 