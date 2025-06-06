import React, { useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import TelegramIcon from '@mui/icons-material/Telegram';

// Define the type for the Telegram data received from widget
interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

// Define the props for Telegram login component
interface TelegramLoginButtonProps {
  botName: string;
  dataOnauth: (user: TelegramUserData) => void;
  buttonSize: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: string;
}

// Declare global TelegramLoginWidget
declare global {
  interface Window {
    TelegramLoginWidget: any;
    onTelegramAuth: (user: TelegramUserData) => void;
  }
}

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

  // Handle Telegram auth data
  const handleTelegramResponse = async (userData: TelegramUserData) => {
    try {
      const success = await login(userData);
      
      if (success) {
        enqueueSnackbar('Login successful', { variant: 'success' });
        navigate('/dashboard');
      } else {
        enqueueSnackbar('Login failed. Please try again.', { variant: 'error' });
      }
    } catch (error) {
      console.error('Login error:', error);
      enqueueSnackbar('An error occurred during login', { variant: 'error' });
    }
  };

  // Setup Telegram login widget
  useEffect(() => {
    // If in test mode, auto-login
    if (isTestMode && !isAuthenticated) {
      console.log('Test mode: Auto-logging in...');
      
      // Create test user data similar to what Telegram widget would return
      const testUserData = {
        id: 12345678,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        photo_url: 'https://via.placeholder.com/100',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'testtelegramhash123456789'
      };
      
      // Auto login with test data
      setTimeout(() => {
        handleTelegramResponse(testUserData);
      }, 1000);
      
      return;
    }

    // Set global callback for telegram widget
    window.onTelegramAuth = (user: TelegramUserData) => {
      handleTelegramResponse(user);
    };

    // Load Telegram widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', import.meta.env.VITE_TELEGRAM_BOT_NAME || 'nidrivebot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'false');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    // Find container and append script
    const container = document.getElementById('telegram-login-container');
    if (container) {
      // Clear container first
      container.innerHTML = '';
      container.appendChild(script);
    }

    // Cleanup function
    return () => {
      if (container) {
        container.innerHTML = '';
      }
      delete window.onTelegramAuth;
    };
  }, [isAuthenticated, isTestMode]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', textAlign: 'center', py: 3 }}>
      <TelegramIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
      <Typography variant="h4" gutterBottom>
        Sign in with Telegram
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph sx={{ mb: 4 }}>
        Securely access your cloud storage using your Telegram account
      </Typography>
      
      {isTestMode && (
        <Alert severity="info" sx={{ mb: 3, mx: 'auto', maxWidth: 400 }}>
          Running in test mode. Auto-login will be performed.
        </Alert>
      )}
      
      {/* Container for Telegram login button */}
      <Box 
        id="telegram-login-container" 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: 60 
        }}
      >
        {!isTestMode && <CircularProgress size={24} />}
      </Box>

      <Typography variant="body2" color="textSecondary" sx={{ mt: 4 }}>
        By logging in, you agree to our Terms of Service and Privacy Policy
      </Typography>
    </Box>
  );
};

export default LoginPage;
