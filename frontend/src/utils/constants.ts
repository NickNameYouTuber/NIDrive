// API configuration
// В режиме разработки в Docker контейнерах используем имя сервиса бэкенда
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://backend:7070' 
  : window.location.hostname === 'localhost' 
    ? 'http://localhost:7070' 
    : 'http://backend:7070';

// При локальной разработке используйте 'http://localhost:7070'
// В Docker контейнерах используйте 'http://backend:7070'
