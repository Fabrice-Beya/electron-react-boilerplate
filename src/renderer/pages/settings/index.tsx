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
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  ChevronRight as ChevronRightIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  SmartToy as SmartToyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const SettingsPage = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
    setLogoutDialogOpen(false);
  };

  const navigateToAccountSettings = () => {
    navigate('/settings/account');
  };

  return (
    <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardActionArea onClick={() => navigate('/settings/account')}>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">Account Settings</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage your account information and preferences
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardActionArea onClick={() => navigate('/settings/preferences')}>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <SmartToyIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">AI Preferences</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Configure AI provider settings and API endpoints
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      {/* About Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          About
        </Typography>

        <Paper>
          <List disablePadding>
            <ListItem>
              <ListItemIcon>
                <InfoIcon />
              </ListItemIcon>
              <ListItemText
                primary="Version"
                secondary="1.0.0"
              />
            </ListItem>
          </List>
        </Paper>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setLogoutDialogOpen(true)}
            fullWidth
          >
            Logout
          </Button>
        </Box>
      </Box>

      {/* Logout Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>Logout</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to logout?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage; 