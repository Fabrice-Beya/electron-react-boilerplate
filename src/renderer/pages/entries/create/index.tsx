import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Mic as MicIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { ServiceFactory } from '../../../../services/ServiceFactory';
import { globalState } from '..';
import { VoiceNote } from '../../../../types';
import VoiceNotePlayer from '../../../components/VoiceNotePlayer';
import VoiceNoteRecorder from '../../../components/VoiceNoteRecorder';
import VoiceNoteImporter from '../../../components/VoiceNoteImporter';
import { v4 as uuidv4 } from 'uuid';

const CreateEntryPage = () => {
  const [entryId, setEntryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [transcribing, setTranscribing] = useState<number | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const entriesService = ServiceFactory.getEntriesService();
  const voiceNoteService = ServiceFactory.getVoiceNoteService();
  const transcriptionService = ServiceFactory.getTranscriptionService();

  // Create draft entry when page loads
  useEffect(() => {
    const createDraftEntry = async () => {
      try {
        const { data, error } = await entriesService.createEntry(
          {
            id: uuidv4(),
            userId: user?.id || '',
            title: '',
            content: '',
            isDraft: true,
          },
          [],
          true // isDraft
        );

        if (error) {
          console.error('Error creating draft:', error);
          return;
        }

        if (data) {
          console.log('Draft entry created:', data);
          setEntryId(data.id);
        }
      } catch (err) {
        console.error('Error in createDraftEntry:', err);
      }
    };

    createDraftEntry();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!user || !entryId) {
        throw new Error('User not authenticated or entry ID not found');
      }

      const { error: updateError } = await entriesService.updateEntry(
        entryId,
        {
          title: title.trim(),
          content: content.trim(),
        },
        voiceNotes,
        false // Not a draft anymore
      );

      if (updateError) {
        throw updateError;
      }

      globalState.shouldRefreshEntries = true;
      navigate('/entries');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entry');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      // Delete the draft entry if it exists
      if (entryId) {
        await entriesService.deleteEntry(entryId);
      }
      navigate('/entries');
    } catch (err) {
      console.error('Error deleting draft:', err);
      navigate('/entries'); // Navigate away anyway
    }
  };

  const handleRecordingComplete = async (
    file: { uri: string; type: string; name?: string; size?: number },
    duration: number
  ) => {
    try {
      setError(null);
      
      if (!user || !entryId) {
        throw new Error('User not authenticated or entry ID not found');
      }

      // Create the voice note with the draft entry ID
      const { data: voiceNote, error } = await voiceNoteService.createVoiceNote(
        {
          uri: file.uri,
          type: 'audio/wav',
          name: `voice-note-${Date.now()}.wav`,
          size: file.size,
        },
        {
          duration,
          userId: user.id,
          entryId: entryId,
        }
      );

      if (error) throw error;
      if (!voiceNote) throw new Error('Failed to create voice note');

      setVoiceNotes(prev => [...prev, voiceNote]);
    } catch (err) {
      console.error('Error creating voice note:', err);
      setError(err instanceof Error ? err.message : 'Failed to save voice note');
    }
  };

  const handleDeleteVoiceNote = async (voiceNoteId: string) => {
    try {
      setError(null);
      
      // Delete the voice note
      const { error } = await voiceNoteService.deleteVoiceNote(voiceNoteId);
      
      if (error) throw error;

      // Update the local state
      setVoiceNotes(prev => prev.filter(vn => vn.id !== voiceNoteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete voice note');
    }
  };

  const handleTranscribe = async (voiceNoteId: string) => {
    try {
      setError(null);
      
      // Find the voice note
      const voiceNote = voiceNotes.find(vn => vn.id === voiceNoteId);
      if (!voiceNote) {
        throw new Error('Voice note not found');
      }

      // Call transcription service
      const result = await transcriptionService.transcribeAudio(voiceNote.fileId);

      if (result.success && result.text) {
        // Update the voice note with the transcript
        const { error } = await voiceNoteService.updateTranscript(voiceNoteId, result.text);

        if (error) {
          throw error;
        }

        // Update local state
        setVoiceNotes(prev =>
          prev.map(vn =>
            vn.id === voiceNoteId ? { ...vn, transcript: result.text || "" } : vn
          )
        );
      } else {
        throw new Error(result.error || "Failed to transcribe voice note");
      }
    } catch (err) {
      console.error('Error transcribing voice note:', err);
      setError(err instanceof Error ? err.message : 'Failed to transcribe voice note');
    }
  };

  const navigateToEditTranscript = (voiceNoteId: string, transcript: string, fileId: string) => {
    navigate('/entries/edit-transcript', {
      state: {
        voiceNoteId,
        transcript,
        fileId,
        returnPath: location.pathname
      }
    });
  };

  const handleAddToContent = (transcript: string) => {
    setContent(prev => prev + (prev ? '\n\n' : '') + transcript);
  };

  return (
    <Box sx={{ 
      p: 3, 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#1a1a1a'  // Dark background
    }}>
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
        {/* <IconButton
          onClick={() => navigate('/entries')}
          sx={{ mr: 2, color: 'text.primary' }}
          aria-label="back"
        >
          <ArrowBackIcon />
        </IconButton> */}
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={handleCancel}
            disabled={loading}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary'
              }
            }}
            aria-label="cancel"
          >
            <CloseIcon />
          </IconButton>
          <IconButton
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !content.trim()}
            sx={{
              color: 'primary.main',
              '&:hover': {
                color: 'primary.light'
              }
            }}
            aria-label="create entry"
          >
            <CheckIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          flex: 1,
          overflow: 'auto',
        }}
      >
        <TextField
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          fullWidth
          autoFocus
          disabled={loading}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: { 
              fontSize: '2rem',
              color: 'text.primary',
              '&::placeholder': {
                color: 'text.secondary',
              }
            }
          }}
          sx={{
            mb: 2,
            '& .MuiInputBase-root': {
              padding: '8px 0'
            }
          }}
        />

        <TextField
          placeholder="Start writing, drag files or start from a template"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          fullWidth
          multiline
          rows={12}
          disabled={loading}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: { 
              fontSize: '1rem',
              color: 'text.primary',
              '&::placeholder': {
                color: 'text.secondary',
              }
            }
          }}
        />

        <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.12)' }} />

        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'text.primary' }}>Voice Notes</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<MicIcon />}
                onClick={() => setShowRecorder(true)}
                disabled={loading}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(144, 202, 249, 0.08)'
                  }
                }}
              >
                Record
              </Button>
              <Button
                startIcon={<UploadIcon />}
                onClick={() => setShowImporter(true)}
                disabled={loading}
                sx={{
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(144, 202, 249, 0.08)'
                  }
                }}
              >
                Import
              </Button>
            </Box>
          </Box>

          {voiceNotes.map((voiceNote) => (
            <VoiceNotePlayer
              key={voiceNote.id}
              voiceNote={voiceNote}
              editable
              onDelete={() => handleDeleteVoiceNote(voiceNote.id)}
              onTranscribe={() => handleTranscribe(voiceNote.id)}
              onEditTranscript={() => navigateToEditTranscript(voiceNote.id, voiceNote.transcript || '', voiceNote.fileId)}
              onAddToContent={() => voiceNote.transcript && handleAddToContent(voiceNote.transcript)}
            />
          ))}
        </Box>
      </Box>

      <VoiceNoteRecorder
        open={showRecorder}
        onClose={() => setShowRecorder(false)}
        onRecordingComplete={handleRecordingComplete}
      />

      <VoiceNoteImporter
        open={showImporter}
        onClose={() => setShowImporter(false)}
        onRecordingComplete={handleRecordingComplete}
      />
    </Box>
  );
};

export default CreateEntryPage; 