import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('canteen_auth_token');
      const savedUser = localStorage.getItem('canteen_user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('canteen_auth_token');
          localStorage.removeItem('canteen_user');
        }
      } else {
        // Auto-login default Kitchen Manager for seamless demo experience if first load
        setUser({
          id: 2,
          email: 'kitchen@canteen.ai',
          full_name: 'Chef Marco Rossi',
          role: 'kitchen_manager'
        });
        localStorage.setItem('canteen_user', JSON.stringify({
          id: 2,
          email: 'kitchen@canteen.ai',
          full_name: 'Chef Marco Rossi',
          role: 'kitchen_manager'
        }));
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authAPI.login(email, password);
      const data = res.data;
      localStorage.setItem('canteen_auth_token', data.access_token);
      const userData = {
        id: data.user_id,
        email: data.email,
        full_name: data.full_name,
        role: data.role
      };
      localStorage.setItem('canteen_user', JSON.stringify(userData));
      setUser(userData);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || 'Invalid login credentials'
      };
    }
  };

  const loginQuick = (roleType) => {
    if (roleType === 'admin') {
      const adminData = {
        id: 1,
        email: 'admin@canteen.ai',
        full_name: 'Dr. Eleanor Vance (Admin)',
        role: 'admin'
      };
      localStorage.setItem('canteen_user', JSON.stringify(adminData));
      setUser(adminData);
    } else {
      const kitchenData = {
        id: 2,
        email: 'kitchen@canteen.ai',
        full_name: 'Chef Marco Rossi (Kitchen Manager)',
        role: 'kitchen_manager'
      };
      localStorage.setItem('canteen_user', JSON.stringify(kitchenData));
      setUser(kitchenData);
    }
  };

  const logout = () => {
    localStorage.removeItem('canteen_auth_token');
    localStorage.removeItem('canteen_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginQuick, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
