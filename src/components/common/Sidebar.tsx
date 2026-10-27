import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Layers,
  Truck,
  Users,
  Building,
  CreditCard,
  DollarSign,
  BarChart3,
  GitBranch,
  UserCheck,
  ShieldAlert,
  Settings,
  Crown,
  Database,
  ScanBarcode,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isOpen,
  onCloseMobile,
}) => {
  const { t, currentUser, checkPermission, currentBusiness, isSuperAdmin, logoutBusiness } = useERP();


  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
    badge?: string | number;
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const groups: NavGroup[] = [
    {
      title: 'Operations',
      items: [
        { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
        { id: 'pos', label: t('pos'), icon: ShoppingCart },
        { id: 'sales', label: t('sales'), icon: Receipt },
      ],
    },
    {
      title: 'Inventory & Purchasing',
      items: [
        { id: 'products', label: t('products'), icon: Package },
        { id: 'stock_movements', label: t('inventory_movements'), icon: Layers },
        { id: 'purchases', label: t('purchases'), icon: Truck },
        { id: 'suppliers', label: t('suppliers'), icon: Building },
      ],
    },
    {
      title: 'CRM & Accounting',
      items: [
        { id: 'customers', label: t('customers'), icon: Users },
        { id: 'expenses', label: t('expenses'), icon: CreditCard },
        { id: 'finance', label: t('finance'), icon: DollarSign },
        { id: 'reports', label: t('reports'), icon: BarChart3 },
      ],
    },
    {
      title: 'Management',
      items: [
        { id: 'branches', label: t('branches'), icon: GitBranch },
        { id: 'employees', label: t('employees'), icon: UserCheck },
        { id: 'users_roles', label: t('users_roles'), icon: Users },
        { id: 'audit_logs', label: t('audit_logs'), icon: ShieldAlert },
        { id: 'settings', label: t('settings'), icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out dark:border-slate-800 dark:bg-slate-900 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand identity header */}
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold tracking-wider shadow-sm">
            L
          </div>
          <div>
            <div className="font-bold tracking-tight text-slate-900 dark:text-white">LINK ERP</div>
            <div className="text-[10px] text-slate-400">Enterprise Multi-Tenant</div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {groups.map((group) => (
            <div key={group.title}>
              <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider dark:text-slate-500">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectView(item.id);
                        onCloseMobile();
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                            isActive ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Tenant status footer */}
        <div className="border-t border-slate-200 p-3 dark:border-slate-800 space-y-2">
          <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>RLS Database Security</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
            </div>
            <div className="mt-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
              {currentBusiness?.name || 'All Businesses'}
            </div>
          </div>

          <button
            onClick={logoutBusiness}
            className="flex w-full items-center justify-between rounded-lg border border-red-200/70 bg-red-50/50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100/70 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
            title="Ka bax ganacsiga (Logout)"
          >
            <div className="flex items-center gap-1.5">
              <LogOut className="h-3.5 w-3.5 text-red-500" />
              <span>Ka Bax Ganacsiga</span>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};
