import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Supplier, PaymentMethod } from '../../types/erp';
import { Building, Plus, Search, Download, DollarSign, Edit2, ArrowUpRight } from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const {
    t,
    suppliers,
    addSupplier,
    updateSupplier,
    recordSupplierPayment,
    exportToCSV,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Pay Debt modal
  const [paySupplier, setPaySupplier] = useState<Supplier | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('bank');
  const [payRef, setPayRef] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    phone: '+252 61 ',
    email: '',
    address: '',
    supplier_code: '',
    notes: '',
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      company_name: '',
      phone: '+252 61 ',
      email: '',
      address: '',
      supplier_code: `SUP-${Math.floor(100 + Math.random() * 900)}`,
      notes: '',
    });
    setEditingSupplier(null);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name.trim(),
      company_name: formData.company_name.trim() || undefined,
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      address: formData.address.trim() || undefined,
      supplier_code: formData.supplier_code || `SUP-${Date.now()}`,
      notes: formData.notes.trim() || undefined,
    };

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, payload);
    } else {
      addSupplier(payload);
    }
    setShowAddModal(false);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paySupplier) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;

    recordSupplierPayment(paySupplier.id, amount, payMethod, payRef);
    setPaySupplier(null);
    setPayAmount('');
    setPayRef('');
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.company_name && s.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.phone.includes(searchTerm)
  );

  const totalSupplierDebt = suppliers.reduce((acc, s) => acc + (s.current_debt || 0), 0);

  const handleExport = () => {
    const headers = ['Code', 'Supplier Name', 'Company', 'Phone', 'Email', 'Address', 'Current Debt', 'Notes'];
    const rows = filtered.map((s) => [
      s.supplier_code,
      s.name,
      s.company_name || '',
      s.phone,
      s.email || '',
      s.address || '',
      s.current_debt.toFixed(2),
      s.notes || '',
    ]);
    exportToCSV(`suppliers_report_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('suppliers')} & Payables
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Vendor accounts, purchase ledgers and payable debts (Total Payables: ${totalSupplierDebt.toFixed(2)})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by supplier or company name..."
          className="w-full text-xs bg-transparent dark:text-white focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">Supplier & Company</th>
              <th className="px-4 py-3 font-medium">Contact Phone</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium text-right">Owed Debt (Payables)</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                  No suppliers found
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{s.name}</div>
                    <div className="text-[11px] text-slate-400">{s.company_name || s.supplier_code}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    <div>{s.phone}</div>
                    {s.email && <div className="text-[10px] text-slate-400">{s.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{s.address || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        s.current_debt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'
                      }`}
                    >
                      ${s.current_debt.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {s.current_debt > 0 && (
                        <button
                          onClick={() => {
                            setPaySupplier(s);
                            setPayAmount(s.current_debt.toString());
                          }}
                          className="flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                          <span>Pay Debt</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingSupplier(s);
                          setFormData({
                            name: s.name,
                            company_name: s.company_name || '',
                            phone: s.phone,
                            email: s.email || '',
                            address: s.address || '',
                            supplier_code: s.supplier_code,
                            notes: s.notes || '',
                          });
                          setShowAddModal(true);
                        }}
                        className="rounded p-1 text-slate-400 hover:text-slate-700"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier / Vendor'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Supplier Name / Contact Person *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Gulf Food Importers"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Official company registered name"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Phone *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                  {editingSupplier ? 'Save Changes' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {paySupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Pay Supplier Debt: {paySupplier.name}
            </h3>
            <div className="mt-1 text-slate-500">
              Current Owed Debt:{' '}
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                ${paySupplier.current_debt.toFixed(2)}
              </span>
            </div>

            <form onSubmit={handlePaySubmit} className="mt-4 space-y-3">
              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Amount Paid ($) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash Cadaan</option>
                  <option value="mobile_money">Mobile Money</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Reference Code / Cheque #
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. IBS-88192"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPaySupplier(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 font-semibold text-white hover:bg-indigo-700"
                >
                  Record Outflow Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
