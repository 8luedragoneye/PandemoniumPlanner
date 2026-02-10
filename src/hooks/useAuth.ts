import { useState, useEffect } from 'react';
import { User } from '../types';
import { authApi, removeToken } from '../lib/api';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  login: (name: string) => Promise<{ user: User; token: string }>;
  register: (name: string) => Promise<{ user: User; token: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  authVersion: number;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authVersion, setAuthVersion] = useState(0); // Force re-render on auth changes

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
          // Token was removed
          setUser(null);
        } else {
          // Token was added, re-check auth
          checkAuth();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (name: string): Promise<{ user: User; token: string }> => {
    try {
      const data = await authApi.login(name);
      if (data?.user) {
        setUser(data.user as User);
        setAuthVersion(prev => prev + 1);
      } else {
        throw new Error('Invalid response from server');
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string): Promise<{ user: User; token: string }> => {
    try {
      const data = await authApi.register(name);
      if (data?.user) {
        setUser(data.user as User);
        setAuthVersion(prev => prev + 1);
      } else {
        throw new Error('Invalid response from server');
      }
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = (): void => {
    removeToken();
    setUser(null);
    setAuthVersion(prev => prev + 1);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    authVersion, // Expose version to force re-renders
  };
}
