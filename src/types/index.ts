export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER' | 'warehouse' | 'super_admin' | 'admin' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  warehouseId?: string;
  createdAt?: string;
}

export interface AuthUser extends User {
  token?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  minStockLevel?: number;
  description?: string;
  warehouseId?: string;
  isLowStock?: boolean;
  totalValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryItem {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  buy_price: number;
  sell_price: number;
  minStockLevel?: number;
  description?: string;
  warehouse_id: string;
}

export interface UpdateInventoryItem extends Partial<CreateInventoryItem> {
  id: string;
}

export interface InventoryState {
  items: InventoryItem[];
  isLoading: boolean;
  error: string | null;
}

export interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  totalCategories: number;
  totalValue: number;
}

export interface ActivityItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  description: string;
  itemName: string;
  timestamp: string;
  userId: string;
}

export interface EntityActivity {
  id: string;
  type: string;
  description: string;
  item_name: string;
  timestamp: string;
  user_id: string;
  action: string;
  entity_id: string;
  entity_type: string;
  metadata?: Record<string, any>;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouse {
  name: string;
  location: string;
  description?: string;
}

export interface SellItem {
  id: string;
  warehouseId: string;
  warehouseName?: string;
  inventoryId: string;
  inventoryName?: string;
  quantity: number;
  sellPrice: number;
  totalAmount: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateSellItem {
  warehouse_id: string;
  inventory_id: string;
  quantity: number;
  sell_price: number;
  description?: string;
}

export interface UpdateSellItem extends Partial<CreateSellItem> {
  id: string;
}