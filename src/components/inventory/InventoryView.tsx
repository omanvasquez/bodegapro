import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Package, 
  Box, 
  AlertTriangle, 
  Edit, 
  Trash2, 
  DollarSign, 
  Banknote, 
  AlertCircle 
} from 'lucide-react';
import { Product } from '../../types';
import { useInventory } from '../../context/InventoryContext';
import { useCurrency } from '../../context/CurrencyContext';
import { ProductModal } from './ProductModal';
import { BulkUnpackModal } from './BulkUnpackModal';
import { WasteModal } from './WasteModal';

export const InventoryView: React.FC = () => {
  const { 
    products, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    unpackBulk, 
    recordWaste,
    getProductPriceUSD,
    getProductPriceVES 
  } = useInventory();
  const { effectiveRate } = useCurrency();

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToUnpack, setProductToUnpack] = useState<Product | null>(null);
  const [productForWaste, setProductForWaste] = useState<Product | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['Todos', ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search));
      const matchCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  const handleSaveProduct = (data: any) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
    setEditingProduct(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 overflow-hidden pb-16 md:pb-0">
      
      {/* Top Action Header */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Inventario y Doble Anclaje</span>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
              {products.length} productos
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Administra precios en USD o Bs, control de bultos y registro de mermas.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsProductModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-emerald-600 hover:bg-brand-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-center gap-3 shrink-0">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-brand-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Anclaje / Modalidad</th>
                  <th className="py-3 px-4">Precio Venta</th>
                  <th className="py-3 px-4">Último Costo</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredProducts.map((product) => {
                  const priceUSD = getProductPriceUSD(product);
                  const priceVES = getProductPriceVES(product);
                  const isLow = product.stock <= 3;
                  const marginUSD = Math.round((priceUSD - product.costUSD) * 100) / 100;
                  const marginPercent = product.costUSD > 0 ? Math.round((marginUSD / product.costUSD) * 100) : 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {product.category} {product.barcode ? `• ${product.barcode}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Modalidad Anclaje */}
                      <td className="py-3 px-4">
                        {product.pricingMode === 'USD' ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <DollarSign className="w-3 h-3 text-emerald-600" />
                            <span>Anclado USD</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <Banknote className="w-3 h-3 text-blue-600" />
                            <span>Fijo Bs</span>
                          </span>
                        )}
                      </td>

                      {/* Precio */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>
                          <span>${priceUSD.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-500 font-normal block">
                            Bs {priceVES.toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* Costo y Margen */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-600">${product.costUSD.toFixed(2)}</span>
                        <span className="text-[10px] text-emerald-600 font-bold block">
                          +{marginPercent}% margen
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-black px-2 py-0.5 rounded-lg text-xs ${
                            isLow ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {product.stock} {product.unit}s
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Despiece de bulto */}
                          {product.isBulkPack && (
                            <button
                              onClick={() => setProductToUnpack(product)}
                              className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                              title="Desempacar bulto (Despiece)"
                            >
                              <Box className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Merma / Consumo propio */}
                          <button
                            onClick={() => setProductForWaste(product)}
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                            title="Registrar merma o consumo propio"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
                            title="Editar producto"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar ${product.name}?`)) {
                                deleteProduct(product.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          productToEdit={editingProduct}
          onSave={handleSaveProduct}
        />
      )}

      {productToUnpack && (
        <BulkUnpackModal
          product={productToUnpack}
          onClose={() => setProductToUnpack(null)}
          onUnpack={(id, packs) => {
            const res = unpackBulk(id, packs);
            alert(res.message);
          }}
        />
      )}

      {productForWaste && (
        <WasteModal
          product={productForWaste}
          onClose={() => setProductForWaste(null)}
          onRecord={(id, qty, reason, notes) => {
            recordWaste(id, qty, reason, notes);
          }}
        />
      )}
    </div>
  );
};
