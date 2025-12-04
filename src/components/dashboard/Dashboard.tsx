import React from 'react';
import { Link } from '@tanstack/react-router';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { useWarehouseById } from '../../hooks/useWarehouseData';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Stack,
  CircularProgress,
  Skeleton
} from '@mui/material';

const Dashboard: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  // Debug logging
  React.useEffect(() => {
    console.log('[Dashboard] Component mounted');
    console.log('[Dashboard] User:', user);
    console.log('[Dashboard] User role:', user?.role);
    console.log('[Dashboard] User warehouseId:', user?.warehouseId);
  }, [user]);

  const { data: stats, isLoading, error } = useDashboardStats();

  // Fetch warehouse details if user has warehouseId but stats doesn't have warehouse name
  const shouldFetchWarehouse = !!(user?.warehouseId && !stats?.warehouseName);
  const { data: warehouseData } = useWarehouseById(shouldFetchWarehouse ? user?.warehouseId : undefined);

  // Debug logging for query state
  React.useEffect(() => {
    console.log('[Dashboard] Query state:', {
      isLoading,
      error: error?.message,
      hasStats: !!stats,
      stats: stats
    });
    if (stats) {
      console.log('[Dashboard] Stats data:', {
        totalItems: stats.totalItems,
        lowStockItems: stats.lowStockItems,
        totalCategories: stats.totalCategories,
        totalValue: stats.totalValue,
        warehouseName: stats.warehouseName,
        recentActivities: stats.recentActivities?.length
      });
    }
  }, [isLoading, error, stats]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get warehouse name from user or stats
  const getWarehouseName = (): string => {
    // First priority: use warehouse name from API stats
    if (stats?.warehouseName) {
      return stats.warehouseName;
    }
    // Second priority: use warehouse name from separate fetch
    if (warehouseData?.name) {
      return warehouseData.name;
    }
    // Third priority: show warehouse ID if we have it but no name yet
    if (user?.warehouseId) {
      return `Warehouse ${user.warehouseId}`;
    }
    // Default for SUPER_ADMIN or when no warehouse selected
    return 'Dashboard';
  };

  // Loading skeleton component
  const StatCardSkeleton = () => (
    <Card sx={{ flex: '1 1 300px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Skeleton variant="text" width={120} height={24} sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.2)' }} />
            <Skeleton variant="text" width={80} height={48} sx={{ mb: 0.5, bgcolor: 'rgba(255,255,255,0.2)' }} />
            <Skeleton variant="text" width={140} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          </Box>
          <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
        </Box>
      </CardContent>
    </Card>
  );

  // Error state component
  const ErrorState = ({ message }: { message: string }) => {
    console.error('[Dashboard] Error loading data:', message);
    return (
      <Alert severity="error" sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Failed to load dashboard data</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>{message}</Typography>
        <Typography variant="caption" sx={{ display: 'block', mb: 2, opacity: 0.8 }}>
          User: {user?.email} | Role: {user?.role} | Warehouse: {user?.warehouseId || 'None'}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          sx={{ mt: 2 }}
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Alert>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          {getWarehouseName()}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's your inventory overview.
        </Typography>
      </Box>

      {/* Debug Info */}
      {!isLoading && !error && !stats && (
        <Alert severity="warning" sx={{ mb: 4 }}>
          <Typography variant="body2">
            No stats data available. Query may not be enabled.
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            User role: {user?.role} | Warehouse ID: {user?.warehouseId || 'None'}
          </Typography>
        </Alert>
      )}

      {/* Error State */}
      {error && <ErrorState message={error.message} />}

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {isLoading ? (
          // Loading skeletons
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : stats ? (
          <>
            <Card sx={{ flex: '1 1 300px', background: 'linear-gradient(135deg,rgb(42, 74, 109) 0%, #5856D6 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 16px rgba(0, 122, 255, 0.15)' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 1, fontWeight: 500 }}>
                      Total Items
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats.totalItems.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                      products in inventory
                    </Typography>
                  </Box>
                  <Box sx={{ width: 56, height: 56, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.15)' }}>
                    <Typography variant="h2" sx={{ fontSize: '2rem' }}>
                      📦
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ flex: '1 1 300px', background: 'linear-gradient(135deg,rgb(163, 42, 36) 0%, #FF9500 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 16px rgba(255, 59, 48, 0.15)' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 1, fontWeight: 500 }}>
                      Low Stock Items
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats.lowStockItems.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                      need attention
                    </Typography>
                  </Box>
                  <Box sx={{ width: 56, height: 56, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.15)' }}>
                    <Typography variant="h2" sx={{ fontSize: '2rem' }}>
                      ⚠️
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ flex: '1 1 300px', background: 'linear-gradient(135deg,rgb(45, 126, 163) 0%, #007AFF 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 16px rgba(90, 200, 250, 0.15)' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 1, fontWeight: 500 }}>
                      Categories
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats.totalCategories.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                      different categories
                    </Typography>
                  </Box>
                  <Box sx={{ width: 56, height: 56, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.15)' }}>
                    <Typography variant="h2" sx={{ fontSize: '2rem' }}>
                      📂
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ flex: '1 1 300px', background: 'linear-gradient(135deg,rgb(48, 173, 80) 0%, #30D158 100%)', color: 'white', borderRadius: 3, boxShadow: '0 4px 16px rgba(52, 199, 89, 0.15)' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 1, fontWeight: 500 }}>
                      Total Value
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {formatCurrency(stats.totalValue)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>
                      inventory worth
                    </Typography>
                  </Box>
                  <Box sx={{ width: 56, height: 56, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.15)' }}>
                    <Typography variant="h2" sx={{ fontSize: '2rem' }}>
                      💰
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </>
        ) : null}
      </Box>

      {/* Recent Activities Section */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Card sx={{ flex: '1 1 400px', minWidth: '400px' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Recent Activity
            </Typography>
            
            {!isLoading && stats?.recentActivities && stats.recentActivities.length > 0 ? (
              <Stack spacing={2}>
                {stats.recentActivities.slice(0, 5).map((activity) => (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'grey.200'
                    }}
                  >
                    <Typography variant="h6">📝</Typography>
                    <Box flex={1}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {activity.description} - "{activity.item_name}"
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(activity.timestamp)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            ) : !isLoading ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No recent activity
              </Typography>
            ) : (
              <Stack spacing={2}>
                {[1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'grey.200'
                    }}
                  >
                    <Skeleton variant="circular" width={32} height={32} />
                    <Box flex={1}>
                      <Skeleton variant="text" width="80%" height={20} />
                      <Skeleton variant="text" width="40%" height={16} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 400px', minWidth: '400px' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
            </Box>
            
            <Stack spacing={2}>
              <Button
                component={Link}
                to="/inventory"
                variant="contained"
                fullWidth
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0051D5 0%, #3634A3 100%)',
                  },
                }}
              >
                Manage Inventory
              </Button>

              {user?.role === 'SUPER_ADMIN' && (
                <Button
                  component={Link}
                  to="/warehouses"
                  variant="outlined"
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderColor: '#007AFF',
                    color: '#007AFF',
                    '&:hover': {
                      borderColor: '#0051D5',
                      backgroundColor: 'rgba(0, 122, 255, 0.05)',
                    },
                  }}
                >
                  Manage Warehouses
                </Button>
              )}
              
              {(user?.role?.toUpperCase() === 'ADMIN' || user?.role?.toUpperCase() === 'USER' || user?.role?.toUpperCase() === 'WAREHOUSE') && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    You have {stats?.lowStockItems || 0} items requiring attention
                  </Typography>
                </Alert>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      {/* <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Button 
          component={Link}
          to="/inventory"
          variant="contained"
          size="large"
          sx={{ px: 4, py: 1.5 }}
        >
          Manage Inventory
        </Button>
      </Box> */}
    </Container>
  );
};

export default Dashboard;