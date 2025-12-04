import { apiClient } from './api';
import { SellItem, CreateSellItem, ApiResponse } from '../types';
import { AxiosError } from 'axios';

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

export const sellService = {
  async getSells(): Promise<SellItem[]> {
    try {
      const response = await apiClient.get<any>('/sell');

      // Handle different API response formats
      let sells: SellItem[];

      if (response.data.success !== undefined) {
        // Format: { success: true, data: [...] }
        if (!response.data.success && response.data.error) {
          throw new Error(response.data.error);
        }
        sells = response.data.data || [];
      } else if (response.data.data) {
        // Format: { data: [...] }
        sells = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Format: direct array [...]
        sells = response.data;
      } else {
        sells = [];
      }

      return sells;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getSellById(id: string): Promise<SellItem> {
    try {
      const response = await apiClient.get<any>(`/sell/${id}`);

      // Handle different response formats
      if (response.data.success !== undefined) {
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch sell item');
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

  async createSell(data: CreateSellItem): Promise<SellItem> {
    try {
      const response = await apiClient.post<any>('/sell', data);

      if (response.data.success !== undefined) {
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to create sell item');
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

  async updateSell(id: string, data: Partial<CreateSellItem>): Promise<SellItem> {
    try {
      const response = await apiClient.put<any>(`/sell/${id}`, data);

      if (response.data.success !== undefined) {
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to update sell item');
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

  async deleteSell(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<any>(`/sell/${id}`);

      if (response.data?.success === false) {
        throw new Error(response.data.error || 'Failed to delete sell item');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
