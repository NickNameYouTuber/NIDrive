// API configuration
// Используем абсолютный URL для API через прокси
export const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:7070' 
  : ''; // Пустая строка для относительных URL на одном домене через Nginx

// При локальной разработке используйте 'http://localhost:7070'
// В Docker контейнерах используйте 'http://backend:7070'
