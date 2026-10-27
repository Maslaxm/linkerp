import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Package,
  AlertTriangle,
  Users,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Plus,
  Truck,
  Receipt,
  AlertCircle,
} from 'lucide-react';

interface BusinessDashboardProps {
  onNavigate: (view: string) => void;
}

export const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ onNavigate }) => {
  const {
    t,
    currentBusiness,
    products,
    sales,
    purchases,
    expenses,
    customers,
    suppliers,
    currentSubscription,
    currentPlan,
  } = useERP();

  // Financial calculations for today
  const todayDateStr = new Date().toISOString().slice(0, 10);

  const todaysSalesList = sales.filter((s) => s.created_at.startsWith(todayDateStr) && s.status === 'completed');
  const todaysSalesTotal = todaysSalesList.reduce((acc, s) => acc + s.total, 0);

  // Profit calculation = Sales Total - Cost of Goods Sold
  let todaysCOGS = 0;
  todaysSalesList.forEach((s) => {
    s.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      const cost = prod ? prod.purchase_price : 0;
      todaysCOGS += cost * item.quantity;
    });
  });
  const todaysProfit = todaysSalesTotal - todaysCOGS;

  const todaysPurchasesTotal = purchases
    .filter((p) => p.created_at.startsWith(todayDateStr))
    .reduce((acc, p) => acc + p.total, 0);

  const todaysExpensesTotal = expenses
    .filter((e) => e.created_at.startsWith(todayDateStr))
    .reduce((acc, e) => acc + e.amount, 0);

  // Inventory stats
  const lowStockProducts = products.filter((p) => p.current_stock > 0 && p.current_stock <= p.min_stock);
  const outOfStockProducts = products.filter((p) => p.current_stock <= 0);

  // Debt balances
  const totalCustomerDebt = customers.reduce((acc, c) => acc + (c.current_debt || 0), 0);
  const totalSupplierDebt = suppliers.reduce((acc, s) => acc + (s.current_debt || 0), 0);

  // Overall cash balance: (All Paid Sales) - (All Paid Purchases) - (All Paid Expenses)
  const allPaidSales = sales.reduce((acc, s) => (s.status === 'completed' ? acc + s.paid_amount : acc), 0);
  const allPaidPurchases = purchases.reduce((acc, p) => acc + p.paid_amount, 0);
  const allPaidExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const cashBalance = allPaidSales - allPaidPurchases - allPaidExpenses;

  // 7-day Sales Bar Chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString([], { weekday: 'short' });
    const dayTotal = sales
      .filter((s) => s.created_at.startsWith(dayStr) && s.status === 'completed')
      .reduce((acc, s) => acc + s.total, 0);
    return { dayStr, dayName, total: dayTotal };
  });

  const maxDailySales = Math.max(...last7Days.map((d) => d.total), 50);

  return (
    <div className="space-y-6">
      {/* Top Banner / Workspace Summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {currentBusiness?.name || 'Business'} {t('dashboard')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time business performance, inventory alerts and cash flow metrics
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onNavigate('pos')}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{t('quick_pos')}</span>
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('new_product')}</span>
          </button>
          <button
            onClick={() => onNavigate('purchases')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Truck className="h-3.5 w-3.5" />
            <span>{t('new_purchase')}</span>
          </button>
        </div>
      </div>

      {/* Subscription Expiry / Trial Warning if applicable */}
      {currentSubscription && currentSubscription.status === 'expired' && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Subscription Expired!</span> Your business subscription has expired.
            Please contact the platform administrator to renew access.
          </div>
        </div>
      )}

      {/* 4 Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t('todays_sales')}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            ${todaysSalesTotal.toFixed(2)}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>{todaysSalesList.length} invoices processed today</span>
          </div>
        </div>

        {/* Today's Profit */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t('todays_profit')} (Gross)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            ${todaysProfit.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Revenue minus product unit cost
          </div>
        </div>

        {/* Customer Debts (Receivables) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t('customer_debt')}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            ${totalCustomerDebt.toFixed(2)}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Supplier Debts:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              ${totalSupplierDebt.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Cash Balance */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium">{t('cash_balance')}</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            ${cashBalance.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Cash, Mobile Money & Bank on hand
          </div>
        </div>
      </div>

      {/* Secondary Row: 7-Day Chart + Stock Alert Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 7-Day Sales Trend Bar Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{t('sales_trend')}</h2>
              <p className="text-xs text-slate-500">Daily revenue totals for the past week</p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 tabular-nums">
              Total: ${last7Days.reduce((a, b) => a + b.total, 0).toFixed(2)}
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="mt-6 flex h-48 items-end gap-3 pt-4">
            {last7Days.map((d) => {
              const heightPercent = maxDailySales > 0 ? (d.total / maxDailySales) * 100 : 0;
              return (
                <div key={d.dayStr} className="flex flex-1 flex-col items-center gap-2">
                  <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                    ${d.total > 0 ? d.total.toFixed(0) : '0'}
                  </div>
                  <div className="w-full rounded-t-md bg-slate-100 dark:bg-slate-800 flex items-end h-32 overflow-hidden">
                    <div
                      style={{ height: `${Math.max(6, heightPercent)}%` }}
                      className="w-full rounded-t-md bg-indigo-600 transition-all duration-300 hover:bg-indigo-500"
                    />
                  </div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{d.dayName}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stock & Operational Health Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Inventory Health</h2>
            <button
              onClick={() => onNavigate('products')}
              className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              View Catalogue
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <Package className="h-4 w-4 text-slate-500" />
                <span>{t('total_products')}</span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {products.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-amber-50/70 p-3 dark:bg-amber-950/30">
              <div className="flex items-center gap-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>{t('low_stock_items')}</span>
              </div>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                {lowStockProducts.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-red-50/70 p-3 dark:bg-red-950/30">
              <div className="flex items-center gap-2 text-xs font-medium text-red-800 dark:text-red-300">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span>{t('out_of_stock')}</span>
              </div>
              <span className="font-mono font-bold text-red-700 dark:text-red-300 tabular-nums">
                {outOfStockProducts.length}
              </span>
            </div>
          </div>

          {/* Quick low-stock warning list */}
          {lowStockProducts.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Needs Reordering
              </div>
              <div className="mt-2 space-y-1.5">
                {lowStockProducts.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[170px] text-slate-700 dark:text-slate-300">
                      {item.name}
                    </span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                      {item.current_stock} {item.unit} (Min: {item.min_stock})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales Invoices Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t('recent_transactions')}
            </h2>
            <p className="text-xs text-slate-500">Latest completed point-of-sale transactions</p>
          </div>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            All Invoices →
          </button>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
                <th className="py-2.5 font-medium">{t('invoice_number')}</th>
                <th className="py-2.5 font-medium">Customer</th>
                <th className="py-2.5 font-medium">{t('payment_method')}</th>
                <th className="py-2.5 font-medium text-center">Items</th>
                <th className="py-2.5 font-medium text-right">Total</th>
                <th className="py-2.5 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sales.slice(0, 5).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 font-mono font-semibold text-slate-900 dark:text-white">
                    {sale.invoice_number}
                  </td>
                  <td className="py-2.5 text-slate-700 dark:text-slate-300">
                    {sale.customer_name || 'Walk-in Customer'}
                  </td>
                  <td className="py-2.5">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {sale.payment_method.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-2.5 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                    {sale.items.length}
                  </td>
                  <td className="py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    ${sale.total.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right text-slate-400">
                    {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
