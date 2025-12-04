import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { InventoryItem, CreateInventoryItem, UpdateInventoryItem, ApiResponse } from '../types';
import { toSnakeCase, toCamelCase } from '../utils/apiTransform';

interface InventoryFilters {
  warehouseId?: string;
  category?: string;
  minStock?: number;
}

// Fetch inventory items with optional filters
export const useInventoryItems = (filters?: InventoryFilters) => {
  return useQuery<InventoryItem[], Error>({
    queryKey: ['inventoryItems', filters],
    queryFn: async () => {
      // Build query parameters
      const params = new URLSearchParams();

      if (filters?.category) {
        params.append('category', filters.category);
      }

      if (filters?.minStock !== undefined && filters.minStock !== null) {
        params.append('min_stock', filters.minStock.toString());
      }

      // Determine endpoint
      let endpoint = filters?.warehouseId
        ? `/inventories/warehouse/${filters.warehouseId}`
        : '/inventories';

      // Append query parameters if any
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }

      // API returns data directly as an array, not wrapped in ApiResponse
      const response = await apiClient.get<any[]>(endpoint);

      console.log('=== DEBUG useInventoryItems ===');
      console.log('Endpoint:', endpoint);
      console.log('Filters:', filters);
      console.log('response.data:', response.data);
      console.log('Is array?:', Array.isArray(response.data));
      console.log('Length:', response.data?.length);

      // Transform snake_case to camelCase for frontend
      const transformedData = toCamelCase(response.data || []);
      console.log('Transformed data:', transformedData);
      console.log('=== END DEBUG ===');

      return transformedData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// console.log('useInventoryItems hook', useInventoryItems());


// Add new inventory item
export const useAddInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation<InventoryItem, Error, CreateInventoryItem>({
    mutationFn: async (newItem: CreateInventoryItem) => {
      // Transform camelCase to snake_case for API
      const transformedItem = toSnakeCase(newItem);
      // API returns data directly, not wrapped in ApiResponse
      const response = await apiClient.post<any>('/inventories', transformedItem);

      // Transform snake_case to camelCase for frontend
      return toCamelCase(response.data);
    },
    onSuccess: () => {
      // Invalidate and refetch inventory items
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
    },
  });
};

// Update inventory item
export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation<InventoryItem, Error, UpdateInventoryItem>({
    mutationFn: async (updatedItem: UpdateInventoryItem) => {
      const { id, ...updateData } = updatedItem;
      // Transform camelCase to snake_case for API
      const transformedData = toSnakeCase(updateData);
      // API returns data directly, not wrapped in ApiResponse
      const response = await apiClient.put<any>(`/inventories/${id}`, transformedData);

      // Transform snake_case to camelCase for frontend
      return toCamelCase(response.data);
    },
    onSuccess: (updatedItem) => {
      // Update the cache with the updated item
      queryClient.setQueryData<InventoryItem[]>(
        ['inventoryItems'],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map(item =>
            item.id === updatedItem.id ? updatedItem : item
          );
        }
      );
    },
  });
};

// Delete inventory item
export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      // API returns data directly, not wrapped in ApiResponse
      await apiClient.delete(`/inventories/${id}`);
    },
    onSuccess: () => {
      // Invalidate and refetch inventory items
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
    },
  });
};