import React, { createContext, useContext, useState, useEffect } from 'react';
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
  SaleItem,
  Purchase,
  Expense,
  Employee,
  AuditLog,
  NotificationItem,
  POSSession,
  POSCartItem,
  PaymentMethod,
  UserRole,
  SubscriptionStatus,
  ERPPermission,
  ROLE_PERMISSIONS,
  MovementType,
} from '../types/erp';
import {
  INITIAL_PLANS,
  INITIAL_BUSINESSES,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_USER_PROFILES,
  INITIAL_BUSINESS_USERS,
  INITIAL_BRANCHES,
  INITIAL_CATEGORIES,
  INITIAL_BRANDS,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_PURCHASES,
  INITIAL_EXPENSES,
  INITIAL_EMPLOYEES,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from '../services/mockData';
import { Language, getTranslation } from '../lib/i18n';
import {
  db,
  auth,
  handleFirestoreError,
  OperationType,
  syncSetDoc,
  syncUpdateDoc,
  syncDeleteDoc,
  fetchTenantCollection,
  findUserOrBusinessInFirestore,
  syncFirebaseEmailAuth,
  autoProvisionFirebaseAuthUser,
  sanitizeForFirestore,
} from '../lib/firebase';

interface ERPContextType {
  // Localization & Theme
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: any) => string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Identity & Multi-tenant Context
  isBusinessAuthenticated: boolean;
  loginBusiness: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logoutBusiness: () => void;
  currentUser: UserProfile;
  currentBusiness: Business | null;
  currentBranch: Branch | null;
  currentRole: UserRole;
  currentSubscription: BusinessSubscription | null;
  currentPlan: SubscriptionPlan | null;
  userBusinesses: Business[];
  allBusinesses: Business[];
  allProfiles: UserProfile[];

  // Tenant / User Switching
  switchTenant: (businessId: string) => void;
  switchBranch: (branchId: string | null) => void;
  switchUser: (userId: string) => void;
  checkPermission: (permission: ERPPermission) => boolean;

  // Tenant-Scoped Data (Automatically filtered by RLS / business_id)
  branches: Branch[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  employees: Employee[];
  businessUsers: BusinessUser[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  subscriptionPlans: SubscriptionPlan[];
  activeSessions: POSSession[];

  // Actions
  isSuperAdmin: boolean;
  createBusiness: (data: Partial<Business> & { plan_id: string; temp_password?: string; tenantId?: string; role?: UserRole; permissions?: ERPPermission[] }) => {
    business: Business;
    owner: UserProfile;
    temp_password: string;
  };
  deleteBusiness: (id: string) => void;
  updateBusiness: (id: string, data: Partial<Business>) => void;
  updateBusinessStatus: (id: string, status: 'active' | 'suspended' | 'inactive') => void;
  createTenantUser: (payload: { tenantId: string; full_name: string; email: string; phone?: string; temp_password?: string; role: UserRole; permissions?: ERPPermission[] }) => {
    success: boolean;
    message?: string;
    user?: UserProfile;
    temp_password?: string;
  };
  updateUserProfileRoleAndPermissions: (userId: string, role: UserRole, permissions?: ERPPermission[]) => void;
  toggleUserStatus: (userId: string) => void;
  resetUserPassword: (userId: string, newTempPass?: string) => string;

  // Product & Inventory Actions
  addProduct: (product: Omit<Product, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => { success: boolean; message?: string };
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, quantityChange: number, reason: string, movementType?: MovementType) => void;

  // POS Actions
  activePOSSession: POSSession | null;
  openPOSSession: (openingBalance: number) => void;
  closePOSSession: (closingBalance: number) => void;
  completePOSSale: (
    cart: POSCartItem[],
    customer: Customer | null,
    paymentMethod: PaymentMethod,
    tendered: number,
    overallDiscount: number,
    notes?: string
  ) => { success: boolean; sale?: Sale; error?: string };
  refundSale: (saleId: string, reason?: string) => void;

  // Purchase Actions
  createPurchase: (
    supplierId: string,
    items: { productId: string; quantity: number; unitCost: number }[],
    paidAmount: number,
    paymentMethod: PaymentMethod,
    invoiceNumber?: string
  ) => void;

  // Customer & Supplier Debt Actions
  addCustomer: (data: Omit<Customer, 'id' | 'business_id' | 'current_debt' | 'created_at' | 'updated_at'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  recordCustomerPayment: (customerId: string, amount: number, paymentMethod: PaymentMethod, reference?: string) => void;
  addSupplier: (data: Omit<Supplier, 'id' | 'business_id' | 'current_debt' | 'created_at' | 'updated_at'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  recordSupplierPayment: (supplierId: string, amount: number, paymentMethod: PaymentMethod, reference?: string) => void;

  // Expenses & HRM
  addExpense: (expense: Omit<Expense, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => void;
  deleteExpense: (id: string) => void;
  addEmployee: (employee: Omit<Employee, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;

  // Branch & User Admin
  addBranch: (data: Omit<Branch, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => { success: boolean; message?: string };
  addBusinessUser: (email: string, fullName: string, role: UserRole, branchId?: string) => { success: boolean; message?: string };
  updateBusinessUserRole: (id: string, newRole: UserRole) => void;

  // Notifications & Audit
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  logAuditAction: (action: string, module: string, description: string, recordId?: string) => void;

  // Export utility
  exportToCSV: (filename: string, headers: string[], rows: (string | number)[][]) => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(`link_erp_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(`link_erp_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export const ERPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Settings & Localization
  const [language, setLanguageState] = useState<Language>(() => loadStorage('lang', 'en'));
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => loadStorage('theme', 'light'));

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    saveStorage('lang', lang);
  };

  const applyTheme = (targetTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    if (targetTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      document.body.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    saveStorage('theme', newTheme);
    applyTheme(newTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const t = (key: any) => getTranslation(language, key);

  // Purge legacy demo data if present in localStorage
  if (typeof window !== 'undefined') {
    const existingBiz = localStorage.getItem('link_erp_businesses');
    const existingUser = localStorage.getItem('link_erp_active_user_id');
    if ((existingBiz && existingBiz.includes('biz-albaraka')) || existingUser === 'usr-albaraka-owner') {
      localStorage.removeItem('link_erp_businesses');
      localStorage.removeItem('link_erp_user_profiles');
      localStorage.removeItem('link_erp_business_users');
      localStorage.removeItem('link_erp_branches');
      localStorage.removeItem('link_erp_categories');
      localStorage.removeItem('link_erp_brands');
      localStorage.removeItem('link_erp_suppliers');
      localStorage.removeItem('link_erp_customers');
      localStorage.removeItem('link_erp_products');
      localStorage.removeItem('link_erp_sales');
      localStorage.removeItem('link_erp_purchases');
      localStorage.removeItem('link_erp_expenses');
      localStorage.removeItem('link_erp_employees');
      localStorage.removeItem('link_erp_audit_logs');
      localStorage.removeItem('link_erp_active_user_id');
      localStorage.removeItem('link_erp_active_biz_id');
      localStorage.removeItem('link_erp_is_biz_auth');
    }
  }

  // Entities loaded from local storage or seed data
  const [businesses, setBusinesses] = useState<Business[]>(() => loadStorage('businesses', INITIAL_BUSINESSES));
  const [subscriptions, setSubscriptions] = useState<BusinessSubscription[]>(() => loadStorage('subscriptions', INITIAL_SUBSCRIPTIONS));
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(() => loadStorage('plans', INITIAL_PLANS));
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>(() => loadStorage('user_profiles', INITIAL_USER_PROFILES));
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>(() => loadStorage('business_users', INITIAL_BUSINESS_USERS));
  const [branches, setBranches] = useState<Branch[]>(() => loadStorage('branches', INITIAL_BRANCHES));
  const [categories, setCategories] = useState<Category[]>(() => loadStorage('categories', INITIAL_CATEGORIES));
  const [brands, setBrands] = useState<Brand[]>(() => loadStorage('brands', INITIAL_BRANDS));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStorage('suppliers', INITIAL_SUPPLIERS));
  const [customers, setCustomers] = useState<Customer[]>(() => loadStorage('customers', INITIAL_CUSTOMERS));
  const [products, setProducts] = useState<Product[]>(() => loadStorage('products', INITIAL_PRODUCTS));
  const [sales, setSales] = useState<Sale[]>(() => loadStorage('sales', INITIAL_SALES));
  const [purchases, setPurchases] = useState<Purchase[]>(() => loadStorage('purchases', INITIAL_PURCHASES));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStorage('expenses', INITIAL_EXPENSES));
  const [employees, setEmployees] = useState<Employee[]>(() => loadStorage('employees', INITIAL_EMPLOYEES));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadStorage('notifications', INITIAL_NOTIFICATIONS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStorage('audit_logs', INITIAL_AUDIT_LOGS));
  const [sessions, setSessions] = useState<POSSession[]>(() => loadStorage('pos_sessions', []));

  // Business User Authentication State (Default to false unless authenticated)
  const [isBusinessAuthenticated, setIsBusinessAuthenticated] = useState<boolean>(() => loadStorage('is_biz_auth', false));

  // Current session & active tenant
  const [currentUserId, setCurrentUserId] = useState<string>(() => loadStorage('active_user_id', 'usr-ishanews7-superadmin'));
  const [currentBusinessId, setCurrentBusinessId] = useState<string>(() => loadStorage('active_biz_id', ''));
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(() => loadStorage('active_branch_id', null));

  // Sync to localStorage whenever entities change
  useEffect(() => saveStorage('businesses', businesses), [businesses]);
  useEffect(() => saveStorage('subscriptions', subscriptions), [subscriptions]);
  useEffect(() => saveStorage('plans', subscriptionPlans), [subscriptionPlans]);
  useEffect(() => saveStorage('user_profiles', userProfiles), [userProfiles]);
  useEffect(() => saveStorage('business_users', businessUsers), [businessUsers]);
  useEffect(() => saveStorage('branches', branches), [branches]);
  useEffect(() => saveStorage('categories', categories), [categories]);
  useEffect(() => saveStorage('brands', brands), [brands]);
  useEffect(() => saveStorage('suppliers', suppliers), [suppliers]);
  useEffect(() => saveStorage('customers', customers), [customers]);
  useEffect(() => saveStorage('products', products), [products]);
  useEffect(() => saveStorage('sales', sales), [sales]);
  useEffect(() => saveStorage('purchases', purchases), [purchases]);
  useEffect(() => saveStorage('expenses', expenses), [expenses]);
  useEffect(() => saveStorage('employees', employees), [employees]);
  useEffect(() => saveStorage('notifications', notifications), [notifications]);
  useEffect(() => saveStorage('audit_logs', auditLogs), [auditLogs]);
  useEffect(() => saveStorage('pos_sessions', sessions), [sessions]);
  useEffect(() => saveStorage('is_biz_auth', isBusinessAuthenticated), [isBusinessAuthenticated]);
  useEffect(() => saveStorage('active_user_id', currentUserId), [currentUserId]);
  useEffect(() => saveStorage('active_biz_id', currentBusinessId), [currentBusinessId]);
  useEffect(() => saveStorage('active_branch_id', currentBranchId), [currentBranchId]);

  // Load tenant-specific data from Firestore
  const loadTenantDataFromFirestore = async (tenantId: string) => {
    if (!tenantId) return;
    try {
      const [remoteProducts, remoteSales, remoteCustomers, remoteSuppliers, remoteExpenses, remoteBranches] =
        await Promise.all([
          fetchTenantCollection<Product>('products', tenantId),
          fetchTenantCollection<Sale>('sales', tenantId),
          fetchTenantCollection<Customer>('customers', tenantId),
          fetchTenantCollection<Supplier>('suppliers', tenantId),
          fetchTenantCollection<Expense>('expenses', tenantId),
          fetchTenantCollection<Branch>('branches', tenantId),
        ]);

      if (remoteProducts.length > 0) {
        setProducts((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          remoteProducts.forEach((rp) => map.set(rp.id, rp));
          return Array.from(map.values());
        });
      }
      if (remoteSales.length > 0) {
        setSales((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]));
          remoteSales.forEach((rs) => map.set(rs.id, rs));
          return Array.from(map.values());
        });
      }
      if (remoteCustomers.length > 0) {
        setCustomers((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          remoteCustomers.forEach((rc) => map.set(rc.id, rc));
          return Array.from(map.values());
        });
      }
      if (remoteSuppliers.length > 0) {
        setSuppliers((prev) => {
          const map = new Map(prev.map((s) => [s.id, s]));
          remoteSuppliers.forEach((rs) => map.set(rs.id, rs));
          return Array.from(map.values());
        });
      }
      if (remoteExpenses.length > 0) {
        setExpenses((prev) => {
          const map = new Map(prev.map((e) => [e.id, e]));
          remoteExpenses.forEach((re) => map.set(re.id, re));
          return Array.from(map.values());
        });
      }
      if (remoteBranches.length > 0) {
        setBranches((prev) => {
          const map = new Map(prev.map((b) => [b.id, b]));
          remoteBranches.forEach((rb) => map.set(rb.id, rb));
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('Tenant data sync from Firestore:', err);
    }
  };

  // Hydrate businesses and user profiles from Cloud Firestore on mount
  useEffect(() => {
    const hydrateFromFirestore = async () => {
      try {
        const [remoteBiz, remoteUsers] = await Promise.all([
          fetchTenantCollection<Business>('businesses'),
          fetchTenantCollection<UserProfile>('user_profiles'),
        ]);

        if (remoteBiz.length > 0) {
          setBusinesses((prev) => {
            const map = new Map(prev.map((b) => [b.id, b]));
            remoteBiz.forEach((rb) => map.set(rb.id, rb));
            return Array.from(map.values());
          });
        }

        if (remoteUsers.length > 0) {
          setUserProfiles((prev) => {
            const map = new Map(prev.map((u) => [u.id, u]));
            remoteUsers.forEach((ru) => map.set(ru.id, ru));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Initial Firestore hydration notice:', err);
      }
    };

    hydrateFromFirestore();
  }, []);

  // When active business changes, load its tenant data from Firestore
  useEffect(() => {
    if (currentBusinessId) {
      loadTenantDataFromFirestore(currentBusinessId);
    }
  }, [currentBusinessId]);

  // Active Current User Profile
  const currentUser: UserProfile =
    userProfiles.find((u) => u.id === currentUserId) ||
    userProfiles[0] || {
      id: 'usr-guest',
      full_name: 'Guest User',
      email: 'guest@linkerp.com',
      system_role: 'viewer',
      role: 'viewer',
      is_active: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

  // Super Admin Authorization Check
  const SUPER_ADMIN_EMAILS = ['ishanews7@gmail.com', 'admin@linkerp.com'];
  const isSuperAdmin =
    currentUser.system_role === 'super_admin' ||
    (!!currentUser.email && SUPER_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === currentUser.email.toLowerCase()));

  // User's Authorized Businesses
  const userBusinessUsers = businessUsers.filter((bu) => bu.user_id === currentUser.id && bu.is_active);
  const authorizedBusinessIds = Array.from(
    new Set([
      ...userBusinessUsers.map((bu) => bu.business_id),
      ...(currentUser.tenantId ? [currentUser.tenantId] : []),
      ...(currentUser.business_id ? [currentUser.business_id] : []),
    ])
  );
  
  const userBusinesses = isSuperAdmin
    ? businesses
    : businesses.filter((b) => authorizedBusinessIds.includes(b.id));

  // Active Business: strictly tenant-isolated
  const currentBusiness: Business | null = isSuperAdmin
    ? (businesses.find((b) => b.id === currentBusinessId) || businesses[0] || null)
    : (userBusinesses.find((b) => b.id === currentBusinessId) || userBusinesses[0] || null);

  // Active User Role inside Current Business
  const activeBU = businessUsers.find(
    (bu) => bu.user_id === currentUser.id && bu.business_id === currentBusiness?.id
  );
  const currentRole: UserRole = isSuperAdmin
    ? 'super_admin'
    : (currentUser.role || activeBU?.role || 'viewer');

  // Active Branch
  const currentBranch: Branch | null = branches.find((br) => br.id === currentBranchId) || null;

  // Active Subscription & Plan
  const currentSubscription = currentBusiness
    ? subscriptions.find((s) => s.business_id === currentBusiness.id) || null
    : null;
  const currentPlan = currentSubscription
    ? subscriptionPlans.find((p) => p.id === currentSubscription.plan_id) || null
    : null;

  // Active POS Session for current cashier in current business
  const activePOSSession = sessions.find(
    (s) => s.business_id === currentBusiness?.id && s.cashier_id === currentUser.id && s.status === 'open'
  ) || null;

  // TENANT ISOLATION: Filter collections by current business / tenant ID
  // Multi-tenant guarantee: Records MUST match currentBusiness.id.
  const tenantFilter = <T extends { business_id?: string; tenantId?: string }>(items: T[]): T[] => {
    if (!currentBusiness) return [];
    return items.filter(
      (item) => item.business_id === currentBusiness.id || item.tenantId === currentBusiness.id
    );
  };

  const tenantBranches = tenantFilter(branches);
  const tenantCategories = tenantFilter(categories);
  const tenantBrands = tenantFilter(brands);
  const tenantSuppliers = tenantFilter(suppliers).filter(s => !s.is_deleted);
  const tenantCustomers = tenantFilter(customers).filter(c => !c.is_deleted);
  const tenantProducts = tenantFilter(products).filter(p => !p.is_deleted);
  const tenantSales = tenantFilter(sales);
  const tenantPurchases = tenantFilter(purchases);
  const tenantExpenses = tenantFilter(expenses);
  const tenantEmployees = tenantFilter(employees);
  const tenantBusinessUsers = tenantFilter(businessUsers);
  const tenantNotifications = tenantFilter(notifications);
  const tenantAuditLogs = isSuperAdmin && !currentBusinessId
    ? auditLogs
    : tenantFilter(auditLogs);

  // Permission Check
  const checkPermission = (permission: ERPPermission): boolean => {
    if (isSuperAdmin) return true;
    if (currentUser.permissions && currentUser.permissions.length > 0) {
      return currentUser.permissions.includes(permission);
    }
    const permissions = ROLE_PERMISSIONS[currentRole] || [];
    return permissions.includes(permission);
  };

  // Log Audit Action
  const logAuditAction = (action: string, module: string, description: string, recordId?: string) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: currentBusiness?.id || 'platform',
      business_id: currentBusiness?.id || 'platform',
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      action,
      module,
      record_id: recordId || '',
      description,
      ip_address: '127.0.0.1 (Web Client)',
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Asynchronously sync sanitized audit log to Cloud Firestore
    syncSetDoc('audit_logs', newLog.id, newLog);
  };

  // Switch Active Tenant
  const switchTenant = (businessId: string) => {
    if (!isSuperAdmin) {
      const isAllowed = userBusinesses.some((b) => b.id === businessId);
      if (!isAllowed) {
        console.warn(`Access Denied: Non-superadmin user ${currentUser.email} cannot access business ${businessId}`);
        return;
      }
    }
    setCurrentBusinessId(businessId);
    setCurrentBranchId(null);
    setIsBusinessAuthenticated(true);
    saveStorage('is_biz_auth', true);
    const target = businesses.find((b) => b.id === businessId);
    if (target) {
      logAuditAction('SWITCH_TENANT', 'TENANCY', `Switched active workspace to ${target.name}`, businessId);
    }
  };

  // Switch Active Branch
  const switchBranch = (branchId: string | null) => {
    setCurrentBranchId(branchId);
  };

  // Switch Active User / Persona
  const switchUser = (userId: string) => {
    setCurrentUserId(userId);
    setIsBusinessAuthenticated(true);
    saveStorage('is_biz_auth', true);
    const targetUser = userProfiles.find((u) => u.id === userId);
    if (targetUser) {
      // If user belongs to businesses, switch to their primary business
      const userBU = businessUsers.find((bu) => bu.user_id === userId);
      if (userBU) {
        setCurrentBusinessId(userBU.business_id);
      } else if (targetUser.tenantId) {
        setCurrentBusinessId(targetUser.tenantId);
      }
      logAuditAction('USER_SWITCH', 'AUTH', `Switched active session to ${targetUser.full_name} (${targetUser.system_role})`);
    }
  };

  // Business Login: Validate tenant user credentials created by Super Admin or Firebase
  const loginBusiness = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, message: 'Fadlan geli Gmail-kaaga iyo Password-ka.' };
    }

    // 1. Attempt Firebase Authentication verification
    let fbAuthUser: any = null;
    let fbAuthResult: any = null;
    try {
      fbAuthResult = await syncFirebaseEmailAuth(cleanEmail, cleanPass);
      if (fbAuthResult.success && fbAuthResult.user) {
        fbAuthUser = fbAuthResult.user;
      }
    } catch {
      // Firebase auth attempt handled
    }

    // If Firebase Auth confirmed the account exists, but the password provided was wrong:
    if (fbAuthResult && !fbAuthResult.success && fbAuthResult.isExistingUserWrongPassword) {
      return {
        success: false,
        message: fbAuthResult.error || 'Password-ka aad gelisay waa khalad. Gmail-kani wuu ku jiraa Firebase Auth, fadlan geli password-ka saxda ah.',
      };
    }

    // If Firebase Email/Password provider is not enabled in Firebase Console:
    if (fbAuthResult && !fbAuthResult.success && fbAuthResult.isOperationNotAllowed) {
      return {
        success: false,
        message: fbAuthResult.error,
      };
    }

    // 2. Look for user in local memory
    let user = userProfiles.find((u) => u.email && u.email.trim().toLowerCase() === cleanEmail);
    let bizMatch = businesses.find((b) => (b.owner_email && b.owner_email.trim().toLowerCase() === cleanEmail) || (b.email && b.email.trim().toLowerCase() === cleanEmail));

    // 3. If not found in local memory, query Cloud Firestore directly
    if (!user || !bizMatch) {
      try {
        const directFirestoreResult = await findUserOrBusinessInFirestore(cleanEmail);
        if (directFirestoreResult.userProfile) {
          user = directFirestoreResult.userProfile;
          setUserProfiles((prev) => {
            const map = new Map(prev.map((u) => [u.id, u]));
            map.set(directFirestoreResult.userProfile.id, directFirestoreResult.userProfile);
            return Array.from(map.values());
          });
        }
        if (directFirestoreResult.business) {
          bizMatch = directFirestoreResult.business;
          setBusinesses((prev) => {
            const map = new Map(prev.map((b) => [b.id, b]));
            map.set(directFirestoreResult.business.id, directFirestoreResult.business);
            return Array.from(map.values());
          });
        }

        // Broader scan fallback if needed
        if (!user || !bizMatch) {
          const [remoteUsers, remoteBizList] = await Promise.all([
            fetchTenantCollection<UserProfile>('user_profiles'),
            fetchTenantCollection<Business>('businesses'),
          ]);

          if (remoteUsers.length > 0) {
            setUserProfiles((prev) => {
              const map = new Map(prev.map((u) => [u.id, u]));
              remoteUsers.forEach((ru) => map.set(ru.id, ru));
              return Array.from(map.values());
            });
            user = remoteUsers.find((ru) => ru.email && ru.email.trim().toLowerCase() === cleanEmail) || user;
          }

          if (remoteBizList.length > 0) {
            setBusinesses((prev) => {
              const map = new Map(prev.map((b) => [b.id, b]));
              remoteBizList.forEach((rb) => map.set(rb.id, rb));
              return Array.from(map.values());
            });
            bizMatch = remoteBizList.find((b) => (b.owner_email && b.owner_email.trim().toLowerCase() === cleanEmail) || (b.email && b.email.trim().toLowerCase() === cleanEmail)) || bizMatch;
          }
        }
      } catch (err) {
        console.warn('Firestore refresh notice during login:', err);
      }
    }

    // 4. If user is Super Admin
    if (SUPER_ADMIN_EMAILS.includes(cleanEmail) || user?.system_role === 'super_admin') {
      const superAdminUser: UserProfile = user || {
        id: 'usr-ishanews7-superadmin',
        full_name: 'Platform Super Admin',
        email: cleanEmail,
        system_role: 'super_admin' as UserRole,
        role: 'super_admin' as UserRole,
        permissions: ROLE_PERMISSIONS['super_admin'] || [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setCurrentUserId(superAdminUser.id);
      setIsBusinessAuthenticated(true);
      saveStorage('is_biz_auth', true);
      saveStorage('active_user_id', superAdminUser.id);
      return { success: true };
    }

    // 5. Resolve or Auto-Construct User Profile
    if (!user && bizMatch) {
      // Business exists with this owner email, construct owner profile
      user = {
        id: `usr-${bizMatch.id}`,
        tenantId: bizMatch.id,
        business_id: bizMatch.id,
        full_name: bizMatch.owner_name || bizMatch.name,
        email: cleanEmail,
        password: cleanPass,
        system_role: 'business_owner',
        role: 'business_owner',
        permissions: ROLE_PERMISSIONS['business_owner'] || [],
        is_active: bizMatch.status !== 'suspended',
        created_at: bizMatch.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUserProfiles((prev) => [...prev.filter((u) => u.email.toLowerCase() !== cleanEmail), user!]);
      syncSetDoc('user_profiles', user.id, user);
      syncSetDoc('users', user.id, user);
    } else if (fbAuthUser && !user) {
      // User is verified in Firebase Auth! Find or construct workspace
      const autoBizId = `biz-${cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '') || 'workspace'}`;
      const resolvedBiz: Business = businesses.find((b) => b.id === autoBizId) || {
        id: autoBizId,
        tenantId: autoBizId,
        name: `${cleanEmail.split('@')[0].toUpperCase()} Store`,
        business_type: 'General Retail',
        owner_name: cleanEmail.split('@')[0],
        owner_email: cleanEmail,
        email: cleanEmail,
        address: 'KM4 Maka Al Mukarama Road',
        city: 'Mogadishu',
        country: 'Somalia',
        currency: 'USD',
        timezone: 'Africa/Mogadishu',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      bizMatch = resolvedBiz;
      user = {
        id: `usr-${autoBizId}`,
        tenantId: autoBizId,
        business_id: autoBizId,
        full_name: resolvedBiz.owner_name,
        email: cleanEmail,
        password: cleanPass,
        system_role: 'business_owner',
        role: 'business_owner',
        permissions: ROLE_PERMISSIONS['business_owner'] || [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setBusinesses((prev) => [...prev.filter((b) => b.id !== autoBizId), resolvedBiz]);
      setUserProfiles((prev) => [...prev.filter((u) => u.email.toLowerCase() !== cleanEmail), user!]);
      syncSetDoc('businesses', resolvedBiz.id, resolvedBiz);
      syncSetDoc('user_profiles', user.id, user);
      syncSetDoc('users', user.id, user);
    }

    // 6. Check if user exists
    if (!user) {
      return {
        success: false,
        message: 'Gmail-kan lagama helin nidaamka. Fadlan hubi ama la xiriir maamulka Link ERP.',
      };
    }

    // 7. Verify password (if not already authenticated via Firebase Auth)
    if (!fbAuthUser) {
      if (user.password && user.password !== cleanPass) {
        return {
          success: false,
          message: 'Password-ka aad gelisay waa khalad. Fadlan dib u hubi.',
        };
      }
      // Auto-provision into Firebase Auth in the background
      autoProvisionFirebaseAuthUser(cleanEmail, cleanPass).catch(() => {});
    }

    // 8. Check if account is active
    if (!user.is_active) {
      return {
        success: false,
        message: 'Xisaabtan waa la joojiyay (Deactivated). Fadlan la xiriir Super Admin-ka.',
      };
    }

    // 9. Find assigned business
    const targetTenantId = user.tenantId || user.business_id;
    let assignedBiz = businesses.find((b) => b.id === targetTenantId) || bizMatch;

    if (!assignedBiz) {
      try {
        const remoteBizList = await fetchTenantCollection<Business>('businesses');
        assignedBiz =
          remoteBizList.find((b) => b.id === targetTenantId) ||
          remoteBizList.find((b) => (b.owner_email && b.owner_email.toLowerCase() === cleanEmail) || (b.email && b.email.toLowerCase() === cleanEmail));
        if (assignedBiz) {
          setBusinesses((prev) => [...prev.filter((x) => x.id !== assignedBiz!.id), assignedBiz!]);
        }
      } catch (err) {}
    }

    if (!assignedBiz) {
      return {
        success: false,
        message: 'Xisaabtaada laguma xirin ganacsi firfircoon. Fadlan la xiriir Super Admin-ka.',
      };
    }

    if (assignedBiz.status === 'suspended') {
      return {
        success: false,
        message: `Ganacsiga "${assignedBiz.name}" waa la hakiyay (Suspended). Fadlan la xiriir Maamulka Guud ee Link ERP.`,
      };
    }

    // 9. Successfully authenticate session
    setCurrentUserId(user.id);
    setCurrentBusinessId(assignedBiz.id);
    setCurrentBranchId(null);
    setIsBusinessAuthenticated(true);
    saveStorage('is_biz_auth', true);
    saveStorage('active_user_id', user.id);
    saveStorage('active_biz_id', assignedBiz.id);

    // Load live tenant collections from Firestore
    await loadTenantDataFromFirestore(assignedBiz.id);

    logAuditAction('LOGIN', 'AUTH', `User ${user.full_name} (${user.email}) logged into business ${assignedBiz.name}`, assignedBiz.id);

    return { success: true };
  };

  // Business Logout: Clears session and returns to Business Login screen
  const logoutBusiness = () => {
    setIsBusinessAuthenticated(false);
    saveStorage('is_biz_auth', false);
    localStorage.removeItem('link_erp_is_biz_auth');
    localStorage.removeItem('link_erp_active_user_id');
    localStorage.removeItem('link_erp_active_biz_id');
  };

  // Super Admin: Create New Business Workspace
  const createBusiness = (
    data: Partial<Business> & {
      plan_id: string;
      temp_password?: string;
      tenantId?: string;
      role?: UserRole;
      permissions?: ERPPermission[];
    }
  ) => {
    const rawBizId = data.tenantId?.trim() ? data.tenantId.trim() : `biz-${Date.now().toString(36)}`;
    const newBizId = rawBizId.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const newOwnerId = `usr-${Date.now().toString(36)}`;
    const assignedRole = data.role || 'business_owner';
    const assignedPermissions = data.permissions && data.permissions.length > 0
      ? data.permissions
      : ROLE_PERMISSIONS[assignedRole] || [];

    const newBiz: Business = {
      id: newBizId,
      tenantId: newBizId,
      name: data.name || 'New Enterprise',
      business_type: data.business_type || 'General Retail',
      owner_name: data.owner_name || 'Owner',
      owner_email: data.owner_email || 'owner@example.com',
      owner_phone: data.owner_phone || '',
      logo_url: data.logo_url || '',
      address: data.address || '',
      city: data.city || 'Mogadishu',
      country: data.country || 'Somalia',
      tax_number: data.tax_number || '',
      currency: data.currency || 'USD',
      timezone: data.timezone || 'Africa/Mogadishu',
      status: data.status || 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newOwnerProfile: UserProfile = {
      id: newOwnerId,
      tenantId: newBizId,
      business_id: newBizId,
      full_name: data.owner_name || 'Owner',
      email: data.owner_email || 'owner@example.com',
      password: data.temp_password || 'LinkERP#2026',
      phone: data.owner_phone,
      system_role: assignedRole,
      role: assignedRole,
      permissions: assignedPermissions,
      is_active: data.status !== 'inactive',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newBU: BusinessUser = {
      id: `bu-${Date.now()}`,
      business_id: newBizId,
      user_id: newOwnerId,
      role: assignedRole,
      is_active: data.status !== 'inactive',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newBranch: Branch = {
      id: `br-${Date.now()}`,
      tenantId: newBizId,
      business_id: newBizId,
      name: 'Main HQ Branch',
      address: data.address || 'Headquarters',
      phone: data.owner_phone || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newSub: BusinessSubscription = {
      id: `sub-${Date.now()}`,
      business_id: newBizId,
      plan_id: data.plan_id || 'plan-standard',
      status: (data.status as SubscriptionStatus) || 'active',
      start_date: new Date().toISOString().slice(0, 10),
      expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      auto_renew: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setBusinesses((prev) => [newBiz, ...prev]);
    setUserProfiles((prev) => [newOwnerProfile, ...prev]);
    setBusinessUsers((prev) => [newBU, ...prev]);
    setBranches((prev) => [newBranch, ...prev]);
    setSubscriptions((prev) => [newSub, ...prev]);

    // Persist new business to Firestore with tenant isolation
    syncSetDoc('businesses', newBiz.id, { ...newBiz, email: newBiz.owner_email });
    syncSetDoc('user_profiles', newOwnerProfile.id, newOwnerProfile);
    syncSetDoc('users', newOwnerProfile.id, newOwnerProfile);
    syncSetDoc('branches', newBranch.id, newBranch);
    syncSetDoc('business_subscriptions', newSub.id, newSub);

    // Auto-provision owner into Firebase Auth asynchronously in background
    if (newOwnerProfile.email && newOwnerProfile.password) {
      autoProvisionFirebaseAuthUser(newOwnerProfile.email, newOwnerProfile.password).catch(() => {});
    }

    logAuditAction(
      'CREATE_BUSINESS',
      'SUPER_ADMIN',
      `Super admin created new tenant "${newBiz.name}" (Tenant ID: ${newBizId}) with owner ${newOwnerProfile.email} and role ${assignedRole}`,
      newBizId
    );

    return {
      business: newBiz,
      owner: newOwnerProfile,
      temp_password: data.temp_password || 'LinkERP#Temp2026',
    };
  };

  const deleteBusiness = (businessId: string) => {
    setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
    logAuditAction('DELETE_BUSINESS', 'SUPER_ADMIN', `Super Admin deleted tenant ${businessId}`, businessId);
  };

  const createTenantUser = (payload: {
    tenantId: string;
    full_name: string;
    email: string;
    phone?: string;
    temp_password?: string;
    role: UserRole;
    permissions?: ERPPermission[];
  }): { success: boolean; message?: string; user?: UserProfile; temp_password?: string } => {
    if (!payload.tenantId || !payload.email || !payload.full_name) {
      return { success: false, message: 'Tenant ID, email, and full name are required.' };
    }

    const existingUser = userProfiles.find((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (existingUser) {
      return { success: false, message: `A user with email ${payload.email} already exists.` };
    }

    const newUserId = `usr-${Date.now().toString(36)}`;
    const assignedRole = payload.role || 'sales_staff';
    const assignedPermissions = payload.permissions && payload.permissions.length > 0
      ? payload.permissions
      : ROLE_PERMISSIONS[assignedRole] || [];

    const newUser: UserProfile = {
      id: newUserId,
      tenantId: payload.tenantId,
      business_id: payload.tenantId,
      full_name: payload.full_name,
      email: payload.email,
      password: payload.temp_password || 'LinkERP#User2026',
      phone: payload.phone,
      system_role: assignedRole,
      role: assignedRole,
      permissions: assignedPermissions,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newBU: BusinessUser = {
      id: `bu-${Date.now()}`,
      business_id: payload.tenantId,
      user_id: newUserId,
      role: assignedRole,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setUserProfiles((prev) => [newUser, ...prev]);
    setBusinessUsers((prev) => [newBU, ...prev]);

    syncSetDoc('user_profiles', newUser.id, newUser);
    syncSetDoc('users', newUser.id, newUser);

    // Auto-provision tenant staff into Firebase Auth asynchronously in background
    if (newUser.email && newUser.password) {
      autoProvisionFirebaseAuthUser(newUser.email, newUser.password).catch(() => {});
    }

    logAuditAction(
      'CREATE_TENANT_USER',
      'SUPER_ADMIN',
      `Super admin created user ${newUser.full_name} (${newUser.email}) for tenant ${payload.tenantId} with role ${assignedRole}`,
      newUserId
    );

    return {
      success: true,
      user: newUser,
      temp_password: payload.temp_password || 'LinkERP#User2026',
    };
  };

  const updateUserProfileRoleAndPermissions = (
    userId: string,
    role: UserRole,
    permissions?: ERPPermission[]
  ) => {
    const updatedPermissions = permissions || ROLE_PERMISSIONS[role] || [];
    setUserProfiles((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              system_role: role,
              role,
              permissions: updatedPermissions,
              updated_at: new Date().toISOString(),
            }
          : u
      )
    );

    setBusinessUsers((prev) =>
      prev.map((bu) => (bu.user_id === userId ? { ...bu, role, updated_at: new Date().toISOString() } : bu))
    );

    syncUpdateDoc('user_profiles', userId, {
      system_role: role,
      role,
      permissions: updatedPermissions,
      updated_at: new Date().toISOString(),
    });

    logAuditAction(
      'UPDATE_USER_PERMISSIONS',
      'SUPER_ADMIN',
      `Updated user ${userId} role to ${role} with ${updatedPermissions.length} permissions`,
      userId
    );
  };

  const toggleUserStatus = (userId: string) => {
    const target = userProfiles.find((u) => u.id === userId);
    if (!target) return;
    const newStatus = !target.is_active;

    setUserProfiles((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: newStatus, updated_at: new Date().toISOString() } : u))
    );

    setBusinessUsers((prev) =>
      prev.map((bu) => (bu.user_id === userId ? { ...bu, is_active: newStatus, updated_at: new Date().toISOString() } : bu))
    );

    syncUpdateDoc('user_profiles', userId, { is_active: newStatus, updated_at: new Date().toISOString() });

    logAuditAction(
      'TOGGLE_USER_STATUS',
      'SUPER_ADMIN',
      `Set user ${target.full_name} (${target.email}) status to ${newStatus ? 'ACTIVE' : 'INACTIVE'}`,
      userId
    );
  };

  const resetUserPassword = (userId: string, newTempPass?: string): string => {
    const pass = newTempPass || `LinkERP#${Math.floor(1000 + Math.random() * 9000)}`;
    setUserProfiles((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: pass, updated_at: new Date().toISOString() } : u))
    );
    const target = userProfiles.find((u) => u.id === userId);
    logAuditAction(
      'RESET_USER_PASSWORD',
      'SUPER_ADMIN',
      `Reset temporary credentials for ${target?.full_name || userId} (${target?.email || 'N/A'})`,
      userId
    );
    return pass;
  };

  const updateBusiness = (id: string, data: Partial<Business>) => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...data, updated_at: new Date().toISOString() } : b))
    );
    syncUpdateDoc('businesses', id, data);
    logAuditAction('UPDATE_BUSINESS', 'SETTINGS', `Updated business profile for ${data.name || id}`, id);
  };

  const updateBusinessStatus = (id: string, status: 'active' | 'suspended' | 'inactive') => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status, updated_at: new Date().toISOString() } : b))
    );
    syncUpdateDoc('businesses', id, { status, updated_at: new Date().toISOString() });
    logAuditAction('BUSINESS_STATUS_CHANGE', 'SUPER_ADMIN', `Changed business ${id} status to ${status}`, id);
  };

  // Add Product with Plan Restriction Check
  const addProduct = (
    productData: Omit<Product, 'id' | 'business_id' | 'created_at' | 'updated_at'>
  ): { success: boolean; message?: string } => {
    if (!currentBusiness) return { success: false, message: 'No active business selected' };

    // Check Plan Product Limit
    if (currentPlan && currentPlan.max_products) {
      const activeProductsCount = tenantProducts.length;
      if (activeProductsCount >= currentPlan.max_products) {
        return {
          success: false,
          message: `Plan limit reached! Your ${currentPlan.name} plan allows maximum ${currentPlan.max_products} products. Please upgrade.`,
        };
      }
    }

    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      tenantId: currentBusiness.id,
      business_id: currentBusiness.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Sync product to Firestore
    syncSetDoc('products', newProduct.id, newProduct);

    logAuditAction('ADD_PRODUCT', 'INVENTORY', `Added product "${newProduct.name}" (SKU: ${newProduct.sku})`, newProduct.id);

    return { success: true };
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );

    // Sync product update to Firestore
    syncUpdateDoc('products', id, updates);

    logAuditAction('UPDATE_PRODUCT', 'INVENTORY', `Updated product ${id}`, id);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, is_deleted: true } : p)));
    syncUpdateDoc('products', id, { is_deleted: true, updated_at: new Date().toISOString() });
    logAuditAction('DELETE_PRODUCT', 'INVENTORY', `Soft deleted product ${id}`, id);
  };

  const adjustStock = (productId: string, quantityChange: number, reason: string, movementType: MovementType = 'adjustment') => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const previousStock = prod.current_stock;
    const newStock = Math.max(0, previousStock + quantityChange);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, current_stock: newStock, updated_at: new Date().toISOString() } : p))
    );

    // Create stock movement record
    logAuditAction(
      'STOCK_ADJUSTMENT',
      'INVENTORY',
      `Adjusted stock for "${prod.name}" by ${quantityChange > 0 ? '+' : ''}${quantityChange} (${previousStock} -> ${newStock}). Reason: ${reason}`,
      productId
    );

    // Trigger Notification if below minimum stock
    if (newStock <= prod.min_stock && currentBusiness) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        business_id: currentBusiness.id,
        title: newStock === 0 ? 'Out of Stock' : 'Low Stock Warning',
        message: `${prod.name} current stock is ${newStock} ${prod.unit} (Min: ${prod.min_stock}).`,
        notification_type: newStock === 0 ? 'out_of_stock' : 'low_stock',
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  // POS Session Management
  const openPOSSession = (openingBalance: number) => {
    if (!currentBusiness) return;
    const newSession: POSSession = {
      id: `sess-${Date.now()}`,
      business_id: currentBusiness.id,
      branch_id: currentBranch?.id,
      cashier_id: currentUser.id,
      cashier_name: currentUser.full_name,
      opening_balance: openingBalance,
      status: 'open',
      start_time: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    logAuditAction('POS_SESSION_OPEN', 'POS', `Cashier ${currentUser.full_name} opened register with $${openingBalance.toFixed(2)} float`);
  };

  const closePOSSession = (closingBalance: number) => {
    if (!activePOSSession) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activePOSSession.id
          ? {
              ...s,
              closing_balance: closingBalance,
              status: 'closed',
              end_time: new Date().toISOString(),
            }
          : s
      )
    );
    logAuditAction('POS_SESSION_CLOSE', 'POS', `Cashier ${currentUser.full_name} closed register. Counted cash: $${closingBalance.toFixed(2)}`);
  };

  // Complete POS Sale
  const completePOSSale = (
    cart: POSCartItem[],
    customer: Customer | null,
    paymentMethod: PaymentMethod,
    tendered: number,
    overallDiscount: number,
    notes?: string
  ): { success: boolean; sale?: Sale; error?: string } => {
    if (!currentBusiness) return { success: false, error: 'No active business selected' };
    if (!cart.length) return { success: false, error: 'Cart is empty' };

    // Calculate subtotal, taxes, totals
    let subtotal = 0;
    cart.forEach((item) => {
      const lineTotal = (item.unit_price - item.discount) * item.quantity;
      subtotal += lineTotal;
    });

    const finalTotal = Math.max(0, subtotal - overallDiscount);
    let paidAmount = finalTotal;
    let debtAmount = 0;

    if (paymentMethod === 'credit') {
      if (!customer) {
        return { success: false, error: 'A customer must be selected for debt/credit sales' };
      }
      // Check credit limit
      const currentDebt = customer.current_debt || 0;
      if (customer.credit_limit > 0 && currentDebt + finalTotal > customer.credit_limit) {
        return {
          success: false,
          error: `Credit limit exceeded! Current debt $${currentDebt.toFixed(2)} + $${finalTotal.toFixed(2)} exceeds limit $${customer.credit_limit.toFixed(2)}`,
        };
      }
      paidAmount = 0;
      debtAmount = finalTotal;
    }

    const saleId = `sale-${Date.now()}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const saleItems: SaleItem[] = cart.map((item, idx) => ({
      id: `si-${saleId}-${idx}`,
      business_id: currentBusiness.id,
      sale_id: saleId,
      product_id: item.product.id,
      product_name: item.product.name,
      sku: item.product.sku,
      barcode: item.product.barcode,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      tax: 0,
      total: (item.unit_price - item.discount) * item.quantity,
    }));

    const newSale: Sale = {
      id: saleId,
      tenantId: currentBusiness.id,
      business_id: currentBusiness.id,
      branch_id: currentBranch?.id,
      customer_id: customer?.id,
      customer_name: customer?.name || 'Walk-in Customer',
      invoice_number: invoiceNumber,
      subtotal,
      tax: 0,
      discount: overallDiscount,
      total: finalTotal,
      paid_amount: paidAmount,
      debt_amount: debtAmount,
      payment_method: paymentMethod,
      status: 'completed',
      cashier_id: currentUser.id,
      cashier_name: currentUser.full_name,
      items: saleItems,
      notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Save Sale
    setSales((prev) => [newSale, ...prev]);

    // Asynchronously sync Sale to Firestore
    syncSetDoc('sales', newSale.id, newSale);

    // 2. Reduce Inventory Stock automatically
    cart.forEach((item) => {
      adjustStock(item.product.id, -item.quantity, `POS Sale ${invoiceNumber}`, 'sale');
    });

    // 3. Update Customer Debt if credit sale
    if (customer && debtAmount > 0) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, current_debt: c.current_debt + debtAmount } : c))
      );
      syncUpdateDoc('customers', customer.id, {
        current_debt: customer.current_debt + debtAmount,
        updated_at: new Date().toISOString(),
      });
    }

    // 4. Create Audit Log
    logAuditAction(
      'SALE_COMPLETED',
      'POS',
      `Completed sale ${invoiceNumber} for $${finalTotal.toFixed(2)} via ${paymentMethod} (${customer ? customer.name : 'Walk-in Customer'})`,
      saleId
    );

    return { success: true, sale: newSale };
  };

  // Refund Sale / Return Items
  const refundSale = (saleId: string, reason?: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale || sale.status === 'returned') return;

    // Return stock to inventory
    sale.items.forEach((item) => {
      adjustStock(item.product_id, item.quantity, `Refund / Return for ${sale.invoice_number}`, 'return');
    });

    // If customer had debt, reduce it
    if (sale.customer_id && sale.debt_amount > 0) {
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === sale.customer_id ? { ...c, current_debt: Math.max(0, c.current_debt - sale.debt_amount) } : c
        )
      );
    }

    setSales((prev) =>
      prev.map((s) => (s.id === saleId ? { ...s, status: 'returned', updated_at: new Date().toISOString() } : s))
    );

    syncUpdateDoc('sales', saleId, {
      status: 'returned',
      updated_at: new Date().toISOString(),
    });

    logAuditAction('SALE_REFUNDED', 'SALES', `Processed return for ${sale.invoice_number}. Reason: ${reason || 'Customer Return'}`, saleId);
  };

  // Create Purchase / GRN
  const createPurchase = (
    supplierId: string,
    items: { productId: string; quantity: number; unitCost: number }[],
    paidAmount: number,
    paymentMethod: PaymentMethod,
    invoiceNumber?: string
  ) => {
    if (!currentBusiness) return;
    const sup = suppliers.find((s) => s.id === supplierId);
    const purchaseId = `purch-${Date.now()}`;
    const invNum = invoiceNumber || `PO-${Math.floor(1000 + Math.random() * 9000)}`;

    let subtotal = 0;
    const purchaseItems = items.map((it, idx) => {
      const prod = products.find((p) => p.id === it.productId);
      const total = it.quantity * it.unitCost;
      subtotal += total;
      return {
        id: `pi-${purchaseId}-${idx}`,
        business_id: currentBusiness.id,
        purchase_id: purchaseId,
        product_id: it.productId,
        product_name: prod?.name || 'Product',
        quantity: it.quantity,
        unit_cost: it.unitCost,
        total,
      };
    });

    const total = subtotal;
    const debtAmount = Math.max(0, total - paidAmount);

    const newPurchase: Purchase = {
      id: purchaseId,
      tenantId: currentBusiness.id,
      business_id: currentBusiness.id,
      branch_id: currentBranch?.id,
      supplier_id: supplierId,
      supplier_name: sup?.name,
      invoice_number: invNum,
      subtotal,
      tax: 0,
      discount: 0,
      total,
      paid_amount: paidAmount,
      debt_amount: debtAmount,
      payment_method: paymentMethod,
      status: 'completed',
      items: purchaseItems,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPurchases((prev) => [newPurchase, ...prev]);

    // 1. Increase product inventory & update cost
    items.forEach((it) => {
      adjustStock(it.productId, it.quantity, `Purchase received ${invNum}`, 'purchase');
      // Update purchase cost price
      setProducts((prev) =>
        prev.map((p) => (p.id === it.productId ? { ...p, purchase_price: it.unitCost, updated_at: new Date().toISOString() } : p))
      );
    });

    // 2. Increase supplier debt if debtAmount > 0
    if (sup && debtAmount > 0) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === supplierId ? { ...s, current_debt: s.current_debt + debtAmount } : s))
      );
    }

    logAuditAction(
      'CREATE_PURCHASE',
      'PURCHASES',
      `Received purchase ${invNum} from ${sup?.name || 'Supplier'} for $${total.toFixed(2)} (Paid: $${paidAmount.toFixed(2)}, Debt: $${debtAmount.toFixed(2)})`,
      purchaseId
    );
  };

  // Customers
  const addCustomer = (data: Omit<Customer, 'id' | 'business_id' | 'current_debt' | 'created_at' | 'updated_at'>) => {
    if (!currentBusiness) return;
    const newCust: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      tenantId: currentBusiness.id,
      business_id: currentBusiness.id,
      current_debt: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);

    syncSetDoc('customers', newCust.id, newCust);

    logAuditAction('ADD_CUSTOMER', 'CUSTOMERS', `Added customer ${newCust.name}`, newCust.id);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c))
    );

    syncUpdateDoc('customers', id, updates);

    logAuditAction('UPDATE_CUSTOMER', 'CUSTOMERS', `Updated customer ${id}`, id);
  };

  const recordCustomerPayment = (customerId: string, amount: number, paymentMethod: PaymentMethod, reference?: string) => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const newDebt = Math.max(0, cust.current_debt - amount);
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, current_debt: newDebt, updated_at: new Date().toISOString() } : c))
    );

    syncUpdateDoc('customers', customerId, {
      current_debt: newDebt,
      updated_at: new Date().toISOString(),
    });

    logAuditAction(
      'CUSTOMER_PAYMENT',
      'FINANCE',
      `Received debt payment of $${amount.toFixed(2)} from ${cust.name} via ${paymentMethod} (${reference || 'No ref'})`,
      customerId
    );
  };

  // Suppliers
  const addSupplier = (data: Omit<Supplier, 'id' | 'business_id' | 'current_debt' | 'created_at' | 'updated_at'>) => {
    if (!currentBusiness) return;
    const newSup: Supplier = {
      ...data,
      id: `sup-${Date.now()}`,
      tenantId: currentBusiness.id,
      business_id: currentBusiness.id,
      current_debt: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSup, ...prev]);

    syncSetDoc('suppliers', newSup.id, newSup);

    logAuditAction('ADD_SUPPLIER', 'SUPPLIERS', `Added supplier ${newSup.name}`, newSup.id);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, updated_at: new Date().toISOString() } : s))
    );

    syncUpdateDoc('suppliers', id, updates);

    logAuditAction('UPDATE_SUPPLIER', 'SUPPLIERS', `Updated supplier ${id}`, id);
  };

  const recordSupplierPayment = (supplierId: string, amount: number, paymentMethod: PaymentMethod, reference?: string) => {
    const sup = suppliers.find((s) => s.id === supplierId);
    if (!sup) return;

    const newDebt = Math.max(0, sup.current_debt - amount);
    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, current_debt: newDebt, updated_at: new Date().toISOString() } : s))
    );

    syncUpdateDoc('suppliers', supplierId, {
      current_debt: newDebt,
      updated_at: new Date().toISOString(),
    });

    logAuditAction(
      'SUPPLIER_PAYMENT',
      'FINANCE',
      `Paid supplier debt $${amount.toFixed(2)} to ${sup.name} via ${paymentMethod} (${reference || 'No ref'})`,
      supplierId
    );
  };

  // Expenses
  const addExpense = (expenseData: Omit<Expense, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
    if (!currentBusiness) return;
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      tenantId: currentBusiness.id,
      business_id: currentBusiness.id,
      branch_id: currentBranch?.id,
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);

    syncSetDoc('expenses', newExpense.id, newExpense);

    logAuditAction('ADD_EXPENSE', 'EXPENSES', `Recorded expense "${newExpense.expense_name}" ($${newExpense.amount.toFixed(2)})`, newExpense.id);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    logAuditAction('DELETE_EXPENSE', 'EXPENSES', `Deleted expense ${id}`, id);
  };

  // Employees
  const addEmployee = (employeeData: Omit<Employee, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
    if (!currentBusiness) return;
    const newEmp: Employee = {
      ...employeeData,
      id: `emp-${Date.now()}`,
      tenantId: currentBusiness.id,
      business_id: currentBusiness.id,
      branch_id: currentBranch?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEmployees((prev) => [newEmp, ...prev]);

    syncSetDoc('employees', newEmp.id, newEmp);

    logAuditAction('ADD_EMPLOYEE', 'HRM', `Added employee ${newEmp.full_name} (${newEmp.position})`, newEmp.id);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e))
    );

    syncUpdateDoc('employees', id, updates);

    logAuditAction('UPDATE_EMPLOYEE', 'HRM', `Updated employee ${id}`, id);
  };

  // Branches & Users with Plan Limit Checks
  const addBranch = (data: Omit<Branch, 'id' | 'business_id' | 'created_at' | 'updated_at'>): { success: boolean; message?: string } => {
    if (!currentBusiness) return { success: false, message: 'No active business selected' };

    if (currentPlan && currentPlan.max_branches && tenantBranches.length >= currentPlan.max_branches) {
      return {
        success: false,
        message: `Plan limit reached! Your ${currentPlan.name} plan allows up to ${currentPlan.max_branches} branch(es). Please upgrade.`,
      };
    }

    const newBranch: Branch = {
      ...data,
      id: `branch-${Date.now()}`,
      tenantId: currentBusiness.id,
      business_id: currentBusiness.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBranches((prev) => [newBranch, ...prev]);
    logAuditAction('ADD_BRANCH', 'BRANCHES', `Created branch ${newBranch.name}`, newBranch.id);
    return { success: true };
  };

  const addBusinessUser = (
    email: string,
    fullName: string,
    role: UserRole,
    branchId?: string
  ): { success: boolean; message?: string } => {
    if (!currentBusiness) return { success: false, message: 'No active business selected' };

    if (currentPlan && currentPlan.max_users && tenantBusinessUsers.length >= currentPlan.max_users) {
      return {
        success: false,
        message: `Plan limit reached! Your ${currentPlan.name} plan allows up to ${currentPlan.max_users} users. Please upgrade.`,
      };
    }

    // Check if user profile already exists or create new
    let userProf = userProfiles.find((u) => u.email.toLowerCase() === email.toLowerCase());
    let uid = userProf?.id;

    if (!userProf) {
      uid = `usr-${Date.now()}`;
      userProf = {
        id: uid,
        full_name: fullName,
        email,
        system_role: role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUserProfiles((prev) => [userProf!, ...prev]);
    }

    const newBU: BusinessUser = {
      id: `bu-${Date.now()}`,
      business_id: currentBusiness.id,
      user_id: uid!,
      role,
      branch_id: branchId,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBusinessUsers((prev) => [newBU, ...prev]);
    logAuditAction('ADD_USER', 'USERS', `Assigned user ${fullName} (${email}) as ${role}`, newBU.id);

    return { success: true };
  };

  const updateBusinessUserRole = (id: string, newRole: UserRole) => {
    setBusinessUsers((prev) =>
      prev.map((bu) => (bu.id === id ? { ...bu, role: newRole, updated_at: new Date().toISOString() } : bu))
    );
    logAuditAction('UPDATE_USER_ROLE', 'USERS', `Updated business user ${id} role to ${newRole}`);
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.filter((n) => n.business_id !== currentBusiness?.id));
  };

  // Universal CSV Export
  const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join(
        '\n'
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ERPContext.Provider
      value={{
        language,
        setLanguage,
        t,
        theme,
        toggleTheme,

        currentUser,
        currentBusiness,
        currentBranch,
        currentRole,
        currentSubscription,
        currentPlan,
        userBusinesses,
        allBusinesses: businesses,
        allProfiles: userProfiles,

        switchTenant,
        switchBranch,
        switchUser,
        checkPermission,
        isBusinessAuthenticated,
        loginBusiness,
        logoutBusiness,

        branches: tenantBranches,
        categories: tenantCategories,
        brands: tenantBrands,
        suppliers: tenantSuppliers,
        customers: tenantCustomers,
        products: tenantProducts,
        sales: tenantSales,
        purchases: tenantPurchases,
        expenses: tenantExpenses,
        employees: tenantEmployees,
        businessUsers: tenantBusinessUsers,
        notifications: tenantNotifications,
        auditLogs: tenantAuditLogs,
        subscriptionPlans,
        activeSessions: sessions,

        isSuperAdmin,
        createBusiness,
        deleteBusiness,
        updateBusiness,
        updateBusinessStatus,
        createTenantUser,
        updateUserProfileRoleAndPermissions,
        toggleUserStatus,
        resetUserPassword,

        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,

        activePOSSession,
        openPOSSession,
        closePOSSession,
        completePOSSale,
        refundSale,

        createPurchase,

        addCustomer,
        updateCustomer,
        recordCustomerPayment,
        addSupplier,
        updateSupplier,
        recordSupplierPayment,

        addExpense,
        deleteExpense,
        addEmployee,
        updateEmployee,

        addBranch,
        addBusinessUser,
        updateBusinessUserRole,

        markNotificationAsRead,
        clearAllNotifications,
        logAuditAction,

        exportToCSV,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

export const useERP = () => {
  const context = useContext(ERPContext);
  if (!context) throw new Error('useERP must be used within an ERPProvider');
  return context;
};
