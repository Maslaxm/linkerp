import React, { useState, useEffect, useRef } from 'react';
import { useERP } from '../../context/ERPContext';
import { Product, Customer, POSCartItem, PaymentMethod, Sale } from '../../types/erp';
import { BarcodeModal } from '../common/BarcodeModal';
import { ReceiptModal } from '../common/ReceiptModal';
import {
  ScanBarcode,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  DollarSign,
  Smartphone,
  Building,
  User,
  PauseCircle,
  PlayCircle,
  Clock,
  Printer,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const POSView: React.FC = () => {
  const {
    t,
    products,
    categories,
    customers,
    activePOSSession,
    openPOSSession,
    closePOSSession,
    completePOSSale,
    currentUser,
    currentBusiness,
  } = useERP();

  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [heldSales, setHeldSales] = useState<{ id: string; name: string; cart: POSCartItem[]; time: string }[]>([]);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [overallDiscount, setOverallDiscount] = useState<string>('0');
  const [paymentReference, setPaymentReference] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Receipt Modal state
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // POS Session open/close state
  const [openingFloat, setOpeningFloat] = useState('100.00');
  const [countedClosing, setCountedClosing] = useState('');
  const [showSessionModal, setShowSessionModal] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Hardware Scanner USB / Bluetooth Keyboard Wedge Listener
  // Hardware scanners type very rapidly (< 50ms) and end with 'Enter'.
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in regular text inputs other than POS barcode search
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (target.id !== 'pos-barcode-input') {
          return;
        }
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 80) {
        buffer = ''; // reset buffer if slow manual typing
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.trim().length >= 3) {
          handleBarcodeScanned(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // Handle scanned barcode (from camera, hardware scanner, or manual input)
  const handleBarcodeScanned = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    const matched = products.find(
      (p) =>
        p.barcode.toLowerCase() === clean.toLowerCase() ||
        p.sku.toLowerCase() === clean.toLowerCase() ||
        p.product_code?.toLowerCase() === clean.toLowerCase()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`No product matching barcode or SKU: "${clean}"`);
    }
  };

  const addToCart = (product: Product) => {
    if (product.current_stock <= 0) {
      alert(`Warning: "${product.name}" is currently out of stock!`);
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit_price: product.selling_price,
          discount: 0,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  // Hold / Resume
  const handleHoldSale = () => {
    if (!cart.length) return;
    const holdName = prompt('Enter a label for this held cart:', `Hold #${heldSales.length + 1}`) || `Hold #${heldSales.length + 1}`;
    setHeldSales((prev) => [
      ...prev,
      {
        id: `hold-${Date.now()}`,
        name: holdName,
        cart: [...cart],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    clearCart();
  };

  const handleResumeSale = (holdId: string) => {
    const target = heldSales.find((h) => h.id === holdId);
    if (target) {
      setCart(target.cart);
      setHeldSales((prev) => prev.filter((h) => h.id !== holdId));
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.unit_price - item.discount) * item.quantity, 0);
  const numDiscount = parseFloat(overallDiscount) || 0;
  const grandTotal = Math.max(0, subtotal - numDiscount);
  const numTendered = parseFloat(amountTendered) || grandTotal;
  const changeDue = Math.max(0, numTendered - grandTotal);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  // Execute Sale
  const handleCompleteSale = () => {
    setCheckoutError(null);
    const result = completePOSSale(
      cart,
      selectedCustomer,
      paymentMethod,
      numTendered,
      numDiscount,
      paymentReference
    );

    if (result.success && result.sale) {
      setCompletedSale(result.sale);
      setIsReceiptOpen(true);
      setIsCheckoutOpen(false);
      clearCart();
      setSelectedCustomerId('');
      setAmountTendered('');
      setPaymentReference('');
      setOverallDiscount('0');
    } else {
      setCheckoutError(result.error || 'Failed to complete sale');
    }
  };

  // Filter catalogue
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Session Banner if closed */}
      {!activePOSSession && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs dark:border-amber-900/60 dark:bg-amber-950/40">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <Lock className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold">Register Session Closed.</span> Open a cashier register session with an initial opening float to start sales.
            </div>
          </div>
          <button
            onClick={() => setShowSessionModal(true)}
            className="rounded-lg bg-amber-600 px-3.5 py-1.5 font-semibold text-white hover:bg-amber-700"
          >
            Open Register Shift
          </button>
        </div>
      )}

      {/* Main POS Interface Grid: Left (Product Grid) / Right (Cart & Checkout) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Product Search & Catalogue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barcode & Search Controls */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Quick Barcode Scanner Input */}
            <div className="relative flex-1">
              <ScanBarcode className="absolute left-3 top-2.5 h-4 w-4 text-indigo-600" />
              <input
                id="pos-barcode-input"
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleBarcodeScanned(barcodeInput);
                  }
                }}
                placeholder={t('barcode_scan_hint')}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-mono shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={() => setIsCameraScannerOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ScanBarcode className="h-4 w-4 text-indigo-600" />
              <span>{t('open_camera')}</span>
            </button>
          </div>

          {/* Search by Name & Category Tabs */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title or brand..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const inCartItem = cart.find((c) => c.product.id === p.id);
              const isLowStock = p.current_stock <= p.min_stock;
              const isOut = p.current_stock <= 0;

              return (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className={`relative flex flex-col justify-between cursor-pointer rounded-xl border p-3 transition-all duration-150 hover:shadow-md select-none ${
                    inCartItem
                      ? 'border-indigo-600 bg-indigo-50/30 dark:border-indigo-500 dark:bg-indigo-950/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2">
                        {p.name}
                      </div>
                      {inCartItem && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                          {inCartItem.quantity}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 font-mono text-[10px] text-slate-400">
                      {p.barcode}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      ${p.selling_price.toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] font-mono tabular-nums ${
                        isOut
                          ? 'text-red-600 dark:text-red-400 font-bold'
                          : isLowStock
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {isOut ? 'Out of stock' : `${p.current_stock} ${p.unit}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: POS Cart & Checkout Terminal (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-indigo-600" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">Current Cart</span>
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold dark:bg-slate-800">
                {cart.length}
              </span>
            </div>

            <div className="flex gap-2">
              {cart.length > 0 && (
                <>
                  <button
                    onClick={handleHoldSale}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
                    title="Hold sale"
                  >
                    <PauseCircle className="h-3.5 w-3.5" />
                    <span>Hold</span>
                  </button>
                  <button
                    onClick={clearCart}
                    className="rounded p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Clear cart"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Held Sales Strip (if any) */}
          {heldSales.length > 0 && (
            <div className="my-2 flex gap-1.5 overflow-x-auto pb-1">
              {heldSales.map((h) => (
                <button
                  key={h.id}
                  onClick={() => handleResumeSale(h.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
                >
                  <PlayCircle className="h-3 w-3" />
                  <span>{h.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Customer Selection */}
          <div className="mt-3 flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Walk-in Customer (Cadaan / Default)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.current_debt > 0 ? `(Debt: $${c.current_debt.toFixed(2)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Debt & Credit limit indicator if customer selected */}
          {selectedCustomer && (
            <div className="mt-2 rounded-lg bg-slate-50 p-2 text-[11px] dark:bg-slate-800/60 flex items-center justify-between">
              <div>
                <span className="text-slate-500">Credit Limit:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                  ${selectedCustomer.credit_limit.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Current Debt:</span>{' '}
                <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                  ${selectedCustomer.current_debt.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Cart Item List */}
          <div className="mt-3 max-h-64 min-h-[140px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {cart.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-slate-400">
                <ShoppingCart className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-1" />
                <span>{t('cart_empty')}</span>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="truncate flex-1">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      ${item.unit_price.toFixed(2)} / {item.product.unit}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center font-mono text-xs font-bold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right w-16">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                      ${((item.unit_price - item.discount) * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-300 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Subtotal & Totals Box */}
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>{t('subtotal')}:</span>
              <span className="font-mono tabular-nums">${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-500">
              <span>{t('discount')}:</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={overallDiscount}
                  onChange={(e) => setOverallDiscount(e.target.value)}
                  className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-right font-mono dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-base font-bold text-slate-900 dark:text-white">
              <span>{t('grand_total')}:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
                ${grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Complete Sale Trigger */}
          <div className="mt-4">
            <button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={cart.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              <span>Proceed to Payment (${grandTotal.toFixed(2)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Select Payment Method & Finalize Sale
            </h2>
            <div className="mt-1 text-xs text-slate-500">
              Total Due:{' '}
              <span className="font-bold font-mono text-slate-900 dark:text-white">
                ${grandTotal.toFixed(2)}
              </span>{' '}
              ({cart.length} line items)
            </div>

            {/* Payment Method Selector Grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <DollarSign className="h-5 w-5" />
                <span>Cash Cadaan</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('mobile_money')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  paymentMethod === 'mobile_money'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <Smartphone className="h-5 w-5" />
                <span>EVC / Zaad / Sahal</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  paymentMethod === 'bank'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <Building className="h-5 w-5" />
                <span>Bank Transfer</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  paymentMethod === 'card'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                <span>Card / POS</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  paymentMethod === 'credit'
                    ? 'border-amber-600 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800'
                }`}
              >
                <User className="h-5 w-5" />
                <span>Credit / Debt Dayn</span>
              </button>
            </div>

            {/* Conditional input fields based on payment method */}
            <div className="mt-4 space-y-3">
              {paymentMethod === 'cash' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Amount Tendered ($)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Exact: ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder={grandTotal.toFixed(2)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono dark:border-slate-700 dark:bg-slate-900"
                    autoFocus
                  />
                  <div className="mt-2 flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Change Due:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                      ${changeDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {(paymentMethod === 'mobile_money' || paymentMethod === 'bank') && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Transaction Reference / Phone Number
                  </label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="e.g. EVC-992140 / Sender 615551234"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              )}

              {paymentMethod === 'credit' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900/60 dark:bg-amber-950/40">
                  <div className="font-semibold text-amber-900 dark:text-amber-200">
                    Debt Sale for: {selectedCustomer ? selectedCustomer.name : 'No customer chosen!'}
                  </div>
                  <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                    This full balance of ${grandTotal.toFixed(2)} will be added to the customer's ledger.
                  </p>
                </div>
              )}

              {checkoutError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm"
              >
                Confirm & Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POS Session Modal (Open/Close Float) */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Open Cashier Register Shift
            </h3>
            <p className="text-xs text-slate-500">
              Opening register float for cashier {currentUser.full_name}
            </p>

            <div className="mt-4">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Opening Cash Balance ($)
              </label>
              <input
                type="number"
                step="5"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowSessionModal(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  openPOSSession(parseFloat(openingFloat) || 0);
                  setShowSessionModal(false);
                }}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Start Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Camera Modal */}
      <BarcodeModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        onScan={(code) => handleBarcodeScanned(code)}
      />

      {/* Thermal Receipt Print Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={completedSale}
      />
    </div>
  );
};
