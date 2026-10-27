import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Building2,
  Crown,
  Users,
  Layers,
  DollarSign,
  Plus,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Key,
  Check,
  X,
  Edit,
  Lock,
  RefreshCw,
  UserPlus,
  Shield,
  Copy,
  CheckCheck,
  KeyRound,
  Dices,
} from 'lucide-react';
import { ERPPermission, UserRole, ROLE_PERMISSIONS } from '../../types/erp';

const ALL_PERMISSIONS: { key: ERPPermission; label: string; desc: string }[] = [
  { key: 'view_dashboard', label: 'View Dashboard', desc: 'Access analytics and summaries' },
  { key: 'pos_access', label: 'POS Terminal', desc: 'Operate sales register and scanner' },
  { key: 'manage_sales', label: 'Sales & Invoices', desc: 'Create and process customer sales' },
  { key: 'manage_products', label: 'Products Catalog', desc: 'Create and edit product list' },
  { key: 'manage_inventory', label: 'Inventory & Stock', desc: 'Adjust stock and transfers' },
  { key: 'manage_purchases', label: 'Purchases & POs', desc: 'Receive goods from suppliers' },
  { key: 'manage_customers', label: 'Customers & Debts', desc: 'Manage customer credit ledger' },
  { key: 'manage_suppliers', label: 'Suppliers & Payables', desc: 'Manage vendor accounts' },
  { key: 'manage_expenses', label: 'Expenses', desc: 'Record operational expenditures' },
  { key: 'manage_employees', label: 'HRM & Staff', desc: 'Staff payroll and employment' },
  { key: 'view_finance', label: 'Finance & P&L', desc: 'Access financial statements' },
  { key: 'view_reports', label: 'Reports & Analytics', desc: 'Generate business insights' },
  { key: 'export_reports', label: 'Data Export', desc: 'Export to CSV and PDF' },
  { key: 'manage_branches', label: 'Multi-Branch', desc: 'Configure retail locations' },
  { key: 'manage_users', label: 'Staff Roles', desc: 'Assign roles to branch users' },
  { key: 'manage_settings', label: 'Store Settings', desc: 'Configure tax, currency, and info' },
  { key: 'view_audit_logs', label: 'Audit Security', desc: 'Review immutable change logs' },
];

