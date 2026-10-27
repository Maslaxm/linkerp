export type UserRole =
  | 'super_admin'
  | 'business_owner'
  | 'manager'
  | 'accountant'
  | 'cashier'
  | 'inventory_manager'
  | 'sales_staff'
  | 'hr_manager'
  | 'viewer';

export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'expired'
  | 'suspended'
  | 'cancelled';

export type PaymentMethod =
  | 'cash'
  | 'mobile_money'
  | 'bank'
  | 'card'
  | 'credit';

export type SaleStatus = 'completed' | 'returned' | 'cancelled' | 'pending';
export type PurchaseStatus = 'completed' | 'ordered' | 'received' | 'cancelled';
export type MovementType = 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'return';

export interface Business {
  id: string;
  tenantId?: string;
  name: string;
  business_type: string;
  owner_name: string;
  owner_email: string;
  email?: string;
  owner_phone?: string;
  logo_url?: string;
  address: string;
  city: string;
  country: string;
  tax_number?: string;
  currency: string;
  timezone: string;
  status: 'active' | 'suspended' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string; // auth.users.id
  tenantId?: string;
  business_id?: string;
  full_name: string;
  email: string;
  password?: string;
  phone?: string;
  avatar_url?: string;
  system_role: UserRole;
  role?: UserRole;
  permissions?: ERPPermission[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessUser {
  id: string;
  business_id: string;
  user_id: string;
  user_profile?: UserProfile;
  role: UserRole;
  branch_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  max_users: number;
  max_branches: number;
  max_products: number;
  storage_limit_mb: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessSubscription {
  id: string;
  business_id: string;
  plan_id: string;
  plan?: SubscriptionPlan;
  status: SubscriptionStatus;
  start_date: string;
  expiry_date: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  tenantId?: string;
  business_id: string;
  name: string;
  address: string;
  phone: string;
  manager_user_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  tenantId?: string;
  business_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Brand {
  id: string;
  tenantId?: string;
  business_id: string;
  name: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  tenantId?: string;
  business_id: string;
  name: string;
  company_name?: string;
  phone: string;
  email?: string;
  address?: string;
  supplier_code: string;
  current_debt: number;
  notes?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  tenantId?: string;
  business_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  customer_code: string;
  credit_limit: number;
  current_debt: number;
  notes?: string;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenantId?: string;
  business_id: string;
  branch_id?: string;
  category_id?: string;
  brand_id?: string;
  supplier_id?: string;
  name: string;
  sku: string;
  barcode: string;
  product_code?: string;
  unit: string;
  purchase_price: number;
  selling_price: number;
  wholesale_price: number;
  min_stock: number;
  max_stock?: number;
  current_stock: number;
  tax_rate: number;
  discount: number;
  image_url?: string;
  description?: string;
  expiry_date?: string;
  batch_number?: string;
  location?: string;
  is_active: boolean;
  is_deleted?: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  business_id: string;
  branch_id?: string;
  product_id: string;
  product_name?: string;
  movement_type: MovementType;
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  previous_stock: number;
  new_stock: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface PurchaseItem {
  id: string;
  business_id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total: number;
}

export interface Purchase {
  id: string;
  tenantId?: string;
  business_id: string;
  branch_id?: string;
  supplier_id?: string;
  supplier_name?: string;
  invoice_number: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paid_amount: number;
  debt_amount: number;
  payment_method: PaymentMethod;
  status: PurchaseStatus;
  items: PurchaseItem[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  tenantId?: string;
  business_id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  barcode: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
}

export interface Sale {
  id: string;
  tenantId?: string;
  business_id: string;
  branch_id?: string;
  customer_id?: string;
  customer_name?: string;
  invoice_number: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paid_amount: number;
  debt_amount: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  status: SaleStatus;
  cashier_id?: string;
  cashier_name?: string;
  items: SaleItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenantId?: string;
  business_id: string;
  customer_id?: string;
  supplier_id?: string;
  sale_id?: string;
  purchase_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  direction: 'inflow' | 'outflow';
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  tenantId?: string;
  business_id: string;
  branch_id?: string;
  expense_name: string;
  category: string;
  amount: number;
  payment_method: PaymentMethod;
  description?: string;
  receipt_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  tenantId?: string;
  business_id: string;
  branch_id?: string;
  employee_id: string;
  full_name: string;
  phone: string;
  email: string;
  position: string;
  department: string;
  salary: number;
  joining_date: string;
  address?: string;
  photo_url?: string;
  status: 'active' | 'on_leave' | 'terminated';
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: string;
  tenantId?: string;
  business_id: string;
  title: string;
  message: string;
  notification_type: 'low_stock' | 'out_of_stock' | 'expiry' | 'sale' | 'purchase' | 'debt' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  tenantId?: string;
  business_id?: string;
  user_id?: string;
  user_name?: string;
  action: string;
  module: string;
  record_id?: string;
  description: string;
  ip_address?: string;
  created_at: string;
}

export interface POSCartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount: number;
}

export interface POSSession {
  id: string;
  business_id: string;
  branch_id?: string;
  cashier_id: string;
  cashier_name: string;
  opening_balance: number;
  closing_balance?: number;
  expected_closing_balance?: number;
  status: 'open' | 'closed';
  start_time: string;
  end_time?: string;
}

export type ERPPermission =
  | 'view_dashboard'
  | 'manage_products'
  | 'manage_inventory'
  | 'manage_sales'
  | 'pos_access'
  | 'manage_purchases'
  | 'manage_customers'
  | 'manage_suppliers'
  | 'manage_expenses'
  | 'manage_employees'
  | 'view_finance'
  | 'view_reports'
  | 'export_reports'
  | 'manage_settings'
  | 'manage_users'
  | 'manage_branches'
  | 'view_audit_logs'
  | 'super_admin';

export const ROLE_PERMISSIONS: Record<UserRole, ERPPermission[]> = {
  super_admin: [
    'super_admin',
    'view_dashboard',
    'manage_products',
    'manage_inventory',
    'manage_sales',
    'pos_access',
    'manage_purchases',
    'manage_customers',
    'manage_suppliers',
    'manage_expenses',
    'manage_employees',
    'view_finance',
    'view_reports',
    'export_reports',
    'manage_settings',
    'manage_users',
    'manage_branches',
    'view_audit_logs',
  ],
  business_owner: [
    'view_dashboard',
    'manage_products',
    'manage_inventory',
    'manage_sales',
    'pos_access',
    'manage_purchases',
    'manage_customers',
    'manage_suppliers',
    'manage_expenses',
    'manage_employees',
    'view_finance',
    'view_reports',
    'export_reports',
    'manage_settings',
    'manage_users',
    'manage_branches',
    'view_audit_logs',
  ],
  manager: [
    'view_dashboard',
    'manage_products',
    'manage_inventory',
    'manage_sales',
    'pos_access',
    'manage_purchases',
    'manage_customers',
    'manage_suppliers',
    'manage_expenses',
    'manage_employees',
    'view_finance',
    'view_reports',
    'export_reports',
    'manage_users',
    'view_audit_logs',
  ],
  accountant: [
    'view_dashboard',
    'manage_sales',
    'manage_purchases',
    'manage_customers',
    'manage_suppliers',
    'manage_expenses',
    'view_finance',
    'view_reports',
    'export_reports',
  ],
  cashier: [
    'pos_access',
    'manage_sales',
    'manage_customers',
  ],
  inventory_manager: [
    'view_dashboard',
    'manage_products',
    'manage_inventory',
    'manage_purchases',
    'manage_suppliers',
    'view_reports',
  ],
  sales_staff: [
    'pos_access',
    'manage_sales',
    'manage_customers',
    'view_dashboard',
  ],
  hr_manager: [
    'view_dashboard',
    'manage_employees',
    'view_reports',
  ],
  viewer: [
    'view_dashboard',
    'view_reports',
  ],
};
