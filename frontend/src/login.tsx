import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { SnackbarProvider } from 'notistack';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import AuthLayout from './layouts/AuthLayout';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Loading fallback component
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

// Login wrapper that redirects to dashboard if already authenticated
const LoginWrapper = () => {
  const { isAuthenticated, loading } = useAuth();
  
  React.useEffect(() => {
    // Если пользователь уже аутентифицирован, перенаправляем на дашборд
    if (isAuthenticated && !loading) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated, loading]);

  // Показываем загрузку, пока проверяем аутентификацию
  if (loading) {
    return <PageLoader />;
  }
  
  // Если пользователь не аутентифицирован, показываем страницу входа
  return (
    <AuthLayout>
      <LoginPage />
    </AuthLayout>
  );
};

// Отрисовка страницы входа
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <SnackbarProvider 
          maxSnack={3} 
          autoHideDuration={3000}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <LoginWrapper />
        </SnackbarProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
);
