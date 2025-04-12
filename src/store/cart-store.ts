import { create } from "zustand";

export type CartItemType = {
  id: number;
  title: string;
  hero_image: string;
  price: number;
  quantity: number;
  max_quantity: number;
};

type CartState = {
  items: CartItemType[];
  addItem: (item: CartItemType) => void;
  removeItem: (id: number) => void;
  incrementItem: (id: number) => void;
  decrementItem: (id: number) => void;
  getTotalPrice: () => string;
  getItemCount: () => number;
  resetCart: () => void;
};

const initialCartItems: CartItemType[] = [];

export const useCartStore = create<CartState>((set, get) => ({
  items: initialCartItems,
  addItem: (item) => {
    const existingItem = get().items.find(
      (cartItem) => cartItem.id === item.id
    );
    if (existingItem) {
      set((state) => ({
        items: state.items.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: Math.min(i.quantity + item.quantity, i.max_quantity),
              }
            : i
        ),
      }));
    } else {
      set((state) => ({
        items: [...state.items, item],
      }));
    }
  },
  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
  incrementItem: (id) =>
    set((state) => {
      return {
        items: state.items.map((item) =>
          item.id === id && item.quantity < item.max_quantity
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };
    }),
  decrementItem: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
    })),
  getTotalPrice: () => {
    const items = get().items;

    const total = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    return total.toFixed(2);
  },
  getItemCount: () => {
    const items = get().items;

    const total = items.reduce((count, item) => count + item.quantity, 0);
    return total;
  },
  resetCart: () => set({ items: initialCartItems }),
}));
