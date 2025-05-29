import axios from 'axios';
import { API_BASE_URL } from './constants';

// Настраиваем базовый URL для всех API запросов
// Используем константу из constants.ts
const baseURL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Добавляем перехватчик для добавления токена к запросам
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

export default api;
