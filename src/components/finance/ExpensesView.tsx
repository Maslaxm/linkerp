import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Expense, PaymentMethod } from '../../types/erp';
import { CreditCard, Plus, Search, Download, Trash2, Tag, Calendar } from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { t, expenses, addExpense, deleteExpense, exportToCSV } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    expense_name: '',
    category: 'Rent',
    amount: '',
    payment_method: 'cash' as PaymentMethod,
    description: '',
  });

  const categoriesList = [
    'Rent',
    'Electricity',
    'Water',
    'Internet',
    'Salaries',
    'Transport',
    'Maintenance',
    'Marketing',
    'Office expenses',
    'Other',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formData.amount);
    if (!formData.expense_name.trim() || isNaN(numAmount) || numAmount <= 0) return;

    addExpense({
      expense_name: formData.expense_name.trim(),
      category: formData.category,
      amount: numAmount,
      payment_method: formData.payment_method,
      description: formData.description.trim() || undefined,
    });

    setShowAddModal(false);
    setFormData({
      expense_name: '',
      category: 'Rent',
      amount: '',
      payment_method: 'cash',
      description: '',
    });
  };

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      searchTerm === '' ||
      e.expense_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;

    return matchesSearch && matchesCat;
  });

  const totalExpenseAmount = filtered.reduce((acc, e) => acc + e.amount, 0);

  const handleExport = () => {
    const headers = ['Date', 'Expense Title', 'Category', 'Payment Method', 'Amount ($)', 'Description'];
    const rows = filtered.map((e) => [
      new Date(e.created_at).toLocaleDateString(),
      e.expense_name,
      e.category,
      e.payment_method,
      e.amount.toFixed(2),
      e.description || '',
    ]);
    exportToCSV(`expenses_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('expenses')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Operational business expenses, rent, utilities and receipts (Total: ${totalExpenseAmount.toFixed(2)})
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
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>{t('record_expense')}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by expense title or description..."
            className="w-full text-xs bg-transparent dark:text-white focus:outline-none pl-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Expense Categories</option>
            {categoriesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">Expense Title & Description</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Payment Method</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
              <th className="px-4 py-3 font-medium text-right">Date</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                  No expense records found
                </td>
              </tr>
            ) : (
              filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {exp.expense_name}
                    </div>
                    {exp.description && (
                      <div className="text-[11px] text-slate-400">{exp.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 uppercase text-[10px] font-medium text-slate-500">
                    {exp.payment_method.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    ${exp.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 text-[11px]">
                    {new Date(exp.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Delete expense "${exp.expense_name}"?`)) {
                          deleteExpense(exp.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Record Operating Expense
            </h2>
            <p className="text-xs text-slate-500">
              Log facility rent, electricity, fuel, salaries or supplies.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.expense_name}
                  onChange={(e) => setFormData({ ...formData, expense_name: e.target.value })}
                  placeholder="e.g. Generator Diesel 100L"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Payment Method
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="cash">Cash Cadaan</option>
                  <option value="mobile_money">Mobile Money (EVC/Zaad)</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="card">Card / POS</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Description / Receipt Notes
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Optional details, vendor or invoice number"
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
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
