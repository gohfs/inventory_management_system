import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import { useInventoryItems, useAddInventoryItem, useUpdateInventoryItem, useDeleteInventoryItem } from '../../hooks/useInventory';
import { extractErrorMessage } from '../../utils/errorHandler';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  Chip,
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
  Popover,
  Badge,
  Divider,
  Autocomplete,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add,
  Search,
  FilterList,
  Clear,
  Warning
} from '@mui/icons-material';
import { CreateInventoryItem, InventoryItem } from '../../types';

const itemSchema = z.object({
  name: z
    .string()
    .min(1, 'Item name is required'),
  sku: z
    .string()
    .min(1, 'SKU is required'),
  category: z
    .string()
    .min(1, 'Category is required'),
  quantity: z
    .number()
    .min(0, 'Quantity cannot be negative'),
  buyPrice: z
    .number()
    .min(0, 'Buy price must be non-negative'),
  sellPrice: z
    .number()
    .min(0, 'Sell price must be non-negative'),
  minStockLevel: z
    .number()
    .min(0, 'Minimum stock level must be non-negative')
    .optional(),
  description: z.string(),
}).refine((data) => data.sellPrice > data.buyPrice, {
  message: 'Sell price must be higher than buy price',
  path: ['sellPrice'],
});

type ItemFormData = z.infer<typeof itemSchema>;

interface ItemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ItemFormData) => Promise<void>;
  editingItem?: InventoryItem | null;
  isSubmitting: boolean;
  categories: string[];
}

