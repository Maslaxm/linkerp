import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Building,
  Users,
  Download,
  Calendar,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const FinanceView: React.FC = () => {
  const { t, sales, purchases, expenses, customers, suppliers, products, exportToCSV } = useERP();
  const [dateRange, setDateRange] = useState<'all' | 'this_month' | 'this_year'>('all');

  // Revenue & COGS calculation
  const completedSales = sales.filter((s) => s.status === 'completed');
  const totalRevenue = completedSales.reduce((acc, s) => acc + s.total, 0);

  let totalCOGS = 0;
  completedSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.product_id);
      const cost = prod ? prod.purchase_price : 0;
      totalCOGS += cost * item.quantity;
    });
  });

  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const accountsReceivable = customers.reduce((acc, c) => acc + (c.current_debt || 0), 0);
  const accountsPayable = suppliers.reduce((acc, s) => acc + (s.current_debt || 0), 0);

  // Cash Inflows & Outflows
  const totalCashCollected = completedSales.reduce((acc, s) => acc + s.paid_amount, 0);
  const totalPurchasesPaid = purchases.reduce((acc, p) => acc + p.paid_amount, 0);
  const netCashFlow = totalCashCollected - totalPurchasesPaid - totalExpenses;

  // Expense by category breakdown
  const categoryMap: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  const handleExportStatement = () => {
    const headers = ['Financial Metric', 'Amount ($)'];
    const rows = [
      ['Gross Sales Revenue', totalRevenue.toFixed(2)],
      ['Cost of Goods Sold (COGS)', totalCOGS.toFixed(2)],
      ['Gross Profit', grossProfit.toFixed(2)],
      ['Gross Margin (%)', `${grossMargin.toFixed(1)}%`],
      ['Total Operating Expenses', totalExpenses.toFixed(2)],
      ['Net Profit', netProfit.toFixed(2)],
      ['Net Margin (%)', `${netMargin.toFixed(1)}%`],
      ['Accounts Receivable (Customer Debts)', accountsReceivable.toFixed(2)],
      ['Accounts Payable (Supplier Debts)', accountsPayable.toFixed(2)],
      ['Net Cash Flow', netCashFlow.toFixed(2)],
    ];
    exportToCSV(`financial_statement_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('finance')} & Financial Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Income statement, gross/net profit margins, accounts receivable and cash flow
          </p>
        </div>

        <button
          onClick={handleExportStatement}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Financial Statement</span>
        </button>
      </div>

      {/* 4 Financial Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Gross Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            ${totalRevenue.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Total sales from {completedSales.length} invoices
          </div>
        </div>

        {/* Gross Profit */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Gross Profit</span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            ${grossProfit.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
            {grossMargin.toFixed(1)}% Gross Margin
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Operating Expenses</span>
            <CreditCard className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            ${totalExpenses.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Rent, utilities, fuel and office costs
          </div>
        </div>

        {/* Net Profit */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Net Profit</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <div
            className={`mt-2 text-2xl font-bold tracking-tight tabular-nums ${
              netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'
            }`}
          >
            ${netProfit.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 tabular-nums">
            {netMargin.toFixed(1)}% Net Margin after expenses
          </div>
        </div>
      </div>

      {/* Income Statement & Balance Sheet Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Income Statement Table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
            Income Statement (Profit & Loss)
          </h2>

          <div className="mt-4 space-y-2.5 text-xs">
            <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
              <span>Operating Revenue (Sales):</span>
              <span className="font-mono tabular-nums">${totalRevenue.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400 pl-4">
              <span>Less: Cost of Goods Sold (COGS):</span>
              <span className="font-mono tabular-nums">-${totalCOGS.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-100 pt-2 dark:border-slate-800">
              <span>Gross Profit:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                ${grossProfit.toFixed(2)}
              </span>
            </div>

            <div className="pt-2 font-semibold text-slate-900 dark:text-white">
              Operating Expenses:
            </div>
            {Object.entries(categoryMap).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between text-slate-600 dark:text-slate-400 pl-4">
                <span>{cat}:</span>
                <span className="font-mono tabular-nums">-${amt.toFixed(2)}</span>
              </div>
            ))}

            <div className="flex justify-between font-bold text-slate-900 dark:text-white border-t border-slate-200 pt-2 dark:border-slate-800 text-sm">
              <span>Net Profit (EBITDA):</span>
              <span
                className={`font-mono tabular-nums ${
                  netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600'
                }`}
              >
                ${netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Working Capital & Receivables / Payables */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
            Working Capital & Debt Balances
          </h2>

          <div className="mt-4 space-y-4 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Accounts Receivable (Customer Debts)
                  </div>
                  <div className="text-[11px] text-slate-400">Total money owed to your business</div>
                </div>
                <span className="font-mono text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  ${accountsReceivable.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Accounts Payable (Supplier Debts)
                  </div>
                  <div className="text-[11px] text-slate-400">Total money you owe to suppliers</div>
                </div>
                <span className="font-mono text-base font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  ${accountsPayable.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-950 dark:bg-indigo-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-indigo-950 dark:text-indigo-200">
                    Net Working Capital Position
                  </div>
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-400">
                    Receivables minus Payables
                  </div>
                </div>
                <span className="font-mono text-base font-bold text-indigo-700 dark:text-indigo-300 tabular-nums">
                  ${(accountsReceivable - accountsPayable).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
