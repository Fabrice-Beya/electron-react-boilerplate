import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  IconButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ServiceFactory } from '../../../../services/ServiceFactory';

const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const authService = ServiceFactory.getAuthService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await authService.updateUserPassword(currentPassword, newPassword);
      if (response.success) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(response.error || 'Failed to update password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate('/settings/account')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Change Password
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Password updated successfully
            </Alert>
          )}

          <TextField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            fullWidth
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            fullWidth
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <TextField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            fullWidth
            sx={{ mb: 3 }}
            disabled={loading}
            error={newPassword !== confirmPassword && confirmPassword !== ''}
            helperText={
              newPassword !== confirmPassword && confirmPassword !== ''
                ? 'Passwords do not match'
                : ''
            }
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => navigate('/settings/account')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                loading ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword
              }
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChangePasswordPage; 