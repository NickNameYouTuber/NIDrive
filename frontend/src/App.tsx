import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FilesPage from './pages/FilesPage';
import UploadPage from './pages/UploadPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import Layout from './components/Layout';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Компонент для обработки обратного вызова Telegram
const TelegramAuthCallback = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('TelegramAuthCallback: Получены параметры', location.search);
    
    // Получаем параметры из URL
    const params = new URLSearchParams(location.search);
    
    // Собираем данные авторизации
    const telegramData: any = {
      id: params.get('id'),
      first_name: params.get('first_name'),
      last_name: params.get('last_name'),
      username: params.get('username'),
      photo_url: params.get('photo_url'),
      auth_date: params.get('auth_date'),
      hash: params.get('hash')
    };

    // Дополнительная отладка
    console.log('TelegramAuthCallback: Данные авторизации', telegramData);

    // Проверяем, что есть все необходимые данные
    if (telegramData.id && telegramData.hash) {
      // Преобразуем auth_date в число или строку, чтобы избежать ошибок типов
      const authDateStr = telegramData.auth_date;
      if (authDateStr) {
        try {
          // Сохраняем и строку, и числовое значение
          telegramData.auth_date_num = parseInt(authDateStr, 10);
        } catch (e) {
          console.error('Ошибка при преобразовании auth_date', e);
        }
      }
      
      login(telegramData)
        .then(() => {
          console.log('TelegramAuthCallback: Успешная авторизация');
          navigate('/');
        })
        .catch((error) => {
          console.error('TelegramAuthCallback: Ошибка авторизации', error);
          navigate('/login');
        });
    } else {
      console.error('Недостаточно данных для авторизации', telegramData);
      navigate('/login');
    }
  }, [login, navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* Публичные маршруты */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<TelegramAuthCallback />} />
      
      {/* Защищенные маршруты пользовательского интерфейса диска */}
      <Route path="/drive" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="upload" element={<UploadPage />} />
      </Route>
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