interface SuperAdminDashboardProps {
  onExitToERP?: () => void;
  onLaunchTenant?: (bizId: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onExitToERP, onLaunchTenant }) => {
  const {
    allBusinesses,
    allProfiles,
    businessUsers,
    subscriptionPlans,
    createBusiness,
    deleteBusiness,
    updateBusinessStatus,
    createTenantUser,
    updateUserProfileRoleAndPermissions,
    toggleUserStatus,
    resetUserPassword,
    switchTenant,
    auditLogs,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'businesses' | 'users' | 'plans' | 'audit'>('businesses');
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<{
    id: string;
    full_name: string;
    email: string;
    role: UserRole;
    permissions: ERPPermission[];
  } | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ user: string; tempPass: string } | null>(null);

  // Created credentials modal state for quick copy / sharing
  const [createdCredentialsSummary, setCreatedCredentialsSummary] = useState<{
    companyName: string;
    tenantId: string;
    ownerName: string;
    email: string;
    password: string;
    role: string;
    plan: string;
    businessId: string;
  } | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Generate strong random password
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = 'Link#';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  // New business form state with full requirements
  const [formData, setFormData] = useState({
    name: '',
    tenantId: '',
    business_type: 'Supermarket & Grocery',
    owner_name: '',
    owner_email: '',
    owner_phone: '+252 61 ',
    temp_password: 'LinkERP#Temp2026',
    role: 'business_owner' as UserRole,
    status: 'active' as 'active' | 'suspended' | 'inactive',
    permissions: [...(ROLE_PERMISSIONS.business_owner || [])] as ERPPermission[],
    address: 'KM4 Maka Al Mukarama Road',
    city: 'Mogadishu',
    country: 'Somalia',
    tax_number: 'TAX-SO-8821',
    currency: 'USD',
    timezone: 'Africa/Mogadishu',
    plan_id: 'plan-standard',
  });

  // New User for existing tenant form state
  const [newUserData, setNewUserData] = useState({
    tenantId: allBusinesses[0]?.id || '',
    full_name: '',
    email: '',
    phone: '+252 61 ',
    temp_password: 'LinkERP#User2026',
    role: 'sales_staff' as UserRole,
    permissions: [...(ROLE_PERMISSIONS.sales_staff || [])] as ERPPermission[],
  });

  const activeBusinesses = allBusinesses.filter((b) => b.status === 'active');
  const suspendedBusinesses = allBusinesses.filter((b) => b.status === 'suspended');

  const filteredBusinesses = allBusinesses.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.owner_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = allProfiles.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      (u.tenantId || u.business_id || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.system_role.toLowerCase().includes(userSearchTerm.toLowerCase());

    const matchesTenant =
      selectedTenantFilter === 'all'
        ? true
        : u.tenantId === selectedTenantFilter || u.business_id === selectedTenantFilter;

    return matchesSearch && matchesTenant;
  });

  // Handle Business & Autonomous Admin Creation
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.owner_name.trim() || !formData.owner_email.trim()) {
      alert('Fadlan geli Magaca Ganacsiga, Magaca Admin-ka iyo Gmail/Email-ka.');
      return;
    }

    const res = createBusiness(formData);
    setShowCreateModal(false);

    // Show credential receipt modal for easy sharing
    setCreatedCredentialsSummary({
      companyName: res.business.name,
      tenantId: res.business.id,
      ownerName: res.owner.full_name,
      email: res.owner.email,
      password: res.temp_password,
      role: 'Super Admin u madax banaan ganacsigiisa keliya',
      plan: subscriptionPlans.find((p) => p.id === formData.plan_id)?.name || formData.plan_id,
      businessId: res.business.id,
    });

    setFormData({
      name: '',
      tenantId: '',
      business_type: 'Supermarket & Grocery',
      owner_name: '',
      owner_email: '',
      owner_phone: '+252 61 ',
      temp_password: generateStrongPassword(),
      role: 'business_owner',
      status: 'active',
      permissions: [...(ROLE_PERMISSIONS.business_owner || [])],
      address: '',
      city: 'Mogadishu',
      country: 'Somalia',
      tax_number: '',
      currency: 'USD',
      timezone: 'Africa/Mogadishu',
      plan_id: 'plan-standard',
    });
  };

  // Handle adding user to tenant
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.tenantId || !newUserData.full_name.trim() || !newUserData.email.trim()) {
      alert('Fadlan buuxi Tenant-ka, Magaca buuxa iyo Gmail/Email-ka.');
      return;
    }

    const res = createTenantUser(newUserData);
    if (!res.success) {
      alert(res.message);
      return;
    }

    setShowAddUserModal(false);
    const targetBiz = allBusinesses.find((b) => b.id === newUserData.tenantId);

    setCreatedCredentialsSummary({
      companyName: targetBiz?.name || newUserData.tenantId,
      tenantId: newUserData.tenantId,
      ownerName: newUserData.full_name,
      email: newUserData.email,
      password: res.temp_password || newUserData.temp_password,
      role: newUserData.role.replace('_', ' ').toUpperCase(),
      plan: 'Tenant Staff User',
      businessId: newUserData.tenantId,
    });

    setNewUserData({
      tenantId: allBusinesses[0]?.id || '',
      full_name: '',
      email: '',
      phone: '+252 61 ',
      temp_password: generateStrongPassword(),
      role: 'sales_staff',
      permissions: [...(ROLE_PERMISSIONS.sales_staff || [])],
    });
  };

  const handleCopyCredentials = () => {
    if (!createdCredentialsSummary) return;
    const text = `🌟 LINK ERP - Helitaanka Xafiiska Ganacsigaaga\n` +
      `🏢 Shirkadda: ${createdCredentialsSummary.companyName}\n` +
      `🆔 Tenant ID: ${createdCredentialsSummary.tenantId}\n` +
      `👤 Magaca Admin-ka: ${createdCredentialsSummary.ownerName}\n` +
      `📧 Gmail / Login Email: ${createdCredentialsSummary.email}\n` +
      `🔑 Password: ${createdCredentialsSummary.password}\n` +
      `💼 Doorka / Heerka: ${createdCredentialsSummary.role}\n` +
      `📦 Qorshaha: ${createdCredentialsSummary.plan}\n\n` +
      `🔒 Xusuusin: Xogta ganacsigaagu waa mid u gooni ah shirkaddaada oo keliya (Database RLS Isolation). Marnaba ganacsi kale ma arki karo.\n` +
      `🌐 Linkiga App-ka: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 3000);
  };

  // Toggle permission in Create Modal
  const toggleCreatePermission = (perm: ERPPermission) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists ? prev.permissions.filter((p) => p !== perm) : [...prev.permissions, perm],
      };
    });
  };

  // Handle role change in create modal (auto updates default permissions)
  const handleRoleChangeInCreate = (newRole: UserRole) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      permissions: [...(ROLE_PERMISSIONS[newRole] || [])],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Top Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md">
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                LINK ERP Platform Owner Portal
              </h1>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase dark:bg-amber-950 dark:text-amber-300">
                Super Admin Authorized
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-Tenant SaaS architecture with database-level isolation and centralized tenant management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <UserPlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Create Tenant User</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Provision New Business</span>
          </button>
        </div>
      </div>

      {/* Super Admin Quick Access Notice & Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-amber-50/70 p-4 text-xs dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-amber-950/20 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm font-bold">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
              <span>Shortcut-ka Tooska ah ee Admin Dashboard-kan:</span>
              <kbd className="rounded bg-indigo-600 px-2 py-0.5 font-mono text-xs font-bold text-white shadow-xs">
                Ctrl + Shift + A
              </kbd>
              <span className="text-[11px] text-slate-500">(ama ⌘ + Shift + A Mac-ka)</span>
            </div>
            <p className="mt-0.5 text-slate-600 dark:text-slate-300">
              Meel kasta oo aad app-ka ka joogto, taabo shortcut-kan si aad toos ugu soo gasho Maamulka Guud ee Link ERP.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-indigo-200/60 bg-white/90 px-3.5 py-2 text-[11px] text-slate-700 dark:border-indigo-800 dark:bg-slate-900/90 dark:text-slate-300">
          <span className="font-bold text-indigo-700 dark:text-indigo-400">Autonomous Admin:</span> Ganacsi kasta oo aad ku darto wuxuu yeelanayaa Gmail & Password gooni ah, isagoo noqonaya <strong>Super Admin u madax banaan ganacsigiisa keliya</strong> (Zero Data Leakage).
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-medium">Total Registered Tenants</span>
            <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {allBusinesses.length}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{activeBusinesses.length} active</span>
            <span>•</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">{suspendedBusinesses.length} suspended</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-medium">Total Platform Users</span>
            <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {allProfiles.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
            {allProfiles.filter((u) => u.is_active).length} active credentials
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-medium">SaaS Monthly Volume</span>
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            $
            {allBusinesses
              .reduce((acc) => acc + 39, 0)
              .toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">Monthly recurring subscription revenue</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-medium">Database Isolation</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            100% Firestore RLS
          </div>
          <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">Zero cross-tenant data leakage</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('businesses')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'businesses'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Business Management ({allBusinesses.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Tenant Users & Roles ({allProfiles.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'plans'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Subscription Plans ({subscriptionPlans.length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          System Audit Logs ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Business Management */}
      {activeTab === 'businesses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search businesses, tenant ID, or owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredBusinesses.length}</span> of {allBusinesses.length} isolated tenants
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">Business & Tenant ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Owner & Credentials</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredBusinesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{biz.name}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                        <span className="rounded bg-slate-100 px-1 dark:bg-slate-800">ID: {biz.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {biz.business_type}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{biz.owner_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{biz.owner_email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {biz.city}, {biz.country}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          biz.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${biz.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {biz.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            switchTenant(biz.id);
                            if (onLaunchTenant) onLaunchTenant(biz.id);
                          }}
                          className="flex items-center gap-1 rounded bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
                          title="Enter and manage this business workspace directly"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>Gal Ganacsigan</span>
                        </button>
                        {biz.status === 'active' ? (
                          <button
                            onClick={() => updateBusinessStatus(biz.id, 'suspended')}
                            className="rounded p-1 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                            title="Suspend Tenant Access"
                          >
                            <PauseCircle className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateBusinessStatus(biz.id, 'active')}
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                            title="Re-activate Tenant Access"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete tenant "${biz.name}"?`)) {
                              deleteBusiness(biz.id);
                            }
                          }}
                          className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50"
                          title="Delete Business"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Tenant Users & Roles */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <select
                value={selectedTenantFilter}
                onChange={(e) => setSelectedTenantFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="all">All Tenants ({allBusinesses.length})</option>
                {allBusinesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.id})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 shrink-0 transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Create Tenant User</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-100 text-[11px] font-semibold text-slate-700 uppercase dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3">User & Email</th>
                  <th className="px-4 py-3">Assigned Tenant / Company</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Permissions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  const assignedTenantId = u.tenantId || u.business_id;
                  const tenantBiz = allBusinesses.find((b) => b.id === assignedTenantId);
                  const effectivePerms = u.permissions && u.permissions.length > 0
                    ? u.permissions
                    : ROLE_PERMISSIONS[u.system_role] || [];

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{u.full_name}</span>
                          {u.system_role === 'super_admin' && (
                            <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {u.system_role === 'super_admin' ? (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">Global Platform (All Tenants)</span>
                        ) : (
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-200">
                              {tenantBiz?.name || 'Assigned Business'}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">ID: {assignedTenantId || 'N/A'}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase dark:bg-indigo-950/60 dark:text-indigo-300">
                          {u.system_role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {u.system_role === 'super_admin' ? 'All (Full Access)' : `${effectivePerms.length} assigned`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingUser({
                                id: u.id,
                                full_name: u.full_name,
                                email: u.email,
                                role: u.system_role,
                                permissions: effectivePerms,
                              });
                            }}
                            className="flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Edit User Role & Permissions"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit Role</span>
                          </button>

                          <button
                            onClick={() => {
                              const temp = resetUserPassword(u.id);
                              setResetPasswordResult({ user: u.email, tempPass: temp });
                            }}
                            className="flex items-center gap-1 rounded bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60 transition-colors"
                            title="Reset User Password"
                          >
                            <Key className="h-3 w-3" />
                            <span>Reset Pass</span>
                          </button>

                          {u.system_role !== 'super_admin' && (
                            <button
                              onClick={() => toggleUserStatus(u.id)}
                              className={`rounded p-1 ${u.is_active ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'}`}
                              title={u.is_active ? 'Deactivate User' : 'Activate User'}
                            >
                              {u.is_active ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Subscription Plans */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    SaaS Tier
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{plan.description}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    ${plan.monthly_price}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ month</span>
                </div>

                <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-4 dark:border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>User Limit</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {plan.max_users === 999 ? 'Unlimited' : `${plan.max_users} users`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Branch Locations</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {plan.max_branches === 999 ? 'Unlimited' : `${plan.max_branches} branch`}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Product Limit</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {plan.max_products ? `${plan.max_products.toLocaleString()} SKUs` : 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Cloud Storage</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{plan.storage_limit_mb} MB</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Included Features</span>
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="text-center text-xs text-slate-500 dark:text-slate-400">
                  {allBusinesses.filter((b) => b.status === 'active').length} businesses active on this tier
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-slate-200 bg-slate-100 text-[11px] font-semibold text-slate-700 uppercase dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Tenant ID</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {auditLogs.slice(0, 50).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      {log.tenantId || log.business_id || 'platform'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-sans font-medium text-slate-900 dark:text-slate-100">
                    {log.user_name || 'System'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">{log.action}</td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-sans">{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Password Reset Result Notification Modal */}
      {resetPasswordResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Credentials Generated</h3>
            </div>
            <p className="mt-2 text-xs text-slate-700 dark:text-slate-300">
              Temporary login credentials have been created for user{' '}
              <strong className="text-slate-900 dark:text-white">{resetPasswordResult.user}</strong>:
            </p>
            <div className="mt-3 rounded-lg bg-slate-100 p-3 font-mono text-sm font-bold text-indigo-700 dark:bg-slate-800 dark:text-indigo-300 border border-slate-200 dark:border-slate-700">
              {resetPasswordResult.tempPass}
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Share this password with the user. They can change their password after logging in.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setResetPasswordResult(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Role & Permissions Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Manage Role & Granular Permissions
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">{editingUser.email}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-800 dark:text-slate-200">Assign Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => {
                    const newR = e.target.value as UserRole;
                    setEditingUser({
                      ...editingUser,
                      role: newR,
                      permissions: [...(ROLE_PERMISSIONS[newR] || [])],
                    });
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="business_owner">Business Owner (Full Tenant Admin)</option>
                  <option value="manager">Branch / General Manager</option>
                  <option value="cashier">POS Cashier</option>
                  <option value="inventory_manager">Inventory & Warehouse Manager</option>
                  <option value="accountant">Accountant / Bookkeeper</option>
                  <option value="sales_staff">Sales Associate</option>
                  <option value="hr_manager">HR / Personnel Officer</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Granular Access Permissions ({editingUser.permissions.length} active)
                  </label>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingUser({
                          ...editingUser,
                          permissions: ALL_PERMISSIONS.map((p) => p.key),
                        })
                      }
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Select All
                    </button>
                    <span className="text-slate-400">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingUser({
                          ...editingUser,
                          permissions: [...(ROLE_PERMISSIONS[editingUser.role] || [])],
                        })
                      }
                      className="text-slate-500 hover:underline dark:text-slate-400"
                    >
                      Reset to Role Default
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-800/40">
                  {ALL_PERMISSIONS.map((perm) => {
                    const checked = editingUser.permissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-2 rounded p-1.5 cursor-pointer text-xs ${
                          checked
                            ? 'bg-indigo-50/90 text-indigo-950 dark:bg-indigo-950/60 dark:text-indigo-200'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const newP = checked
                              ? editingUser.permissions.filter((p) => p !== perm.key)
                              : [...editingUser.permissions, perm.key];
                            setEditingUser({ ...editingUser, permissions: newP });
                          }}
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="font-semibold">{perm.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">{perm.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateUserProfileRoleAndPermissions(
                      editingUser.id,
                      editingUser.role,
                      editingUser.permissions
                    );
                    setEditingUser(null);
                  }}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User to Tenant Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Tenant User Account</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Provision a new user credential assigned to a specific tenant workspace with custom role and permissions.
            </p>

            <form onSubmit={handleAddUserSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-800 dark:text-slate-200">Assign to Tenant Workspace *</label>
                <select
                  required
                  value={newUserData.tenantId}
                  onChange={(e) => setNewUserData({ ...newUserData, tenantId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {allBusinesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Tenant ID: {b.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maryam Xaashi"
                    value={newUserData.full_name}
                    onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Email / Gmail Username *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@business.com"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Assigned Role</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setNewUserData({
                        ...newUserData,
                        role: r,
                        permissions: [...(ROLE_PERMISSIONS[r] || [])],
                      });
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="business_owner">Business Owner</option>
                    <option value="manager">Manager</option>
                    <option value="cashier">Cashier</option>
                    <option value="inventory_manager">Inventory Manager</option>
                    <option value="accountant">Accountant</option>
                    <option value="sales_staff">Sales Staff</option>
                    <option value="hr_manager">HR Manager</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-800 dark:text-slate-200">Temporary Password</label>
                    <button
                      type="button"
                      onClick={() => setNewUserData({ ...newUserData, temp_password: generateStrongPassword() })}
                      className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                    >
                      <Dices className="h-3 w-3" />
                      <span>Random Pass</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newUserData.temp_password}
                    onChange={(e) => setNewUserData({ ...newUserData, temp_password: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 shadow-xs transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision New Business Modal (Full Fields) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Provision New Business / Company Account
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Creates isolated tenant container, assigns tenant ID, owner credentials, role, status & permissions.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-950 dark:bg-indigo-950/20">
                <span className="font-bold text-indigo-900 dark:text-indigo-200">1. Company & Tenant Identifier</span>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200">Company / Business Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        const generatedId = `biz-${name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}`;
                        setFormData({
                          ...formData,
                          name,
                          tenantId: formData.tenantId ? formData.tenantId : generatedId,
                        });
                      }}
                      placeholder="e.g. Al-Hikma Supermarket"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200">
                      Tenant / Business ID (Unique) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tenantId}
                      onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                      placeholder="e.g. biz-alhikma"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Used for database-level RLS isolation</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200">Business Type</label>
                    <select
                      value={formData.business_type}
                      onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Supermarket & Grocery">Supermarket & Grocery</option>
                      <option value="Wholesale & Distribution">Wholesale & Distribution</option>
                      <option value="Pharmacy & Medical">Pharmacy & Medical</option>
                      <option value="Electronics & Hardware">Electronics & Hardware</option>
                      <option value="Restaurant & Cafe">Restaurant & Cafe</option>
                      <option value="Hotel & Hospitality">Hotel & Hospitality</option>
                      <option value="General Retail">General Retail</option>
                      <option value="Office & SME">Office & SME</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200">Account Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as 'active' | 'suspended' | 'inactive' })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="active">Active (Full Access)</option>
                      <option value="suspended">Suspended (Access Halted)</option>
                      <option value="inactive">Inactive / Trial Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
                <span className="font-bold text-slate-900 dark:text-white">2. User Account & Authentication</span>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200">User Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.owner_name}
                      onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                      placeholder="e.g. Ahmed Yusuf"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200">Email / Gmail Username *</label>
                    <input
                      type="email"
                      required
                      value={formData.owner_email}
                      onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                      placeholder="owner@business.com"
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200">User Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleRoleChangeInCreate(e.target.value as UserRole)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="business_owner">Business Owner (Full Workspace Owner)</option>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                      <option value="accountant">Accountant</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-slate-800 dark:text-slate-200">
                        Password-ka Login-ka (Secret Password) *
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, temp_password: generateStrongPassword() })}
                        className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                      >
                        <Dices className="h-3 w-3" />
                        <span>Samee Password Adag</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.temp_password}
                      onChange={(e) => setFormData({ ...formData, temp_password: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono font-bold text-indigo-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300"
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Waxaa lagu xiri doonaa Firebase Auth</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-900 dark:text-white">
                    3. Granular User Permissions ({formData.permissions.length} selected)
                  </span>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, permissions: ALL_PERMISSIONS.map((p) => p.key) })}
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Select All
                    </button>
                    <span className="text-slate-400">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          permissions: [...(ROLE_PERMISSIONS[formData.role] || [])],
                        })
                      }
                      className="text-slate-500 hover:underline dark:text-slate-400"
                    >
                      Reset to Role Default
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-800/30">
                  {ALL_PERMISSIONS.map((perm) => {
                    const checked = formData.permissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-center gap-1.5 rounded p-1 cursor-pointer text-[11px] ${
                          checked
                            ? 'bg-indigo-50 text-indigo-950 dark:bg-indigo-950/60 dark:text-indigo-200'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCreatePermission(perm.key)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate font-medium">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="SOS">SOS (Somali Shilling)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200">Subscription Plan</label>
                  <select
                    value={formData.plan_id}
                    onChange={(e) => setFormData({ ...formData, plan_id: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {subscriptionPlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - ${p.monthly_price}/mo
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 shadow-sm transition-colors"
                >
                  Provision Business Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Business & Admin Credentials Receipt Modal */}
      {createdCredentialsSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Akoonka Ganacsiga & Admin-ka Waa La Diyaariyey!
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Nuqul ka qaado macluumaadkan si aad ugu dirto milkiilaha ganacsiga (WhatsApp, SMS ama Gmail)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCreatedCredentialsSummary(null)}
                className="rounded p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/50 space-y-2.5">
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-400">Shirkadda / Ganacsiga:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{createdCredentialsSummary.companyName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-400">Tenant / Business ID:</span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{createdCredentialsSummary.tenantId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-400">Admin-ka / Milkiilaha:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-200">{createdCredentialsSummary.ownerName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-400">Gmail / Email-ka Login-ka:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{createdCredentialsSummary.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/80 pb-1.5 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-400">Password-ka Login-ka:</span>
                  <span className="rounded bg-indigo-100 px-2 py-0.5 font-mono text-sm font-extrabold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    {createdCredentialsSummary.password}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Awoodda Xafiiska:</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {createdCredentialsSummary.role}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-indigo-50/70 p-3 text-[11px] text-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900/40">
                🔒 <strong>Ammaanka Xogta (Tenant RLS):</strong> Milkiilahaani wuxuu si madax-banaan u maamulayaa ganacsigiisa oo keliya (Customers, Products, Sales, Expenses, HRM, Reports). Marnaba xogtiisa lama wadaagayo ganacsi kale.
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCopyCredentials}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  {hasCopied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{hasCopied ? 'Waa La Koobiyeey! ✓' : 'Koobiyeey Macluumaadka Login-ka'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    switchTenant(createdCredentialsSummary.businessId);
                    setCreatedCredentialsSummary(null);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Gal Xafiiska Hadda</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
