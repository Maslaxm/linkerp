import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { GitBranch, Plus, Search, Building2, Phone, MapPin, AlertCircle } from 'lucide-react';

export const BranchesView: React.FC = () => {
  const { t, branches, addBranch, currentPlan, switchBranch, currentBranch } = useERP();
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '+252 61 ',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setErrorMsg(null);
    const res = addBranch({
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      is_active: true,
    });

    if (res.success) {
      setShowAddModal(false);
      setFormData({ name: '', address: '', phone: '+252 61 ' });
    } else {
      setErrorMsg(res.message || 'Failed to add branch');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('branches')} Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-branch retail locations ({branches.length} branches registered
            {currentPlan?.max_branches ? ` / limit ${currentPlan.max_branches}` : ''})
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
          <span>Add New Branch</span>
        </button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((b) => {
          const isSelected = currentBranch?.id === b.id;
          return (
            <div
              key={b.id}
              className={`rounded-2xl border p-5 transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/20'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200">
                    <GitBranch className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{b.name}</h3>
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => switchBranch(isSelected ? null : b.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {isSelected ? 'Active Scope' : 'Filter Scope'}
                </button>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 pt-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{b.address || 'Central Address'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{b.phone || '+252 61 000 0000'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Create New Branch Location
            </h2>

            {errorMsg && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Branch Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Bakara Wholesale Branch"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Physical Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Market Gate 3, Sector 2"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
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
                  Add Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
