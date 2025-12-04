import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { InventoryStats } from '../types';
import { useAuthStore } from '../store/authStore';

// API response interface for dashboard stats
interface DashboardStatsResponse {
  total_items: number;
  low_stock_items: number;
  total_categories: number;
  total_value: number;
  warehouse_name?: string;
}

// Transform snake_case response to camelCase for frontend
const transformStatsResponse = (data: DashboardStatsResponse): InventoryStats & { warehouseName?: string } => {
  return {
    totalItems: data.total_items,
    lowStockItems: data.low_stock_items,
    totalCategories: data.total_categories,
    totalValue: data.total_value,
    warehouseName: data.warehouse_name,
  };
};

export const useDashboardStats = () => {
  const user = useAuthStore((state) => state.user);

  console.log('[useDashboardStats] Hook called with user:', user);
  console.log('[useDashboardStats] Query enabled:', !!user);

  return useQuery({
    queryKey: ['dashboardStats', user?.role, user?.warehouseId],
    queryFn: async () => {
      console.log('[useDashboardStats] queryFn executing...');
      if (!user) {
        throw new Error('User not authenticated');
      }

      let endpoint = '';

      // Determine endpoint based on user role
      console.log('[Dashboard Stats] Fetching for user:', { role: user.role, warehouseId: user.warehouseId });

      // Normalize role to uppercase for comparison
      const normalizedRole = user.role?.toUpperCase();

      switch (normalizedRole) {
        case 'SUPER_ADMIN':
          endpoint = '/inventories/stats';
          break;
        case 'ADMIN':
        case 'USER':
        case 'WAREHOUSE':
          // For warehouse roles, we need warehouse_id
          if (!user.warehouseId) {
            console.error('[Dashboard Stats] Missing warehouse ID for warehouse role');
            throw new Error('Warehouse ID is required for warehouse role');
          }
          endpoint = `/inventories/${user.warehouseId}/stats`;
          break;
        default:
          throw new Error(`Unsupported user role: ${user.role}`);
      }

      console.log('[Dashboard Stats] Fetching from endpoint:', endpoint);
      console.log('[Dashboard Stats] Full URL will be: ' + (import.meta as any).env?.VITE_API_BASE_URL + endpoint);

      // Make API request
      const response = await apiClient.get<any>(endpoint);
      console.log('[Dashboard Stats] Response received:', response.status, response.data);

      // Handle different API response formats
      let statsData: DashboardStatsResponse;

      console.log('[Dashboard Stats] Raw response.data:', response.data);

      if (response.data.success !== undefined) {
        // Format: { success: true, data: { ... } }
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch dashboard stats');
        }
        statsData = response.data.data;
      } else if (response.data.data) {
        // Format: { data: { ... } }
        statsData = response.data.data;
      } else {
        // Format: Direct response { total_items, low_stock_items, ... }
        console.log('[Dashboard Stats] Using direct response format');
        statsData = response.data;
      }

      // Transform the response to match frontend interface
      console.log('[Dashboard Stats] Received data:', statsData);
      const transformed = transformStatsResponse(statsData);
      console.log('[Dashboard Stats] Transformed data:', transformed);
      return transformed;
    },
    enabled: !!user && (user.role?.toUpperCase() === 'SUPER_ADMIN' || !!user.warehouseId),
    staleTime: 1000 * 60 * 2,
    retry: (failureCount, error: any) => {
      console.error('[Dashboard Stats] Error occurred:', error);
      console.error('[Dashboard Stats] Error response:', error?.response?.data);
      console.error('[Dashboard Stats] Error status:', error?.response?.status);
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    refetchOnMount: true,
  });
};

// Hook specifically for super admin dashboard
export const useSuperAdminDashboardStats = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['superAdminDashboardStats'],
    queryFn: async () => {
      if (!user || user.role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized: Super Admin access required');
      }

      const response = await apiClient.get<any>('/inventories/stats');

      // Handle different API response formats
      let statsData: DashboardStatsResponse;

      if (response.data.success !== undefined) {
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch dashboard stats');
        }
        statsData = response.data.data;
      } else if (response.data.data) {
        statsData = response.data.data;
      } else {
        statsData = response.data;
      }

      return transformStatsResponse(statsData);
    },
    enabled: !!user && user.role === 'SUPER_ADMIN',
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
};

// Hook specifically for warehouse dashboard
export const useWarehouseDashboardStats = (warehouseId: string) => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['warehouseDashboardStats', warehouseId],
    queryFn: async () => {
      const normalizedRole = user?.role?.toUpperCase();
      if (!user || (normalizedRole !== 'ADMIN' && normalizedRole !== 'USER' && normalizedRole !== 'WAREHOUSE')) {
        throw new Error('Unauthorized: Warehouse role required');
      }

      if (!warehouseId) {
        throw new Error('Warehouse ID is required');
      }

      const response = await apiClient.get<any>(`/inventories/${warehouseId}/stats`);

      // Handle different API response formats
      let statsData: DashboardStatsResponse;

      if (response.data.success !== undefined) {
        if (!response.data.success) {
          throw new Error(response.data.error || 'Failed to fetch dashboard stats');
        }
        statsData = response.data.data;
      } else if (response.data.data) {
        statsData = response.data.data;
      } else {
        statsData = response.data;
      }

      return transformStatsResponse(statsData);
    },
    enabled: !!user && !!warehouseId && (user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'USER' || user.role?.toUpperCase() === 'WAREHOUSE'),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });
};