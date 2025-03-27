import { Box, Typography, Button, Container } from '@mui/material';
import logo from '../../../assets/icons/icon_inverted.png';
import { useNavigate } from 'react-router-dom';
import { withAuth } from '../context/withAuth';

const WelcomePage = () => {
  const navigate = useNavigate();

  const navigateToAuth = () => {
    navigate('/auth');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 4,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Box
            component="img"
            src={logo}
            alt="Journy Logo"
            sx={{
              width: 80,
              height: 80,
              objectFit: 'contain',
            }}
          />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h1"
              sx={{
                color: 'text.primary',
                mb: 1,
                fontSize: '2.5rem',
                fontWeight: 'bold',
              }}
            >
              Welcome to Journy
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: '1.125rem',
              }}
            >
              Your journey begins here
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={navigateToAuth}
            size="large"
            sx={{
              mt: 2,
              px: 6,
              py: 1.5,
            }}
          >
            Get Started
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default withAuth(WelcomePage, false); 