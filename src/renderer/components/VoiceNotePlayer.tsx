import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Paper,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  TextFields as TranscribeIcon,
} from '@mui/icons-material';
import { ServiceFactory } from '../../services/ServiceFactory';
import { VoiceNote } from '../../types';

interface VoiceNotePlayerProps {
  voiceNote: VoiceNote;
  onDelete?: () => void;
  onTranscribe?: () => void;
  onEditTranscript?: () => void;
  onAddToContent?: () => void;
  editable?: boolean;
  isTranscribing?: boolean;
}

const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  voiceNote,
  onDelete,
  onTranscribe,
  onEditTranscript,
  onAddToContent,
  editable = false,
  isTranscribing = false,
}) => {
  // Add debug log

  const [duration, setDuration] = useState<number>(() => {
    const initialDuration = parseFloat(String(voiceNote.duration));
    return !isNaN(initialDuration) ? initialDuration : 0;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceNoteService = ServiceFactory.getVoiceNoteService();

  useEffect(() => {
    const newDuration = parseFloat(String(voiceNote.duration));
    
    if (!isNaN(newDuration)) {
      setDuration(newDuration);
    }
  }, [voiceNote.duration]);

  useEffect(() => {
    const audio = new Audio(voiceNoteService.getVoiceNoteUrl(voiceNote.fileId));
    audioRef.current = audio;

    // Add debug log

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        const audioDuration = audioRef.current.duration;
       
        // Only use audio duration if stored duration is not available
        if (duration === 0 && typeof audioDuration === 'number' && !isNaN(audioDuration)) {
          setDuration(audioDuration);
        }
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Force load the audio to get metadata
    audio.load();

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audioRef.current = null;
    };
  }, [voiceNote.fileId]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPosition(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setPosition(0);
  };

  const handleError = (e: Event) => {
    setError('Error playing audio file');
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    if (typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Check if transcript is a UUID (common error case)
  const isUUID = (str: string) => {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  // Determine if we have a valid transcript
  const hasValidTranscript = voiceNote.transcript && !isUUID(voiceNote.transcript) && voiceNote.transcript.trim() !== '';

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconButton onClick={togglePlayPause} size="small">
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>

        <Box sx={{ flex: 1, mx: 2 }}>
          <Box sx={{ width: '100%', mb: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={duration > 0 ? (position / duration) * 100 : 0}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {formatTime(position)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatTime(duration)}
            </Typography>
          </Box>
        </Box>

        {editable && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {onDelete && (
              <IconButton onClick={onDelete} size="small" color="error">
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        )}
      </Box>

      {/* Transcript section */}
      <Box sx={{ mt: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{ 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          onClick={() => setShowTranscript(!showTranscript)}
        >
          <span>Transcript</span>
          <span>{showTranscript ? '▼' : '▶'}</span>
        </Typography>

        {showTranscript && (
          <Box sx={{ mt: 1 }}>
            {hasValidTranscript ? (
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {voiceNote.transcript}
                </Typography>
                <Box sx={{ display: 'flex', ml: 1 }}>
                  {onEditTranscript && (
                    <IconButton 
                      size="small" 
                      onClick={onEditTranscript}
                      title="Edit transcript"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  {onAddToContent && (
                    <IconButton 
                      size="small" 
                      onClick={onAddToContent}
                      title="Add to content"
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  No transcript available
                </Typography>
                {onTranscribe && (
                  <IconButton 
                    size="small" 
                    onClick={onTranscribe}
                    disabled={isTranscribing}
                    title="Transcribe audio"
                  >
                    {isTranscribing ? (
                      <CircularProgress size={20} />
                    ) : (
                      <TranscribeIcon fontSize="small" />
                    )}
                  </IconButton>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Paper>
  );
};

export default VoiceNotePlayer; 