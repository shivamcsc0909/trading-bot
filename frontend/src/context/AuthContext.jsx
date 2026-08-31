import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tf_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('tf_token'));
  const [loading, setLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Validate stored token with real PHP backend on application load
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('tf_token');
      if (storedToken) {
        try {
          const res = await api.me();
          if (res.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('tf_user', JSON.stringify(res.data.user));
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (err) {
          // If server returned 401 Unauthorized, invalidate session
          if (err.status === 401 || err.status === 403) {
            logout();
          }
          console.warn('[Auth verification]:', err.message);
        }
      }
      setInitialCheckDone(true);
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.success && res.data) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('tf_token', res.data.token);
        localStorage.setItem('tf_user', JSON.stringify(res.data.user));
        return { success: true };
      }
      return { success: false, message: res.message || 'Invalid email or password credentials.' };
    } catch (err) {
      return { success: false, message: err.message || 'Unable to connect to the server. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setToken(null);
    setUser(null);
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, initialCheckDone, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
