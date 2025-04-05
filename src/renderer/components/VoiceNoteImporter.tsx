import React, { useState, useRef } from 'react';
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
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Close as CloseIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';

interface VoiceNoteImporterProps {
  open: boolean;
  onClose: () => void;
  onRecordingComplete: (
    file: { uri: string; type: string; name?: string; size?: number },
    duration: number
  ) => void;
}

const VoiceNoteImporter: React.FC<VoiceNoteImporterProps> = ({
  open,
  onClose,
  onRecordingComplete,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError('Please select an audio file');
        setSelectedFile(null);
      }
    }
  };

  const playAudio = () => {
    if (!selectedFile) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(URL.createObjectURL(selectedFile));
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

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
    if (!selectedFile) return;

    const file = {
      uri: URL.createObjectURL(selectedFile),
      type: selectedFile.type,
      name: selectedFile.name,
      size: selectedFile.size,
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
        Import Voice Note
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

          {selectedFile && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={(playbackPosition / duration) * 100}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              sx={{ mb: 2 }}
            >
              Select Audio File
            </Button>

            {selectedFile && (
              <IconButton
                onClick={playAudio}
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

          {selectedFile && (
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
              Selected file: {selectedFile.name}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {selectedFile && (
          <>
            <Button onClick={() => setSelectedFile(null)} color="inherit">
              Discard
            </Button>
            <Button onClick={handleSave} variant="contained">
              Import
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VoiceNoteImporter; 