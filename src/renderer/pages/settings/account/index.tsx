import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  ChevronRight as ChevronRightIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const AccountSettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const navigateTo = (path: string) => {
    navigate(`/settings/account/${path}`);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate('/settings')}
          sx={{ mr: 2 }}
          aria-label="back"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Account Settings
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your account settings and personal information.
      </Typography>

      <Paper>
        <List disablePadding>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigateTo('profile')}>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                primary="Profile"
                secondary="Change your profile information"
              />
              <ChevronRightIcon color="action" />
            </ListItemButton>
          </ListItem>

          <Divider />

          <ListItem disablePadding>
            <ListItemButton onClick={() => navigateTo('email')}>
              <ListItemIcon>
                <EmailIcon />
              </ListItemIcon>
              <ListItemText
                primary="Change Email"
                secondary={user?.email || 'No email set'}
              />
              <ChevronRightIcon color="action" />
            </ListItemButton>
          </ListItem>

          <Divider />

          <ListItem disablePadding>
            <ListItemButton onClick={() => navigateTo('password')}>
              <ListItemIcon>
                <LockIcon />
              </ListItemIcon>
              <ListItemText
                primary="Change Password"
                secondary="Update your password"
              />
              <ChevronRightIcon color="action" />
            </ListItemButton>
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
};

export default AccountSettingsPage; 