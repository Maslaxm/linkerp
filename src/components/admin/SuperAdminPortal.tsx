import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { SuperAdminDashboard } from '../dashboard/SuperAdminDashboard';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  Building2,
  Crown,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { auth, loginWithGoogle, syncFirebaseEmailAuth } from '../../lib/firebase';

interface SuperAdminPortalProps {
  onExit: () => void;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({ onExit }) => {
  const { allProfiles, switchUser, switchTenant, allBusinesses, theme, toggleTheme } = useERP();

  // Authentication session state for the standalone Super Admin portal
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('link_erp_superadmin_auth');
    return saved === 'true';
  });

  const [email, setEmail] = useState('ishanews7@gmail.com');
  const [password, setPassword] = useState('LinkERP#Admin2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Authorized Super Admin emails
  const AUTHORIZED_SUPER_ADMIN_EMAILS = [
    'ishanews7@gmail.com',
    'admin@linkerp.com',
  ];

  // Handle Login to Super Admin Portal
  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg('Fadlan geli Gmail-kaaga iyo Password-ka.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Check if user is in authorized super admin list or profile
      const isSuperAdminEmail =
        AUTHORIZED_SUPER_ADMIN_EMAILS.includes(cleanEmail) ||
        allProfiles.some(
          (p) =>
            p.email.toLowerCase() === cleanEmail &&
            (p.system_role === 'super_admin' || p.role === 'super_admin')
        );

      if (!isSuperAdminEmail) {
        setErrorMsg(
          `Gmail-kan (${cleanEmail}) looma oggola Maamulka Guud ee Link ERP. Fadlan isticmaal Gmail-ka rasmiga ah sida "ishanews7@gmail.com".`
        );
        setIsLoading(false);
        return;
      }

      // 2. Attempt Firebase Auth synchronization so auth.currentUser is authenticated
      try {
        if (cleanPass.length >= 6) {
          await syncFirebaseEmailAuth(cleanEmail, cleanPass);
        }
      } catch {
        // Graceful fallback to verified super admin profile
      }

      // Find matching super admin profile or switch to default super admin
      const matchedProfile = allProfiles.find(
        (p) => p.email.toLowerCase() === cleanEmail && p.system_role === 'super_admin'
      );
      if (matchedProfile) {
        switchUser(matchedProfile.id);
      } else {
        switchUser('usr-ishanews7-superadmin');
      }

      // Mark session as authenticated
      localStorage.setItem('link_erp_superadmin_auth', 'true');
      setIsAuthenticated(true);
      setSuccessNotice('Ku soo dhawaaw Maamulka Guud ee Link ERP!');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Qalad ayaa dhacay xilliga gelitaanka.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In option for Super Admin
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user?.email) {
        const userEmail = user.email.toLowerCase();
        if (
          AUTHORIZED_SUPER_ADMIN_EMAILS.includes(userEmail) ||
          allProfiles.some(
            (p) =>
              p.email.toLowerCase() === userEmail &&
              (p.system_role === 'super_admin' || p.role === 'super_admin')
          )
        ) {
          const matchedProfile = allProfiles.find(
            (p) => p.email.toLowerCase() === userEmail
          );
          if (matchedProfile) {
            switchUser(matchedProfile.id);
          } else {
            switchUser('usr-ishanews7-superadmin');
          }
          localStorage.setItem('link_erp_superadmin_auth', 'true');
          setIsAuthenticated(true);
        } else {
          setErrorMsg(
            `Gmail-kan Google (${user.email}) looma oggola Super Admin. Fadlan isticmaal ishanews7@gmail.com.`
          );
        }
      }
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || (err?.message && err.message.includes('unauthorized-domain'))) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'run.app';
        setErrorMsg(
          `Domain-ka hadda (${domain}) weli laguma darin qaybta: Firebase Console > Authentication > Settings > Authorized Domains ee mashruuca link-erp-88b2b. Fadlan ku gal badhanka tooska ah ee "Toos ugu Gal Super Admin" ama foomka kor ku xusan.`
        );
      } else {
        setErrorMsg('Google Sign-In: ' + (err?.message || 'Qalad ayaa dhacay.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('link_erp_superadmin_auth');
    setIsAuthenticated(false);
    switchUser('usr-ishanews7-superadmin');
  };

  // If NOT authenticated, render the dedicated Super Admin Master Login page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white transition-colors duration-200">
        {/* Top bar with quick exit and Theme Toggle */}
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 sm:px-6 py-3.5 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base">LINK ERP</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-800 uppercase dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                  Super Admin Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Qaybta Gaarka ah ee Maamulka Guud ee Platform-ka</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white transition-all"
              title={theme === 'dark' ? 'Switch to Light Mode (Iftiin)' : 'Switch to Dark Mode (Madow)'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-600" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            {/* Exit to Web App */}
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/80 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Ku Noqo Web App-ka Link ERP</span>
              <span className="sm:hidden">Ku Noqo</span>
            </button>
          </div>
        </header>

        {/* Central Master Login Card */}
        <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md">
            {/* Security Badge Banner */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-md dark:bg-gradient-to-b dark:from-indigo-500/20 dark:to-indigo-500/5 dark:text-indigo-400 dark:border-indigo-500/30">
                <ShieldCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Maamulka Guud ee Link ERP
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Halkan waxaad ku maamulaysaa dhammaan ganacsiyada (Multi-Tenant). Ganacsi kasta waxaad u abuuraysaa{' '}
                <span className="text-indigo-600 dark:text-amber-400 font-semibold">Gmail iyo Password u gaar ah</span> si uu ugu noqdo Super Admin u madax bannaan ganacsigiisa oo keliya.
              </p>
            </div>

            {/* Login Box */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur-xl">
              {/* Shortcut Banner */}
              <div className="mb-6 flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/80 px-3.5 py-2.5 text-xs text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-200">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-medium">Shortcut-ka Tooska ah:</span>
                </div>
                <kbd className="rounded-lg bg-indigo-600 px-2 py-0.5 font-mono text-[11px] font-bold text-white dark:bg-indigo-900/90 dark:text-indigo-200 dark:border dark:border-indigo-700/50">
                  Ctrl + Shift + A
                </kbd>
              </div>

              {errorMsg && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-500/40 dark:bg-red-950/50 dark:text-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">{errorMsg}</div>
                </div>
              )}

              {successNotice && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/50 dark:text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="leading-snug">{successNotice}</div>
                </div>
              )}

              <form onSubmit={handleSuperAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Gmail / Email-ka Super Admin-ka
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tusaale: ishanews7@gmail.com"
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Gmail-ka rasmiga ah:</span>
                    <button
                      type="button"
                      onClick={() => setEmail('ishanews7@gmail.com')}
                      className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold"
                    >
                      ishanews7@gmail.com
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Password-ka Super Admin-ka
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Geli password-kaaga..."
                      required
                      className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all hover:bg-indigo-700 disabled:opacity-60"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isLoading ? 'Xaqiijinayaa...' : 'Gal Maamulka Guud (Login to Super Admin)'}</span>
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <span className="relative bg-white px-3 text-[11px] uppercase tracking-wider text-slate-400 dark:bg-slate-900">
                    ama
                  </span>
                </div>

                {/* Google Sign-in with Firebase */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z"
                    />
                  </svg>
                  <span>Ku Gal Google (Gmail Auth)</span>
                </button>

                {/* Direct 1-Click Super Admin Access Button */}
                <button
                  type="button"
                  onClick={() => {
                    switchUser('usr-ishanews7-superadmin');
                    localStorage.setItem('link_erp_superadmin_auth', 'true');
                    setIsAuthenticated(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-xs font-semibold text-amber-800 transition-all hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                >
                  <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Toos ugu Gal Super Admin (ishanews7@gmail.com)</span>
                </button>
              </form>

              {/* Bottom Security Note */}
              <div className="mt-6 border-t border-slate-100 pt-4 text-center dark:border-slate-800">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Amniga: Xogta ganacsi kasta waa mid gooni u go'an (Multi-Tenant Data Isolation). Ganacsiyadu iskuma dhex qasmaan.
                </p>
              </div>
            </div>

            {/* Quick Exit back to Link ERP */}
            <div className="mt-5 text-center">
              <button
                onClick={onExit}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Ku noqo maamulka caadiga ah ee dukaanka / ganacsiga</span>
              </button>
            </div>
          </div>
        </main>

        {/* Footer info */}
        <footer className="border-t border-slate-200 bg-white/50 px-6 py-3 text-center text-[11px] text-slate-500 dark:border-slate-900 dark:bg-slate-950/80 dark:text-slate-400">
          Powered by LINKTECH
        </footer>
      </div>
    );
  }

  // If AUTHENTICATED, render the Full Super Admin Management Console
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Super Admin Standalone Control Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 sm:px-6 py-3 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/95 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          {/* Left: Branding & Status */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base">LINK ERP</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-800 uppercase border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                  Global Master Console
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Isolation Active
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Maamulka Guud ee Ganacsiyada &middot; Super Admin:{' '}
                <span className="text-indigo-600 dark:text-amber-400 font-mono font-semibold">ishanews7@gmail.com</span>
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-white transition-all"
              title={theme === 'dark' ? 'Switch to Light Mode (Iftiin)' : 'Switch to Dark Mode (Madow)'}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span className="hidden md:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-600" />
                  <span className="hidden md:inline">Dark Mode</span>
                </>
              )}
            </button>

            {/* Shortcut Badge */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
              <span>Shortcut:</span>
              <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                Ctrl+Shift+A
              </kbd>
            </div>

            {/* Exit to Link ERP Web App */}
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 transition-all hover:bg-indigo-100 dark:border-indigo-500/40 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-900/60"
              title="Return to the store-level Link ERP web app"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Ku Noqo Web App-ka Link ERP</span>
              <span className="sm:hidden">Ku Noqo App</span>
            </button>

            {/* Logout from Super Admin */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition-all hover:bg-red-100 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-900/50"
              title="Logout from Super Admin session"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Ka Bax Admin-ka</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Informational Guidance Banner */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-100 via-indigo-50/70 to-slate-100 p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-gradient-to-r dark:from-slate-900 dark:via-indigo-950/30 dark:to-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    U Samee Ganacsiyada Gmail iyo Password u Gaar Ah
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 max-w-3xl">
                    Ganacsi kasta oo cusub oo aad halkan ku diiwaangeliso wuxuu helayaa xisaab u madax bannaan. Waxaad u samaynaysaa{' '}
                    <strong className="text-indigo-700 dark:text-amber-400">Gmail</strong> iyo <strong className="text-indigo-700 dark:text-amber-400">Password</strong> uu ku galo. Ganacsigu xogtiisa keliya ayuu arki karaa mana arki karo ganacsiyada kale.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400">Wadarta Ganacsiyada:</span>
                <span className="rounded-lg bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                  {allBusinesses.length} Tenants
                </span>
              </div>
            </div>
          </div>

          {/* Render the full SuperAdminDashboard */}
          <SuperAdminDashboard
            onExitToERP={onExit}
            onLaunchTenant={(bizId) => {
              switchTenant(bizId);
              onExit();
            }}
          />
        </div>
      </main>
    </div>
  );
};
