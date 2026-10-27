import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Settings, Building2, ShieldCheck, Check, Save } from 'lucide-react';

export const BusinessSettingsView: React.FC = () => {
  const { t, currentBusiness, updateBusiness, currentPlan, currentSubscription } = useERP();

  const [formData, setFormData] = useState({
    name: currentBusiness?.name || '',
    business_type: currentBusiness?.business_type || '',
    owner_name: currentBusiness?.owner_name || '',
    owner_phone: currentBusiness?.owner_phone || '',
    address: currentBusiness?.address || '',
    city: currentBusiness?.city || '',
    country: currentBusiness?.country || 'Somalia',
    tax_number: currentBusiness?.tax_number || '',
    currency: currentBusiness?.currency || 'USD',
    timezone: currentBusiness?.timezone || 'Africa/Mogadishu',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!currentBusiness) {
    return <div className="p-8 text-center text-slate-400">No active business selected</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusiness(currentBusiness.id, formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          {t('settings')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage company profile, tax registration, currency and subscription details
        </p>
      </div>

      {/* Subscription Card */}
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 dark:border-indigo-950 dark:bg-indigo-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Current Subscription Plan:
              </span>
              <span className="rounded bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white uppercase">
                {currentPlan?.name || 'Standard Plan'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {currentPlan?.description || 'Active business multi-branch subscription'}
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">Plan Status:</div>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize text-sm">
              {currentSubscription?.status || 'Active'}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-indigo-100 pt-3 dark:border-indigo-900/50 text-xs">
          <div>
            <span className="text-slate-500">Allowed Users:</span>
            <div className="font-semibold font-mono text-slate-800 dark:text-slate-200">
              {currentPlan?.max_users} accounts
            </div>
          </div>
          <div>
            <span className="text-slate-500">Max Branches:</span>
            <div className="font-semibold font-mono text-slate-800 dark:text-slate-200">
              {currentPlan?.max_branches} locations
            </div>
          </div>
          <div>
            <span className="text-slate-500">Max Products:</span>
            <div className="font-semibold font-mono text-slate-800 dark:text-slate-200">
              {currentPlan?.max_products} items
            </div>
          </div>
          <div>
            <span className="text-slate-500">Cloud Storage:</span>
            <div className="font-semibold font-mono text-slate-800 dark:text-slate-200">
              {currentPlan?.storage_limit_mb} MB
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Business Legal Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Industry / Business Type
              </label>
              <input
                type="text"
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Owner Contact Name
              </label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Owner Phone Number
              </label>
              <input
                type="text"
                value={formData.owner_phone}
                onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Storefront / Head Office Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Tax Identification Number
              </label>
              <input
                type="text"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                placeholder="TAX-SO-XXXX"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                Functional Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="SOS">SOS (Somali Shilling)</option>
                <option value="SLSH">SLSH (Somaliland Shilling)</option>
                <option value="EUR">EUR (€ - Euro)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {savedSuccess ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4" />
                <span>Business profile updated successfully!</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Workspace ID: {currentBusiness.id}
              </span>
            )}

            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 shadow-xs"
            >
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
