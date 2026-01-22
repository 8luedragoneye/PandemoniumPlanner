import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi, removeToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (name: string) => Promise<{ user: User; token: string }>;
  register: (name: string) => Promise<{ user: User; token: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const data = await authApi.getMe();
          setUser(data.user as User);
        } else {
          setUser(null);
        }
      } catch (error) {
        // Token invalid or expired
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          setUser(null);
        } else {
          checkAuth();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (name: string) => {
    try {
      const data = await authApi.login(name);
      if (data && data.user) {
        setUser(data.user as User);
      } else {
        throw new Error('Invalid response from server');
      }
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string) => {
    try {
      const data = await authApi.register(name);
      if (data && data.user) {
        setUser(data.user as User);
      } else {
        throw new Error('Invalid response from server');
      }
      return data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
