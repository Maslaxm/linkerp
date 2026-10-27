import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Store,
} from 'lucide-react';

interface BusinessLoginViewProps {
  onOpenSuperAdmin?: () => void;
}

export const BusinessLoginView: React.FC<BusinessLoginViewProps> = () => {
  const { loginBusiness } = useERP();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg('Fadlan geli Gmail-kaaga iyo Password-ka ganacsigaaga.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await loginBusiness(cleanEmail, cleanPass);
      if (!result.success) {
        setErrorMsg(result.message || 'Gmail-ka ama Password-ka waa khalad.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMsg('Qalad ayaa dhacay xilliga xaqiijinta. Fadlan dib u tijaabi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col justify-between selection:bg-indigo-500 selection:text-white text-slate-900 dark:text-slate-100">
      {/* Top bar with Super Admin Quick Link */}
      <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20">
            L
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-base">
                LINK ERP
              </span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                SaaS Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Nidaamka Maamulka Ganacsiyada</p>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          {/* Header icon and title */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 shadow-lg">
              <Store className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Galitaanka Ganacsiga
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Geli <strong className="text-slate-800 dark:text-slate-200">Gmail-ka</strong> iyo <strong className="text-slate-800 dark:text-slate-200">Password-ka</strong> laguu sameeyay si aad u gasho ganacsigaaga oo keliya.
            </p>
          </div>

          {/* Form container */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur-xl">
            {errorMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <div className="leading-snug">{errorMsg}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Gmail / Email-ka Ganacsiga
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tusaale: admin@ganacsigaaga.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password-ka Ganacsiga
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Geli password-kaaga..."
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-800 font-mono"
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
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-700 disabled:opacity-60"
              >
                <span>{isLoading ? 'Xaqiijinayaa...' : 'Gal Ganacsiga (Login)'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="border-t border-slate-200 bg-white/50 px-6 py-3 text-center text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
        Powered by LINKTECH
      </footer>
    </div>
  );
};
