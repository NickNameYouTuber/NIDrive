import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFoundPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Container disableGutters maxWidth={false} sx={{ height: 'calc(100vh - 64px)', position: 'relative' }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          backgroundImage: `url('/this-is-fine-this-is-fine-dog-meme.gif')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1
          }
        }}
      >
        <Typography 
          variant="h1" 
          gutterBottom
          sx={{ 
            fontFamily: '"Impact", sans-serif',
            color: 'white',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            zIndex: 2,
            fontSize: { xs: '3rem', sm: '5rem', md: '7rem' }
          }}
        >
          404 I'm Fine
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          component={RouterLink}
          to={isAuthenticated ? '/dashboard' : '/'}
          sx={{ 
            mt: 4, 
            position: 'relative', 
            zIndex: 2,
            backgroundColor: 'primary.main',
            '&:hover': { backgroundColor: 'primary.dark' },
            color: 'white',
            px: 4,
            py: 1.5,
            fontSize: '1.2rem'
          }}
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Go to Home Page'}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
