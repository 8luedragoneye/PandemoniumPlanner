import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authApi, setToken, removeToken } from '../lib/api';

export function useAuth() {
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

  const login = async (name: string) => {
    try {
      const data = await authApi.login(name);
      console.log('Login response:', data);
      if (data && data.user) {
        setUser(data.user as User);
        setAuthVersion(prev => {
          const newVersion = prev + 1;
          console.log('Auth version updated to:', newVersion);
          return newVersion;
        });
        console.log('User state updated:', data.user);
      } else {
        console.error('Invalid login response:', data);
        throw new Error('Invalid response from server');
      }
      return data;
    } catch (error) {
      console.error('Login error in useAuth:', error);
      throw error;
    }
  };

  const register = async (name: string) => {
    try {
      const data = await authApi.register(name);
      console.log('Register response:', data);
      if (data && data.user) {
        setUser(data.user as User);
        setAuthVersion(prev => {
          const newVersion = prev + 1;
          console.log('Auth version updated to:', newVersion);
          return newVersion;
        });
        console.log('User state updated:', data.user);
      } else {
        console.error('Invalid register response:', data);
        throw new Error('Invalid response from server');
      }
      return data;
    } catch (error) {
      console.error('Register error in useAuth:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out...');
    removeToken();
    setUser(null);
    setAuthVersion(prev => {
      const newVersion = prev + 1;
      console.log('Auth version updated to:', newVersion);
      return newVersion;
    });
    console.log('Logout complete, user set to null');
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
