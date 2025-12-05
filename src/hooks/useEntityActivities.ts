import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { ActivityItem } from '../types';
import { useAuthStore } from '../store/authStore';

export interface EntityActivity {
  id: string;
  type: string;
  description: string;
  item_name: string;
  timestamp?: string;
  created_at?: string;
  createdAt?: string;
  user_id: string;
  action: string;
  entity_id: string;
  entity_type: string;
  meta_data?: Record<string, any>;
}

interface UseEntityActivitiesProps {
  entityType: string;
  entityId: string;
  limit?: number;
}

export const useEntityActivities = ({ entityType, entityId, limit = 10 }: UseEntityActivitiesProps) => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: ['entityActivities', entityType, entityId, limit],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!entityType || !entityId) {
        throw new Error('Entity type and ID are required');
      }

      console.log(`[useEntityActivities] Fetching activities for ${entityType}:${entityId}`);

      try {
        // Call the activity entity endpoint
        const response = await apiClient.get(`/activity/entity/${entityType}/${entityId}`, {
          params: {
            limit,
            sort: 'timestamp',
            order: 'desc'
          }
        });

        console.log('[useEntityActivities] Response:', response.data);

        // Handle different response formats
        let activitiesData: EntityActivity[];

        if (response.data.success !== undefined) {
          if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to fetch entity activities');
          }
          activitiesData = response.data.data || [];
        } else if (response.data.data) {
          activitiesData = response.data.data;
        } else {
          activitiesData = response.data;
        }

        // Transform the data to match ActivityItem interface
        const transformedActivities: ActivityItem[] = activitiesData.map((activity: EntityActivity) => {
          // Extract item name based on entity type from meta_data
          let itemName = 'Unknown Item';

          console.log('[useWarehouseActivities] Activity:', {
            entity_type: activity.entity_type,
            meta_data: activity.meta_data,
            description: activity.description
          });

          if (activity.meta_data) {
            if (activity.entity_type === 'warehouse') {
              // For warehouse, get warehouse_name from meta_data
              itemName = activity.meta_data.warehouse_name || 'Unknown Warehouse';
            } else {
              // For everything else, get item_name from meta_data
              itemName = activity.meta_data.item_name || 'Unknown Item';
            }
          }

          const userId = activity.user_id || (activity as any).userId || '';

          // Handle different timestamp field names from API
          const timestamp = activity.timestamp ||
                          (activity as any).created_at ||
                          (activity as any).createdAt ||
                          new Date().toISOString();

          console.log('[useWarehouseActivities] Extracted itemName:', itemName);

          return {
            id: activity.id,
            type: (activity.action || activity.type || 'update') as 'create' | 'update' | 'delete',
            description: activity.description || `${activity.action} ${activity.entity_type}`,
            itemName: itemName,
            timestamp: timestamp,
            userId: userId
          };
        });

        console.log('[useEntityActivities] Transformed activities:', transformedActivities);
        return transformedActivities;
      } catch (error) {
        console.error('[useEntityActivities] Error fetching activities:', error);
        throw error;
      }
    },
    enabled: !!user && !!entityType && !!entityId,
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: (failureCount, error: any) => {
      console.error('[useEntityActivities] Error occurred:', error);
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Specific hook for warehouse activities using dedicated warehouse endpoint
export const useWarehouseActivities = (warehouseId: string, limit = 10) => {
  const user = useAuthStore((state) => state.user);

  console.log('[useWarehouseActivities] Called with:', { warehouseId, limit });

  return useQuery({
    queryKey: ['warehouseActivities', warehouseId, limit],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!warehouseId) {
        throw new Error('Warehouse ID is required');
      }

      console.log(`[useWarehouseActivities] Fetching activities for warehouse: ${warehouseId}`);

      try {
        // Use the dedicated warehouse activities endpoint
        const response = await apiClient.get(`/activity/warehouse/${warehouseId}`, {
          params: {
            limit,
            sort: 'timestamp',
            order: 'desc'
          }
        });

        console.log('[useWarehouseActivities] Response:', response.data);

        // Handle different response formats
        let activitiesData: EntityActivity[];

        if (response.data.success !== undefined) {
          if (!response.data.success) {
            throw new Error(response.data.error || 'Failed to fetch warehouse activities');
          }
          activitiesData = response.data.data || [];
        } else if (response.data.data) {
          activitiesData = response.data.data;
        } else {
          activitiesData = response.data;
        }

        console.log(activitiesData.map((activity) => activity.meta_data), "ACTIVITIES DATA");
        

        // Transform the data to match ActivityItem interface
        const transformedActivities: ActivityItem[] = activitiesData.map((activity: EntityActivity) => {
          // Extract item name based on entity type from meta_data
          let itemName = '';

          if (activity.meta_data) {
            if (activity.entity_type === 'warehouse') {
              // For warehouse, get warehouse_name from meta_data
              itemName = activity.meta_data.warehouse_name || 'Unknown Warehouse';
            } else {
              // For everything else, get item_name from meta_data
              itemName = activity.meta_data.item_name || 'Unknown Item';
            }
          }

          const userId = activity.user_id || (activity as any).userId || '';

          // Handle different timestamp field names from API
          const timestamp = activity.timestamp ||
                          (activity as any).created_at ||
                          (activity as any).createdAt ||
                          new Date().toISOString();
          console.log(itemName, "ITEM NAME");

          return {
            id: activity.id,
            type: (activity.action || activity.type || 'update') as 'create' | 'update' | 'delete',
            description: activity.description || `${activity.action} ${activity.entity_type}`,
            itemName: itemName,
            timestamp: timestamp,
            userId: userId
          };
        });

        console.log('[useWarehouseActivities] Transformed activities:', transformedActivities);
        return transformedActivities;
      } catch (error) {
        console.error('[useWarehouseActivities] Error fetching activities:', error);
        throw error;
      }
    },
    enabled: !!user && !!warehouseId,
    staleTime: 1000 * 60 * 1, // 1 minute
    retry: (failureCount, error: any) => {
      console.error('[useWarehouseActivities] Error occurred:', error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

// Specific hook for inventory activities
export const useInventoryActivities = (inventoryId: string, limit = 10) => {
  return useEntityActivities({
    entityType: 'inventory',
    entityId: inventoryId,
    limit
  });
};

// Generic hook for any entity type
export const useRecentActivities = (entityType: string, entityId: string, limit = 10) => {
  return useEntityActivities({
    entityType,
    entityId,
    limit
  });
};