import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { SellItem, CreateSellItem, UpdateSellItem } from '../types';
import { toSnakeCase, toCamelCase } from '../utils/apiTransform';

// Helper function to fetch warehouse and inventory names
const enrichSellData = async (sellItems: any[]): Promise<any[]> => {
  const warehouseCache: Record<string, string> = {};
  const inventoryCache: Record<string, string> = {};

  // Fetch all unique warehouse and inventory data
  const warehouseIds = [...new Set(sellItems.map(item => item.warehouseId).filter(Boolean))];
  const inventoryIds = [...new Set(sellItems.map(item => item.inventoryId || item.inventoryItemId).filter(Boolean))];

  // Fetch warehouses
  const warehousePromises = warehouseIds.map(async (id) => {
    try {
      const response = await apiClient.get(`/warehouses/${id}`);
      warehouseCache[id] = response.data?.name || response.data?.data?.name || 'Unknown Warehouse';
    } catch (error) {
      console.error(`Failed to fetch warehouse ${id}:`, error);
      warehouseCache[id] = 'Unknown Warehouse';
    }
  });

  // Fetch inventory items
  const inventoryPromises = inventoryIds.map(async (id) => {
    try {
      const response = await apiClient.get(`/inventories/${id}`);
      const name = response.data?.name ||
                   response.data?.item_name ||
                   response.data?.data?.name ||
                   response.data?.data?.item_name;

      inventoryCache[id] = name || `Item (${id.substring(0, 8)}...)`;

      if (!name) {
        console.warn(`[enrichSellData] No name found for inventory ${id}, response:`, response.data);
      }
    } catch (error: any) {
      console.error(`[enrichSellData] Failed to fetch inventory ${id}:`, error?.response?.status, error?.message);
      // Show item ID instead of "Unknown Item" so user can identify which item has an issue
      inventoryCache[id] = `Item (${id.substring(0, 8)}...)`;
    }
  });

  await Promise.all([...warehousePromises, ...inventoryPromises]);

  // Enrich sell items with names
  return sellItems.map(item => ({
    ...item,
    warehouseName: warehouseCache[item.warehouseId] || 'Unknown Warehouse',
    inventoryName: inventoryCache[item.inventoryId || item.inventoryItemId] || 'Unknown Item',
  }));
};

// Fetch all sell items
export const useSells = () => {
  return useQuery<SellItem[], Error>({
    queryKey: ['sells'],
    queryFn: async () => {
      // API returns data directly as an array, not wrapped in ApiResponse
      const response = await apiClient.get<any[]>('/sell');

    //   console.log('=== DEBUG useSells ===');
    //   console.log('response.data:', response.data);
    //   console.log('Is array?:', Array.isArray(response.data));
    //   console.log('Length:', response.data?.length);

      // Log first item raw structure
      if (response.data && response.data.length > 0) {
        console.log('First item (raw from API):', JSON.stringify(response.data[0], null, 2));
      }

      // Transform snake_case to camelCase for frontend
      const transformedData = toCamelCase(response.data || []);
      console.log('Transformed data:', transformedData);

      // Ensure numeric fields are properly typed and handle different field name formats
      const normalizedData = transformedData.map((item: any) => {
        // Handle both camelCase and snake_case for numeric fields
        const quantity = Number(item.quantity || item.qty) || 0;

        // API returns unit_price and total_price (after camelCase transform: unitPrice, totalPrice)
        const sellPrice = Number(item.unitPrice || item.unit_price || item.sellPrice || item.sell_price || item.price) || 0;
        const totalAmount = Number(item.totalPrice || item.total_price || item.totalAmount || item.total_amount || item.total) || 0;

        // Map inventory_item_id to inventoryId if not already done
        const inventoryId = item.inventoryId || item.inventory_item_id || item.inventoryItemId;
        const warehouseId = item.warehouseId || item.warehouse_id;

        // Handle warehouse name - might be nested or direct
        const warehouseName = item.warehouseName ||
                             item.warehouse_name ||
                             item.warehouse?.name ||
                             item.warehouse?.warehouseName;

        // Handle inventory name - might be nested or direct
        const inventoryName = item.inventoryName ||
                             item.inventory_name ||
                             item.inventoryItem?.name ||
                             item.inventoryItem?.itemName ||
                             item.inventory?.name ||
                             item.inventory?.itemName ||
                             item.itemName;

        return {
          ...item,
          quantity,
          sellPrice,
          totalAmount,
          warehouseName,
          inventoryName,
          inventoryId,
          warehouseId,
        };
      });

      // Debug individual sell items
      if (normalizedData.length > 0) {
        console.log('First sell item details (after normalization):');
        console.log('- warehouseName:', normalizedData[0].warehouseName);
        console.log('- inventoryName:', normalizedData[0].inventoryName);
        console.log('- sellPrice:', normalizedData[0].sellPrice, 'type:', typeof normalizedData[0].sellPrice);
        console.log('- totalAmount:', normalizedData[0].totalAmount, 'type:', typeof normalizedData[0].totalAmount);
        console.log('- quantity:', normalizedData[0].quantity, 'type:', typeof normalizedData[0].quantity);
        console.log('Full normalized item:', JSON.stringify(normalizedData[0], null, 2));
      }
      console.log('=== END DEBUG ===');

      // Enrich with warehouse and inventory names
      const enrichedData = await enrichSellData(normalizedData);
      console.log('[useSells] Enriched data with names:', enrichedData.length > 0 ? enrichedData[0] : 'no data');

      return enrichedData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Add new sell item
export const useAddSell = () => {
  const queryClient = useQueryClient();

  return useMutation<SellItem, Error, CreateSellItem>({
    mutationFn: async (newSell: CreateSellItem) => {
      // Transform camelCase to snake_case for API
      const transformedSell = toSnakeCase(newSell);
      // API returns data directly, not wrapped in ApiResponse
      const response = await apiClient.post<any>('/sell', transformedSell);

      // Transform snake_case to camelCase for frontend
      return toCamelCase(response.data);
    },
    onSuccess: () => {
      // Invalidate and refetch sell items and inventory items
      queryClient.invalidateQueries({ queryKey: ['sells'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
    },
  });
};

// Update sell item
export const useUpdateSell = () => {
  const queryClient = useQueryClient();

  return useMutation<SellItem, Error, UpdateSellItem>({
    mutationFn: async (updatedSell: UpdateSellItem) => {
      const { id, ...updateData } = updatedSell;
      // Transform camelCase to snake_case for API
      const transformedData = toSnakeCase(updateData);
      // API returns data directly, not wrapped in ApiResponse
      const response = await apiClient.put<any>(`/sell/${id}`, transformedData);

      // Transform snake_case to camelCase for frontend
      return toCamelCase(response.data);
    },
    onSuccess: (updatedSell) => {
      // Update the cache with the updated sell item
      queryClient.setQueryData<SellItem[]>(['sells'], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((sell) => (sell.id === updatedSell.id ? updatedSell : sell));
      });
      // Also invalidate inventory items as quantities might have changed
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
    },
  });
};

// Delete sell item
export const useDeleteSell = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      // API returns data directly, not wrapped in ApiResponse
      await apiClient.delete(`/sell/${id}`);
    },
    onSuccess: () => {
      // Invalidate and refetch sell items and inventory items
      queryClient.invalidateQueries({ queryKey: ['sells'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
    },
  });
};
