import React, { createContext, useContext, useState } from 'react';
import { Product, InventoryWaste, WasteReason, ProductUnit } from '../types';
import { dbInit } from '../services/localDatabase';
import { useCurrency } from './CurrencyContext';

interface InventoryContextType {
  products: Product[];
  wastes: InventoryWaste[];
  addProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  unpackBulk: (productId: string, packsToUnpack: number) => { success: boolean; message: string };
  recordWaste: (productId: string, quantity: number, reason: WasteReason, notes?: string) => void;
  getProductPriceUSD: (product: Product) => number;
  getProductPriceVES: (product: Product) => number;
  adjustStock: (productId: string, quantityDelta: number) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => dbInit.getProducts());
  const [wastes, setWastes] = useState<InventoryWaste[]>(() => dbInit.getWastes());
  const { toVES, toUSD } = useCurrency();

  const getProductPriceUSD = (product: Product): number => {
    if (product.pricingMode === 'USD') {
      return product.priceUSD;
    }
    return toUSD(product.priceVES);
  };

  const getProductPriceVES = (product: Product): number => {
    if (product.pricingMode === 'VES') {
      return product.priceVES;
    }
    return toVES(product.priceUSD);
  };

  const addProduct = (newProd: Omit<Product, 'id' | 'updatedAt'>) => {
    const product: Product = {
      ...newProd,
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      updatedAt: Date.now(),
    };
    const updated = [product, ...products];
    setProducts(updated);
    dbInit.saveProducts(updated);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
    );
    setProducts(updated);
    dbInit.saveProducts(updated);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    dbInit.saveProducts(updated);
  };

  const adjustStock = (productId: string, quantityDelta: number) => {
    setProducts((prev) => {
      const updated = prev.map((p) => {
        if (p.id === productId) {
          const newStock = Math.max(0, Math.round((p.stock + quantityDelta) * 1000) / 1000);
          return { ...p, stock: newStock, updatedAt: Date.now() };
        }
        return p;
      });
      dbInit.saveProducts(updated);
      return updated;
    });
  };

  // Despiece de bulto a unidades sueltas
  const unpackBulk = (productId: string, packsToUnpack: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product || !product.isBulkPack || !product.packUnits) {
      return { success: false, message: 'El producto no está configurado como bulto' };
    }

    const unitsToAdd = packsToUnpack * product.packUnits;
    adjustStock(productId, unitsToAdd);

    return {
      success: true,
      message: `Se desempacaron ${packsToUnpack} bulto(s). Se añadieron +${unitsToAdd} unidades al inventario.`,
    };
  };

  // Registro de consumo propio o mermas
  const recordWaste = (
    productId: string,
    quantity: number,
    reason: WasteReason,
    notes?: string
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    adjustStock(productId, -quantity);

    const wasteEntry: InventoryWaste = {
      id: 'waste_' + Date.now(),
      tenantId: product.tenantId,
      productId: product.id,
      productName: product.name,
      quantity,
      unit: product.unit as ProductUnit,
      reason,
      costUSD: Math.round((product.costUSD * quantity) * 100) / 100,
      timestamp: Date.now(),
      notes,
    };

    const updatedWastes = [wasteEntry, ...wastes];
    setWastes(updatedWastes);
    dbInit.saveWastes(updatedWastes);
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        wastes,
        addProduct,
        updateProduct,
        deleteProduct,
        unpackBulk,
        recordWaste,
        getProductPriceUSD,
        getProductPriceVES,
        adjustStock,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within an InventoryProvider');
  return context;
};
