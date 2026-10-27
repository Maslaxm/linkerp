import React from 'react';
import { Sale } from '../../types/erp';
import { useERP } from '../../context/ERPContext';
import { Printer, X, Download, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  const { currentBusiness } = useERP();

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span>Sale Completed Successfully</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Box */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            id="printable-receipt"
            className="mx-auto max-w-[340px] rounded-lg border border-dashed border-slate-300 bg-slate-50/50 p-5 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
          >
            {/* Business Brand Header */}
            <div className="text-center">
              <h2 className="text-base font-bold tracking-tight uppercase">
                {currentBusiness?.name || 'LINK ERP RETAIL'}
              </h2>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentBusiness?.address || 'KM4 Maka Al Mukarama Road'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentBusiness?.city}, {currentBusiness?.country} · Tel: {currentBusiness?.owner_phone || '+252 61 555 1234'}
              </div>
              {currentBusiness?.tax_number && (
                <div className="text-[10px] text-slate-400">Tax Reg: {currentBusiness.tax_number}</div>
              )}
            </div>

            <div className="my-3 border-b border-dashed border-slate-300 dark:border-slate-700" />

            {/* Receipt Meta */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-semibold">{sale.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span>{new Date(sale.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cashier:</span>
                <span>{sale.cashier_name || 'Front Desk'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span>{sale.customer_name || 'Walk-in Customer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment:</span>
                <span className="uppercase font-medium">{sale.payment_method.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="my-3 border-b border-dashed border-slate-300 dark:border-slate-700" />

            {/* Itemized Table */}
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="pb-1">Item</th>
                  <th className="pb-1 text-center">Qty</th>
                  <th className="pb-1 text-right">Price</th>
                  <th className="pb-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                {sale.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-1.5 pr-1">
                      <div className="font-medium truncate max-w-[140px]">{it.product_name}</div>
                      <div className="text-[9px] text-slate-400">{it.barcode}</div>
                    </td>
                    <td className="py-1.5 text-center tabular-nums">{it.quantity}</td>
                    <td className="py-1.5 text-right tabular-nums">${it.unit_price.toFixed(2)}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums">${it.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="my-3 border-b border-dashed border-slate-300 dark:border-slate-700" />

            {/* Calculations & Totals */}
            <div className="space-y-1 text-right text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal:</span>
                <span className="tabular-nums">${sale.subtotal.toFixed(2)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Discount:</span>
                  <span className="tabular-nums">-${sale.discount.toFixed(2)}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax:</span>
                  <span className="tabular-nums">${sale.tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 text-sm font-bold border-t border-slate-300 dark:border-slate-700">
                <span>Grand Total:</span>
                <span className="tabular-nums">${sale.total.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[11px] pt-1 text-slate-600 dark:text-slate-400">
                <span>Paid Amount:</span>
                <span className="tabular-nums">${sale.paid_amount.toFixed(2)}</span>
              </div>
              {sale.debt_amount > 0 && (
                <div className="flex justify-between text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  <span>Added to Customer Debt:</span>
                  <span className="tabular-nums">${sale.debt_amount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="my-4 border-b border-dashed border-slate-300 dark:border-slate-700" />

            {/* Thermal Barcode representation */}
            <div className="flex flex-col items-center justify-center text-center">
              <div className="tracking-[0.2em] font-mono text-base font-bold select-none text-slate-700 dark:text-slate-300">
                ||| | |||| || ||| |||| | |||
              </div>
              <div className="mt-1 text-[10px] text-slate-400">{sale.invoice_number}</div>
              <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 italic">
                Thank you for your business! / Waad ku mahadsan tahay!
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-4 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Printer className="h-4 w-4" />
            <span>Print Thermal Receipt (80mm)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
