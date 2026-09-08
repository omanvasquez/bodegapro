import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Tag, 
  Check, 
  AlertCircle, 
  Layers, 
  CreditCard,
  ShoppingCart,
  ChevronUp,
  X
} from 'lucide-react';
import { Product, CartItem } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { CheckoutModal } from './CheckoutModal';
import { PriceOverrideModal } from './PriceOverrideModal';

export const POSView: React.FC = () => {
  const { products, getProductPriceUSD, getProductPriceVES } = useInventory();
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    overrideItemPrice, 
    resetItemPrice, 
    clearCart, 
    totalUSD, 
    totalVES,
    totalItemsCount
  } = useCart();
  const { effectiveRate } = useCurrency();

  // Search and categories
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [itemToOverride, setItemToOverride] = useState<CartItem | null>(null);

  // Mobile cart drawer open state
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Filtered categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['Todos', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search));
      const matchCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden pb-16 md:pb-0">
      
      {/* Left: Product Catalog */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 border-r border-slate-200">
        
        {/* Search & Categories Bar */}
        <div className="p-4 bg-white border-b border-slate-200 space-y-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-brand-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5 pb-28 md:pb-4">
            {filteredProducts.map((product) => {
              const priceUSD = getProductPriceUSD(product);
              const priceVES = getProductPriceVES(product);
              const isLowStock = product.stock <= 3;
              const isDecimalUnit = product.unit === 'kg' || product.unit === 'litro';
              const cartItem = cart.find((item) => item.product.id === product.id);

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product, isDecimalUnit ? 0.25 : 1)}
                  className={`bg-white rounded-2xl p-3.5 border cursor-pointer transition flex flex-col justify-between group active:scale-[0.98] ${
                    cartItem 
                      ? 'border-brand-emerald-500 ring-2 ring-brand-emerald-500/20 bg-emerald-50/10 shadow-sm' 
                      : 'border-slate-200 hover:border-brand-emerald-500 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {product.category}
                      </span>
                      <div className="flex items-center space-x-1">
                        {cartItem && (
                          <span className="text-[10px] font-black bg-brand-emerald-600 text-white px-1.5 py-0.2 rounded-md shadow-xs">
                            {cartItem.quantity} {product.unit}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                            isLowStock
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {product.stock} {product.unit}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-800 leading-snug group-hover:text-brand-emerald-600 transition line-clamp-2">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-black text-slate-900">
                        ${priceUSD.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold block">
                        Bs {priceVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition shadow-sm ${
                      cartItem 
                        ? 'bg-brand-emerald-500 text-white' 
                        : 'bg-slate-50 group-hover:bg-brand-emerald-500 group-hover:text-white text-slate-400'
                    }`}>
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Cart (Desktop Sidebar / Mobile Drawer) */}
      <div className="hidden md:flex flex-col w-96 bg-white border-l border-slate-200 h-full shrink-0">
        
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-black text-base text-slate-800">Ticket de Compra</span>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              {cart.length} ítems
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar</span>
            </button>
          )}
        </div>

        {/* Cart Line Items */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <Layers className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold">El carrito está vacío</p>
              <p className="text-[11px]">Toca cualquier producto para añadirlo a la cuenta.</p>
            </div>
          ) : (
            cart.map((item) => {
              const itemTotalUSD = item.finalPriceUSD * item.quantity;
              const itemTotalVES = item.finalPriceVES * item.quantity;
              const isDecimal = item.product.unit === 'kg' || item.product.unit === 'litro';

              return (
                <div
                  key={item.product.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-2">
                      <h5 className="font-bold text-xs text-slate-800 truncate">{item.product.name}</h5>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[11px] text-slate-500 font-semibold">
                          ${item.finalPriceUSD.toFixed(2)} c/u
                        </span>
                        {item.isOverridden && (
                          <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                            Ajustado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-xs text-slate-900 block">
                        ${itemTotalUSD.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Bs {itemTotalVES.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity and Override Controls */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            isDecimal ? item.quantity - 0.1 : item.quantity - 1
                          )
                        }
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <input
                        type="number"
                        step={isDecimal ? '0.05' : '1'}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product.id, parseFloat(e.target.value) || 0)}
                        className="w-14 text-center text-xs font-black bg-white rounded-lg border border-slate-200 py-0.5"
                      />

                      <button
                        onClick={() =>
                          updateQuantity(
                            item.product.id,
                            isDecimal ? item.quantity + 0.1 : item.quantity + 1
                          )
                        }
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      <span className="text-[10px] text-slate-400 font-semibold">{item.product.unit}</span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setItemToOverride(item)}
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                        title="Ajustar precio al vuelo (regateo)"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Quitar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Totals & Checkout Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Tasa aplicada:</span>
              <span className="font-bold text-slate-800">Bs {effectiveRate.toFixed(2)}</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Total a Cobrar
                </span>
                <span className="text-2xl font-black text-brand-slate-900 tracking-tight">
                  ${totalUSD.toFixed(2)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-extrabold text-brand-emerald-600">
                  Bs {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
            className={`w-full py-3.5 rounded-xl font-black text-base shadow-lg transition flex items-center justify-center space-x-2 ${
              cart.length > 0
                ? 'bg-brand-emerald-600 hover:bg-brand-emerald-700 text-white active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span>COBRAR (${totalUSD.toFixed(2)})</span>
          </button>
        </div>
      </div>

      {/* Mobile Floating Bar for POS Cart */}
      {cart.length > 0 && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 px-3.5 py-2.5 bg-brand-slate-900/95 backdrop-blur-md text-white z-30 shadow-2xl border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsMobileCartOpen(true)}
            className="flex items-center space-x-2.5 text-left group active:opacity-80 transition flex-1 min-w-0 pr-2 focus:outline-none"
          >
            <div className="relative w-10 h-10 rounded-xl bg-brand-emerald-500/20 border border-brand-emerald-500/40 flex items-center justify-center text-brand-emerald-400 shrink-0">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-brand-emerald-500 text-slate-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                {totalItemsCount}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1">
                <span className="text-[11px] text-brand-emerald-400 font-bold uppercase tracking-wider truncate">
                  Ver Ticket ({cart.length})
                </span>
                <ChevronUp className="w-3.5 h-3.5 text-brand-emerald-400 animate-pulse shrink-0" />
              </div>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-lg font-black text-white">${totalUSD.toFixed(2)}</span>
                <span className="text-xs text-slate-300 font-medium truncate">/ Bs {totalVES.toFixed(2)}</span>
              </div>
            </div>
          </button>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 active:scale-95 transition"
            >
              Detalle
            </button>
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="px-4 py-2 bg-brand-emerald-500 hover:bg-brand-emerald-600 text-slate-950 font-black text-sm rounded-xl shadow-md active:scale-95 transition flex items-center space-x-1.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Cobrar</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Drawer (Ticket Completo para Móvil y Tablet) */}
      {isMobileCartOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileCartOpen(false)}
          />

          {/* Bottom Sheet */}
          <div className="relative z-10 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col border-t border-slate-200 animate-in slide-in-from-bottom duration-200">
            {/* Drag Handle */}
            <div 
              className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 cursor-pointer" 
              onClick={() => setIsMobileCartOpen(false)} 
            />

            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-black text-base text-slate-800">Ticket de Compra</span>
                <span className="text-xs bg-brand-emerald-50 text-brand-emerald-700 border border-brand-emerald-200 font-bold px-2.5 py-0.5 rounded-full">
                  {cart.length} {cart.length === 1 ? 'producto' : 'productos'} ({totalItemsCount} unid.)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Deseas vaciar todo el ticket de compra?')) {
                        clearCart();
                        setIsMobileCartOpen(false);
                      }
                    }}
                    className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vaciar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Ticket Items List */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
              {cart.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                    <Layers className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">El ticket está vacío</p>
                  <p className="text-xs text-slate-400">Toca cualquier producto del mostrador para añadirlo.</p>
                  <button
                    type="button"
                    onClick={() => setIsMobileCartOpen(false)}
                    className="mt-3 px-4 py-2 bg-brand-emerald-50 text-brand-emerald-700 font-bold text-xs rounded-xl border border-brand-emerald-200"
                  >
                    Volver al mostrador
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const itemTotalUSD = item.finalPriceUSD * item.quantity;
                  const itemTotalVES = item.finalPriceVES * item.quantity;
                  const isDecimal = item.product.unit === 'kg' || item.product.unit === 'litro';

                  return (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 shadow-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 pr-2">
                          <h5 className="font-bold text-sm text-slate-800 leading-snug">{item.product.name}</h5>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span className="text-xs text-slate-500 font-semibold">
                              ${item.finalPriceUSD.toFixed(2)} c/u
                            </span>
                            <span className="text-[11px] text-slate-400">
                              (Bs {item.finalPriceVES.toFixed(2)})
                            </span>
                            {item.isOverridden && (
                              <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                                Ajustado
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-sm text-slate-900 block">
                            ${itemTotalUSD.toFixed(2)}
                          </span>
                          <span className="text-[11px] text-slate-500 font-semibold">
                            Bs {itemTotalVES.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Quantity & Actions Bar */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                        <div className="flex items-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                isDecimal ? Math.max(0, Number((item.quantity - 0.1).toFixed(2))) : item.quantity - 1
                              )
                            }
                            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 active:bg-slate-100 shadow-xs"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <input
                            type="number"
                            step={isDecimal ? '0.05' : '1'}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseFloat(e.target.value) || 0)}
                            className="w-14 text-center text-sm font-black bg-white rounded-xl border border-slate-200 py-1"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                isDecimal ? Number((item.quantity + 0.1).toFixed(2)) : item.quantity + 1
                              )
                            }
                            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 active:bg-slate-100 shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-[11px] text-slate-500 font-bold ml-1">{item.product.unit}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setItemToOverride(item)}
                            className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 active:bg-amber-100 transition border border-slate-200 bg-white shadow-xs"
                            title="Ajustar precio al vuelo (regateo)"
                          >
                            <Tag className="w-4 h-4" />
                          </button>
                          
                          {/* Botón destacado para eliminar o desmarcar el producto */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="px-2.5 py-1.5 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 transition border border-rose-200 flex items-center space-x-1 font-bold text-xs shadow-xs"
                            title="Quitar o desmarcar este producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Quitar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Tasa aplicada:</span>
                    <span className="font-bold text-slate-800">Bs {effectiveRate.toFixed(2)}</span>
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total a Cobrar
                      </span>
                      <span className="text-2xl font-black text-brand-slate-900 tracking-tight">
                        ${totalUSD.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-brand-emerald-600">
                        Bs {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMobileCartOpen(false)}
                    className="w-full py-3 rounded-xl border border-slate-300 font-bold text-sm text-slate-700 bg-white hover:bg-slate-50 active:scale-[0.98] transition text-center"
                  >
                    + Seguir marcando
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3 rounded-xl font-black text-sm shadow-lg transition flex items-center justify-center space-x-1.5 bg-brand-emerald-600 hover:bg-brand-emerald-700 text-white active:scale-[0.98]"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>COBRAR</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cartItems={cart}
          totalUSD={totalUSD}
          totalVES={totalVES}
          onSaleCompleted={() => {
            clearCart();
            setIsMobileCartOpen(false);
          }}
        />
      )}

      {/* Price Override Modal */}
      {itemToOverride && (
        <PriceOverrideModal
          item={itemToOverride}
          onClose={() => setItemToOverride(null)}
          onSave={(newPriceUSD) => overrideItemPrice(itemToOverride.product.id, newPriceUSD)}
          onReset={() => resetItemPrice(itemToOverride.product.id)}
        />
      )}
    </div>
  );
};
