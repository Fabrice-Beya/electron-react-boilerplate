import { createTheme } from '@mui/material/styles';

// Define semantic colors based on the palette from mobile app
const colors = {
  primary: {
    main: '#7c3aed', // purple[500]
    light: '#9d5cff', // purple[300]
    dark: '#5b21b6', // purple[700]
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#6b7280', // gray[500]
    light: '#d1d5db', // gray[300]
    dark: '#374151', // gray[700]
    contrastText: '#ffffff',
  },
  background: {
    default: '#1a1f2c', // dark navy
    paper: '#1f2937', // slightly lighter
  },
  text: {
    primary: '#ffffff',
    secondary: '#9ca3af',
    disabled: '#4b5563',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#b91c1c',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#b45309',
  },
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#1d4ed8',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
};

// Create theme instance
const theme = createTheme({
  palette: {
    mode: 'dark',
    ...colors,
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
  shape: {
    borderRadius: 24,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 24,
          padding: '8px 24px',
          fontSize: '1rem',
        },
        containedPrimary: {
          backgroundColor: colors.primary.light,
          '&:hover': {
            backgroundColor: colors.primary.main,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: colors.background.paper,
        },
      },
    },
  },
});

export default theme; 