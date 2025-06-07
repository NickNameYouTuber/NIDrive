import React, { useEffect } from 'react';
import { Box, Typography, Button, Container, keyframes } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Анимация горящей кнопки
const flameAnimation = keyframes`
  0% { text-shadow: 0 0 5px #ff5722, 0 0 10px #ff5722, 0 0 15px #ff9800, 0 0 20px #ff9800; }
  50% { text-shadow: 0 0 10px #ff5722, 0 0 20px #ff5722, 0 0 30px #ff9800, 0 0 40px #ff9800; }
  100% { text-shadow: 0 0 5px #ff5722, 0 0 10px #ff5722, 0 0 15px #ff9800, 0 0 20px #ff9800; }
`;

const buttonHoverAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const NotFoundPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // Убираем скроллбар для этой страницы
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  return (
    <Container 
      disableGutters 
      maxWidth={false} 
      sx={{ 
        height: '100vh', 
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          width: '100%',
          backgroundImage: `url('/this-is-fine-this-is-fine-dog-meme.gif')`,
          backgroundSize: 'auto 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          pt: '10vh',
          pb: '15vh'
        }}
      >
        <Typography 
          variant="h1" 
          gutterBottom
          sx={{ 
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            color: '#FFD700',
            WebkitTextStroke: '2px black',
            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
            position: 'relative',
            zIndex: 2,
            fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
            mb: 6,
            letterSpacing: '0.05em',
            transform: 'rotate(-5deg)'
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
            position: 'relative',
            zIndex: 2,
            backgroundColor: '#ff5722',
            color: '#ffeb3b',
            px: 6,
            py: 2,
            fontSize: '1.8rem',
            fontFamily: '"Comic Sans MS", cursive, sans-serif',
            WebkitTextStroke: '1px black',
            textShadow: '2px 2px 0 #000',
            fontWeight: 'bold',
            borderRadius: '12px',
            animation: `${flameAnimation} 2s infinite`,
            boxShadow: '0 0 20px 5px rgba(255, 87, 34, 0.7)',
            border: '3px solid #ff9800',
            transform: 'rotate(2deg)',
            '&:hover': {
              backgroundColor: '#ff9800',
              animation: `${flameAnimation} 1s infinite, ${buttonHoverAnimation} 1s infinite`,
              transform: 'rotate(-2deg)',
            },
            transition: 'all 0.3s ease'
          }}
        >
          {isAuthenticated ? 'GO TO DASHBOARD!!!1!' : 'GO TO HOME PAGE!!!1!'}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
