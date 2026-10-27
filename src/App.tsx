import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './context/ERPContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { FirebaseModal } from './components/common/FirebaseModal';
import { BusinessDashboard } from './components/dashboard/BusinessDashboard';
import { SuperAdminPortal } from './components/admin/SuperAdminPortal';
import { BusinessLoginView } from './components/auth/BusinessLoginView';
import { POSView } from './components/pos/POSView';
import { ProductsView } from './components/inventory/ProductsView';
import { StockAdjustmentsView } from './components/inventory/StockAdjustmentsView';
import { SalesView } from './components/sales/SalesView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { CustomersView } from './components/contacts/CustomersView';
import { SuppliersView } from './components/contacts/SuppliersView';
import { ExpensesView } from './components/finance/ExpensesView';
import { FinanceView } from './components/finance/FinanceView';
import { EmployeesView } from './components/hrm/EmployeesView';
import { ReportsView } from './components/reports/ReportsView';
import { BranchesView } from './components/admin/BranchesView';
import { UsersAndRolesView } from './components/admin/UsersAndRolesView';
import { AuditLogsView } from './components/admin/AuditLogsView';
import { BusinessSettingsView } from './components/admin/BusinessSettingsView';
import { Menu, ShieldCheck } from 'lucide-react';

function ERPAppContent() {
  const { currentRole, checkPermission, currentUser, currentBusiness, isBusinessAuthenticated } = useERP();
  
  // Portal Mode: 'erp' (normal business app) vs 'super_admin' (isolated master portal)
  const [portalMode, setPortalMode] = useState<'erp' | 'super_admin'>('erp');
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global Keyboard Shortcut: Ctrl + Shift + A (or Cmd + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Shift+A or Cmd+Shift+A
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setPortalMode((prev) => (prev === 'super_admin' ? 'erp' : 'super_admin'));
        setToastMessage(
          portalMode === 'super_admin'
            ? 'Ku noqotay Web App-ka Link ERP'
            : 'Furay Super Admin Portal (Ctrl + Shift + A) - Maamulka Guud'
        );
        setTimeout(() => setToastMessage(null), 3500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [portalMode]);

  // If in Super Admin Portal mode, render the decoupled standalone portal!
  if (portalMode === 'super_admin') {
    return (
      <>
        <SuperAdminPortal onExit={() => setPortalMode('erp')} />

        {/* Floating shortcut toast notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-indigo-500/40 bg-slate-900/95 px-5 py-3.5 text-white shadow-2xl backdrop-blur-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                Platform Super Admin
              </div>
              <div className="text-xs font-semibold text-white">{toastMessage}</div>
            </div>
          </div>
        )}
      </>
    );
  }

  // If not authenticated in a business account, show the Business Login Screen
  if (!isBusinessAuthenticated) {
    return (
      <>
        <BusinessLoginView onOpenSuperAdmin={() => setPortalMode('super_admin')} />

        {/* Floating shortcut toast notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-indigo-500/40 bg-slate-900/95 px-5 py-3.5 text-white shadow-2xl backdrop-blur-md">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                Platform Super Admin
              </div>
              <div className="text-xs font-semibold text-white">{toastMessage}</div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Handle sidebar navigation - route to super admin or view
  const handleSelectView = (view: string) => {
    if (view === 'super_admin') {
      setPortalMode('super_admin');
    } else {
      setActiveView(view);
    }
  };

  // Render standard business views
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <BusinessDashboard onNavigate={(v) => handleSelectView(v)} />;
      case 'pos':
        return <POSView />;
      case 'products':
        return <ProductsView />;
      case 'stock_movements':
        return <StockAdjustmentsView />;
      case 'sales':
        return <SalesView />;
      case 'purchases':
        return <PurchasesView />;
      case 'customers':
        return <CustomersView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'expenses':
        return <ExpensesView />;
      case 'finance':
        return <FinanceView />;
      case 'employees':
        return <EmployeesView />;
      case 'reports':
        return <ReportsView />;
      case 'branches':
        return <BranchesView />;
      case 'users_roles':
        return <UsersAndRolesView />;
      case 'audit_logs':
        return <AuditLogsView />;
      case 'settings':
        return <BusinessSettingsView />;
      default:
        return <BusinessDashboard onNavigate={(v) => handleSelectView(v)} />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onSelectView={handleSelectView}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="flex items-center">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden p-3 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            aria-label="Open navigation menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <Header
              onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
              activeView={activeView}
              onOpenSuperAdmin={() => setPortalMode('super_admin')}
            />
          </div>
        </div>

        {/* View Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{renderView()}</div>
        </main>
      </div>

      {/* Floating shortcut toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-indigo-500/40 bg-slate-900/95 px-5 py-3.5 text-white shadow-2xl backdrop-blur-md">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Platform Control · Super Admin
            </div>
            <div className="text-xs font-semibold text-white">{toastMessage}</div>
          </div>
        </div>
      )}

      {/* Firebase Firestore & Security Rules Modal */}
      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ERPProvider>
      <ERPAppContent />
    </ERPProvider>
  );
}
