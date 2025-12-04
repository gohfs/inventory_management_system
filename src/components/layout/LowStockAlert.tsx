import React, { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInventoryItems } from '../../hooks/useInventory';
import { useAuthStore } from '../../store/authStore';
import { Alert, Box, Button, Typography, Chip } from '@mui/material';
import { Warning, ChevronRight } from '@mui/icons-material';

const LowStockAlert: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Fetch inventory items for the user's warehouse
  const filters = useMemo(() => ({
    warehouseId: user?.warehouseId,
  }), [user?.warehouseId]);

  const { data: items = [], isLoading } = useInventoryItems(filters);

  // Calculate low stock items (items with quantity below 50)
  const lowStockItems = useMemo(() => {
    return items.filter(item => item.quantity < 50);
  }, [items]);

  // Get text for multiple items
  const getItemsCountText = (count: number): string => {
    if (count === 1) return 'item';
    if (count === 2) return 'couple of items';
    return 'several items';
  };

  const handleViewInventory = () => {
    navigate({ to: '/inventory' });
  };

  // Don't show if:
  // - Still loading
  // - No low stock items
  // - User is super admin (no warehouse assigned)
  const shouldShow = !isLoading && lowStockItems.length > 0 && user?.warehouseId;

  if (!shouldShow) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        width: '100vw',
        left: 0,
        right: 0,
        ml: 'calc(-50vw + 50%)',
        mr: 'calc(-50vw + 50%)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Alert
        severity="warning"
        icon={<Warning fontSize="small" />}
        action={
          <Button
            size="small"
            variant="text"
            endIcon={<ChevronRight fontSize="small" />}
            onClick={handleViewInventory}
            sx={{
              bgcolor: 'rgba(255, 153, 0, 0.71)',
              color: 'white',
              textTransform: 'none',
              fontWeight: 500,
              px: 1.5,
              py: 0.5,
              minWidth:150,
              minHeight: 'auto',
              '&:hover': {
                backgroundColor: 'rgba(255, 153, 0, 0.57)',
              },
            }}
          >
            View Items
          </Button>
        }
        sx={{
          borderRadius: 0,
          px: 3,
          py: 1,
          alignItems: 'center',
          '& .MuiAlert-message': {
            width: '100%',
            py: 0,
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiAlert-icon': {
            py: 0,
            alignItems: 'center',
          },
          '& .MuiAlert-action': {
            py: 0,
            alignItems: 'center',
            pl: 1,
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
          <Typography variant="body2" sx={{ fontWeight: 600, mr: 0.5 }}>
            Low Stock:
          </Typography>
          <Typography variant="body2">
            {lowStockItems.length === 1 ? (
              <>
                <strong>{lowStockItems[0].name}</strong> ({lowStockItems[0].quantity} left)
              </>
            ) : (
              <>
                <strong>{getItemsCountText(lowStockItems.length)}</strong> below 50:
              </>
            )}
          </Typography>
          {lowStockItems.length > 1 && (
            <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center">
              {lowStockItems.slice(0, 5).map((item) => (
                <Chip
                  key={item.id}
                  label={`${item.name} (${item.quantity})`}
                  size="small"
                  sx={{
                    height: '22px',
                    fontSize: '0.75rem',
                    backgroundColor: 'rgba(255, 152, 0, 0.2)',
                    color: 'warning.dark',
                    fontWeight: 500,
                    '& .MuiChip-label': {
                      px: 1,
                    },
                  }}
                />
              ))}
              {lowStockItems.length > 5 && (
                <Chip
                  label={`+${lowStockItems.length - 5} more`}
                  size="small"
                  sx={{
                    height: '22px',
                    fontSize: '0.75rem',
                    backgroundColor: 'rgba(255, 152, 0, 0.3)',
                    color: 'warning.dark',
                    fontWeight: 600,
                    '& .MuiChip-label': {
                      px: 1,
                    },
                  }}
                />
              )}
            </Box>
          )}
        </Box>
      </Alert>
    </Box>
  );
};

export default LowStockAlert;
