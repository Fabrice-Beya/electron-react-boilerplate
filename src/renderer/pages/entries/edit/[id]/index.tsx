import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Mic as MicIcon,
  Close as CloseIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { ServiceFactory } from '../../../../../services/ServiceFactory';
import { Entry, VoiceNote } from '../../../../../types';
import { globalState } from '../..';
import VoiceNotePlayer from '../../../../components/VoiceNotePlayer';
import VoiceNoteRecorder from '../../../../components/VoiceNoteRecorder';

const EditEntryPage = () => {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const entriesService = ServiceFactory.getEntriesService();
  const voiceNoteService = ServiceFactory.getVoiceNoteService();
  const transcriptionService = ServiceFactory.getTranscriptionService();

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
        setFormData({
          title: data.title,
          content: data.content,
        });
        setVoiceNotes(data.voicenotes || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entry');
      } finally {
        setLoading(false);
      }
    };

    loadEntry();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`Updating ${name} to:`, value);
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value,
      };
      console.log('New form data:', newData);
      return newData;
    });
  };

  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  useEffect(() => {
    console.log('Entry updated:', entry);
  }, [entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !entry) return;

    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await entriesService.updateEntry(
        id,
        { 
          title: formData.title, 
          content: formData.content 
        },
        voiceNotes,
        false // Not a draft
      );

      if (updateError) {
        throw updateError;
      }

      // Set flag to refresh entries list when returning
      globalState.shouldRefreshEntries = true;
      navigate(`/entries/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update entry');
      setSaving(false);
    }
  };

  const handleRecordingComplete = async (
    file: { uri: string; type: string; name?: string; size?: number },
    duration: number
  ) => {
    try {
      setError(null);
      
      // Create the voice note
      const { data: voiceNote, error } = await voiceNoteService.createVoiceNote(
        {
          uri: file.uri,
          type: 'audio/wav',
          name: `voice-note-${Date.now()}.wav`,
          size: file.size,
        },
        {
          duration,
          userId: entry?.userId || '',
          entryId: id,
        }
      );

      if (error) throw error;
      if (!voiceNote) throw new Error('Failed to create voice note');

      // Add the new voice note to the list
      setVoiceNotes(prev => [...prev, voiceNote]);
    } catch (err) {
      console.error('Error creating voice note:', err);
      setError(err instanceof Error ? err.message : 'Failed to save voice note');
    }
  };

  const handleDeleteVoiceNote = async (voiceNoteId: string) => {
    try {
      setError(null);
      
      // Remove the voice note from the entry
      const { error } = await entriesService.removeVoiceNote(id!, voiceNoteId, true);
      
      if (error) throw error;

      // Update the local state
      setVoiceNotes(prev => prev.filter(vn => vn.id !== voiceNoteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete voice note');
    }
  };

  const handleTranscribeVoiceNote = async (voiceNoteId: string) => {
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

  const handleAddToContent = (transcript: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + (prev.content ? '\n\n' : '') + transcript,
    }));
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

  return (
    <Box sx={{ 
      p: 3, 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: '#1a1a1a'
    }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={() => navigate(`/entries/${id}`)}
          sx={{ mr: 2, color: 'text.primary' }}
          aria-label="back"
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={() => navigate(`/entries/${id}`)}
            disabled={saving}
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
            disabled={
              saving ||
              !formData.title.trim() ||
              !formData.content.trim() ||
              (formData.title === entry.title && 
               formData.content === entry.content &&
               voiceNotes.length === entry.voicenotes.length)
            }
            sx={{
              color: 'primary.main',
              '&:hover': {
                color: 'primary.light'
              }
            }}
            aria-label="save changes"
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
          name="title"
          placeholder="Title"
          value={formData.title || ''}
          onChange={handleChange}
          required
          fullWidth
          disabled={saving}
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
          name="content"
          placeholder="Start writing, drag files or start from a template"
          value={formData.content || ''}
          onChange={handleChange}
          required
          fullWidth
          multiline
          rows={12}
          disabled={saving}
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
            <Button
              startIcon={<MicIcon />}
              onClick={() => setShowRecorder(true)}
              disabled={saving}
              sx={{
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(144, 202, 249, 0.08)'
                }
              }}
            >
              Record Voice Note
            </Button>
          </Box>

          {voiceNotes.map((voiceNote) => (
            <VoiceNotePlayer
              key={voiceNote.id}
              voiceNote={voiceNote}
              editable
              onDelete={() => handleDeleteVoiceNote(voiceNote.id)}
              onTranscribe={() => handleTranscribeVoiceNote(voiceNote.id)}
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
    </Box>
  );
};

export default EditEntryPage; 