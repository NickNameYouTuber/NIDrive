import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AuthSuccessPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  // Таймер обратного отсчета
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-dark-bg">
      <div className="bg-white dark:bg-dark-card shadow-xl rounded-lg p-8 max-w-md w-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white">Вход выполнен успешно!</h2>
          
          {user && (
            <div className="my-4 p-4 bg-gray-50 dark:bg-dark-border rounded-lg">
              <div className="flex items-center mb-2">
                {(user as any).photo_url && (
                  <img 
                    src={(user as any).photo_url} 
                    alt={user.first_name || 'User'} 
                    className="w-10 h-10 rounded-full mr-3"
                  />
                )}
                <div className="text-left">
                  <p className="font-medium dark:text-white">
                    {user.first_name} {user.last_name}
                    {user.username && <span className="text-gray-500 dark:text-gray-400 ml-1">@{user.username}</span>}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Вы будете перенаправлены на панель управления через {countdown} сек...
            <span className="block mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">Вкладку с Telegram ботом можно закрыть.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Перейти сейчас
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSuccessPage;
