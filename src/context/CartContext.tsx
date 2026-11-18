import React, { createContext, useContext, useMemo, useState } from 'react';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  size: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>) => void;
  remove: (productId: string, size: string) => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

// Carrito en memoria para la primera versión. Más adelante se guarda en Firestore por usuario.
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const value = useMemo<CartContextValue>(() => {
    const add: CartContextValue['add'] = (item) =>
      setItems((prev) => {
        const found = prev.find((i) => i.productId === item.productId && i.size === item.size);
        if (found) {
          return prev.map((i) =>
            i === found ? { ...i, quantity: i.quantity + 1 } : i,
          );
        }
        return [...prev, { ...item, quantity: 1 }];
      });

    const remove: CartContextValue['remove'] = (productId, size) =>
      setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);

    return { items, add, remove, total, count };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  return ctx;
}
