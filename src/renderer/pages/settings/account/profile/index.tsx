import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { ServiceFactory } from '../../../../../services/ServiceFactory';

const ProfileSettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const profileService = ServiceFactory.getInstance().getProfileService();
  const authService = ServiceFactory.getInstance().getAuthService();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await profileService.getProfile(user.id);
      setName(profile.fullName || user.user_metadata?.name || '');
    } catch (err) {
      console.error('Error loading profile:', err);
      // If profile doesn't exist, use name from user metadata
      setName(user.user_metadata?.name || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Update auth user metadata
      const authResponse = await authService.updateUserName(name);
      if (!authResponse.success) {
        throw new Error(authResponse.error || 'Failed to update user name');
      }

      // Update or create profile
      try {
        await profileService.updateProfile({
          id: user.id,
          userId: user.id,
          fullName: name,
          username: '',
          avatar_url: '',
          website: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        // If profile doesn't exist, create it
        await profileService.createProfile({
          id: user.id,
          userId: user.id,
          fullName: name,
          username: '',
          avatar_url: '',
          website: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Alert severity="error">User not authenticated</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate('/settings/account')}
          sx={{ mr: 2 }}
          aria-label="back"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Profile Settings
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Update your profile information.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated successfully
        </Alert>
      )}

      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 3 }}
      >
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          disabled={loading}
          sx={{ mb: 3 }}
        />

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/settings/account')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !name.trim() || name === user.user_metadata?.name}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Save Changes'
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfileSettingsPage; 