import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { ShieldAlert, Search, Download, Filter, Lock } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const { t, auditLogs, currentBusiness, exportToCSV } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  const filtered = auditLogs.filter((log) => {
    const matchesSearch =
      searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;

    return matchesSearch && matchesModule;
  });

  const handleExport = () => {
    const headers = ['Timestamp', 'User', 'Module', 'Action', 'Record ID', 'Description', 'IP Address'];
    const rows = filtered.map((l) => [
      new Date(l.created_at).toISOString(),
      l.user_name || 'System',
      l.module,
      l.action,
      l.record_id || '',
      l.description,
      l.ip_address || '',
    ]);
    exportToCSV(`audit_trail_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  const modules = ['AUTH', 'POS', 'SALES', 'INVENTORY', 'PURCHASES', 'CUSTOMERS', 'FINANCE', 'SUPER_ADMIN'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('audit_logs')} & Security Trail
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Immutable system event logs. Normal users cannot alter or purge these records.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action, user or details..."
            className="w-full text-xs bg-transparent dark:text-white focus:outline-none pl-8"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="all">All Modules</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">User Profile</th>
              <th className="px-4 py-3 font-medium">Module</th>
              <th className="px-4 py-3 font-medium">Action Event</th>
              <th className="px-4 py-3 font-medium font-sans">Details</th>
              <th className="px-4 py-3 font-medium text-right">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-sans text-xs">
                  No audit logs recorded
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString([], {
                      dateStyle: 'short',
                      timeStyle: 'medium',
                    })}
                  </td>
                  <td className="px-4 py-2.5 font-sans font-medium text-slate-900 dark:text-white">
                    {log.user_name || 'System Worker'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                    {log.action}
                  </td>
                  <td className="px-4 py-2.5 font-sans text-slate-700 dark:text-slate-300">
                    {log.description}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-400">
                    {log.ip_address || 'Internal'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
