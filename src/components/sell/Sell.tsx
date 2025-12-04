import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { useSells, useAddSell, useUpdateSell, useDeleteSell } from '../../hooks/useSell';
import { useWarehouses } from '../../hooks/useWarehouseData';
import { useInventoryItems } from '../../hooks/useInventory';
import { extractErrorMessage } from '../../utils/errorHandler';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Autocomplete,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add,
  Search,
  Warning,
} from '@mui/icons-material';
import { CreateSellItem, SellItem, Warehouse, InventoryItem } from '../../types';

const sellSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  inventoryId: z.string().min(1, 'Inventory item is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  sellPrice: z.number().min(0, 'Sell price must be non-negative'),
  description: z.string().optional(),
});

type SellFormData = z.infer<typeof sellSchema>;

interface SellFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SellFormData) => Promise<void>;
  editingSell?: SellItem | null;
  isSubmitting: boolean;
  warehouses: Warehouse[];
}

const SellForm: React.FC<SellFormProps> = ({
  open,
  onClose,
  onSubmit,
  editingSell,
  isSubmitting,
  warehouses,
}) => {
  const [hasTriedToSubmit, setHasTriedToSubmit] = React.useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string>('');
  const [selectedInventoryId, setSelectedInventoryId] = React.useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
    setValue,
    control,
    getValues,
    trigger,
    watch,
  } = useForm<SellFormData>({
    resolver: zodResolver(sellSchema),
    mode: 'onChange',
  });
  const [apiError, setApiError] = React.useState<string | null>(null);

  // Watch warehouse selection to fetch inventories
  const warehouseId = watch('warehouseId');

  // Fetch inventories for selected warehouse
  const { data: inventories = [], isLoading: isLoadingInventories } = useInventoryItems({
    warehouseId: warehouseId || undefined,
  });

  // Watch inventory selection to auto-fill sell price
  const inventoryId = watch('inventoryId');

  React.useEffect(() => {
    if (open) {
      if (editingSell) {
        reset({
          warehouseId: editingSell.warehouseId || '',
          inventoryId: editingSell.inventoryId || '',
          quantity: editingSell.quantity || 0,
          sellPrice: editingSell.sellPrice || 0,
          description: editingSell.description || '',
        });
        setSelectedWarehouseId(editingSell.warehouseId || '');
        setSelectedInventoryId(editingSell.inventoryId || '');
      } else {
        reset({
          warehouseId: '',
          inventoryId: '',
          quantity: 1,
          sellPrice: 0,
          description: '',
        });
        setSelectedWarehouseId('');
        setSelectedInventoryId('');
      }
      setHasTriedToSubmit(false);
      setApiError(null);
    }
  }, [open, editingSell, reset]);

  // Auto-fill sell price when inventory is selected
  React.useEffect(() => {
    if (inventoryId && !editingSell) {
      const selectedInventory = inventories.find((inv) => inv.id === inventoryId);
      if (selectedInventory) {
        setValue('sellPrice', selectedInventory.sellPrice);
      }
    }
  }, [inventoryId, inventories, setValue, editingSell]);

  const handleFormSubmit = async (data: SellFormData) => {
    setApiError(null);
    setHasTriedToSubmit(true);

    const isValid = await trigger();

    if (!isValid) {
      console.log('Form validation failed:', errors);
      return;
    }

    try {
      await onSubmit(data);
      reset();
      setSelectedWarehouseId('');
      setSelectedInventoryId('');
      setHasTriedToSubmit(false);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setApiError(error.response?.data?.message || 'An error occurred while saving the sell item');
    }
  };

  const handleClose = () => {
    setApiError(null);
    onClose();
  };

  const shouldShowError = (fieldName: keyof SellFormData) => {
    const hasError = !!(errors as Record<string, any>)[fieldName];
    return (hasTriedToSubmit || isSubmitted) ? hasError : false;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{editingSell ? 'Edit Sell' : 'Create New Sell'}</DialogTitle>
      <DialogContent>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Warehouse Selection */}
            <Controller
              name="warehouseId"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <Autocomplete
                  options={warehouses}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(event, newValue) => {
                    const warehouseId = newValue?.id || '';
                    field.onChange(warehouseId);
                    setSelectedWarehouseId(warehouseId);
                    // Reset inventory selection when warehouse changes
                    setValue('inventoryId', '');
                    setSelectedInventoryId('');
                  }}
                  value={warehouses.find((w) => w.id === field.value) || null}
                  disabled={isSubmitting || !!editingSell}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Warehouse"
                      error={shouldShowError('warehouseId')}
                      helperText={
                        shouldShowError('warehouseId')
                          ? errors.warehouseId?.message
                          : 'Select warehouse first'
                      }
                      placeholder="Search warehouse"
                    />
                  )}
                />
              )}
            />

            {/* Inventory Selection - Only shown when warehouse is selected */}
            {selectedWarehouseId && (
              <Controller
                name="inventoryId"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Autocomplete
                    options={inventories}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(event, newValue) => {
                      const inventoryId = newValue?.id || '';
                      field.onChange(inventoryId);
                      setSelectedInventoryId(inventoryId);
                    }}
                    value={inventories.find((inv) => inv.id === field.value) || null}
                    disabled={isSubmitting || isLoadingInventories || !!editingSell}
                    loading={isLoadingInventories}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Inventory Item"
                        error={shouldShowError('inventoryId')}
                        helperText={
                          shouldShowError('inventoryId')
                            ? errors.inventoryId?.message
                            : 'Select item to sell'
                        }
                        placeholder="Search inventory"
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <Box>
                          <Typography variant="body1">{option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Available: {option.quantity} | Price: ${option.sellPrice}
                          </Typography>
                        </Box>
                      </li>
                    )}
                  />
                )}
              />
            )}

            {/* Quantity and Sell Price */}
            {selectedInventoryId && (
              <>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <TextField
                    sx={{ flex: '1 1 200px', minWidth: '200px' }}
                    label="Sell Price"
                    type="number"
                    {...register('sellPrice', { valueAsNumber: true })}
                    error={shouldShowError('sellPrice')}
                    helperText={
                      shouldShowError('sellPrice')
                        ? errors.sellPrice?.message
                        : 'Auto-filled from inventory'
                    }
                    inputProps={{ min: 0, step: 0.01 }}
                    disabled={isSubmitting}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                  <TextField
                    sx={{ flex: '1 1 200px', minWidth: '200px' }}
                    label="Quantity"
                    type="number"
                    {...register('quantity', { valueAsNumber: true })}
                    error={shouldShowError('quantity')}
                    helperText={
                      shouldShowError('quantity') ? errors.quantity?.message : 'Units to sell'
                    }
                    inputProps={{ min: 1 }}
                    disabled={isSubmitting}
                  />
                </Box>

                {/* Description */}
                <TextField
                  sx={{ width: '100%' }}
                  label="Description"
                  multiline
                  rows={3}
                  {...register('description')}
                  placeholder="Enter sale description (optional)"
                  error={shouldShowError('description')}
                  helperText={shouldShowError('description') ? errors.description?.message : undefined}
                  disabled={isSubmitting}
                />
              </>
            )}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          variant="contained"
          disabled={isSubmitting || !selectedInventoryId}
        >
          {editingSell ? 'Update Sell' : 'Create Sell'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Sell: React.FC = () => {
  const user = useAuthStore((state: any) => state.user);

  const [showModal, setShowModal] = useState(false);
  const [editingSell, setEditingSell] = useState<SellItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sellToDelete, setSellToDelete] = useState<SellItem | null>(null);

  // Snackbar state for error/success messages
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: allSells = [], isLoading, error } = useSells();
  const { data: warehouses = [] } = useWarehouses();
  const { mutateAsync: addSell } = useAddSell();
  const { mutateAsync: updateSell } = useUpdateSell();
  const { mutateAsync: deleteSell } = useDeleteSell();

  // Client-side search filtering
  const searchFilteredSells = useMemo(() => {
    return allSells.filter((sell) => {
      const matchesSearch =
        sell.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sell.inventoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sell.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [allSells, searchTerm]);

  const openModal = (sell?: SellItem) => {
    setEditingSell(sell || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    // Delay clearing editingSell to prevent flash from edit to add
    setTimeout(() => {
      setEditingSell(null);
    }, 200);
  };

  const handleSellSubmit = async (formData: SellFormData) => {
    setIsSubmitting(true);

    try {
      if (editingSell) {
        await updateSell({
          id: editingSell.id,
          warehouse_id: formData.warehouseId,
          inventory_id: formData.inventoryId,
          quantity: formData.quantity,
          sell_price: formData.sellPrice,
          description: formData.description,
        });
        setSnackbar({
          open: true,
          message: 'Sell updated successfully',
          severity: 'success',
        });
      } else {
        await addSell({
          warehouse_id: formData.warehouseId,
          inventory_id: formData.inventoryId,
          quantity: formData.quantity,
          sell_price: formData.sellPrice,
          description: formData.description,
        });
        setSnackbar({
          open: true,
          message: 'Sell created successfully',
          severity: 'success',
        });
      }

      closeModal();
    } catch (error) {
      console.error('Error saving sell:', error);
      const errorMessage = extractErrorMessage(error);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (sell: SellItem) => {
    setSellToDelete(sell);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSellToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleDelete = async () => {
    if (!sellToDelete) return;

    try {
      await deleteSell(sellToDelete.id);
      setSnackbar({
        open: true,
        message: 'Sell deleted successfully',
        severity: 'success',
      });
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting sell:', error);
      const errorMessage = extractErrorMessage(error);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
      closeDeleteModal();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatCurrency = (amount: number | undefined | null): string => {
    // Handle undefined, null, or NaN values
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) {
      return '-';
    }

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Sell Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage sales transactions and inventory
            </Typography>
          </Box>
          <Button
            onClick={() => openModal()}
            variant="contained"
            size="large"
            startIcon={<Add />}
            sx={{
              background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
              px: 3,
              py: 1.5,
              borderRadius: 2.5,
              boxShadow: '0 4px 12px rgba(0, 122, 255, 0.2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0051D5 0%, #3634A3 100%)',
                boxShadow: '0 6px 16px rgba(0, 122, 255, 0.3)',
              },
            }}
          >
            Create New Sell
          </Button>
        </Box>
      </Box>

      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              sx={{ flex: '1 1 300px', minWidth: '300px' }}
              placeholder="Search sells..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Card
          sx={{
            width: '100%',
            borderRadius: 3,
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.04)',
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {isLoading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CircularProgress sx={{ color: '#007AFF' }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading sell items...
                </Typography>
              </Box>
            ) : error ? (
              <Box sx={{ p: 3 }}>
                <Alert severity="error">{error.message || 'An error occurred'}</Alert>
              </Box>
            ) : searchFilteredSells.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  No sell items found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {allSells.length === 0
                    ? 'No sales have been recorded yet.'
                    : 'No sells match your current search criteria.'}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => openModal()}
                  startIcon={<Add />}
                  sx={{
                    mt: 2,
                    background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0051D5 0%, #3634A3 100%)',
                    },
                  }}
                >
                  Create Your First Sell
                </Button>
              </Box>
            ) : (
              <TableContainer sx={{ borderRadius: 3 }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F2F2F7' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }}>Warehouse</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }}>Inventory Item</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }} align="right">
                        Quantity
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }} align="right">
                        Sell Price
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }} align="right">
                        Total Amount
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchFilteredSells.map((sell) => (
                      <TableRow key={sell.id}>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {sell.warehouseName || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {sell.inventoryName || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{sell.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(sell.sellPrice)}</TableCell>
                        <TableCell align="right">{formatCurrency(sell.totalAmount)}</TableCell>
                        <TableCell>{formatDate(sell.createdAt)}</TableCell>
                        <TableCell>
                          <IconButton
                            color="primary"
                            onClick={() => openModal(sell)}
                            size="small"
                            sx={{ mr: 1 }}
                            title="Edit sell"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => openDeleteModal(sell)}
                            size="small"
                            title="Delete sell"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      <SellForm
        open={showModal}
        onClose={closeModal}
        onSubmit={handleSellSubmit}
        editingSell={editingSell}
        isSubmitting={isSubmitting}
        warehouses={warehouses}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onClose={closeDeleteModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="error" />
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this sell record?
          </Typography>
          <Alert severity="info">This action cannot be undone.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteModal}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for success/error messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Sell;
