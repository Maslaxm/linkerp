import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Layers, Plus, Search, Download, ArrowUp, ArrowDown } from 'lucide-react';

export const StockAdjustmentsView: React.FC = () => {
  const { t, products, adjustStock, exportToCSV } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Recount / Stocktake');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const delta = parseFloat(adjustQty);
    if (isNaN(delta) || delta === 0) return;

    adjustStock(selectedProduct.id, delta, adjustReason, 'adjustment');
    setShowAdjustModal(false);
    setAdjustQty('');
  };

  const handleExport = () => {
    const headers = ['Product', 'Barcode', 'Unit', 'Current Stock', 'Min Stock Threshold'];
    const rows = products.map((p) => [p.name, p.barcode, p.unit, p.current_stock, p.min_stock]);
    exportToCSV(`stock_balances_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('inventory_movements')} & Stock Balancing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time stock ledger, physical stocktakes, shrinkage and warehouse adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Stock CSV</span>
          </button>
          <button
            onClick={() => {
              setSelectedProductId(products[0]?.id || '');
              setShowAdjustModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Log Stock Adjustment</span>
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
          placeholder="Search by product name, barcode or SKU..."
          className="w-full text-xs bg-transparent dark:text-white focus:outline-none"
        />
      </div>

      {/* Stock Balancing Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">Product / Barcode</th>
              <th className="px-4 py-3 font-medium">Shelf Location</th>
              <th className="px-4 py-3 font-medium text-right">Cost Value</th>
              <th className="px-4 py-3 font-medium text-center">Current Stock</th>
              <th className="px-4 py-3 font-medium text-center">Min Threshold</th>
              <th className="px-4 py-3 font-medium text-right">Quick Stock Adjustment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredProducts.map((p) => {
              const isLow = p.current_stock <= p.min_stock;
              return (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {p.sku} · {p.barcode}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{p.location || 'Warehouse'}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    ${(p.current_stock * p.purchase_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        p.current_stock <= 0
                          ? 'text-red-600 dark:text-red-400'
                          : isLow
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {p.current_stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono tabular-nums text-slate-400">
                    {p.min_stock} {p.unit}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => adjustStock(p.id, 10, 'Quick Restock +10', 'adjustment')}
                        className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="Add 10 units"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => adjustStock(p.id, -1, 'Damaged / Spoilage -1', 'adjustment')}
                        className="rounded border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="Deduct 1 unit"
                      >
                        -1
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Record Stock Adjustment
            </h3>
            <p className="text-xs text-slate-500">
              Apply manual correction from physical stocktake, damage, or theft.
            </p>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Select Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Current: {p.current_stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Quantity Change (+ to add, - to subtract) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. 25 or -5"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Reason for Adjustment
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Recount / Stocktake">Physical Stocktake Recount</option>
                  <option value="Damaged / Expired">Damaged or Expired Inventory</option>
                  <option value="Theft / Unaccounted Shrinkage">Theft / Unaccounted Shrinkage</option>
                  <option value="Branch Transfer">Transfer from Another Branch</option>
                  <option value="Internal Business Use">Internal Business Consumption</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700"
                >
                  Apply Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
