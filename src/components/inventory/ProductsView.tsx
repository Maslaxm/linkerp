import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Product } from '../../types/erp';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  AlertTriangle,
  Barcode,
  Layers,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const {
    t,
    products,
    categories,
    brands,
    suppliers,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    exportToCSV,
    currentPlan,
  } = useERP();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockAdjustProduct, setStockAdjustProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Recount / Stocktake');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category_id: '',
    brand_id: '',
    supplier_id: '',
    unit: 'pcs',
    purchase_price: '0.00',
    selling_price: '0.00',
    wholesale_price: '0.00',
    min_stock: '10',
    current_stock: '50',
    location: '',
    description: '',
    expiry_date: '',
  });

  const handleOpenAdd = () => {
    // Generate clean auto barcode
    const randomBarcode = `619${Math.floor(100000000 + Math.random() * 900000000)}`;
    const randomSKU = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      name: '',
      sku: randomSKU,
      barcode: randomBarcode,
      category_id: categories[0]?.id || '',
      brand_id: brands[0]?.id || '',
      supplier_id: suppliers[0]?.id || '',
      unit: 'pcs',
      purchase_price: '5.00',
      selling_price: '8.00',
      wholesale_price: '6.50',
      min_stock: '10',
      current_stock: '40',
      location: 'Aisle 1',
      description: '',
      expiry_date: '',
    });
    setErrorMessage(null);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim() || `SKU-${Date.now()}`,
      barcode: formData.barcode.trim() || `${Date.now()}`,
      category_id: formData.category_id || undefined,
      brand_id: formData.brand_id || undefined,
      supplier_id: formData.supplier_id || undefined,
      unit: formData.unit,
      purchase_price: parseFloat(formData.purchase_price) || 0,
      selling_price: parseFloat(formData.selling_price) || 0,
      wholesale_price: parseFloat(formData.wholesale_price) || 0,
      min_stock: parseFloat(formData.min_stock) || 0,
      current_stock: parseFloat(formData.current_stock) || 0,
      location: formData.location,
      description: formData.description,
      expiry_date: formData.expiry_date || undefined,
      tax_rate: 0,
      discount: 0,
      is_active: true,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      setEditingProduct(null);
    } else {
      const res = addProduct(payload);
      if (!res.success) {
        setErrorMessage(res.message || 'Failed to add product');
        return;
      }
    }
    setShowAddModal(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustProduct) return;
    const delta = parseFloat(adjustQty);
    if (isNaN(delta) || delta === 0) return;

    adjustStock(stockAdjustProduct.id, delta, adjustReason, 'adjustment');
    setStockAdjustProduct(null);
    setAdjustQty('');
  };

  // Filter products
  const filtered = products.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = selectedCat === 'all' || p.category_id === selectedCat;

    let matchesStock = true;
    if (stockFilter === 'low') matchesStock = p.current_stock > 0 && p.current_stock <= p.min_stock;
    if (stockFilter === 'out') matchesStock = p.current_stock <= 0;

    return matchesSearch && matchesCat && matchesStock;
  });

  const handleExport = () => {
    const headers = ['Product Name', 'SKU', 'Barcode', 'Unit', 'Cost Price', 'Selling Price', 'Current Stock', 'Min Stock'];
    const rows = filtered.map((p) => [
      p.name,
      p.sku,
      p.barcode,
      p.unit,
      p.purchase_price.toFixed(2),
      p.selling_price.toFixed(2),
      p.current_stock,
      p.min_stock,
    ]);
    exportToCSV(`inventory_export_${new Date().toISOString().slice(0, 10)}`, headers, rows);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {t('products')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Catalogue, barcodes, stock levels and pricing ({products.length} items registered
            {currentPlan?.max_products ? ` / limit ${currentPlan.max_products}` : ''})
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
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
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
            placeholder="Search by product name, barcode or SKU..."
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock status tabs */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-800 text-xs">
            <button
              onClick={() => setStockFilter('all')}
              className={`rounded px-2.5 py-1 font-medium ${
                stockFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`rounded px-2.5 py-1 font-medium ${
                stockFilter === 'low'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`rounded px-2.5 py-1 font-medium ${
                stockFilter === 'out'
                  ? 'bg-red-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 dark:border-slate-800">
              <th className="px-4 py-3 font-medium">Product / Barcode</th>
              <th className="px-4 py-3 font-medium">Category & Unit</th>
              <th className="px-4 py-3 font-medium text-right">Cost Price</th>
              <th className="px-4 py-3 font-medium text-right">Selling Price</th>
              <th className="px-4 py-3 font-medium text-center">Stock Level</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                  No products found matching filters
                </td>
              </tr>
            ) : (
              filtered.map((prod) => {
                const isLow = prod.current_stock > 0 && prod.current_stock <= prod.min_stock;
                const isOut = prod.current_stock <= 0;
                const cat = categories.find((c) => c.id === prod.category_id);

                return (
                  <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {prod.name}
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                        <span>{prod.sku}</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400">
                          <Barcode className="h-3 w-3" />
                          {prod.barcode}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      <div>{cat?.name || 'General'}</div>
                      <div className="text-[10px] text-slate-400 uppercase">{prod.unit}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-500">
                      ${prod.purchase_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      ${prod.selling_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          isOut
                            ? 'text-red-600 dark:text-red-400'
                            : isLow
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {prod.current_stock}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        (min {prod.min_stock})
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isOut ? (
                        <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950/60 dark:text-red-300">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                          Low Stock
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setStockAdjustProduct(prod)}
                          className="rounded px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          title="Adjust stock balance"
                        >
                          Adjust
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(prod);
                            setFormData({
                              name: prod.name,
                              sku: prod.sku,
                              barcode: prod.barcode,
                              category_id: prod.category_id || '',
                              brand_id: prod.brand_id || '',
                              supplier_id: prod.supplier_id || '',
                              unit: prod.unit,
                              purchase_price: prod.purchase_price.toString(),
                              selling_price: prod.selling_price.toString(),
                              wholesale_price: prod.wholesale_price.toString(),
                              min_stock: prod.min_stock.toString(),
                              current_stock: prod.current_stock.toString(),
                              location: prod.location || '',
                              description: prod.description || '',
                              expiry_date: prod.expiry_date || '',
                            });
                            setShowAddModal(true);
                          }}
                          className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${prod.name}?`)) {
                              deleteProduct(prod.id);
                            }
                          }}
                          className="rounded p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingProduct ? 'Edit Product' : 'Add New Inventory Product'}
            </h2>

            {errorMessage && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Al-Watan Basmati Rice 25kg"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Barcode (EAN-13 / Code-128) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Unit of Measure
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="bag">Bag</option>
                    <option value="carton">Carton</option>
                    <option value="box">Box</option>
                    <option value="bottle">Bottle</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="liter">Liter (L)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Selling Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Opening / Current Stock
                  </label>
                  <input
                    type="number"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Shelf Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Aisle 2 - Shelf B"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white hover:bg-indigo-700"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {stockAdjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Stock Adjustment: {stockAdjustProduct.name}
            </h3>
            <div className="mt-1 text-slate-500">
              Current stock on record:{' '}
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {stockAdjustProduct.current_stock} {stockAdjustProduct.unit}
              </span>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-3">
              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Quantity Change (+ to add, - to reduce)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. +10 or -5"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 dark:text-slate-300">
                  Adjustment Reason
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Recount / Stocktake">Physical Recount / Stocktake</option>
                  <option value="Damaged / Expired">Damaged / Expired Item</option>
                  <option value="Theft or Loss">Theft / Unaccounted Loss</option>
                  <option value="Internal Use">Internal Business Consumption</option>
                  <option value="Returned from Customer">Returned from Customer</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setStockAdjustProduct(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-1.5 font-semibold text-white hover:bg-indigo-700"
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
