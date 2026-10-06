"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/context/auth-context";
import {
  MEDIA_BASE_URL,
  apiRequest,
  resolveMediaUrl,
  type Vehicle,
} from "@/lib/api";

export type CartItem = {
  id: number;
  name: string;
  price: string;
  image: string;
  year: string;
  type: string;
  /** Available units. Optional so older saved guest carts still load. */
  stock?: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  /** False while the cart is still loading (avoids an "empty cart" flash). */
  isHydrated: boolean;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

// Guest (not logged in) carts still live in the browser.
const GUEST_STORAGE_KEY = "autotrade-cart";

// --- Server <-> CartItem mapping ------------------------------------------

type ServerCartRow = {
  id: number;
  vehicle_id: number;
  quantity: number;
  vehicle: Vehicle;
};

// The server only stores vehicle_id + quantity; name/price/image/stock always
// come fresh from the vehicles table, so the cart can't hold stale prices.
function mapServerRow(row: ServerCartRow): CartItem {
  const v = row.vehicle;
  return {
    id: v.id,
    name: v.name,
    price: v.price,
    image: resolveMediaUrl(v.image, MEDIA_BASE_URL),
    year: v.year,
    type: v.type,
    stock: v.stock,
    quantity: row.quantity,
  };
}

// Every cart endpoint returns the full cart: { data: [...] }.
// Uses the shared apiRequest from lib/api.ts, so it sends the Sanctum session
// cookie + CSRF header automatically (no tokens).
async function cartRequest(
  path = "",
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
  } = {},
): Promise<CartItem[]> {
  const json = await apiRequest<{ data?: ServerCartRow[] }>(
    `/cart${path}`,
    options,
  );
  return (json?.data ?? []).map(mapServerRow);
}

// --- Pure helpers used for instant (optimistic) UI updates -----------------

function applyAdd(
  current: CartItem[],
  item: Omit<CartItem, "quantity">,
): CartItem[] {
  const existing = current.find((entry) => entry.id === item.id);
  if (existing) {
    return current.map((entry) => {
      if (entry.id !== item.id) return entry;
      const max = item.stock ?? entry.stock ?? Infinity;
      return {
        ...entry,
        ...item,
        quantity: Math.min(entry.quantity + 1, max),
      };
    });
  }
  return [...current, { ...item, quantity: 1 }];
}

function applyQuantity(
  current: CartItem[],
  id: number,
  quantity: number,
): CartItem[] {
  return quantity <= 0
    ? current.filter((entry) => entry.id !== id)
    : current.map((entry) =>
        entry.id === id
          ? { ...entry, quantity: Math.min(quantity, entry.stock ?? Infinity) }
          : entry,
      );
}

// --- Provider --------------------------------------------------------------

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const isAuthenticated = userId !== null;

  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Runs on first load AND whenever the logged-in user changes (login/logout).
  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    setIsHydrated(false);

    const readGuestCart = (): CartItem[] => {
      try {
        const stored = window.localStorage.getItem(GUEST_STORAGE_KEY);
        return stored ? (JSON.parse(stored) as CartItem[]) : [];
      } catch {
        return [];
      }
    };

    (async () => {
      if (!isAuthenticated) {
        // Logged out -> guest cart from this browser.
        if (!cancelled) {
          setItems(readGuestCart());
          setIsHydrated(true);
        }
        return;
      }

      // Logged in -> the server cart is the source of truth.
      try {
        const guestItems = readGuestCart();

        let serverItems: CartItem[];
        if (guestItems.length > 0) {
          // Fold the guest cart into the user's saved cart, once.
          serverItems = await cartRequest("/merge", {
            method: "POST",
            body: {
              items: guestItems.map((i) => ({
                vehicle_id: i.id,
                quantity: i.quantity,
              })),
            },
          });
          window.localStorage.removeItem(GUEST_STORAGE_KEY);
        } else {
          serverItems = await cartRequest();
        }

        if (!cancelled) setItems(serverItems);
      } catch (err) {
        console.error("Couldn't load cart:", err);
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAuthenticated, userId]);

  // Guests only: persist to localStorage. Logged-in carts live on the server.
  useEffect(() => {
    if (!isHydrated || isAuthenticated) return;
    try {
      window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore write errors
    }
  }, [items, isHydrated, isAuthenticated]);

  // Sends a change to the server, then replaces local state with the server's
  // answer (so quantities/stock caps always match the database). If the
  // request fails, reload the real cart to undo the optimistic change.
  const syncWithServer = async (request: () => Promise<CartItem[]>) => {
    try {
      setItems(await request());
    } catch (err) {
      console.error("Cart sync failed:", err);
      try {
        setItems(await cartRequest());
      } catch {
        // offline — keep whatever is on screen
      }
    }
  };

  const addToCart: CartContextValue["addToCart"] = (item) => {
    setItems((current) => applyAdd(current, item));

    if (isAuthenticated) {
      void syncWithServer(() =>
        cartRequest("", { method: "POST", body: { vehicle_id: item.id } }),
      );
    }
  };

  const removeFromCart = (id: number) => {
    setItems((current) => current.filter((entry) => entry.id !== id));

    if (isAuthenticated) {
      void syncWithServer(() => cartRequest(`/${id}`, { method: "DELETE" }));
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    setItems((current) => applyQuantity(current, id, quantity));

    if (isAuthenticated) {
      void syncWithServer(() =>
        cartRequest(`/${id}`, {
          method: "PATCH",
          body: { quantity: Math.max(0, quantity) },
        }),
      );
    }
  };

  const clearCart = () => {
    setItems([]);

    if (isAuthenticated) {
      void syncWithServer(() => cartRequest("", { method: "DELETE" }));
    }
  };

  const totalItems = useMemo(
    () => items.reduce((sum, entry) => sum + entry.quantity, 0),
    [items],
  );

  const value: CartContextValue = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    isHydrated,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
