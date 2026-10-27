import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Building2,
  GitBranch,
  Bell,
  Sun,
  Moon,
  Globe,
  Database,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  X,
  AlertTriangle,
  Info,
  Flame,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  onOpenFirebaseModal: () => void;
  activeView: string;
  onOpenSuperAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFirebaseModal, activeView, onOpenSuperAdmin }) => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    currentUser,
    currentBusiness,
    currentBranch,
    branches,
    switchBranch,
    userBusinesses,
    switchTenant,
    allProfiles,
    switchUser,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    currentRole,
    currentPlan,
    logoutBusiness,
  } = useERP();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTenantMenu, setShowTenantMenu] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      {/* Left zone: Active Workspace / Tenant Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                {currentBusiness?.name || 'LINK ERP Platform'}
              </span>
              {currentPlan && (
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-indigo-700 uppercase dark:bg-indigo-950/60 dark:text-indigo-300">
                  {currentPlan.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{currentBusiness?.city || 'Somalia'}</span>
              <span>·</span>
              <span className="capitalize">{currentRole.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Tenant Switcher dropdown for users with multiple businesses or Super Admin */}
        {userBusinesses.length > 1 && (
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowTenantMenu(!showTenantMenu)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span>Switch Business</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showTenantMenu && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Your Workspaces
                </div>
                {userBusinesses.map((biz) => (
                  <button
                    key={biz.id}
                    onClick={() => {
                      switchTenant(biz.id);
                      setShowTenantMenu(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                      biz.id === currentBusiness?.id
                        ? 'bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate">{biz.name}</div>
                      <div className="text-[10px] text-slate-400">{biz.business_type}</div>
                    </div>
                    {biz.id === currentBusiness?.id && <CheckCircle2 className="h-4 w-4 text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Branch Switcher (if business has branches) */}
        {branches.length > 1 && (
          <div className="hidden lg:flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs dark:border-slate-800 dark:bg-slate-800/60">
            <GitBranch className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={currentBranch?.id || ''}
              onChange={(e) => switchBranch(e.target.value || null)}
              className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none dark:text-slate-300"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="dark:bg-slate-900">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right zone: Actions, Notifications, Theme, Language, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'so' : 'en')}
          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
          title="Switch Language: English / Af-Soomaali"
        >
          <Globe className="h-3.5 w-3.5 text-slate-500" />
          <span className="uppercase">{language}</span>
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          title={theme === 'light' ? 'Switch to Dark Mode (Madow)' : 'Switch to Light Mode (Iftiin)'}
          aria-label={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <>
              <Moon className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Dark</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Light</span>
            </>
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Notifications ({unreadCount})
                </span>
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationAsRead(n.id)}
                      className={`mb-1.5 flex cursor-pointer gap-2.5 rounded-lg p-2.5 text-left text-xs transition-colors ${
                        n.is_read
                          ? 'text-slate-500 dark:text-slate-400'
                          : 'bg-indigo-50/60 font-medium text-slate-900 dark:bg-indigo-950/30 dark:text-slate-200'
                      }`}
                    >
                      {n.notification_type === 'low_stock' || n.notification_type === 'out_of_stock' ? (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                      ) : (
                        <Info className="h-4 w-4 shrink-0 text-indigo-500" />
                      )}
                      <div>
                        <div className="font-semibold">{n.title}</div>
                        <div className="text-[11px] opacity-80">{n.message}</div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Persona Switcher & Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
              {currentUser.full_name.charAt(0)}
            </div>
            <div className="hidden text-left xl:block">
              <div className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {currentUser.full_name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                {currentRole.replace('_', ' ')}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50">
              {/* Active User Information */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-sm">
                  {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.full_name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              {/* User Account & Security Details */}
              <div className="py-2.5 space-y-2 text-xs border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-[11px]">Xilka (Role):</span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800 text-[10px]">
                    {currentRole.replace('_', ' ')}
                  </span>
                </div>
                {currentBusiness && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="text-[11px]">Ganacsiga:</span>
                    <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[140px]">
                      {currentBusiness.name}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="text-[11px]">Kala Saaridda:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-[10px]">
                    <ShieldCheck className="h-3 w-3" />
                    Xogtaada Keliya
                  </span>
                </div>
              </div>

              {/* Logout Action in Dropdown */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logoutBusiness();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Ka Bax Ganacsiga (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Standalone Direct Logout Button in Header Bar */}
        <button
          onClick={logoutBusiness}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/80 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
          title="Ka bax ganacsiga hadda (Logout)"
        >
          <LogOut className="h-3.5 w-3.5 text-red-500" />
          <span className="hidden sm:inline">Ka Bax</span>
        </button>
      </div>
    </header>
  );
};
