// Authentication context to manage user state globally
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create context
export const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      axios
        .get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then((res) => {
          setUser(res.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Token verification failed:', err);
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Register function - accepts full registration data
  const register = async (...args) => {
    try {
      // Handle both object and individual params (backward compatibility)
      let dataToSend = args[0];
      if (typeof args[0] === 'string') {
        // Old format: register(name, email, password)
        const [name, email, password] = args;
        dataToSend = { name, email, password };
      }

      const res = await axios.post('/api/auth/register', dataToSend);
      localStorage.setItem('token', res.data.token);
      setUser(res.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Update user data
  const updateUser = async (userData) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put('/api/auth/update', userData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(res.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Update failed'
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
