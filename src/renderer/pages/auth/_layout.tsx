import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { withAuth } from '../../context/withAuth';

const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <Outlet />
    </Box>
  );
};

export default withAuth(AuthLayout, false); 