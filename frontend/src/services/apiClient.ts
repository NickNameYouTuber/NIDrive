import axios from 'axios';

// Базовый URL для API - берем из переменных окружения с fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 
                     import.meta.env.VITE_API_BASE_URL || 
                     'https://drive.nicorp.tech/api' || 
                     'http://localhost:7070';

console.log('Using API Base URL:', API_BASE_URL);

// Создаем инстанс axios с базовыми настройками
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // для работы с cookies и авторизацией
});

// Интерцептор для добавления токена авторизации в запросы
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // Используем единое имя токена
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок авторизации
apiClient.interceptors.response.use(
  (response) => response, // Возвращаем ответ без изменений если нет ошибок
  (error) => {
    const originalRequest = error?.config;
    
    // Проверяем, что ошибка 401 и не находимся уже на странице логина
    // чтобы предотвратить бесконечный цикл перенаправлений
    if (
      error?.response?.status === 401 && 
      !originalRequest?._retry && 
      window.location.pathname !== '/login'
    ) {
      console.log('Токен недействителен, выполняется выход из системы...');
      
      // Помечаем запрос как уже обработанный
      if (originalRequest) {
        originalRequest._retry = true;
      }
      
      // Очищаем все токены используя единый формат имен
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenType');
      
      // Перенаправляем на страницу входа
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
