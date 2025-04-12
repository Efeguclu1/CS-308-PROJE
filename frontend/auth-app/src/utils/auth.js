// Token management utilities
import axios from 'axios';

const TOKEN_KEY = 'token';
const USER_DATA_KEY = 'userData';

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  if (!token) {
    console.warn('Attempting to set null/undefined token');
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getUserData = () => {
  try {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const setUserData = (userData) => {
  if (!userData) {
    console.warn('Attempting to set null/undefined user data');
    return;
  }
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
};

export const removeUserData = () => {
  localStorage.removeItem(USER_DATA_KEY);
};

export const clearAuth = () => {
  removeToken();
  removeUserData();
};

// Axios interceptor setup
export const setupAxiosInterceptors = (axios) => {
  console.log('Setting up axios interceptors');
  
  // Request interceptor
  axios.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        console.log(`Adding token to request: ${config.url}`);
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn(`No token available for request: ${config.url}`);
      }
      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for handling token expiration
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Response interceptor caught error:', error.message);
      
      if (error.response?.status === 401) {
        // Token expired or invalid
        console.log('401 Unauthorized response detected, clearing auth data');
        clearAuth();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}; 