import React, { useState } from 'react';
import {
  Flame,
  X,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Lock,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';
import {
  testFirestoreConnection,
  firebaseConfig,
  auth,
  loginWithGoogle,
  logoutUser,
} from '../../lib/firebase';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({ isOpen, onClose }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'rules' | 'auth'>('status');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testFirestoreConnection();
    setTesting(false);
    setTestResult(res);
  };

  const firestoreRulesPreview = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isSuperAdmin() {
      return isSignedIn() && (
        request.auth.token.email == 'ishanews7@gmail.com' ||
        request.auth.token.email == 'admin@linkerp.com'
      );
    }

    match /businesses/{businessId} {
      allow read, create, update: if true;
      allow delete: if isSuperAdmin();
    }
    match /user_profiles/{userId} {
      allow read, create, update: if true;
      allow delete: if isSuperAdmin();
    }
    match /users/{userId} {
      allow read, create, update: if true;
      allow delete: if isSuperAdmin();
    }
    match /products/{productId} { allow read, write: if true; }
    match /sales/{saleId} { allow read, write: if true; }
    match /purchases/{purchaseId} { allow read, write: if true; }
    match /customers/{customerId} { allow read, write: if true; }
    match /suppliers/{supplierId} { allow read, write: if true; }
    match /expenses/{expenseId} { allow read, write: if true; }
    match /employees/{employeeId} { allow read, write: if true; }
    match /branches/{branchId} { allow read, write: if true; }
    match /categories/{catId} { allow read, write: if true; }
    match /brands/{brandId} { allow read, write: if true; }
    match /pos_sessions/{sessionId} { allow read, write: if true; }
    match /audit_logs/{logId} { allow read, create: if true; allow update, delete: if false; }
    match /subscription_plans/{planId} { allow read, write: if true; }
    match /business_subscriptions/{subId} { allow read, write: if true; }
    match /test/{docId} { allow read, write: if true; }
    match /{document=**} { allow read, write: if false; }
  }
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white shadow-xs">
              <Flame className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Firebase Firestore & Authentication
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-Tenant Cloud Database with Live Sync & Security Rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-5 dark:border-slate-800 gap-4">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 pt-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'status'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Database Status & Config
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 pt-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'rules'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Deployed Security Rules
          </button>
          <button
            onClick={() => setActiveTab('auth')}
            className={`pb-2.5 pt-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'auth'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            Firebase Auth
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 text-xs text-slate-700 dark:text-slate-300">
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30">
                <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span>Google Cloud Firestore Provisioned</span>
                </div>
                <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                  The backend has been switched to Firebase Cloud Firestore. All business collections
                  (products, sales, customers, suppliers, inventory, audit logs) run on Google Cloud.
                </p>
              </div>

              {/* Config Details */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Firebase Project ID:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {firebaseConfig.projectId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Firestore Database ID:</span>
                  <span className="font-mono text-slate-900 dark:text-white text-[11px]">
                    {firebaseConfig.firestoreDatabaseId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Storage Bucket:</span>
                  <span className="font-mono text-slate-900 dark:text-white text-[11px]">
                    {firebaseConfig.storageBucket}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Auth Domain:</span>
                  <span className="font-mono text-slate-900 dark:text-white text-[11px]">
                    {firebaseConfig.authDomain}
                  </span>
                </div>
              </div>

              {testResult && (
                <div
                  className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTestConnection}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50 shadow-xs"
                >
                  <Database className="h-3.5 w-3.5" />
                  <span>{testing ? 'Testing...' : 'Test Firestore Connection'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Deployed Firestore Security Rules
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Deployed to Google Cloud project ({firebaseConfig.projectId})
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(firestoreRulesPreview);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Rules'}</span>
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-slate-900 p-3 font-mono text-[11px] text-slate-200 dark:border-slate-800">
                <pre>{firestoreRulesPreview}</pre>
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {auth.currentUser ? auth.currentUser.displayName || auth.currentUser.email : 'Local Session / Demo RBAC Mode'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {auth.currentUser ? auth.currentUser.email : 'You can sign in with your real Google account or switch roles in the top bar.'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {auth.currentUser ? (
                    <button
                      onClick={async () => {
                        await logoutUser();
                        alert('Logged out from Firebase Auth');
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out from Firebase</span>
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        try {
                          await loginWithGoogle();
                          alert('Signed in successfully with Google!');
                        } catch (err: any) {
                          if (err?.code === 'auth/unauthorized-domain' || (err?.message && err.message.includes('unauthorized-domain'))) {
                            const domain = window.location.hostname;
                            alert(`Fadlan ku dar domain-ka "${domain}" qaybta: Firebase Console > Authentication > Settings > Authorized Domains ee mashruuca link-erp-88b2b.`);
                          } else {
                            alert(`Sign in note: ${err.message}`);
                          }
                        }
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Sign in with Google</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 p-4 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
