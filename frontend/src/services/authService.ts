import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://drive.nicorp.tech';
const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-type': 'application/json'
  }
});

// Interceptor to add authorization header to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle expired tokens
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenType');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  loginWithTelegram: async (authData: any) => {
    if (isTestMode) {
      console.log('Test mode: Simulating successful Telegram login');
      
      // Return fake token data for test mode
      return {
        access_token: 'test_token_for_development_purposes_only',
        token_type: 'bearer'
      };
    }
    
    const response = await apiClient.post('/api/v1/auth/telegram-login', authData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    if (isTestMode) {
      console.log('Test mode: Returning test user data');
      
      // Return fake user data for test mode
      return {
        telegram_id: '12345678',
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        photo_url: 'https://via.placeholder.com/100',
        used_space: 256,
        quota: 1024
      };
    }
    
    const response = await apiClient.get('/api/v1/users/me');
    return response.data;
  },
  
  getUserStats: async () => {
    if (isTestMode) {
      console.log('Test mode: Returning test user stats');
      
      // Return fake user stats for test mode
      return {
        total_files: 12,
        total_folders: 5,
        used_space: 256,
        quota: 1024,
        usage_percent: 25
      };
    }
    
    const response = await apiClient.get('/api/v1/users/me/stats');
    return response.data;
  }
};

export default apiClient;
