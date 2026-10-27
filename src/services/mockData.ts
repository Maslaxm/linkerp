import {
  Business,
  UserProfile,
  BusinessUser,
  SubscriptionPlan,
  BusinessSubscription,
  Branch,
  Category,
  Brand,
  Supplier,
  Customer,
  Product,
  Sale,
  Purchase,
  Expense,
  Employee,
  AuditLog,
  NotificationItem,
} from '../types/erp';

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-basic',
    name: 'Basic',
    description: 'Essential ERP for small shops, kiosks and retail startups',
    monthly_price: 15,
    yearly_price: 150,
    max_users: 3,
    max_branches: 1,
    max_products: 500,
    storage_limit_mb: 500,
    features: ['Single Branch', 'POS & Barcode Scanning', 'Inventory Management', 'Sales & Receipts', 'Standard Reports'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plan-standard',
    name: 'Standard',
    description: 'Ideal for pharmacies, supermarkets and expanding SME stores',
    monthly_price: 35,
    yearly_price: 350,
    max_users: 10,
    max_branches: 3,
    max_products: 5000,
    storage_limit_mb: 2000,
    features: ['Up to 3 Branches', 'Advanced POS & Barcode', 'Customer Debts & Credit Limits', 'Supplier Purchases', 'Expense & Financial Ledger', 'Excel/PDF Export'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plan-professional',
    name: 'Professional',
    description: 'High-volume wholesale, supermarket chains & multi-branch groups',
    monthly_price: 75,
    yearly_price: 750,
    max_users: 25,
    max_branches: 10,
    max_products: 25000,
    storage_limit_mb: 10000,
    features: ['Up to 10 Branches', 'Unlimited Barcode POS', 'Multi-Branch Inventory Transfer', 'Complete Accounting & P&L', 'HR & Employee Attendance', 'Tamper-Evident Audit Logs', 'Priority Support'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    description: 'Unlimited corporate scale, franchise chains and hotels',
    monthly_price: 150,
    yearly_price: 1500,
    max_users: 100,
    max_branches: 50,
    max_products: 100000,
    storage_limit_mb: 50000,
    features: ['Unlimited Scale', 'Custom Roles & Granular Permissions', 'Dedicated Database Isolation', 'Multi-Currency Support', 'Realtime Sync & Storage', 'SLA 99.9% Guarantee'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// All demo businesses and data removed - businesses are created exclusively via Super Admin
export const INITIAL_BUSINESSES: Business[] = [];
export const INITIAL_SUBSCRIPTIONS: BusinessSubscription[] = [];

// Only authorized platform super admins exist by default
export const INITIAL_USER_PROFILES: UserProfile[] = [
  {
    id: 'usr-ishanews7-superadmin',
    full_name: 'Platform Super Admin',
    email: 'ishanews7@gmail.com',
    password: 'LinkERP#Admin2026',
    phone: '+252 61 999 0000',
    system_role: 'super_admin',
    role: 'super_admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'usr-super-admin',
    full_name: 'Abdirahman Noor',
    email: 'admin@linkerp.com',
    password: 'LinkERP#Admin2026',
    phone: '+252 61 999 0001',
    system_role: 'super_admin',
    role: 'super_admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_BUSINESS_USERS: BusinessUser[] = [];
export const INITIAL_BRANCHES: Branch[] = [];
export const INITIAL_CATEGORIES: Category[] = [];
export const INITIAL_BRANDS: Brand[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_SALES: Sale[] = [];
export const INITIAL_PURCHASES: Purchase[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
