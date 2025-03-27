import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Mic as MicIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ServiceFactory } from '../../../../services/ServiceFactory';

interface LocationState {
  voiceNoteId: string;
  transcript: string;
  returnPath: string;
  fileId: string;
}

const EditTranscriptPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [transcript, setTranscript] = useState(state?.transcript || '');
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voiceNoteService = ServiceFactory.getVoiceNoteService();
  const transcriptionService = ServiceFactory.getTranscriptionService();

  const handleTranscribe = async () => {
    if (!state?.fileId) {
      setError('Voice note file ID not found');
      return;
    }

    setTranscribing(true);
    setError(null);

    try {
      const result = await transcriptionService.transcribeAudio(state.fileId);

      if (result.success && result.text) {
        setTranscript(result.text);
      } else {
        throw new Error(result.error || 'Failed to transcribe audio');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to transcribe audio');
    } finally {
      setTranscribing(false);
    }
  };

  const handleSave = async () => {
    if (!state?.voiceNoteId) return;
    
    setSaving(true);
    setError(null);

    try {
      const { error } = await voiceNoteService.updateTranscript(
        state.voiceNoteId,
        transcript.trim()
      );

      if (error) throw error;

      if (state.returnPath) {
        navigate(state.returnPath, {
          state: {
            updatedTranscript: transcript.trim(),
            voiceNoteId: state.voiceNoteId
          }
        });
      } else {
        navigate(-1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transcript');
      setSaving(false);
    }
  };

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
          Edit Transcript
        </Typography>
      </Box>

      <Paper
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          flex: 1,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            startIcon={transcribing ? <CircularProgress size={20} /> : <MicIcon />}
            onClick={handleTranscribe}
            disabled={transcribing || saving}
            variant="outlined"
          >
            {transcribing ? 'Transcribing...' : 'Transcribe Audio'}
          </Button>
        </Box>

        <TextField
          label="Transcript"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          multiline
          rows={12}
          fullWidth
          disabled={saving}
        />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate(-1)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !transcript.trim()}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EditTranscriptPage; 