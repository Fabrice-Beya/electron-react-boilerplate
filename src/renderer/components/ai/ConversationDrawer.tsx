import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Conversation } from '../../../types';
import aiService from '../../../services/common/aiService';
import { ServiceFactory } from '../../../services/ServiceFactory';

interface ConversationDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelectConversation: (conversation: Conversation) => void;
}

const ConversationDrawer: React.FC<ConversationDrawerProps> = ({
  open,
  onClose,
  onSelectConversation,
}) => {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const conversationsService = ServiceFactory.getConversationsService();

  React.useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const result = await aiService.getConversations();

      if (result.error) {
        setError(result.error.message);
      } else if (result.data) {
        // Sort conversations by updatedAt in descending order
        const sortedConversations = [...result.data].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setConversations(sortedConversations);
      }
    } catch (err) {
      setError('Failed to load conversations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const result = await conversationsService.deleteConversation(conversationId);

      if (result.error) {
        setError(result.error.message);
      } else {
        // Remove the deleted conversation from the list
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      }
    } catch (err) {
      setError('Failed to delete conversation');
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 320 },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          Conversations
        </Typography>
      </Box>
      <Divider />

      {error && (
        <Box sx={{ p: 2 }}>
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </Box>
      )}

      <List sx={{ width: '100%', p: 0 }}>
        {loading ? (
          <ListItem>
            <ListItemText primary="Loading conversations..." />
          </ListItem>
        ) : conversations.length === 0 ? (
          <ListItem>
            <ListItemText primary="No conversations yet" />
          </ListItem>
        ) : (
          conversations.map((conversation) => (
            <ListItem
              key={conversation.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conversation.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemButton onClick={() => onSelectConversation(conversation)}>
                <ListItemIcon>
                  <ChatIcon />
                </ListItemIcon>
                <ListItemText
                  primary={conversation.title || 'Untitled Conversation'}
                  secondary={formatDate(conversation.updatedAt)}
                />
              </ListItemButton>
            </ListItem>
          ))
        )}
      </List>
    </Drawer>
  );
};

export default ConversationDrawer; 