import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for user data
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        setUser({
          id: parsedUserData.id,
          name: parsedUserData.name,
          email: parsedUserData.email,
          role: parsedUserData.role,
          token: token
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
      }
    }
    
    setLoading(false);
  }, []);

  const login = (responseData) => {
    console.log('Login function called with:', responseData); // Debug log

    // Backend'den gelen veriyi doğru formatta hazırla
    const userToStore = {
      id: responseData.user.id,
      name: responseData.user.name,
      email: responseData.user.email,
      role: responseData.user.role,
      token: responseData.token
    };

    console.log('Formatted user data:', userToStore); // Debug log

    // State'i güncelle
    setUser(userToStore);

    // LocalStorage'a kaydet
    localStorage.setItem('token', responseData.token);
    localStorage.setItem('userData', JSON.stringify(userToStore));

    console.log('Login successful, user data stored:', userToStore);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
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