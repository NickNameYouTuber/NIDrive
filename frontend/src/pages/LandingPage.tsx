import React from 'react';
import { Box, Button, Container, Grid, Typography, Paper, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useColorMode } from '../context/ThemeContext';
import IconButton from '@mui/material/IconButton';
import BrightnessMediumIcon from '@mui/icons-material/BrightnessMedium';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SecurityIcon from '@mui/icons-material/Security';
import TelegramIcon from '@mui/icons-material/Telegram';
import StorageIcon from '@mui/icons-material/Storage';

const LandingPage: React.FC = () => {
  const theme = useMuiTheme();
  const { toggleColorMode } = useColorMode();

  const features = [
    {
      icon: <CloudUploadIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: 'Easy File Management',
      description: 'Upload, organize, and share your files with just a few clicks. Create folders, manage permissions, and access your files from anywhere.',
    },
    {
      icon: <SecurityIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: 'Secure Storage',
      description: 'Your files are encrypted and stored securely. Control visibility settings for each file to decide what\'s public and what\'s private.',
    },
    {
      icon: <TelegramIcon fontSize="large" sx={{ color: theme.palette.primary.main }} />,
      title: 'Telegram Authentication',
      description: 'No need to create a new account. Simply log in with your Telegram account for a seamless and secure authentication experience.',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box
        component="header"
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.palette.background.paper,
          boxShadow: 1,
        }}
      >
        <Typography variant="h5" component="div" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
          NIDrive
        </Typography>
        <Box>
          <IconButton onClick={toggleColorMode} color="inherit">
            <BrightnessMediumIcon />
          </IconButton>
          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            color="primary"
            sx={{ ml: 2 }}
          >
            Login
          </Button>
        </Box>
      </Box>

      {/* Hero section */}
      <Box
        sx={{
          pt: 8,
          pb: 6,
          backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
        }}
      >
        <Container maxWidth="md">
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="text.primary"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            Secure Cloud Storage
          </Typography>
          <Typography variant="h5" align="center" color="text.secondary" paragraph>
            Store, share, and manage your files in one secure place. 
            NIDrive offers simple file management with Telegram authentication.
          </Typography>
          <Stack
            sx={{ pt: 4 }}
            direction="row"
            spacing={2}
            justifyContent="center"
          >
            <Button 
              component={RouterLink} 
              to="/login" 
              variant="contained" 
              size="large"
              startIcon={<TelegramIcon />}
            >
              Get Started with Telegram
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              startIcon={<StorageIcon />}
              href="#features"
            >
              Learn More
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* Features section */}
      <Container sx={{ py: 8 }} id="features">
        <Typography variant="h4" align="center" gutterBottom sx={{ mb: 6 }}>
          Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} sm={4}>
              <Paper
                sx={{
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: '100%',
                  borderRadius: 2,
                }}
                elevation={2}
              >
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA section */}
      <Box
        sx={{
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          py: 8,
        }}
      >
        <Container>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={7}>
              <Typography variant="h4" gutterBottom>
                Ready to get started?
              </Typography>
              <Typography variant="body1" paragraph>
                Sign in with your Telegram account to start using NIDrive now. 
                Store up to 1GB of files for free and manage them easily.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' }, mt: { xs: 3, md: 0 } }}>
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                size="large"
                sx={{ 
                  bgcolor: 'white', 
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: theme.palette.grey[100],
                  }
                }}
                startIcon={<TelegramIcon />}
              >
                Sign in with Telegram
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: theme.palette.mode === 'light' 
            ? theme.palette.grey[200]
            : theme.palette.grey[900],
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} NIDrive • Secure Cloud Storage
        </Typography>
      </Box>
    </Box>
  );
};

export default LandingPage;
