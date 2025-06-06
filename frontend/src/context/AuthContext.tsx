import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { authService } from '../services/authService';

interface User {
  telegram_id: string;
  username?: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  used_space: number;
  quota: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (authData: any) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Check if running in test mode
  const isTestMode = import.meta.env.VITE_TEST_MODE === 'true';

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        if (token) {
          // Check if token is expired
          try {
            const decodedToken: any = jwt_decode(token);
            const currentTime = Date.now() / 1000;
            
            if (decodedToken.exp > currentTime) {
              // Token is valid, get user info
              const userData = await authService.getCurrentUser();
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              // Token expired, logout
              handleLogout();
            }
          } catch (error) {
            console.error('Invalid token:', error);
            handleLogout();
          }
        }
        
        // If in test mode and no user is authenticated, use test data
        if (isTestMode && !isAuthenticated) {
          console.log('Running in test mode - using test user');
          loadTestUser();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Load test user data in test mode
  const loadTestUser = () => {
    const testUser: User = {
      telegram_id: '12345678',
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      photo_url: 'https://via.placeholder.com/100',
      used_space: 256,
      quota: 1024
    };
    
    // Create fake token and store it
    const fakeToken = 'test_token_for_development_purposes_only';
    localStorage.setItem('accessToken', fakeToken);
    localStorage.setItem('tokenType', 'bearer');
    
    setUser(testUser);
    setIsAuthenticated(true);
  };

  const handleLogin = async (authData: any): Promise<boolean> => {
    try {
      // If in test mode, use test data
      if (isTestMode) {
        loadTestUser();
        return true;
      }
      
      // Otherwise, call real login API
      const response = await authService.loginWithTelegram(authData);
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.access_token);
      localStorage.setItem('tokenType', response.token_type);
      
      // Get user info after successful login
      const userData = await authService.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenType');
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to login page
    navigate('/login');
  };

  const authContextValue: AuthContextType = {
    isAuthenticated,
    user,
    login: handleLogin,
    logout: handleLogout,
    loading,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};
