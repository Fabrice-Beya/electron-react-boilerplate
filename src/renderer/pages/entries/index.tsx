import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
  TextField,
  Alert,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  NoteOutlined as NoteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Entry } from '../../../types';
import { ServiceFactory } from '../../../services/ServiceFactory';
import { useAuth } from '../../context/AuthContext';

// Create a simple global state for tracking navigation
export const globalState = {
  lastNavigationTime: 0,
  shouldRefreshEntries: false,
};

const EntriesPage = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const initialLoadDone = useRef(false);
  const lastLoadTime = useRef(Date.now());
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const entriesService = ServiceFactory.getEntriesService();
  
  const loadEntries = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastLoadTime.current < 2000) {
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      const { data, error } = await entriesService.getEntries(user.id);
      
      if (error) {
        setError(error.message);
      } else {
        setEntries(data);
        setFilteredEntries(data);
        lastLoadTime.current = now;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
      globalState.shouldRefreshEntries = false;
    }
  }, [entriesService, user]);

  // Initial load
  useEffect(() => {
    if (!initialLoadDone.current) {
      loadEntries(true);
    }
  }, [loadEntries]);

  // Handle search filtering
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEntries(entries);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = entries.filter(entry =>
        entry.title.toLowerCase().includes(lowercasedQuery) ||
        entry.content.toLowerCase().includes(lowercasedQuery)
      );
      setFilteredEntries(filtered);
    }
  }, [searchQuery, entries]);

  const navigateToAddEntry = () => {
    globalState.shouldRefreshEntries = true;
    navigate('/entries/create');
  };

  const navigateToEntryDetail = (id: string) => {
    navigate(`/entries/${id}`);
  };

  if (loading && entries.length === 0) {
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
    <Box sx={{ p: 3, height: '100vh', position: 'relative' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Entries
        </Typography>
        <TextField
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: searchQuery && (
              <IconButton size="small" onClick={() => setSearchQuery('')}>
                <CloseIcon />
              </IconButton>
            ),
          }}
          sx={{ width: 300 }}
        />
      </Box>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      )}

      {entries.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100vh - 200px)',
            textAlign: 'center',
          }}
        >
          <NoteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No entries yet
          </Typography>
          <Typography color="text.secondary">
            Start writing your first journal entry by clicking the + button below.
          </Typography>
        </Box>
      ) : (
        <List>
          {filteredEntries.map((entry) => {
            const date = new Date(entry.createdAt);
            const formattedDate = date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <ListItem
                key={entry.id}
                onClick={() => navigateToEntryDetail(entry.id)}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon>
                  <NoteIcon />
                </ListItemIcon>
                <ListItemText
                  primary={entry.title}
                  secondary={`${formattedDate} • ${entry.content.substring(0, 60)}${
                    entry.content.length > 60 ? '...' : ''
                  }`}
                />
              </ListItem>
            );
          })}
        </List>
      )}

      <Fab
        color="primary"
        aria-label="add"
        onClick={navigateToAddEntry}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default EntriesPage; 