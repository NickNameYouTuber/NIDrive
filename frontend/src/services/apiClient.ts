import axios from 'axios';

// Базовый URL для API - сделаем более универсальным с настраиваемыми вариантами
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
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок и обновления токена
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh-token`, { refresh_token: refreshToken });
        const newAccessToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;
        localStorage.setItem('access_token', newAccessToken);
        localStorage.setItem('refresh_token', newRefreshToken);
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
