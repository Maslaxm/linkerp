import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Sale } from '../../types/erp';
import { ReceiptModal } from '../common/ReceiptModal';
import {
  Receipt,
  Search,
  Download,
  Eye,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Filter,
  CreditCard,
  Printer,
} from 'lucide-react';

export const SalesView: React.FC = () => {
  const { t, sales, refundSale, exportToCSV } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'returned'>('all');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      searchTerm === '' ||
      sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.cashier_name && sale.cashier_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const headers = [
      'Invoice Number',
      'Date',
      'Customer',
      'Cashier',
      'Payment Method',
      'Subtotal',
      'Discount',
      'Grand Total',
      'Paid Amount',
      'Debt Amount',
      'Status',
    ];
    const rows = filteredSales.map((s) => [
      s.invoice_number,
      new Date(s.created_at).toLocaleString(),
      s.customer_name || 'Walk-in',
      s.cashier_name || 'Cashier',
      s.payment_method,
      s.subtotal.toFixed(2),
      s.discount.toFixed(2),
      s.total.toFixed(2),
      s.paid_amount.toFixed(2),
      s.debt_amount.toFixed(2),
      s.status,
    ]);
    exportToCSV(`sales_invoices_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const handleRefund = (sale: Sale) => {
    if (confirm(`Refund sale invoice ${sale.invoice_number}? This will return all items back into stock.`)) {
      refundSale(sale.id, 'Customer requested return');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('sales')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Invoice records, returns and receipts ({sales.length} transactions recorded)
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Invoices CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by invoice #, customer name or cashier..."
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="returned">Returned / Refunded</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">{t('invoice_number')}</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">{t('payment_method')}</th>
              <th className="px-4 py-3 font-medium text-center">Items</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium text-right">Paid</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Date & Time</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                  No sales invoices found
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                    {sale.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {sale.customer_name || 'Walk-in Customer'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {sale.payment_method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono tabular-nums text-slate-500">
                    {sale.items.length}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    ${sale.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    ${sale.paid_amount.toFixed(2)}
                    {sale.debt_amount > 0 && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400">
                        Debt: ${sale.debt_amount.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {sale.status === 'completed' ? (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Completed
                      </span>
                    ) : (
                      <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                        Returned
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 text-[11px]">
                    {new Date(sale.created_at).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedSaleForReceipt(sale)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800"
                        title="View & Print Receipt"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      {sale.status === 'completed' && (
                        <button
                          onClick={() => handleRefund(sale)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                          title="Process Return & Restock items"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedSaleForReceipt}
        onClose={() => setSelectedSaleForReceipt(null)}
        sale={selectedSaleForReceipt}
      />
    </div>
  );
};
