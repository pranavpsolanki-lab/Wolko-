import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, PRODUCTS } from '../data/products';
import {
  initAuth,
  backendGoogleSignUp,
  logoutGoogle,
  fetchOrdersFromBackend,
  SheetOrderRow,
  CustomerGoogleProfile,
} from '../lib/googleSheets';

export interface CartItem {
  product: Product;
  selectedColor: string;
  selectedSize?: string;
  variantImage?: string;
  quantity: number;
}

export type GoogleUserProfile = CustomerGoogleProfile;

interface ShopContextType {
  cart: CartItem[];
  addToCart: (
    product: Product,
    colorName?: string,
    quantity?: number,
    sizeName?: string,
    variantImage?: string
  ) => void;
  removeFromCart: (productId: string, colorName: string) => void;
  updateQuantity: (productId: string, colorName: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;

  selectedProduct: Product | null;
  modalInitialColor?: string;
  openProductModal: (product: Product, initialColor?: string) => void;
  closeProductModal: () => void;

  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;

  activeCategory: string;
  setActiveCategory: (cat: string) => void;

  // Customer Google Auth State
  googleUser: GoogleUserProfile | null;
  needsGoogleAuth: boolean;
  isSigningInGoogle: boolean;
  handleGoogleLogin: (
    email: string,
    displayName?: string
  ) => Promise<GoogleUserProfile | null>;
  handleGoogleLogout: () => Promise<void>;

  // Backend Orders & AI Voice Agent 5-Minute Call Scheduling (Runs in Background)
  scheduledOrders: SheetOrderRow[];
  refreshBackendOrders: () => Promise<void>;
  addScheduledOrder: (order: SheetOrderRow) => void;
  updateLocalOrderStatus: (
    orderId: string,
    orderStatus: string,
    aiCallStatus: string,
    voiceResponse: string
  ) => void;
  voiceCallCountdown: number | null;
  activeVoiceCallOrder: SheetOrderRow | null;
  triggerImmediateVoiceCall: (order: SheetOrderRow) => void;
  closeVoiceCallModal: () => void;

  // Admin-Only Backend Portal
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('wolko_cart');
      return saved
        ? JSON.parse(saved)
        : [
            {
              product: PRODUCTS[0],
              selectedColor: PRODUCTS[0].colors[0].name,
              quantity: 1,
            },
          ];
    } catch {
      return [
        {
          product: PRODUCTS[0],
          selectedColor: PRODUCTS[0].colors[0].name,
          quantity: 1,
        },
      ];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wolko_wishlist');
      return saved ? JSON.parse(saved) : [PRODUCTS[1].id];
    } catch {
      return [PRODUCTS[1].id];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalInitialColor, setModalInitialColor] = useState<
    string | undefined
  >(undefined);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Customer Google Session (persisted locally for convenience)
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('wolko_google_customer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState<boolean>(
    () => !googleUser
  );
  const [isSigningInGoogle, setIsSigningInGoogle] = useState<boolean>(false);

  const [scheduledOrders, setScheduledOrders] = useState<SheetOrderRow[]>([]);
  const [voiceCallCountdown, setVoiceCallCountdown] = useState<number | null>(
    null
  );
  const [pendingCallOrder, setPendingCallOrder] =
    useState<SheetOrderRow | null>(null);
  const [activeVoiceCallOrder, setActiveVoiceCallOrder] =
    useState<SheetOrderRow | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  const refreshBackendOrders = async () => {
    try {
      const data = await fetchOrdersFromBackend();
      setScheduledOrders(data.orders || []);
    } catch {
      // ignore if offline
    }
  };

  useEffect(() => {
    refreshBackendOrders();
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth((user) => {
      setGoogleUser(user);
      setNeedsGoogleAuth(false);
      try {
        localStorage.setItem('wolko_google_customer', JSON.stringify(user));
      } catch {
        // ignore
      }
    });
    return () => unsubscribe();
  }, []);

