import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
// Логотип загружается напрямую из публичной директории

const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [authCode, setAuthCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [checkingStatus, setCheckingStatus] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Создаем функцию проверки статуса авторизации с помощью useCallback
  const checkAuthStatus = useCallback(async () => {
    try {
      console.log('Проверка статуса авторизации для кода:', authCode);
      const response = await api.get(`/auth/check-code?code=${authCode}`);
      console.log('Ответ от сервера:', response.data);
      
      if (response.data.authenticated) {
        console.log('Пользователь авторизован!');
        // Пользователь авторизован, получаем токен и завершаем проверку
        await login(response.data);
        setCheckingStatus(false);
        setIsLoading(false);
        navigate('/');
      }
    } catch (error) {
      console.error('Ошибка при проверке статуса авторизации:', error);
      // Не останавливаем проверку при ошибке, просто логируем
    }
  }, [authCode, login, navigate]);
  
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/drive');
      return;
    }

    // Generate auth code if not exists
    if (!authCode) {
      generateAuthCode();
    }

    // Check auth status every 3 seconds
    let intervalId: NodeJS.Timeout;
    if (authCode && checkingStatus) {
      console.log('Запуск периодической проверки статуса авторизации');
      // Сразу проверяем один раз
      checkAuthStatus();
      // И затем каждые 3 секунды
      intervalId = setInterval(checkAuthStatus, 3000);
    }

    return () => {
      if (intervalId) {
        console.log('Очистка интервала проверки');
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, navigate, authCode, checkingStatus, checkAuthStatus]);

  // Генерируем уникальный код авторизации
  const generateAuthCode = () => {
    // Создаем уникальный код из 6 цифр
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setAuthCode(newCode);

    // Отправляем код на бэкенд для регистрации
    registerAuthCode(newCode);
  };



  // Регистрируем код на бэкенде с повторными попытками при ошибках
  const registerAuthCode = async (code: string) => {
    try {
      console.log('Регистрация кода авторизации:', code);
      const response = await api.post('/auth/register-code', { code });
      console.log('Код успешно зарегистрирован:', response.data);
    } catch (error) {
      console.error('Ошибка при регистрации кода:', error);
      setErrorMessage('Ошибка при создании кода авторизации. Попробуйте обновить страницу.');
    }
  };

  // Начинаем процесс авторизации
  const handleStartAuth = () => {
    setIsLoading(true);
    setCheckingStatus(true);
    
    // Открываем бота с введенным кодом
    const botUrl = `https://t.me/NIDriveBot?start=${authCode}`;
    window.open(botUrl, '_blank');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <img src="/logo.svg" alt="NIDriveBot Logo" className="w-10 h-10 mr-2" />
            <h1 className="text-3xl font-bold text-primary-600">NIDriveBot</h1>
          </div>
          <p className="mt-2 text-gray-600">Ваше персональное хранилище файлов</p>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-primary-50 rounded-md">
            <p className="text-sm text-primary-700">
              Для входа в систему используйте свой аккаунт Telegram. Ваши файлы будут доступны как на веб-сайте, так и через Telegram бота.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col items-center space-y-6">
            <div className="w-full p-4 text-center bg-gray-50 rounded-md border border-gray-200">
              <p className="text-gray-600 mb-2">Ваш код авторизации:</p>
              <div className="text-2xl font-bold tracking-widest text-primary-700">
                {authCode}
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              <p>Нажмите кнопку ниже, чтобы открыть Telegram и отправить код боту</p>
            </div>

            <button
              onClick={handleStartAuth}
              disabled={isLoading}
              className="flex items-center justify-center w-full px-4 py-3 text-white bg-[#0088cc] rounded-md hover:bg-[#0077b5] disabled:bg-[#0088cc]/70 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 mr-2 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {checkingStatus ? 'Ожидание подтверждения...' : 'Проверка авторизации...'}
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm-3.5 6.5l9 3-9 3V8.5z" />
                  </svg>
                  Войти через Telegram
                </>
              )}
            </button>

            {isLoading && (
              <div className="text-sm text-center text-gray-600 animate-pulse">
                {checkingStatus ? 
                  'Ожидание подтверждения в Telegram...' : 
                  'Проверка статуса авторизации...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
