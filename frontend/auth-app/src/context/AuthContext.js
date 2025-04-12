import React, { createContext, useState, useContext, useEffect } from 'react';
import { getToken, setToken, removeToken, getUserData, setUserData, removeUserData, clearAuth } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for user data
    const token = getToken();
    const userData = getUserData();
    
    if (token && userData) {
      try {
        setUser({
          ...userData,
          token
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        clearAuth();
      }
    }
    
    setLoading(false);
  }, []);

  const login = (responseData) => {
    console.log('Login function called with:', responseData);

    const userToStore = {
      id: responseData.user.id,
      name: responseData.user.name,
      email: responseData.user.email,
      role: responseData.user.role
    };

    // Update state
    setUser({
      ...userToStore,
      token: responseData.token
    });

    // Store in localStorage
    setToken(responseData.token);
    setUserData(userToStore);

    console.log('Login successful, user data stored:', userToStore);
  };

  const logout = () => {
    setUser(null);
    clearAuth();
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 