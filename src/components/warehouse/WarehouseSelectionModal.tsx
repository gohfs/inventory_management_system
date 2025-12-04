import React, { useState, useEffect, useMemo } from 'react';
import { useWarehouses } from '../../hooks/useWarehouseData'; // Updated import
import { Warehouse } from '../../types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputAdornment,
  CircularProgress,
  Alert,
  TextField,
  Button,
} from '@mui/material';
import { Search, Warehouse as WarehouseIcon, ArrowBack } from '@mui/icons-material';

interface WarehouseSelectionModalProps {
  open: boolean;
  userName: string;
  onSelect: (warehouseId: string) => void;
  onBack: () => void;
}

const WarehouseSelectionModal: React.FC<WarehouseSelectionModalProps> = ({
  open,
  userName,
  onSelect,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Use the new hook for fetching warehouses
  const { data: warehouses = [], isLoading, error, refetch } = useWarehouses();

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(
      (warehouse) =>
        warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [warehouses, searchTerm]);

  const handleWarehouseSelect = async (warehouseId: string) => {
    setIsSubmitting(true);
    setLocalError(null);
    try {
      // Instead of calling backend API, just notify parent component
      onSelect(warehouseId);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to select warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarehouseIcon color="primary" />
          <Typography variant="h6" component="span">
            Warehouse Selection
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Hi {userName}, Which warehouse this time?
          </Typography>
        </Box>

        {(error || localError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error?.message || localError}
          </Alert>
        )}

        <TextField
          fullWidth
          placeholder="Search warehouses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : filteredWarehouses.length === 0 ? (
          <Box textAlign="center" py={3}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'No warehouses found' : 'No warehouses available'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            {filteredWarehouses.map((warehouse) => (
              <ListItem key={warehouse.id} disablePadding>
                <ListItemButton
                  onClick={() => handleWarehouseSelect(warehouse.id)}
                  disabled={isSubmitting}
                >
                  <ListItemText
                    primary={warehouse.name}
                    secondary={warehouse.location}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onBack}
          startIcon={<ArrowBack />}
          disabled={isSubmitting}
        >
          Back to Login
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WarehouseSelectionModal;
