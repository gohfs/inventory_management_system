import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Warehouse as WarehouseIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  Badge,
  InputAdornment,
  Popover,
  Autocomplete,
  Stack,
  Divider,
} from '@mui/material';
import { Warehouse as WarehouseType, CreateWarehouse } from '../../types';
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '../../hooks/useWarehouseData'; // Updated imports
import { extractErrorMessage } from '../../utils/errorHandler';

// Form validation schema
const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  location: z.string().min(1, 'Location is required').max(200, 'Location too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

const Warehouse: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState<WarehouseType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortFilter, setSortFilter] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [tempLocationFilter, setTempLocationFilter] = useState('');
  const [tempSortFilter, setTempSortFilter] = useState<'newest' | 'oldest' | 'name'>('newest');

  // Filter popover state
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null);
  const filterOpen = Boolean(filterAnchorEl);

  // Use the new hooks
  const { data: warehouses = [], isLoading, refetch: refetchWarehouses } = useWarehouses();
  const { mutateAsync: createWarehouse } = useCreateWarehouse();
  const { mutateAsync: updateWarehouse } = useUpdateWarehouse();
  const { mutateAsync: deleteWarehouse } = useDeleteWarehouse();

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (locationFilter) count++;
    if (sortFilter !== 'newest') count++;
    return count;
  }, [locationFilter, sortFilter]);

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locations = Array.from(new Set(warehouses.map(w => w.location)));
    return locations.sort();
  }, [warehouses]);

  // Filter and sort warehouses
  const filteredWarehouses = useMemo(() => {
    let result = warehouses;

    // Apply search filter
    if (searchTerm) {
      result = result.filter(warehouse =>
        warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        warehouse.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply location filter
    if (locationFilter) {
      result = result.filter(warehouse => warehouse.location === locationFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortFilter) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'oldest':
          return new Date(a.createdAt || (a as any).created_at).getTime() - 
                 new Date(b.createdAt || (b as any).created_at).getTime();
        case 'newest':
        default:
          return new Date(b.createdAt || (b as any).created_at).getTime() - 
                 new Date(a.createdAt || (a as any).created_at).getTime();
      }
    });

    return result;
  }, [warehouses, searchTerm, locationFilter, sortFilter]);

  // Filter handlers
  const handleOpenFilter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget);
    setTempLocationFilter(locationFilter);
    setTempSortFilter(sortFilter);
  };

  const handleCloseFilter = () => {
    setFilterAnchorEl(null);
  };

  const handleApplyFilters = () => {
    setLocationFilter(tempLocationFilter);
    setSortFilter(tempSortFilter);
    handleCloseFilter();
  };

  const handleClearFilters = () => {
    setTempLocationFilter('');
    setTempSortFilter('newest');
    setLocationFilter('');
    setSortFilter('newest');
    handleCloseFilter();
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
  });

  // Fetch warehouses on mount
  useEffect(() => {
    refetchWarehouses();
  }, []);

  // Removed unused fetchWarehouses function

  const openCreateDialog = () => {
    setEditingWarehouse(null);
    reset({ name: '', location: '', description: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (warehouse: WarehouseType) => {
    setEditingWarehouse(warehouse);
    setValue('name', warehouse.name);
    setValue('location', warehouse.location);
    setValue('description', warehouse.description || '');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingWarehouse(null);
    reset();
  };

  const openDeleteDialog = (warehouse: WarehouseType) => {
    setDeletingWarehouse(warehouse);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingWarehouse(null);
  };

  const onSubmit = async (data: WarehouseFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const warehouseData: CreateWarehouse = {
        name: data.name,
        location: data.location,
        description: data.description || undefined,
      };

      if (editingWarehouse) {
        await updateWarehouse({ id: editingWarehouse.id, data: warehouseData });
        setSuccessMessage('Warehouse updated successfully');
      } else {
        await createWarehouse(warehouseData);
        setSuccessMessage('Warehouse created successfully');
      }

      closeDialog();
      refetchWarehouses();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingWarehouse) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await deleteWarehouse(deletingWarehouse.id);
      setSuccessMessage('Warehouse deleted successfully');
      closeDeleteDialog();
      refetchWarehouses();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMessage = extractErrorMessage(err);
      setError(errorMessage);
      closeDeleteDialog();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (warehouse: WarehouseType): string => {
    // Handle both camelCase and snake_case date formats from API
    const dateString = warehouse.createdAt || (warehouse as any).created_at;
    
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
    <Container maxWidth="lg" sx={{ py: 4, mt: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Warehouse Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all warehouses in the system (Super Admin only)
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
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
          Add Warehouse
        </Button>
      </Box>

      {/* Success Message */}
      <Collapse in={!!successMessage}>
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Collapse>

      {/* Error Message */}
      <Collapse in={!!error}>
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      </Collapse>

      {/* Search and Filter Section */}
      <Card sx={{
        mb: 3,
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        border: '1px solid rgba(0, 0, 0, 0.04)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              sx={{ flex: '1 1 300px', minWidth: '300px' }}
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
            />
            <Badge badgeContent={activeFilterCount} color="primary">
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
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
              options={uniqueLocations}
              value={tempLocationFilter || null}
              onChange={(event, newValue) => {
                setTempLocationFilter(newValue || '');
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Location"
                  placeholder="Search or select location"
                />
              )}
              noOptionsText="No locations found"
              clearText="Clear selection"
              openText="Open"
              closeText="Close"
            />

            <TextField
              fullWidth
              select
              label="Sort By"
              value={tempSortFilter}
              onChange={(e) => setTempSortFilter(e.target.value as 'newest' | 'oldest' | 'name')}
              SelectProps={{
                native: true,
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </TextField>

            <Divider />

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
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

      {/* Loading State */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#007AFF' }} />
        </Box>
      ) : filteredWarehouses.length === 0 ? (
        /* Empty State */
        <Card sx={{
          textAlign: 'center',
          py: 8,
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.04)'
        }}>
          <CardContent>
            <WarehouseIcon sx={{ fontSize: 80, color: '#C7C7CC', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {warehouses.length === 0 ? 'No Warehouses Yet' : 'No Warehouses Found'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {warehouses.length === 0 
                ? 'Get started by creating your first warehouse'
                : 'No warehouses match your current search or filter criteria.'
              }
            </Typography>
            {warehouses.length === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={openCreateDialog}
                sx={{
                  background: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0051D5 0%, #3634A3 100%)',
                  },
                }}
              >
                Create Warehouse
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Warehouses Table */
        <Card sx={{
          borderRadius: 3,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F2F2F7' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }}>Created</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1C1C1E' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
              {filteredWarehouses.map((warehouse) => (
                <TableRow key={warehouse.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarehouseIcon color="primary" fontSize="small" />
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {warehouse.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={warehouse.location} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {warehouse.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(warehouse)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="primary"
                      onClick={() => openEditDialog(warehouse)}
                      size="small"
                      sx={{ mr: 1 }}
                      title="Edit warehouse"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => openDeleteDialog(warehouse)}
                      size="small"
                      title="Delete warehouse"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {editingWarehouse ? 'Edit Warehouse' : 'Create Warehouse'}
            <IconButton onClick={closeDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <TextField
                label="Warehouse Name"
                fullWidth
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
                autoFocus
              />
              <TextField
                label="Location"
                fullWidth
                {...register('location')}
                error={!!errors.location}
                helperText={errors.location?.message}
              />
              <TextField
                label="Description (Optional)"
                fullWidth
                multiline
                rows={3}
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={closeDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : editingWarehouse ? (
                'Update'
              ) : (
                'Create'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={closeDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Warehouse</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deletingWarehouse?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeDeleteDialog} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Warehouse;
