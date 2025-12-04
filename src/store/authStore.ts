import { create } from 'zustand';
import { AuthUser, LoginCredentials, RegisterData } from '../types';
import { authService } from '../services/authService';

interface AuthStore {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setUserWarehouse: (warehouseId: string) => void;
}

// Initialize auth state from localStorage before creating the store
const initializeAuthState = () => {
  const token = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('user_data');

  if (token && userData) {
    try {
      const user = JSON.parse(userData);
      return {
        user: { ...user, token },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      // If userData is corrupted, clear storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }

  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };
};

const initialState = initializeAuthState();

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });

    try {
      const user = await authService.login(credentials);

      console.log('[AuthStore] Login successful, user:', user);

      localStorage.setItem('auth_token', user.token!);
      localStorage.setItem('user_data', JSON.stringify(user));

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      console.log('[AuthStore] Auth state updated');
    } catch (error) {
      console.error('[AuthStore] Login failed:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication failed',
      });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });

    try {
      // Register but don't auto-login - user needs to login after registration
      await authService.register(data);

      set({
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Registration failed',
      });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  setUserWarehouse: (warehouseId: string) => {
    console.log('[AuthStore] Setting warehouse ID:', warehouseId);
    set((state) => {
      if (state.user) {
        const updatedUser = { ...state.user, warehouseId };
        console.log('[AuthStore] Updated user with warehouse:', updatedUser);
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
        return { user: updatedUser };
      }
      console.warn('[AuthStore] Cannot set warehouse - no user logged in');
      return state;
    });
  },
}));
