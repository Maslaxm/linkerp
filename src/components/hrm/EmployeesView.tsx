import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Employee } from '../../types/erp';
import { UserCheck, Plus, Search, Download, DollarSign, Calendar, Edit2, Mail, Phone } from 'lucide-react';

export const EmployeesView: React.FC = () => {
  const { t, employees, addEmployee, updateEmployee, exportToCSV } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const [formData, setFormData] = useState<{
    employee_id: string;
    full_name: string;
    phone: string;
    email: string;
    position: string;
    department: string;
    salary: string;
    joining_date: string;
    status: 'active' | 'on_leave' | 'terminated';
  }>({
    employee_id: '',
    full_name: '',
    phone: '+252 61 ',
    email: '',
    position: 'Cashier & POS Operator',
    department: 'Operations',
    salary: '450',
    joining_date: new Date().toISOString().slice(0, 10),
    status: 'active',
  });

  const handleOpenAdd = () => {
    setFormData({
      employee_id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      full_name: '',
      phone: '+252 61 ',
      email: '',
      position: 'Cashier & POS Operator',
      department: 'Operations',
      salary: '450',
      joining_date: new Date().toISOString().slice(0, 10),
      status: 'active',
    });
    setEditingEmp(null);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) return;

    const payload = {
      employee_id: formData.employee_id || `EMP-${Date.now()}`,
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      position: formData.position.trim(),
      department: formData.department.trim(),
      salary: parseFloat(formData.salary) || 0,
      joining_date: formData.joining_date,
      status: formData.status,
    };

    if (editingEmp) {
      updateEmployee(editingEmp.id, payload);
    } else {
      addEmployee(payload);
    }
    setShowAddModal(false);
  };

  const filtered = employees.filter(
    (e) =>
      e.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalMonthlyPayroll = employees.reduce((acc, e) => acc + (e.salary || 0), 0);

  const handleExport = () => {
    const headers = ['ID', 'Full Name', 'Phone', 'Email', 'Position', 'Department', 'Monthly Salary ($)', 'Status'];
    const rows = filtered.map((e) => [
      e.employee_id,
      e.full_name,
      e.phone,
      e.email,
      e.position,
      e.department,
      e.salary.toFixed(2),
      e.status,
    ]);
    exportToCSV(`employee_payroll_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('employees')} & Staff
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Staff directory, positions and monthly payroll (Total Payroll: ${totalMonthlyPayroll.toFixed(2)}/mo)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Payroll CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
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
          placeholder="Search employees by name, role or department..."
          className="w-full text-xs bg-transparent dark:text-white focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">Employee ID & Name</th>
              <th className="px-4 py-3 font-medium">Position & Dept</th>
              <th className="px-4 py-3 font-medium">Contact Details</th>
              <th className="px-4 py-3 font-medium text-right">Monthly Salary</th>
              <th className="px-4 py-3 font-medium">Joining Date</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  No employees found
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{emp.full_name}</div>
                    <div className="font-mono text-[11px] text-slate-400">{emp.employee_id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800 dark:text-slate-200 font-medium">{emp.position}</div>
                    <div className="text-[10px] text-slate-400">{emp.department}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    <div>{emp.phone}</div>
                    <div className="text-[10px] text-slate-400">{emp.email}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                    ${emp.salary.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[11px]">
                    {emp.joining_date}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setEditingEmp(emp);
                        setFormData({
                          employee_id: emp.employee_id,
                          full_name: emp.full_name,
                          phone: emp.phone,
                          email: emp.email,
                          position: emp.position,
                          department: emp.department,
                          salary: emp.salary.toString(),
                          joining_date: emp.joining_date,
                          status: emp.status,
                        });
                        setShowAddModal(true);
                      }}
                      className="rounded p-1 text-slate-400 hover:text-slate-700"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingEmp ? 'Edit Employee Record' : 'Add New Staff Member'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Fatima Ali"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Position</label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Monthly Salary ($)</label>
                <input
                  type="number"
                  step="25"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  {editingEmp ? 'Save Changes' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
