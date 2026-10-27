import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Truck, Plus, Search, Download, Trash2, CheckCircle2, DollarSign } from 'lucide-react';
import { PaymentMethod } from '../../types/erp';

export const PurchasesView: React.FC = () => {
  const { t, purchases, suppliers, products, createPurchase, exportToCSV } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Purchase state
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank');
  const [paidAmount, setPaidAmount] = useState('');
  const [purchaseLines, setPurchaseLines] = useState<
    { productId: string; quantity: number; unitCost: number }[]
  >([]);

  const handleOpenModal = () => {
    setSelectedSupplierId(suppliers[0]?.id || '');
    setInvoiceNumber(`PO-${Math.floor(1000 + Math.random() * 9000)}`);
    setPurchaseLines([
      {
        productId: products[0]?.id || '',
        quantity: 10,
        unitCost: products[0]?.purchase_price || 10,
      },
    ]);
    setPaidAmount('');
    setShowAddModal(true);
  };

  const handleAddLine = () => {
    setPurchaseLines((prev) => [
      ...prev,
      {
        productId: products[0]?.id || '',
        quantity: 5,
        unitCost: products[0]?.purchase_price || 5,
      },
    ]);
  };

  const handleRemoveLine = (idx: number) => {
    setPurchaseLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateLine = (
    idx: number,
    field: 'productId' | 'quantity' | 'unitCost',
    value: any
  ) => {
    setPurchaseLines((prev) =>
      prev.map((line, i) => {
        if (i === idx) {
          if (field === 'productId') {
            const prod = products.find((p) => p.id === value);
            return {
              ...line,
              productId: value,
              unitCost: prod ? prod.purchase_price : line.unitCost,
            };
          }
          return { ...line, [field]: value };
        }
        return line;
      })
    );
  };

  const calculatedTotal = purchaseLines.reduce((acc, l) => acc + l.quantity * l.unitCost, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert('Please select a supplier');
      return;
    }
    if (!purchaseLines.length) {
      alert('Please add at least one line item');
      return;
    }

    const numPaid = paidAmount === '' ? calculatedTotal : parseFloat(paidAmount) || 0;

    createPurchase(
      selectedSupplierId,
      purchaseLines,
      numPaid,
      paymentMethod,
      invoiceNumber
    );

    setShowAddModal(false);
  };

  const filtered = purchases.filter((p) => {
    return (
      searchTerm === '' ||
      p.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleExport = () => {
    const headers = ['PO Number', 'Date', 'Supplier', 'Payment Method', 'Total', 'Paid', 'Debt', 'Status'];
    const rows = filtered.map((p) => [
      p.invoice_number,
      new Date(p.created_at).toLocaleDateString(),
      p.supplier_name || 'Supplier',
      p.payment_method,
      p.total.toFixed(2),
      p.paid_amount.toFixed(2),
      p.debt_amount.toFixed(2),
      p.status,
    ]);
    exportToCSV(`purchases_export_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('purchases')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Supplier Goods Received Notes (GRN), inventory stock-in and debt tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Receive New Stock (PO)</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by PO invoice # or supplier..."
          className="w-full text-xs bg-transparent dark:text-white focus:outline-none"
        />
      </div>

      {/* Purchases Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">PO / Invoice #</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium text-center">Items</th>
              <th className="px-4 py-3 font-medium text-right">Total Cost</th>
              <th className="px-4 py-3 font-medium text-right">Paid</th>
              <th className="px-4 py-3 font-medium text-right">Supplier Debt</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                  No purchases found
                </td>
              </tr>
            ) : (
              filtered.map((purch) => (
                <tr key={purch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                    {purch.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {purch.supplier_name || 'Supplier'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono tabular-nums text-slate-500">
                    {purch.items.length}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    ${purch.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                    ${purch.paid_amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    ${purch.debt_amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {purch.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 text-[11px]">
                    {new Date(purch.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Receive Inventory Stock (Purchase Order / GRN)
            </h2>
            <p className="text-xs text-slate-500">
              Receiving items automatically increases inventory stock and updates cost price.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Select Supplier *
                  </label>
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Choose Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Invoice / Bill Number
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="bank">Bank Transfer</option>
                    <option value="cash">Cash Cadaan</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="credit">Supplier Credit / Dayn</option>
                  </select>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Received Product Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="mt-2 space-y-2">
                  {purchaseLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={line.productId}
                        onChange={(e) => handleUpdateLine(idx, 'productId', e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={(e) =>
                            handleUpdateLine(idx, 'quantity', parseFloat(e.target.value) || 1)
                          }
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Unit Cost"
                          value={line.unitCost}
                          onChange={(e) =>
                            handleUpdateLine(idx, 'unitCost', parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      </div>

                      <span className="w-20 text-right font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                        ${(line.quantity * line.unitCost).toFixed(2)}
                      </span>

                      {purchaseLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 font-bold dark:border-slate-800">
                  <span>Total Purchase Cost:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                    ${calculatedTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Allocation */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Amount Paid Now ($)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder={`Full amount: $${calculatedTotal.toFixed(2)}`}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <div className="text-[11px] text-slate-500">
                    Remaining Unpaid:{' '}
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      ${Math.max(0, calculatedTotal - (parseFloat(paidAmount) || 0)).toFixed(2)}
                    </span>{' '}
                    (Added to Supplier Debt)
                  </div>
                </div>
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
                  Receive Stock & Record Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