const ItemForm: React.FC<ItemFormProps> = ({
  open,
  onClose,
  onSubmit,
  editingItem,
  isSubmitting,
  categories,
}) => {
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);
  const [hasTriedToSubmit, setHasTriedToSubmit] = React.useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
    setValue,
    setError,
    clearErrors,
    control,
    getValues,
    trigger,
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    mode: 'onChange',
  });
  const [apiError, setApiError] = React.useState<string | null>(null);

  // Set user interaction state when they first interact with any field
  const handleFieldInteraction = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
    }
  };

  React.useEffect(() => {
    if (open) {
      if (editingItem) {
        reset({
          name: editingItem.name || '',
          sku: editingItem.sku || '',
          category: editingItem.category || '',
          quantity: editingItem.quantity || 0,
          buyPrice: editingItem.buyPrice || 0,
          sellPrice: editingItem.sellPrice || 0,
          minStockLevel: editingItem.minStockLevel || 0,
          description: editingItem.description || '',
        });
        // Reset interaction state for edit mode
        setHasUserInteracted(true);
      } else {
        reset({
          name: '',
          sku: '',
          category: '',
          quantity: 0,
          buyPrice: 0,
          sellPrice: 0,
          minStockLevel: 0,
          description: '',
        });
        // Reset interaction state for add mode
        setHasUserInteracted(false);
      }
      // Reset submission attempt state when dialog opens
      setHasTriedToSubmit(false);
      setApiError(null);
      clearErrors();
    }
  }, [open, editingItem, reset, clearErrors]);

  const handleFormSubmit = async (data: ItemFormData) => {
    setApiError(null);
    setHasTriedToSubmit(true); // Mark that user tried to submit
    
    // Trigger validation to show errors
    const isValid = await trigger();
    
    if (!isValid) {
      // Form has validation errors, don't submit to API
      console.log('Form validation failed:', errors);
      return;
    }
    
    // Check for empty required fields (additional safety check)
    const requiredFields: (keyof ItemFormData)[] = ['name', 'sku', 'category', 'quantity', 'buyPrice', 'sellPrice'];
    const emptyFields = requiredFields.filter(field => {
      const value = getValues(field);
      return !value || (typeof value === 'string' && value.trim() === '') || 
             (typeof value === 'number' && value === 0);
    });
    
    if (emptyFields.length > 0) {
      console.log('Empty required fields:', emptyFields);
      return;
    }
    
    try {
      await onSubmit(data);
      reset();
      setHasUserInteracted(false);
      setHasTriedToSubmit(false); // Reset submission attempt state
    } catch (error: any) {
      console.error('Error submitting form:', error);

      // Handle API validation errors
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          setApiError(error.response.data.detail);
        } else if (Array.isArray(error.response.data.detail)) {
          // Handle FastAPI validation errors
          const validationErrors = error.response.data.detail;
          validationErrors.forEach((err: any) => {
            const field = err.loc?.[err.loc.length - 1];
            if (field && field in data) {
              setError(field as any, { message: err.msg });
            }
          });
          setApiError('Please check the form for validation errors');
        }
      } else {
        setApiError(error.response?.data?.message || 'An error occurred while saving the item');
      }
    }
  };

  const handleClose = () => {
    setApiError(null);
    onClose();
  };

  const shouldShowError = (fieldName: keyof ItemFormData) => {
    const fieldValue = getValues(fieldName);
    const hasError = !!(errors as Record<string, any>)[fieldName];

    // Show errors only when:
    // 1. User has tried to submit (show all errors)
    // 2. Form has been submitted by react-hook-form
    // 3. User has interacted AND there's an error AND the field has been touched
    const fieldTouched = typeof fieldValue === 'string' ? fieldValue.length > 0 : true;

    return (hasTriedToSubmit || isSubmitted) ? hasError : false;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {editingItem ? 'Edit Item' : 'Add New Item'}
      </DialogTitle>
      <DialogContent>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                sx={{ flex: '1 1 200px', minWidth: '200px' }}
                label="Item Name"
                {...register('name')}
                error={shouldShowError('name')}
                helperText={shouldShowError('name') ? errors.name?.message : undefined}
                disabled={isSubmitting}
                onFocus={handleFieldInteraction}
              />
              <Controller
                name="category"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    sx={{ flex: '1 1 200px', minWidth: '200px' }}
                    options={categories}
                    freeSolo
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    onChange={(event, newValue) => {
                      field.onChange(newValue || '');
                    }}
                    onInputChange={(event, newInputValue) => {
                      field.onChange(newInputValue || '');
                    }}
                    value={field.value || ''}
                    disabled={isSubmitting}
                    disableClearable={false}
                    forcePopupIcon={false}
                    filterOptions={(options, params) => {
                      if (!params.inputValue) {
                        return options;
                      }
                      
                      const filtered = options.filter(option =>
                        option.toLowerCase().includes(params.inputValue.toLowerCase())
                      );

                      // If input doesn't match any existing category, hide the list but allow free text
                      if (params.inputValue !== '' && !filtered.length) {
                        return [];
                      }

                      return filtered;
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Category"
                        error={shouldShowError('category')}
                        helperText={shouldShowError('category') ? errors.category?.message || 'Search existing or type to create new' : 'Search existing or type to create new'}
                        placeholder="Search or enter category"
                        onFocus={handleFieldInteraction}
                      />
                    )}
                  />
                )}
              />
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                sx={{ flex: '1 1 200px', minWidth: '200px' }}
                label="SKU"
                {...register('sku')}
                error={shouldShowError('sku')}
                helperText={shouldShowError('sku') ? errors.sku?.message : undefined}
                disabled={isSubmitting}
                onFocus={handleFieldInteraction}
              />
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                sx={{ flex: '1 1 150px', minWidth: '150px' }}
                label="Quantity"
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                error={shouldShowError('quantity')}
                helperText={shouldShowError('quantity') ? errors.quantity?.message : undefined}
                inputProps={{ min: 0 }}
                disabled={isSubmitting}
                onFocus={(e) => {
                  handleFieldInteraction();
                  e.target.select();
                }}
              />
              <TextField
                sx={{ flex: '1 1 150px', minWidth: '150px' }}
                label="Buy Price"
                type="number"
                {...register('buyPrice', { valueAsNumber: true })}
                error={shouldShowError('buyPrice')}
                helperText={shouldShowError('buyPrice') ? errors.buyPrice?.message : undefined}
                inputProps={{ min: 0, step: 0.01 }}
                disabled={isSubmitting}
                onFocus={(e) => {
                  handleFieldInteraction();
                  e.target.select();
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
              <TextField
                sx={{ flex: '1 1 150px', minWidth: '150px' }}
                label="Sell Price"
                type="number"
                {...register('sellPrice', { valueAsNumber: true })}
                error={shouldShowError('sellPrice')}
                helperText={shouldShowError('sellPrice') ? errors.sellPrice?.message : undefined}
                inputProps={{ min: 0, step: 0.01 }}
                disabled={isSubmitting}
                onFocus={(e) => {
                  handleFieldInteraction();
                  e.target.select();
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Box>

            <TextField
              sx={{ width: '100%' }}
              label="Minimum Stock Level"
              type="number"
              {...register('minStockLevel', { valueAsNumber: true })}
              error={shouldShowError('minStockLevel')}
              helperText={shouldShowError('minStockLevel') ? errors.minStockLevel?.message : 'Optional'}
              inputProps={{ min: 0 }}
              disabled={isSubmitting}
              onFocus={(e) => {
                handleFieldInteraction();
                e.target.select();
              }}
            />

            <TextField
              sx={{ width: '100%' }}
              label="Description"
              multiline
              rows={3}
              {...register('description')}
              placeholder="Enter item description (optional)"
              error={shouldShowError('description')}
              helperText={shouldShowError('description') ? errors.description?.message : undefined}
              disabled={isSubmitting}
              onFocus={handleFieldInteraction}
            />
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(handleFormSubmit)}
          variant="contained"
          disabled={isSubmitting}
        >
          {editingItem ? 'Update Item' : 'Add Item'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Inventory: React.FC = () => {
  const user = useAuthStore((state: any) => state.user);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [minStockFilter, setMinStockFilter] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

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

  // Filter popover state
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tempCategoryFilter, setTempCategoryFilter] = useState('');
  const [tempMinStockFilter, setTempMinStockFilter] = useState<number | ''>('');

  const filterOpen = Boolean(filterAnchorEl);

  // Build filters object for API
  const filters = useMemo(() => ({
    warehouseId: user?.warehouseId,
    category: categoryFilter || undefined,
    minStock: minStockFilter !== '' ? minStockFilter : undefined,
  }), [user?.warehouseId, categoryFilter, minStockFilter]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryFilter) count++;
    if (minStockFilter !== '') count++;
    return count;
  }, [categoryFilter, minStockFilter]);

  const { data: allItems = [], isLoading, error } = useInventoryItems(filters);
  const { mutateAsync: addItem } = useAddInventoryItem();
  const { mutateAsync: updateItem } = useUpdateInventoryItem();
  const { mutateAsync: deleteItem } = useDeleteInventoryItem();

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(allItems.map(item => item.category)));
    return uniqueCategories.sort();
  }, [allItems]);

  // Only apply client-side search filtering (API handles category and minStock)
  const searchFilteredItems = useMemo(() => {
    return allItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [allItems, searchTerm]);


  const openModal = (item?: InventoryItem) => {
    setEditingItem(item || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    // Delay clearing editingItem to prevent flash from edit to add
    setTimeout(() => {
      setEditingItem(null);
    }, 200);
  };

  const handleOpenFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
    // Initialize temp values with current filters
    setTempCategoryFilter(categoryFilter);
    setTempMinStockFilter(minStockFilter);
  };

  const handleCloseFilter = () => {
    setFilterAnchorEl(null);
  };

  const handleApplyFilters = () => {
    setCategoryFilter(tempCategoryFilter);
    setMinStockFilter(tempMinStockFilter);
    handleCloseFilter();
  };

  const handleClearFilters = () => {
    setTempCategoryFilter('');
    setTempMinStockFilter('');
    setCategoryFilter('');
    setMinStockFilter('');
    handleCloseFilter();
  };

  const handleItemSubmit = async (formData: ItemFormData) => {
    setIsSubmitting(true);

    try {
      if (editingItem) {
        await updateItem({
          id: editingItem.id,
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          quantity: formData.quantity,
          buy_price: formData.buyPrice,
          sell_price: formData.sellPrice,
          minStockLevel: formData.minStockLevel,
          description: formData.description,
          warehouse_id: user?.warehouseId || '',
        });
        setSnackbar({
          open: true,
          message: 'Item updated successfully',
          severity: 'success',
        });
      } else {
        await addItem({
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          quantity: formData.quantity,
          buy_price: formData.buyPrice,
          sell_price: formData.sellPrice,
          minStockLevel: formData.minStockLevel,
          description: formData.description,
          warehouse_id: user?.warehouseId || '',
        });
        setSnackbar({
          open: true,
          message: 'Item added successfully',
          severity: 'success',
        });
      }

      closeModal();
    } catch (error) {
      console.error('Error saving item:', error);
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

  const openDeleteModal = (item: InventoryItem) => {
    setItemToDelete(item);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setItemToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await deleteItem(itemToDelete.id);
      setSnackbar({
        open: true,
        message: 'Item deleted successfully',
        severity: 'success',
      });
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting item:', error);
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

  const getStockStatus = (item: InventoryItem): { status: 'good' | 'low' | 'out'; label: string; color: 'success' | 'warning' | 'error' } => {
    if (item.quantity === 0) {
      return { status: 'out', label: 'Out of Stock', color: 'error' };
    }
    if (item.minStockLevel && item.quantity <= item.minStockLevel) {
      return { status: 'low', label: 'Low Stock', color: 'warning' };
    }
    return { status: 'good', label: 'In Stock', color: 'success' };
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Inventory Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your products and stock levels
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
            Add New Item
          </Button>
        </Box>
      </Box>

      {/* {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )} */}

      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              sx={{ flex: '1 1 300px', minWidth: '300px' }}
              placeholder="Search items..."
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
            <Badge badgeContent={activeFilterCount} color="primary">
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={handleOpenFilter}
                sx={{ height: '56px' }}
              >
                Filters
              </Button>
            </Badge>
          </Box>
        </CardContent>
      </Card>

      {/* Filter Popover */}
      <Popover
        open={filterOpen}
        anchorEl={filterAnchorEl}
        onClose={handleCloseFilter}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 3, minWidth: '320px' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Filter Options
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={3}>
            <Autocomplete
              fullWidth
              options={categories}
              value={tempCategoryFilter || null}
              onChange={(event, newValue) => {
                setTempCategoryFilter(newValue || '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  placeholder="Search or select category"
                />
              )}
              noOptionsText="No categories found"
              clearText="Clear selection"
              openText="Open"
              closeText="Close"
            />

            <TextField
              fullWidth
              label="Minimum Stock"
              type="number"
              value={tempMinStockFilter}
              onChange={(e) => setTempMinStockFilter(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Enter minimum stock"
              inputProps={{ min: 0 }}
            />

            <Divider />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={handleClearFilters}
              >
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </Box>
          </Stack>
        </Box>
      </Popover>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Card sx={{
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.04)'
        }}>
          <CardContent sx={{ p: 0 }}>
            {isLoading ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CircularProgress sx={{ color: '#007AFF' }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Loading inventory items...
                </Typography>
              </Box>
            ) : error ? (
              <Box sx={{ p: 3 }}>
                <Alert severity="error">
                  {error.message || 'An error occurred'}
                </Alert>
              </Box>
            ) : searchFilteredItems.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  No inventory items found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {allItems.length === 0 
                    ? 'The inventory is currently empty.' 
                    : 'No items match your current search or filter criteria.'}
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
                  Add Your First Item
                </Button>
              </Box>
            ) : (
              <TableContainer sx={{ borderRadius: 3 }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F2F2F7' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }}>SKU</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }}>Category</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }} align="right">Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }} align="right">Buy Price</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }} align="right">Sell Price</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }} align="right">Total Value</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#1C1C1E', position: 'sticky', right: 0, bgcolor:'white'  }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchFilteredItems.map((item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body1" fontWeight="medium" sx={{ minWidth: 120, }}>
                              {item.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#007AFF',
                                fontWeight: 600,
                                fontFamily: 'SF Mono, Monaco, monospace',
                                minWidth: 150,
                              }}
                            >
                              {item.sku || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.buyPrice)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.sellPrice)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.quantity * item.buyPrice)}</TableCell>
                          <TableCell>
                            <Chip
                              label={stockStatus.label}
                              color={stockStatus.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ display: 'flex', position: 'sticky', right: 0, bgcolor:'white' }}>
                            <IconButton
                              color="primary"
                              onClick={() => openModal(item)}
                              size="small"
                              sx={{ mr: 1 }}
                              title="Edit item"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => openDeleteModal(item)}
                              size="small"
                              title="Delete item"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      <ItemForm
        open={showModal}
        onClose={closeModal}
        onSubmit={handleItemSubmit}
        editingItem={editingItem}
        isSubmitting={isSubmitting}
        categories={categories}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="error" />
            <Typography variant="h6">Confirm Delete</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete <strong>"{itemToDelete?.name}"</strong>?
          </Typography>
          {itemToDelete && itemToDelete.quantity > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This item has <strong>{itemToDelete.quantity}</strong> units in stock.
              Only items with 0 stock can be deleted according to API validation.
            </Alert>
          )}
          <Alert severity="info">
            This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
          >
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

export default Inventory;