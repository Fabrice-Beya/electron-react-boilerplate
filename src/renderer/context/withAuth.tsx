import React, { useState, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import theme from '../theme/theme';

/**
 * Higher-order component that handles authentication logic
 * @param Component The component to wrap
 * @param requireAuth Whether authentication is required to access the component
 * @returns The wrapped component with authentication logic
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requireAuth: boolean = true,
): React.FC<P> {
  const WithAuthComponent: React.FC<P> = (props) => {
    const { user, loading, authRefreshing } = useAuth();
    const [initialCheckDone, setInitialCheckDone] = useState(false);
    const navigate = useNavigate();

    // Default route paths
    const authPath = '/auth';
    const defaultRoutePath = '/entries';

    useEffect(() => {
      // Only redirect after the initial loading is complete
      if (!loading) {
        setInitialCheckDone(true);
        // If authentication is required and user is not authenticated, redirect to auth
        if (requireAuth && (!user || (user && !user.id))) {
          navigate(authPath);
        }

        // If authentication is NOT required and user IS authenticated, redirect to entries
        // This is useful for auth pages where we don't want authenticated users to access
        if (!requireAuth && user && user.id) {
          navigate(defaultRoutePath);
        }
      }
    }, [loading, requireAuth, authRefreshing, navigate, user]);

    // Show loading indicator while checking authentication
    if (loading || !initialCheckDone) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: theme.palette.background.default,
          }}
        >
          <CircularProgress 
            size={40}
            sx={{
              color: theme.palette.primary.main
            }}
          />
        </Box>
      );
    }

    // If authentication is required and user is not authenticated, return null
    // (the redirect will happen in the useEffect)
    if (requireAuth && (!user || (user && !user.id))) {
      return null;
    }

    // Render the wrapped component
    return <Component {...props} />;
  };

  // Set display name for debugging purposes
  const componentName = Component.displayName || Component.name || 'Component';
  WithAuthComponent.displayName = `withAuth(${componentName})`;

  return WithAuthComponent;
}

export default withAuth; 