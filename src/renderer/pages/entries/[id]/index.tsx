import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SmartToy as SmartToyIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { ServiceFactory } from '../../../../services/ServiceFactory';
import { Entry } from '../../../../types';
import { globalState } from '..';
import VoiceNotePlayer from '../../../components/VoiceNotePlayer';

const ViewEntryPage = () => {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const entriesService = ServiceFactory.getEntriesService();

  useEffect(() => {
    const loadEntry = async () => {
      if (!id) return;

      try {
        setError(null);
        const { data, error: loadError } = await entriesService.getEntry(id);

        if (loadError) {
          throw loadError;
        }

        if (!data) {
          throw new Error('Entry not found');
        }

        setEntry(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entry');
      } finally {
        setLoading(false);
      }
    };

    loadEntry();
  }, [id, entriesService]);

  const handleDelete = async () => {
    if (!id) return;

    setDeleteLoading(true);
    try {
      const { error: deleteError } = await entriesService.deleteEntry(id);

      if (deleteError) {
        throw deleteError;
      }

      // Set flag to refresh entries list when returning
      globalState.shouldRefreshEntries = true;
      navigate('/entries');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete entry');
      setDeleteDialogOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: '#1a1a1a'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!entry) {
    return (
      <Box sx={{ p: 3, bgcolor: '#1a1a1a' }}>
        <Alert severity="error">Entry not found</Alert>
      </Box>
    );
  }

  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Box sx={{ 
      p: 3, 
      height: '100vh',
      bgcolor: '#1a1a1a',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={() => navigate('/entries')}
          sx={{ mr: 2, color: 'text.primary' }}
          aria-label="back"
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => navigate(`/entries/${id}/ai`)}
            aria-label="chat with AI"
            title="Chat with AI about this entry"
            sx={{ color: 'text.primary' }}
          >
            <SmartToyIcon />
          </IconButton>
          <IconButton
            onClick={() => navigate(`/entries/edit/${id}`)}
            aria-label="edit"
            sx={{ color: 'text.primary' }}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => setDeleteDialogOpen(true)}
            aria-label="delete"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        flex: 1,
        overflow: 'auto'
      }}>
        <Typography variant="h4" sx={{ 
          color: 'text.primary',
          fontSize: '2rem',
          mb: 1
        }}>
          {entry.title}
        </Typography>

        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
          {formattedDate}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            color: 'text.primary',
            fontSize: '1rem',
            lineHeight: 1.6
          }}
        >
          {entry.content}
        </Typography>

        {entry.voicenotes && entry.voicenotes.length > 0 && (
          <>
            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.12)' }} />
            <Box>
              <Typography variant="h6" sx={{ color: 'text.primary', mb: 2 }}>
                Voice Notes
              </Typography>
              {entry.voicenotes.map((voiceNote) => (
                <VoiceNotePlayer
                  key={voiceNote.id}
                  voiceNote={voiceNote}
                  editable={false}
                />
              ))}
            </Box>
          </>
        )}
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            color: 'text.primary'
          }
        }}
      >
        <DialogTitle>Delete Entry</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.primary' }}>
            Are you sure you want to delete this entry? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleteLoading}
            variant="text"
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={deleteLoading}
            variant="contained"
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViewEntryPage; 