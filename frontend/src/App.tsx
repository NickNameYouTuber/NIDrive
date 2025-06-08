import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { lazy, Suspense, useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Lazy-loaded pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const StoragePage = lazy(() => import('./pages/StoragePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading fallback component
const PageLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [tokenChecked, setTokenChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  // Дополнительная проверка наличия токена в localStorage
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setHasToken(!!token);
    setTokenChecked(true);
  }, []);

  // Показываем загрузку, пока не проверили и токен, и состояние авторизации
  if (loading || !tokenChecked) {
    return <PageLoader />;
  }

  // Если нет токена или пользователь не аутентифицирован, перенаправляем на страницу входа
  if (!isAuthenticated || !hasToken) {
    console.log('Authentication failed, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public route wrapper (redirect to dashboard if authenticated)
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  // If user is authenticated and trying to access login/landing pages
  if (isAuthenticated && 
      (location.pathname === '/login' || location.pathname === '/')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Main App Router
const AppRouter = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={
          <PublicRoute>
            <MainLayout hideNav>
              <LandingPage />
            </MainLayout>
          </PublicRoute>
        } />
        
        <Route path="/login" element={
          <PublicRoute>
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        } />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/storage" element={
          <ProtectedRoute>
            <MainLayout>
              <StoragePage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/storage/:folderId" element={
          <ProtectedRoute>
            <MainLayout>
              <StoragePage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* Not found page */}
        <Route path="*" element={
          <MainLayout hideNav>
            <NotFoundPage />
          </MainLayout>
        } />
      </Routes>
    </Suspense>
  );
};

// Root App component
const App = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;
