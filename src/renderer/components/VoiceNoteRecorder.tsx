import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface VoiceNoteRecorderProps {
  open: boolean;
  onClose: () => void;
  onRecordingComplete: (
    file: { uri: string; type: string; name?: string; size?: number },
    duration: number
  ) => void;
}

const VoiceNoteRecorder: React.FC<VoiceNoteRecorderProps> = ({
  open,
  onClose,
  onRecordingComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open) {
      requestPermissions();
    }
    return () => cleanup();
  }, [open]);

  const cleanup = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsRecording(false);
    setDuration(0);
    setRecordingBlob(null);
    setIsPlaying(false);
    setPlaybackPosition(0);
    setError(null);
  };

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setupMediaRecorder(stream);
    } catch (err) {
      console.error('Error requesting microphone permissions:', err);
      setError('Microphone access is required to record voice notes');
    }
  };

  const setupMediaRecorder = (stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      setRecordingBlob(audioBlob);
      audioChunksRef.current = [];
    };
  };

  const startRecording = () => {
    try {
      if (!mediaRecorderRef.current) {
        setError('Microphone not available');
        return;
      }

      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setDuration(0);
      setRecordingBlob(null);

      // Start timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setDuration((Date.now() - startTime) / 1000);
      }, 100);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
    }
  };

  const stopRecording = () => {
    try {
      if (!mediaRecorderRef.current || !isRecording) return;

      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
      setError('Failed to stop recording');
    }
  };

  const playRecording = () => {
    if (!recordingBlob) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(URL.createObjectURL(recordingBlob));
    audioRef.current = audio;

    audio.addEventListener('timeupdate', () => {
      setPlaybackPosition(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setPlaybackPosition(0);
    });

    audio.play();
    setIsPlaying(true);
  };

  const handleSave = () => {
    if (!recordingBlob) return;

    const file = {
      uri: URL.createObjectURL(recordingBlob),
      type: 'audio/wav',
      name: `voice-note-${Date.now()}.wav`,
      size: recordingBlob.size,
    };

    onRecordingComplete(file, duration);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Record Voice Note
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
          <Typography variant="h2" sx={{ mb: 2, fontFamily: 'monospace' }}>
            {formatTime(isPlaying ? playbackPosition : duration)}
          </Typography>

          {isRecording && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  mr: 1,
                }}
              />
              <Typography color="error" variant="caption">
                Recording
              </Typography>
            </Box>
          )}

          {recordingBlob && !isRecording && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={(playbackPosition / duration) * 100}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            {!recordingBlob ? (
              <IconButton
                onClick={isRecording ? stopRecording : startRecording}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: isRecording ? 'error.main' : 'primary.main',
                  '&:hover': {
                    bgcolor: isRecording ? 'error.dark' : 'primary.dark',
                  },
                }}
              >
                {isRecording ? <StopIcon /> : <MicIcon />}
              </IconButton>
            ) : (
              <IconButton
                onClick={playRecording}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {recordingBlob && (
          <>
            <Button onClick={() => setRecordingBlob(null)} color="inherit">
              Discard
            </Button>
            <Button onClick={handleSave} variant="contained">
              Save
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VoiceNoteRecorder; 