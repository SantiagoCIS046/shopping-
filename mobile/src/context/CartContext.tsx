import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

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
  setQuantity: (productId: string, size: string, quantity: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const CART_KEY = 'shopping.cart.v1';

/**
 * Carrito del usuario. Se guarda en el almacenamiento seguro del
 * dispositivo para que no se pierda al cerrar la app; más adelante
 * se sincroniza con el backend por usuario.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Restaura el carrito guardado
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(CART_KEY);
        if (!cancelled && saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setItems(parsed as CartItem[]);
        }
      } catch {
        // Sin carrito guardado
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persiste cada cambio
  useEffect(() => {
    if (!loaded) return;
    SecureStore.setItemAsync(CART_KEY, JSON.stringify(items)).catch(() => undefined);
  }, [items, loaded]);

  const value = useMemo<CartContextValue>(() => {
    const add: CartContextValue['add'] = (item) =>
      setItems((prev) => {
        const found = prev.find((i) => i.productId === item.productId && i.size === item.size);
        if (found) {
          return prev.map((i) =>
            i === found ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i,
          );
        }
        return [...prev, { ...item, quantity: 1 }];
      });

    const remove: CartContextValue['remove'] = (productId, size) =>
      setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));

    const setQuantity: CartContextValue['setQuantity'] = (productId, size, quantity) => {
      if (quantity < 1) {
        remove(productId, size);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.productId === productId && i.size === size
            ? { ...i, quantity: Math.min(99, quantity) }
            : i,
        ),
      );
    };

    const clear: CartContextValue['clear'] = () => setItems([]);

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);

    return { items, add, remove, setQuantity, clear, total, count };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
}
