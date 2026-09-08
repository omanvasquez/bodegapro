import React, { createContext, useContext, useState, useMemo } from 'react';
import { Product, CartItem } from '../types';
import { useCurrency } from './CurrencyContext';
import { useInventory } from './InventoryContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  overrideItemPrice: (productId: string, newPriceUSD: number) => void;
  resetItemPrice: (productId: string) => void;
  clearCart: () => void;
  totalUSD: number;
  totalVES: number;
  totalItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toVES, toUSD } = useCurrency();
  const { getProductPriceUSD, getProductPriceVES } = useInventory();

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      const baseUSD = getProductPriceUSD(product);
      const baseVES = getProductPriceVES(product);

      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const newQty = Math.round((existing.quantity + quantity) * 1000) / 1000;
        const updated = [...prev];
        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity,
            originalPriceUSD: baseUSD,
            originalPriceVES: baseVES,
            finalPriceUSD: baseUSD,
            finalPriceVES: baseVES,
            isOverridden: false,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.round(quantity * 1000) / 1000 }
          : item
      )
    );
  };

  // Ajuste de precio al vuelo (regateo, redondeo de sencillo)
  const overrideItemPrice = (productId: string, newPriceUSD: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const newVES = toVES(newPriceUSD);
          return {
            ...item,
            finalPriceUSD: newPriceUSD,
            finalPriceVES: newVES,
            isOverridden: true,
          };
        }
        return item;
      })
    );
  };

  const resetItemPrice = (productId: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const baseUSD = getProductPriceUSD(item.product);
          const baseVES = getProductPriceVES(item.product);
          return {
            ...item,
            finalPriceUSD: baseUSD,
            finalPriceVES: baseVES,
            isOverridden: false,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  const { totalUSD, totalVES, totalItemsCount } = useMemo(() => {
    let usd = 0;
    let ves = 0;
    let count = 0;

    for (const item of cart) {
      usd += item.finalPriceUSD * item.quantity;
      ves += item.finalPriceVES * item.quantity;
      count += item.quantity >= 1 ? Math.floor(item.quantity) : 1;
    }

    return {
      totalUSD: Math.round(usd * 100) / 100,
      totalVES: Math.round(ves * 100) / 100,
      totalItemsCount: count,
    };
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        overrideItemPrice,
        resetItemPrice,
        clearCart,
        totalUSD,
        totalVES,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
