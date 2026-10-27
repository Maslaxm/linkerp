import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Customer, PaymentMethod } from '../../types/erp';
import { Users, Plus, Search, Download, DollarSign, Edit2, Trash2, ArrowDownLeft } from 'lucide-react';

export const CustomersView: React.FC = () => {
  const {
    t,
    customers,
    addCustomer,
    updateCustomer,
    recordCustomerPayment,
    sales,
    exportToCSV,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Debt Payment modal
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [paymentRef, setPaymentRef] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '+252 61 ',
    email: '',
    address: '',
    customer_code: '',
    credit_limit: '1000',
    notes: '',
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      phone: '+252 61 ',
      email: '',
      address: '',
      customer_code: `CUST-${Math.floor(100 + Math.random() * 900)}`,
      credit_limit: '1000',
      notes: '',
    });
    setEditingCustomer(null);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      address: formData.address.trim() || undefined,
      customer_code: formData.customer_code || `CUST-${Date.now()}`,
      credit_limit: parseFloat(formData.credit_limit) || 0,
      notes: formData.notes.trim() || undefined,
    };

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, payload);
    } else {
      addCustomer(payload);
    }
    setShowAddModal(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    recordCustomerPayment(paymentCustomer.id, amount, paymentMethod, paymentRef);
    setPaymentCustomer(null);
    setPaymentAmount('');
    setPaymentRef('');
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.customer_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDebt = customers.reduce((acc, c) => acc + (c.current_debt || 0), 0);

  const handleExport = () => {
    const headers = ['Code', 'Name', 'Phone', 'Email', 'Address', 'Credit Limit', 'Current Debt', 'Notes'];
    const rows = filtered.map((c) => [
      c.customer_code,
      c.name,
      c.phone,
      c.email || '',
      c.address || '',
      c.credit_limit.toFixed(2),
      c.current_debt.toFixed(2),
      c.notes || '',
    ]);
    exportToCSV(`customers_report_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('customers')} & Debts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Customer directory, credit limits and debt ledger (Total Receivables: ${totalDebt.toFixed(2)})
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
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer name, phone number or code..."
          className="w-full text-xs bg-transparent dark:text-white focus:outline-none"
        />
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">Customer Code & Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium text-right">Credit Limit</th>
              <th className="px-4 py-3 font-medium text-right">Current Debt</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                  No customers found
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const isOverLimit = c.credit_limit > 0 && c.current_debt > c.credit_limit;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{c.customer_code}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      <div>{c.phone}</div>
                      {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{c.address || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      ${c.credit_limit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          isOverLimit
                            ? 'text-red-600 dark:text-red-400'
                            : c.current_debt > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        ${c.current_debt.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.current_debt > 0 && (
                          <button
                            onClick={() => {
                              setPaymentCustomer(c);
                              setPaymentAmount(c.current_debt.toString());
                            }}
                            className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                            title="Record Debt Payment"
                          >
                            <ArrowDownLeft className="h-3 w-3" />
                            <span>Pay Debt</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingCustomer(c);
                            setFormData({
                              name: c.name,
                              phone: c.phone,
                              email: c.email || '',
                              address: c.address || '',
                              customer_code: c.customer_code,
                              credit_limit: c.credit_limit.toString(),
                              notes: c.notes || '',
                            });
                            setShowAddModal(true);
                          }}
                          className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Full Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ahmed Nur Jama"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+252 61..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="optional"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="District, street"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Credit Limit ($)
                </label>
                <input
                  type="number"
                  step="50"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
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
                  {editingCustomer ? 'Save Changes' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt Payment Modal */}
      {paymentCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Receive Debt Payment from {paymentCustomer.name}
            </h3>
            <div className="mt-1 text-slate-500">
              Total Outstanding Debt:{' '}
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                ${paymentCustomer.current_debt.toFixed(2)}
              </span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-3">
              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Payment Amount Received ($) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="mobile_money">Mobile Money (EVC / Zaad / Sahal)</option>
                  <option value="cash">Cash Cadaan</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Card / POS</option>
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Transaction Reference / Notes
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. EVC-99120"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPaymentCustomer(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-1.5 font-semibold text-white hover:bg-emerald-700"
                >
                  Record Payment Received
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