  // Background 5-Minute (300s) Countdown Timer for AI Voice Agent Callback
  useEffect(() => {
    if (voiceCallCountdown === null || !pendingCallOrder) return;

    if (voiceCallCountdown <= 0) {
      setActiveVoiceCallOrder(pendingCallOrder);
      setVoiceCallCountdown(null);
      return;
    }

    const timer = setInterval(() => {
      setVoiceCallCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [voiceCallCountdown, pendingCallOrder]);

  const handleGoogleLogin = async (
    email: string,
    displayName?: string
  ): Promise<GoogleUserProfile | null> => {
    setIsSigningInGoogle(true);
    try {
      const profile = await backendGoogleSignUp(email, displayName);
      setGoogleUser(profile);
      setNeedsGoogleAuth(false);
      try {
        localStorage.setItem('wolko_google_customer', JSON.stringify(profile));
      } catch {
        // ignore
      }
      return profile;
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setNeedsGoogleAuth(true);
    try {
      localStorage.removeItem('wolko_google_customer');
    } catch {
      // ignore
    }
  };

  const addScheduledOrder = (order: SheetOrderRow) => {
    setScheduledOrders((prev) => [order, ...prev]);
    setPendingCallOrder(order);
    // Automatically schedule the 5-minute (300 seconds) AI Voice Agent call in the background
    setVoiceCallCountdown(300);
  };

  const updateLocalOrderStatus = (
    orderId: string,
    orderStatus: string,
    aiCallStatus: string,
    voiceResponse: string
  ) => {
    setScheduledOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId
          ? { ...o, orderStatus, aiCallStatus, voiceResponse }
          : o
      )
    );
    if (pendingCallOrder?.orderId === orderId) {
      setPendingCallOrder((prev) =>
        prev ? { ...prev, orderStatus, aiCallStatus, voiceResponse } : null
      );
    }
    if (activeVoiceCallOrder?.orderId === orderId) {
      setActiveVoiceCallOrder((prev) =>
        prev ? { ...prev, orderStatus, aiCallStatus, voiceResponse } : null
      );
    }
  };

  const triggerImmediateVoiceCall = (order: SheetOrderRow) => {
    setVoiceCallCountdown(null);
    setActiveVoiceCallOrder(order);
  };

  const closeVoiceCallModal = () => {
    setActiveVoiceCallOrder(null);
  };

  useEffect(() => {
    try {
      localStorage.setItem('wolko_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('wolko_wishlist', JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  const addToCart = (
    product: Product,
    colorName?: string,
    quantity: number = 1,
    sizeName?: string,
    variantImage?: string
  ) => {
    const chosenColor = colorName || product.colors[0]?.name || 'Natural';
    const chosenSize =
      sizeName || (product.sizes ? product.sizes[0] : undefined);
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === chosenColor &&
          item.selectedSize === chosenSize
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += quantity;
        return next;
      }
      return [
        ...prev,
        {
          product,
          selectedColor: chosenColor,
          selectedSize: chosenSize,
          variantImage,
          quantity,
        },
      ];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, colorName: string) => {
    setCart((prev) =>
      prev.filter(
        (item) =>
          !(item.product.id === productId && item.selectedColor === colorName)
      )
    );
  };

  const updateQuantity = (
    productId: string,
    colorName: string,
    delta: number
  ) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (
            item.product.id === productId &&
            item.selectedColor === colorName
          ) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const openProductModal = (product: Product, initialColor?: string) => {
    setSelectedProduct(product);
    setModalInitialColor(initialColor);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setModalInitialColor(undefined);
  };

  return (
    <ShopContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        isWishlistOpen,
        setIsWishlistOpen,
        selectedProduct,
        modalInitialColor,
        openProductModal,
        closeProductModal,
        isSearchOpen,
        setIsSearchOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        activeCategory,
        setActiveCategory,
        googleUser,
        needsGoogleAuth,
        isSigningInGoogle,
        handleGoogleLogin,
        handleGoogleLogout,
        scheduledOrders,
        refreshBackendOrders,
        addScheduledOrder,
        updateLocalOrderStatus,
        voiceCallCountdown,
        activeVoiceCallOrder,
        triggerImmediateVoiceCall,
        closeVoiceCallModal,
        isAdminOpen,
        setIsAdminOpen,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
