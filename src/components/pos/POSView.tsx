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
  CreditCard 
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
    totalVES 
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
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
            {filteredProducts.map((product) => {
              const priceUSD = getProductPriceUSD(product);
              const priceVES = getProductPriceVES(product);
              const isLowStock = product.stock <= 3;
              const isDecimalUnit = product.unit === 'kg' || product.unit === 'litro';

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product, isDecimalUnit ? 0.25 : 1)}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 hover:border-brand-emerald-500 hover:shadow-md cursor-pointer transition flex flex-col justify-between group active:scale-[0.98]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {product.category}
                      </span>
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
                    <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-brand-emerald-500 group-hover:text-white flex items-center justify-center text-slate-400 transition shadow-sm">
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
        <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-brand-slate-900 text-white z-30 shadow-2xl flex items-center justify-between border-t border-slate-800">
          <div>
            <span className="text-[10px] text-brand-emerald-400 font-bold uppercase tracking-wider block">
              {cart.length} productos en ticket
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xl font-black">${totalUSD.toFixed(2)}</span>
              <span className="text-xs text-slate-300">/ Bs {totalVES.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="px-5 py-2.5 bg-brand-emerald-500 hover:bg-brand-emerald-600 text-slate-950 font-black text-sm rounded-xl shadow-md active:scale-95 transition"
          >
            Cobrar
          </button>
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
