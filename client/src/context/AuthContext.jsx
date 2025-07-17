import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        if (isTokenValid(storedToken)) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } else {
          try {
            const refreshed = await attemptTokenRefresh(storedToken);
            if (!refreshed) clearAuth();
          } catch {
            clearAuth();
          }
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const isTokenValid = (token) => {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  const attemptTokenRefresh = async (oldToken) => {
    try {
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${oldToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        localStorage.setItem('token', data.token);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Modified login function with better validation
  const login = async (credentials) => {
    try {
      // First check if credentials object exists
      if (!credentials) {
        throw new Error('Credentials are required');
      }

      // Destructure after verifying credentials exists
      const { email, password } = credentials;
      
      // Now check for empty values
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Trim and validate
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();
      
      if (!trimmedEmail || !trimmedPassword) {
        throw new Error('Email and password cannot be empty');
      }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: trimmedEmail, 
          password: trimmedPassword 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      if (!data.token || !data.user) {
        throw new Error('Invalid server response');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setError(null);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      throw error;
    }
  };

  const logout = () => {
    clearAuth();
    setError(null);
  };

  const authFetch = async (url, options = {}) => {
    if (!token) throw new Error('No authentication token available');
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const refreshed = await attemptTokenRefresh(token);
      if (refreshed) {
        headers['Authorization'] = `Bearer ${token}`;
        response = await fetch(url, { ...options, headers });
      } else {
        logout();
        throw new Error('Session expired. Please log in again.');
      }
    }

    return response;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading,
      error,
      login, 
      logout,
      authFetch,
      isAuthenticated: !!token && isTokenValid(token),
      clearError: () => setError(null)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}