import { create } from 'zustand';
import { apiClient } from '../services/api';
import { InventoryItem, CreateInventoryItem, UpdateInventoryItem, InventoryStats, ApiResponse } from '../types';
import { useAuthStore } from './authStore';
import { toSnakeCase, toCamelCase } from '../utils/apiTransform';

interface InventoryStore {
  items: InventoryItem[];
  isLoading: boolean;
  error: string | null;
  fetchItems: (warehouseId?: string) => Promise<void>;
  addItem: (newItem: CreateInventoryItem) => Promise<InventoryItem>;
  updateItem: (updatedItem: UpdateInventoryItem) => Promise<InventoryItem>;
  deleteItem: (id: string) => Promise<void>;
  getStats: () => InventoryStats;
  getFilteredStats: () => InventoryStats;
  getLowStockItems: () => InventoryItem[];
  getItemsByCategory: (category: string) => InventoryItem[];
  getItemById: (id: string) => InventoryItem | undefined;
  getFilteredItems: () => InventoryItem[];
  getFilteredItemsByWarehouse: (warehouseId?: string) => InventoryItem[];
  getFilteredStatsByWarehouse: (warehouseId?: string) => InventoryStats;
  getLowStockItemsByWarehouse: (warehouseId?: string) => InventoryItem[];
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async (warehouseId?: string) => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');

    console.log('Checking authentication:');
    console.log('- Token exists:', !!token);
    console.log('- User data exists:', !!userData);
    console.log('- Token length:', token ? token.length : 0);
    console.log('- Token preview:', token ? token.substring(0, 20) + '...' : 'N/A');

    if (!token) {
      set({ error: 'No authentication token found', isLoading: false });
      return;
    }

    if (!userData) {
      set({ error: 'No user data found', isLoading: false });
      return;
    }

    try {
      const user = JSON.parse(userData);
      console.log('User data:', { id: user.id, email: user.email, name: user.name });
    } catch (e) {
      console.error('Failed to parse user data:', e);
    }

    set({ isLoading: true, error: null });

    try {
      console.log('Making API request to /inventory...');
      // Use warehouse-specific endpoint if warehouseId is provided
      const endpoint = warehouseId 
        ? `/inventories/warehouse/${warehouseId}`
        : '/inventories';
      const response = await apiClient.get<ApiResponse<InventoryItem[]>>(endpoint);

      console.log('API Response:', response.data);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch inventory items');
      }

      // Transform snake_case to camelCase for frontend
      const transformedItems = toCamelCase(response.data.data || []);
      console.log('Successfully fetched inventory items:', transformedItems.length);
      set({ items: transformedItems, isLoading: false, error: null });
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('403') || errorMessage.includes('401')) {
        console.log('Auth error detected, clearing token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }

      set({ error: errorMessage, isLoading: false });
    }
  },

  addItem: async (newItem: CreateInventoryItem) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const errorMessage = 'No authentication token found';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }

    set({ isLoading: true, error: null });

    try {
      // Transform camelCase to snake_case for API
      const transformedItem = toSnakeCase(newItem);
      const response = await apiClient.post<ApiResponse<InventoryItem>>('/inventories', transformedItem);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to add item');
      }

      const createdItem = toCamelCase(response.data.data);
      set((state) => ({
        items: [...state.items, createdItem],
        isLoading: false,
        error: null,
      }));
      return createdItem;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('403') || errorMessage.includes('401')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }

      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  updateItem: async (updatedItem: UpdateInventoryItem) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const errorMessage = 'No authentication token found';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }

    set({ isLoading: true, error: null });

    try {
      const { id, ...updateData } = updatedItem;
      // Transform camelCase to snake_case for API
      const transformedData = toSnakeCase(updateData);
      const response = await apiClient.put<ApiResponse<InventoryItem>>(`/inventories/${id}`, transformedData);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to update item');
      }

      const updated = toCamelCase(response.data.data);
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updated : item)),
        isLoading: false,
        error: null,
      }));

      return updated;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('403') || errorMessage.includes('401')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }

      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  deleteItem: async (id: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const errorMessage = 'No authentication token found';
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }

    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.delete<ApiResponse<void>>(`/inventories/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to delete item');
      }

      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('403') || errorMessage.includes('401')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }

      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  getStats: () => {
    const { items } = get();
    const totalItems = items.length;
    const lowStockItems = items.filter((item) => item.minStockLevel && item.quantity <= item.minStockLevel).length;
    const totalCategories = new Set(items.map((item) => item.category)).size;
    const totalValue = items.reduce((sum, item) => sum + item.quantity * item.sellPrice, 0);

    return {
      totalItems,
      lowStockItems,
      totalCategories,
      totalValue,
    };
  },

  getFilteredStats: () => {
    const { getFilteredItems } = get();
    const items = getFilteredItems();
    const totalItems = items.length;
    const lowStockItems = items.filter((item) => item.minStockLevel && item.quantity <= item.minStockLevel).length;
    const totalCategories = new Set(items.map((item) => item.category)).size;
    const totalValue = items.reduce((sum, item) => sum + item.quantity * item.sellPrice, 0);

    return {
      totalItems,
      lowStockItems,
      totalCategories,
      totalValue,
    };
  },

  getLowStockItems: () => {
    const { getFilteredItems } = get();
    const items = getFilteredItems();
    return items.filter((item) => item.minStockLevel && item.quantity <= item.minStockLevel);
  },

  // New functions that accept warehouseId parameter
  getFilteredItemsByWarehouse: (warehouseId?: string) => {
    const { items } = get();
    
    // If no warehouse is selected, return all items
    if (!warehouseId) {
      return items;
    }
    
    // Filter items by selected warehouse ID
    return items.filter(item => item.warehouseId === warehouseId);
  },

  getFilteredStatsByWarehouse: (warehouseId?: string) => {
    const { getFilteredItemsByWarehouse } = get();
    const items = getFilteredItemsByWarehouse(warehouseId);
    const totalItems = items.length;
    const lowStockItems = items.filter((item: InventoryItem) => item.minStockLevel && item.quantity <= item.minStockLevel).length;
    const totalCategories = new Set(items.map((item: InventoryItem) => item.category)).size;
    const totalValue = items.reduce((sum: number, item: InventoryItem) => sum + item.quantity * item.sellPrice, 0);

    return {
      totalItems,
      lowStockItems,
      totalCategories,
      totalValue,
    };
  },

  getLowStockItemsByWarehouse: (warehouseId?: string) => {
    const { getFilteredItemsByWarehouse } = get();
    const items = getFilteredItemsByWarehouse(warehouseId);
    return items.filter((item: InventoryItem) => item.minStockLevel && item.quantity <= item.minStockLevel);
  },

  getItemsByCategory: (category: string) => {
    const { items } = get();
    return items.filter((item) => item.category === category);
  },

  getItemById: (id: string) => {
    const { items } = get();
    return items.find((item) => item.id === id);
  },

  getFilteredItems: () => {
    const { items } = get();
    const user = useAuthStore.getState().user;
    const selectedWarehouseId = user?.warehouseId;
    
    // If no warehouse is selected, return all items
    if (!selectedWarehouseId) {
      return items;
    }
    
    // Filter items by selected warehouse ID
    return items.filter(item => item.warehouseId === selectedWarehouseId);
  },
}));
