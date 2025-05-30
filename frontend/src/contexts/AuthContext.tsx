import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import api from '../utils/api';

interface User {
  id: string; // Изменено с number на string для поддержки UUID
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  token: string | null;
  login: (data: any) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  token: null,
  login: async () => {},
  logout: () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user is logged in on initial load
    const token = localStorage.getItem('token');
    
    if (token) {
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      // Fetch user data
      const response = await api.get('/users/me');
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      logout();
      setLoading(false);
    }
  };

  const login = async (data: any) => {
    try {
      console.log('Login with data:', data);
      
      // Проверяем, что данные содержат токен
      if (data.access_token) {
        console.log('Полученный токен:', data.access_token);
        
        // Сохраняем токен в локальном хранилище
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        
        // Устанавливаем токен для API
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
        
        // Загружаем данные пользователя с новым токеном
        await fetchUserData(data.access_token);
        return;
      }
      
      // Если нет токена, то отправляем данные на /auth/telegram-login (для обратной совместимости)
      const response = await api.post('/auth/telegram-login', data);
      const { access_token } = response.data;
      
      // Сохраняем токен в локальном хранилище
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Устанавливаем токен для API
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Загружаем данные пользователя с новым токеном
      await fetchUserData(access_token);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    // Remove token from local storage
    localStorage.removeItem('token');
    
    // Token will be automatically handled by the API utility
    setToken(null);
    
    // Clear user state
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
