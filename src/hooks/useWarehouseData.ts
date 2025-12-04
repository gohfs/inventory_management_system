import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseService } from '../services/warehouseService';
import { Warehouse, CreateWarehouse } from '../types';

// Fetch all warehouses
export const useWarehouses = () => {
  return useQuery<Warehouse[], Error>({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const warehouses = await warehouseService.getWarehouses();
      return warehouses;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Fetch a single warehouse by ID
export const useWarehouseById = (warehouseId: string | undefined) => {
  return useQuery<Warehouse, Error>({
    queryKey: ['warehouse', warehouseId],
    queryFn: async () => {
      if (!warehouseId) {
        throw new Error('Warehouse ID is required');
      }
      const warehouse = await warehouseService.getWarehouseById(warehouseId);
      return warehouse;
    },
    enabled: !!warehouseId, // Only run query if warehouseId is defined
  });
};

// Create a new warehouse
export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Warehouse, Error, CreateWarehouse>({
    mutationFn: async (data: CreateWarehouse) => {
      const warehouse = await warehouseService.createWarehouse(data);
      return warehouse;
    },
    onSuccess: () => {
      // Invalidate and refetch warehouses
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
};

// Update an existing warehouse
export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();
  
  return useMutation<Warehouse, Error, { id: string; data: Partial<CreateWarehouse> }>({
    mutationFn: async ({ id, data }) => {
      const warehouse = await warehouseService.updateWarehouse(id, data);
      return warehouse;
    },
    onSuccess: () => {
      // Invalidate and refetch warehouses
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
};

// Delete a warehouse
export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await warehouseService.deleteWarehouse(id);
    },
    onSuccess: () => {
      // Invalidate and refetch warehouses
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    },
  });
};