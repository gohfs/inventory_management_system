import { apiClient } from './api';
import { LoginCredentials, RegisterData, AuthUser, ApiResponse } from '../types';
import { AxiosError } from 'axios';

interface AuthResponse {
  id: string;
  email: string;
  name: string;
  token: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
}

// Helper to extract error message from axios error
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    
    // Check for error message in API response
    if (data) {
      // Prioritize 'detail' (FastAPI format) first
      if (data.detail) return data.detail;
      if (typeof data === 'string') return data;
      if (data.error) return data.error;
      if (data.message) return data.message;
      if (data.msg) return data.msg;
      if (data.errors && Array.isArray(data.errors)) {
        return data.errors.map((e: any) => e.message || e.msg || e).join(', ');
      }
    }
    
    // Handle specific status codes as fallback
    if (error.response?.status === 401) {
      return 'Invalid email or password';
    }
    if (error.response?.status === 400) {
      return 'Invalid request. Please check your input.';
    }
    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }
    
    // Network errors
    if (error.code === 'ERR_NETWORK') {
      return 'Unable to connect to server. Please check your connection.';
    }
    if (error.code === 'ECONNABORTED') {
      return 'Request timeout. Please try again.';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const response = await apiClient.post<any>(
        '/auth/login',
        credentials
      );

      // Handle different API response formats
      // Format 1: { success: true, data: { ... } }
      // Format 2: { id, email, name, token, role } (direct response)
      // Format 3: { data: { ... } } (without success flag)
      
      let userData: AuthResponse;
      
      if (response.data.success !== undefined) {
        // Format 1: Wrapped response with success flag
        if (!response.data.success) {
          throw new Error(response.data.error || 'Login failed');
        }
        userData = response.data.data;
      } else if (response.data.data) {
        // Format 3: Wrapped without success flag
        userData = response.data.data;
      } else {
        // Format 2: Direct response
        userData = response.data;
      }

      const { id, email, name, token, role } = userData;

      console.log('Login response - User role:', role); // Debug log

      return {
        id,
        email,
        name,
        token,
        role: role || 'USER', // Default to USER if role not provided
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async register(data: RegisterData): Promise<AuthUser> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/register',
        {
          name: data.name,
          email: data.email,
          password: data.password,
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Registration failed');
      }

      const { id, email, name, token, role } = response.data.data;

      return {
        id,
        email,
        name,
        token,
        role: role || 'USER', // Default to USER for new registrations
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async logout(): Promise<void> {
    // If you have a logout endpoint on backend, call it here
    // await apiClient.post('/auth/logout');

    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  async verifyToken(): Promise<boolean> {
    try {
      // If you have a token verification endpoint, use it
      // const response = await apiClient.get('/auth/verify');
      // return response.data.success;

      // For now, just check if token exists
      const token = localStorage.getItem('auth_token');
      return !!token;
    } catch (error) {
      return false;
    }
  },
};
