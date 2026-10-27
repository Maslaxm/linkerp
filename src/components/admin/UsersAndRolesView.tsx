import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { UserRole, ROLE_PERMISSIONS } from '../../types/erp';
import { Users, Plus, ShieldCheck, Check, X, AlertCircle } from 'lucide-react';

export const UsersAndRolesView: React.FC = () => {
  const {
    t,
    businessUsers,
    allProfiles,
    currentPlan,
    addBusinessUser,
    updateBusinessUserRole,
    branches,
  } = useERP();

  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'cashier' as UserRole,
    branchId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;

    setErrorMsg(null);
    const res = addBusinessUser(
      formData.email.trim(),
      formData.fullName.trim(),
      formData.role,
      formData.branchId || undefined
    );

    if (res.success) {
      setShowAddModal(false);
      setFormData({
        fullName: '',
        email: '',
        role: 'cashier',
        branchId: '',
      });
    } else {
      setErrorMsg(res.message || 'Failed to add user');
    }
  };

  const rolesList: UserRole[] = [
    'business_owner',
    'manager',
    'accountant',
    'cashier',
    'inventory_manager',
    'sales_staff',
    'hr_manager',
    'viewer',
  ];

  const permissionsList = [
    { key: 'view_dashboard', label: 'View Dashboard' },
    { key: 'pos_access', label: 'Point of Sale (POS)' },
    { key: 'manage_products', label: 'Manage Products' },
    { key: 'manage_inventory', label: 'Adjust Inventory' },
    { key: 'manage_sales', label: 'View & Manage Sales' },
    { key: 'manage_purchases', label: 'Receive Purchases' },
    { key: 'manage_customers', label: 'Manage Customers' },
    { key: 'manage_suppliers', label: 'Manage Suppliers' },
    { key: 'manage_expenses', label: 'Record Expenses' },
    { key: 'manage_employees', label: 'Manage Employees' },
    { key: 'view_finance', label: 'View Financial Ledger' },
    { key: 'view_reports', label: 'View & Export Reports' },
    { key: 'manage_users', label: 'Manage Business Users' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('users_roles')} & Permissions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tenant user accounts and role-based access control ({businessUsers.length} active users
            {currentPlan?.max_users ? ` / limit ${currentPlan.max_users}` : ''})
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* Staff Accounts Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">User Profile</th>
              <th className="px-4 py-3 font-medium">Assigned Role</th>
              <th className="px-4 py-3 font-medium">Branch Scope</th>
              <th className="px-4 py-3 font-medium">Access Status</th>
              <th className="px-4 py-3 font-medium text-right">Change Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {businessUsers.map((bu) => {
              const prof = allProfiles.find((p) => p.id === bu.user_id);
              const branch = branches.find((b) => b.id === bu.branch_id);

              return (
                <tr key={bu.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {prof?.full_name || 'Staff User'}
                    </div>
                    <div className="text-[11px] text-slate-400">{prof?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {bu.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {branch?.name || 'All Branches'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={bu.role}
                      onChange={(e) => updateBusinessUserRole(bu.id, e.target.value as UserRole)}
                      className="rounded border border-slate-200 px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {rolesList.map((r) => (
                        <option key={r} value={r}>
                          {r.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Granular Permission Matrix */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-600" />
            <span>Role-Based Access Control (RBAC) Permission Matrix</span>
          </h2>
          <p className="text-xs text-slate-500">
            Granular access rules strictly verified on every route and database request.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                <th className="py-2.5 font-medium">Capability / Module</th>
                {rolesList.slice(0, 6).map((r) => (
                  <th key={r} className="py-2.5 text-center font-medium capitalize">
                    {r.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {permissionsList.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2 font-medium text-slate-800 dark:text-slate-200">
                    {perm.label}
                  </td>
                  {rolesList.slice(0, 6).map((r) => {
                    const hasPerm = (ROLE_PERMISSIONS[r] || []).includes(perm.key as any);
                    return (
                      <td key={r} className="py-2 text-center">
                        {hasPerm ? (
                          <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                            <Check className="h-3 w-3" />
                          </div>
                        ) : (
                          <div className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-300 dark:text-slate-600">
                            <X className="h-3 w-3" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Add Staff Member to Workspace
            </h2>

            {errorMsg && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Sahra Jama"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Email Address (Login Username) *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="staff@business.com"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="cashier">Cashier (POS & Sales)</option>
                  <option value="inventory_manager">Inventory Manager (Stock & PO)</option>
                  <option value="accountant">Accountant (Ledger & Finance)</option>
                  <option value="manager">Branch Manager</option>
                  <option value="hr_manager">HR Manager</option>
                  <option value="sales_staff">Sales Staff</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Branch Assignment
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
