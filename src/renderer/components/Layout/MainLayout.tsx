import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
} from '@mui/material';
import {
  NotesOutlined,
  ChatOutlined,
  SettingsOutlined,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../../../assets/icons/icon_inverted.png';

const DRAWER_WIDTH = 240;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const navigationItems = [
    { text: 'Entries', icon: <NotesOutlined />, path: '/entries' },
    { text: 'AI Chat', icon: <ChatOutlined />, path: '/ai' },
    { text: 'Settings', icon: <SettingsOutlined />, path: '/settings' },
  ];

  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Journy
        </Typography>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setDrawerOpen(false);
              }}
            >
              <ListItemIcon sx={{ color: 'text.primary' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '100vh' }}>
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            bgcolor: '#1a1a1a',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          },
        }}
      >
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'auto',
          position: 'relative',
          bgcolor: '#1a1a1a',
          pl: '72px', // Add left padding to account for the menu icon
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
          }}
        >
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              p: 0,
              width: 40,
              height: 40,
              '&:hover': {
                bgcolor: 'transparent',
              },
            }}
          >
            <MenuIcon sx={{ color: 'text.primary', fontSize: 32 }} />
          </IconButton>
        </Box>
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout; 