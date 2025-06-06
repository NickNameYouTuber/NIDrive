import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useAuth } from '../context/AuthContext';

const NotFoundPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center',
          py: 4
        }}
      >
        <SearchOffIcon sx={{ fontSize: 100, color: 'text.secondary', mb: 4 }} />
        
        <Typography variant="h3" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          component={RouterLink}
          to={isAuthenticated ? '/dashboard' : '/'}
        >
          {isAuthenticated ? 'Go to Dashboard' : 'Go to Home Page'}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
