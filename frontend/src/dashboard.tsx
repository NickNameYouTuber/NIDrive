import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { SnackbarProvider } from 'notistack';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';
import MainLayout from './layouts/MainLayout';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { Navigate } from 'react-router-dom';

// Loading fallback component
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

// Protected dashboard wrapper that checks authentication
const ProtectedDashboard = () => {
  const { isAuthenticated, loading } = useAuth();
  const [tokenChecked, setTokenChecked] = React.useState(false);
  const [hasToken, setHasToken] = React.useState(false);

  // Проверка наличия токена в localStorage
  React.useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setHasToken(!!token);
    setTokenChecked(true);
  }, []);

  // Показываем загрузку, пока не проверили токен и состояние авторизации
  if (loading || !tokenChecked) {
    return <PageLoader />;
  }

  // Если нет токена или пользователь не аутентифицирован, перенаправляем на страницу входа
  if (!isAuthenticated || !hasToken) {
    window.location.href = '/login';
    return <PageLoader />;
  }

  return (
    <MainLayout>
      <DashboardPage />
    </MainLayout>
  );
};

// Отрисовка приложения Dashboard
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
          <ProtectedDashboard />
        </SnackbarProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>,
);
