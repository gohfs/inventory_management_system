import { apiClient } from './api';
import { Warehouse, CreateWarehouse, ApiResponse } from '../types';
import { AxiosError } from 'axios';

export interface UpdateWarehouse extends Partial<CreateWarehouse> {
  id: string;
}

// Helper to extract error message from axios error
const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data) {
      if (data.detail) return data.detail;
      if (typeof data === 'string') return data;
      if (data.error) return data.error;
      if (data.message) return data.message;
    }
    if (error.code === 'ERR_NETWORK' || !error.response) {
      return 'Unable to connect to server';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const warehouseService = {
  async getWarehouses(): Promise<Warehouse[]> {
    try {
      const response = await apiClient.get<any>('/warehouses');

      // Handle different API response formats
      let warehouses: Warehouse[];

      if (response.data.success !== undefined) {
        // Format: { success: true, data: [...] }
        if (!response.data.success && response.data.error) {
          throw new Error(response.data.error);
        }
        warehouses = response.data.data || [];
      } else if (response.data.data) {
        // Format: { data: [...] }
        warehouses = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Format: direct array [...]
        warehouses = response.data;
      } else {
        warehouses = [];
      }

      return warehouses;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getWarehouseById(id: string): Promise<Warehouse> {
    try {
      const response = await apiClient.get<any>(`/warehouses/${id}`);
      
      // Handle different response formats
      if (response.data.success !== undefined) {
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch warehouse');
        }
        return response.data.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async createWarehouse(data: CreateWarehouse): Promise<Warehouse> {
    try {
      const response = await apiClient.post<any>('/warehouses', data);

      if (response.data.success !== undefined) {
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to create warehouse');
        }
        return response.data.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async updateWarehouse(id: string, data: Partial<CreateWarehouse>): Promise<Warehouse> {
    try {
      const response = await apiClient.put<any>(`/warehouses/${id}`, data);

      if (response.data.success !== undefined) {
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to update warehouse');
        }
        return response.data.data;
      } else if (response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async deleteWarehouse(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<any>(`/warehouses/${id}`);

      if (response.data?.success === false) {
        throw new Error(response.data.error || 'Failed to delete warehouse');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async selectWarehouse(warehouseId: string): Promise<void> {
    try {
      const response = await apiClient.post<any>('/user/select-warehouse', {
        warehouseId,
      });

      if (response.data?.success === false) {
        throw new Error(response.data.error || 'Failed to select warehouse');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
