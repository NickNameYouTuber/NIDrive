import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { useTheme } from '../context/ThemeContext';
import IconButton from '@mui/material/IconButton';
import BrightnessMediumIcon from '@mui/icons-material/BrightnessMedium';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const theme = useMuiTheme();
  const { toggleColorMode } = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box component={Link} to="/" sx={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
            NIDrive
          </Typography>
        </Box>
        <IconButton onClick={toggleColorMode} color="inherit">
          <BrightnessMediumIcon />
        </IconButton>
      </Box>

      {/* Main Content */}
      <Container component="main" maxWidth="sm" sx={{ mb: 4, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          {children}
        </Paper>
      </Container>

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

export default AuthLayout;
