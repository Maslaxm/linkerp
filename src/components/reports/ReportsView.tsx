import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  Users,
  DollarSign,
  TrendingUp,
  Package,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { t, sales, products, customers, suppliers, expenses, exportToCSV } = useERP();
  const [reportType, setReportType] = useState<
    'sales_summary' | 'product_performance' | 'cashier_sales' | 'customer_debts' | 'inventory_valuation'
  >('sales_summary');

  // Product sales volume aggregation
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  sales.forEach((s) => {
    if (s.status === 'completed') {
      s.items.forEach((item) => {
        if (!productSalesMap[item.product_id]) {
          productSalesMap[item.product_id] = {
            name: item.product_name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSalesMap[item.product_id].quantity += item.quantity;
        productSalesMap[item.product_id].revenue += item.total;
      });
    }
  });

  const productPerformanceList = Object.values(productSalesMap).sort((a, b) => b.revenue - a.revenue);

  // Cashier performance aggregation
  const cashierMap: Record<string, { name: string; count: number; total: number }> = {};
  sales.forEach((s) => {
    if (s.status === 'completed') {
      const name = s.cashier_name || 'Front Desk';
      if (!cashierMap[name]) {
        cashierMap[name] = { name, count: 0, total: 0 };
      }
      cashierMap[name].count += 1;
      cashierMap[name].total += s.total;
    }
  });
  const cashierList = Object.values(cashierMap).sort((a, b) => b.total - a.total);

  // Total inventory valuation
  const totalStockUnits = products.reduce((acc, p) => acc + p.current_stock, 0);
  const totalCostValuation = products.reduce((acc, p) => acc + p.current_stock * p.purchase_price, 0);
  const totalRetailValuation = products.reduce((acc, p) => acc + p.current_stock * p.selling_price, 0);

  const handleExportCurrent = () => {
    if (reportType === 'product_performance') {
      const headers = ['Product Name', 'Total Units Sold', 'Total Revenue ($)'];
      const rows = productPerformanceList.map((p) => [p.name, p.quantity, p.revenue.toFixed(2)]);
      exportToCSV('product_sales_performance', headers, rows);
    } else if (reportType === 'cashier_sales') {
      const headers = ['Cashier Name', 'Invoices Completed', 'Total Sales Volume ($)'];
      const rows = cashierList.map((c) => [c.name, c.count, c.total.toFixed(2)]);
      exportToCSV('cashier_sales_performance', headers, rows);
    } else if (reportType === 'customer_debts') {
      const headers = ['Customer Name', 'Phone', 'Credit Limit', 'Current Debt'];
      const rows = customers
        .filter((c) => c.current_debt > 0)
        .map((c) => [c.name, c.phone, c.credit_limit.toFixed(2), c.current_debt.toFixed(2)]);
      exportToCSV('customer_debt_ledger', headers, rows);
    } else if (reportType === 'inventory_valuation') {
      const headers = ['Product', 'Barcode', 'Current Stock', 'Unit Cost', 'Asset Valuation (Cost)'];
      const rows = products.map((p) => [
        p.name,
        p.barcode,
        p.current_stock,
        p.purchase_price.toFixed(2),
        (p.current_stock * p.purchase_price).toFixed(2),
      ]);
      exportToCSV('inventory_valuation_report', headers, rows);
    } else {
      const headers = ['Invoice Number', 'Date', 'Customer', 'Payment Method', 'Total'];
      const rows = sales.map((s) => [
        s.invoice_number,
        new Date(s.created_at).toLocaleDateString(),
        s.customer_name || 'Walk-in',
        s.payment_method,
        s.total.toFixed(2),
      ]);
      exportToCSV('sales_summary_report', headers, rows);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('reports')} & Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exportable analytics for sales, inventory assets, staff volume, and debt aging
          </p>
        </div>

        <button
          onClick={handleExportCurrent}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Selected Report CSV</span>
        </button>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-800 text-xs">
        <button
          onClick={() => setReportType('sales_summary')}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            reportType === 'sales_summary'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          Sales Summary
        </button>
        <button
          onClick={() => setReportType('product_performance')}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            reportType === 'product_performance'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          Top Selling Products
        </button>
        <button
          onClick={() => setReportType('cashier_sales')}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            reportType === 'cashier_sales'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          Cashier Volume
        </button>
        <button
          onClick={() => setReportType('inventory_valuation')}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            reportType === 'inventory_valuation'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          Inventory Valuation
        </button>
        <button
          onClick={() => setReportType('customer_debts')}
          className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
            reportType === 'customer_debts'
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
          }`}
        >
          Customer Debts Ledger
        </button>
      </div>

      {/* Report Viewport */}
      {reportType === 'product_performance' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                <th className="px-4 py-3 font-medium">Product Name</th>
                <th className="px-4 py-3 font-medium text-center">Units Sold</th>
                <th className="px-4 py-3 font-medium text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {productPerformanceList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    ${item.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'cashier_sales' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                <th className="px-4 py-3 font-medium">Cashier Name</th>
                <th className="px-4 py-3 font-medium text-center">Invoices Processed</th>
                <th className="px-4 py-3 font-medium text-right">Total Sales Handled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cashierList.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{c.name}</td>
                  <td className="px-4 py-3 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {c.count}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    ${c.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'inventory_valuation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-500">Total Stock On Hand</span>
              <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                {totalStockUnits} units
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-500">Asset Cost Value</span>
              <div className="mt-1 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                ${totalCostValuation.toFixed(2)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-500">Retail Selling Value</span>
              <div className="mt-1 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                ${totalRetailValuation.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium text-center">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Cost Price</th>
                  <th className="px-4 py-3 font-medium text-right">Selling Price</th>
                  <th className="px-4 py-3 font-medium text-right">Cost Asset Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-center font-mono tabular-nums">{p.current_stock}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      ${p.purchase_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      ${p.selling_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      ${(p.current_stock * p.purchase_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'customer_debts' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                <th className="px-4 py-3 font-medium">Customer Name</th>
                <th className="px-4 py-3 font-medium">Phone Number</th>
                <th className="px-4 py-3 font-medium text-right">Credit Limit</th>
                <th className="px-4 py-3 font-medium text-right">Outstanding Debt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers
                .filter((c) => c.current_debt > 0)
                .map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{c.phone}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      ${c.credit_limit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      ${c.current_debt.toFixed(2)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'sales_summary' && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">
                    {s.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {s.customer_name || 'Walk-in'}
                  </td>
                  <td className="px-4 py-3 uppercase text-[10px] text-slate-500">
                    {s.payment_method}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    ${s.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 text-[11px]">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
