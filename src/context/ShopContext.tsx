import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Product, PRODUCTS } from '../data/products';
import {
  initAuth,
  signInWithFirebaseGooglePopup,
  backendGoogleSignUp,
  logoutGoogle,
  fetchOrdersFromBackend,
  getSavedGoogleUser,
  persistGoogleUserLocally,
  saveCustomGoogleAvatarUrl,
  subscribeToUserOrdersInFirestore,
  mapFirestoreDocToOrderRow,
  cancelCustomerOrderInBackend,
  deleteCustomerOrderInBackend,
  getDeletedOrderIds,
  getCancelledOrderIds,
  fetchProductComments,
  createProductComment,
  markProductCommentHelpful,
  removeProductComment,
  getDeletedCommentIds,
  mapFirestoreDocToComment,
  subscribeToPublicCommentsInFirestore,
  SheetOrderRow,
  CustomerGoogleProfile,
  ProductCommentItem,
} from '../lib/googleSheets';

export interface CartItem {
  product: Product;
  selectedColor: string;
  selectedSize?: string;
  variantImage?: string;
  quantity: number;
}

export type GoogleUserProfile = CustomerGoogleProfile;
export type CustomerDashboardTab = 'orders' | 'profile' | 'addresses';

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

  // Customer Personal Dashboard State
  isCustomerDashboardOpen: boolean;
  setIsCustomerDashboardOpen: (open: boolean) => void;
  customerDashboardTab: CustomerDashboardTab;
  setCustomerDashboardTab: (tab: CustomerDashboardTab) => void;
  openCustomerDashboard: (tab?: CustomerDashboardTab) => void;
  customerOrders: SheetOrderRow[];

  activeCategory: string;
  setActiveCategory: (cat: string) => void;

  // Customer Google Auth State (Firebase Auth + Persistent Storage)
  googleUser: GoogleUserProfile | null;
  needsGoogleAuth: boolean;
  isSigningInGoogle: boolean;
  handleGooglePopupSignIn: () => Promise<GoogleUserProfile | null>;
  handleGoogleLogin: (
    email: string,
    displayName?: string
  ) => Promise<GoogleUserProfile | null>;
  handleGoogleLogout: () => Promise<void>;
  updateGoogleUserPhoto: (photoDataUrlOrUrl: string | null) => void;

  // Backend Orders
  scheduledOrders: SheetOrderRow[];
  refreshBackendOrders: () => Promise<void>;
  addScheduledOrder: (order: SheetOrderRow) => void;
  updateLocalOrderStatus: (
    orderId: string,
    orderStatus: string,
    aiCallStatus: string,
    voiceResponse: string
  ) => void;
  cancelOrder: (orderId: string) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;

  // Real Customer Product Comments (Empty until real customers comment)
  productComments: ProductCommentItem[];
  getCommentsForProduct: (productId: string) => ProductCommentItem[];
  addProductComment: (input: {
    productId: string;
    productName: string;
    productImage?: string;
    authorName: string;
    rating: number;
    highlights?: string[];
    commentText: string;
  }) => Promise<ProductCommentItem>;
  markCommentHelpful: (commentId: string) => Promise<void>;
  deleteProductComment: (commentId: string) => Promise<void>;
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
  const [isCustomerDashboardOpen, setIsCustomerDashboardOpen] = useState(false);
  const [customerDashboardTab, setCustomerDashboardTab] =
    useState<CustomerDashboardTab>('orders');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalInitialColor, setModalInitialColor] = useState<
    string | undefined
  >(undefined);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Customer Google Session (Firebase Auth + unified localStorage persistence)
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(() =>
    getSavedGoogleUser()
  );
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState<boolean>(
    () => !getSavedGoogleUser()
  );
  const [isSigningInGoogle, setIsSigningInGoogle] = useState<boolean>(false);

  const [scheduledOrders, setScheduledOrders] = useState<SheetOrderRow[]>([]);
  const [productComments, setProductComments] = useState<ProductCommentItem[]>([]);

  const refreshBackendOrders = async () => {
    try {
      const data = await fetchOrdersFromBackend();
      setScheduledOrders(data.orders || []);
    } catch {
      // ignore if offline
    }
  };

  const refreshProductComments = async () => {
    try {
      const list = await fetchProductComments();
      setProductComments(list);
    } catch {
      // ignore if offline
    }
  };

  useEffect(() => {
    refreshBackendOrders();
    refreshProductComments();

    const unsubPublicComments = subscribeToPublicCommentsInFirestore((rawDocs) => {
      const deletedSet = getDeletedCommentIds();
      const liveComments = rawDocs
        .map(mapFirestoreDocToComment)
        .filter((c) => c.commentId && !deletedSet.has(c.commentId));

      setProductComments((prev) => {
        const mergedMap = new Map<string, ProductCommentItem>();
        for (const c of [...liveComments, ...prev]) {
          if (c.commentId && !deletedSet.has(c.commentId) && !mergedMap.has(c.commentId)) {
            mergedMap.set(c.commentId, c);
          }
        }
        return Array.from(mergedMap.values()).sort(
          (a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)
        );
      });
    });

    return () => {
      unsubPublicComments();
    };
  }, []);

  useEffect(() => {
    let unsubFirestoreOrders: (() => void) | null = null;

    const unsubscribeAuth = initAuth(
      (user) => {
        setGoogleUser(user);
        setNeedsGoogleAuth(false);
        persistGoogleUserLocally(user);
        refreshBackendOrders();

        if (unsubFirestoreOrders) {
          unsubFirestoreOrders();
        }
        unsubFirestoreOrders = subscribeToUserOrdersInFirestore((rawDocs) => {
          const deletedSet = getDeletedOrderIds();
          const cancelledSet = getCancelledOrderIds();
          const liveRows = rawDocs
            .map(mapFirestoreDocToOrderRow)
            .filter((o) => o.orderId && !deletedSet.has(o.orderId))
            .map((o) =>
              cancelledSet.has(o.orderId)
                ? {
                    ...o,
                    orderStatus: 'CANCELLED ❌',
                    aiCallStatus: 'CANCELLED BY CUSTOMER',
                  }
                : o
            );
          setScheduledOrders((prev) => {
            const mergedMap = new Map<string, SheetOrderRow>();
            for (const o of [...liveRows, ...prev]) {
              if (
                o.orderId &&
                !deletedSet.has(o.orderId) &&
                !mergedMap.has(o.orderId)
              ) {
                mergedMap.set(
                  o.orderId,
                  cancelledSet.has(o.orderId)
                    ? {
                        ...o,
                        orderStatus: 'CANCELLED ❌',
                        aiCallStatus: 'CANCELLED BY CUSTOMER',
                      }
                    : o
                );
              }
            }
            return Array.from(mergedMap.values());
          });
        });
      },
      () => {
        // Only mark unauthenticated if no saved user exists in localStorage
        const existingSaved = getSavedGoogleUser();
        if (existingSaved) {
          setGoogleUser(existingSaved);
          setNeedsGoogleAuth(false);
        } else {
          setGoogleUser(null);
          setNeedsGoogleAuth(true);
        }
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubFirestoreOrders) {
        unsubFirestoreOrders();
      }
    };
  }, []);

  // Filter orders belonging to the current customer (or placed in this browser session)
  const customerOrders = useMemo(() => {
    const deletedSet = getDeletedOrderIds();
    const activeList = scheduledOrders.filter(
      (o) => o && o.orderId && !deletedSet.has(o.orderId)
    );
    if (!googleUser) {
      return activeList;
    }
    const emailLower = (googleUser.email || '').trim().toLowerCase();
    const uid = googleUser.uid;
    const matched = activeList.filter((o) => {
      if (uid && o.userId && o.userId === uid) return true;
      if (
        emailLower &&
        o.email &&
        o.email.trim().toLowerCase() === emailLower
      ) {
        return true;
      }
      return false;
    });
    return matched.length > 0 ? matched : activeList;
  }, [scheduledOrders, googleUser]);

  const openCustomerDashboard = (tab: CustomerDashboardTab = 'orders') => {
    setCustomerDashboardTab(tab);
    setIsCustomerDashboardOpen(true);
    refreshBackendOrders();
  };

  const handleGooglePopupSignIn =
    async (): Promise<GoogleUserProfile | null> => {
      setIsSigningInGoogle(true);
      try {
        const profile = await signInWithFirebaseGooglePopup();
        setGoogleUser(profile);
        setNeedsGoogleAuth(false);
        persistGoogleUserLocally(profile);
        refreshBackendOrders();
        return profile;
      } finally {
        setIsSigningInGoogle(false);
      }
    };

  const handleGoogleLogin = async (
    email: string,
    displayName?: string
  ): Promise<GoogleUserProfile | null> => {
    setIsSigningInGoogle(true);
    try {
      const profile = await backendGoogleSignUp(email, displayName);
      setGoogleUser(profile);
      setNeedsGoogleAuth(false);
      persistGoogleUserLocally(profile);
      refreshBackendOrders();
      return profile;
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setNeedsGoogleAuth(true);
    setIsCustomerDashboardOpen(false);
  };

  const updateGoogleUserPhoto = (photoDataUrlOrUrl: string | null) => {
    saveCustomGoogleAvatarUrl(photoDataUrlOrUrl);
    const updated = getSavedGoogleUser();
    if (updated) {
      setGoogleUser({ ...updated });
    }
  };

  const addScheduledOrder = (order: SheetOrderRow) => {
    setScheduledOrders((prev) => [
      order,
      ...prev.filter((o) => o.orderId !== order.orderId),
    ]);
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
  };

  const cancelOrder = async (orderId: string) => {
    const orderSnap = scheduledOrders.find((o) => o.orderId === orderId);
    setScheduledOrders((prev) =>
      prev.map((o) =>
        o.orderId === orderId
          ? {
              ...o,
              orderStatus: 'CANCELLED ❌',
              aiCallStatus: 'CANCELLED BY CUSTOMER',
              voiceResponse: 'Order cancelled by customer from dashboard',
            }
          : o
      )
    );
    await cancelCustomerOrderInBackend(orderId, orderSnap);
  };

  const deleteOrder = async (orderId: string) => {
    setScheduledOrders((prev) => prev.filter((o) => o.orderId !== orderId));
    await deleteCustomerOrderInBackend(orderId);
  };

  const getCommentsForProduct = (productId: string): ProductCommentItem[] => {
    const deletedSet = getDeletedCommentIds();
    return productComments.filter(
      (c) =>
        c &&
        c.productId === productId &&
        !deletedSet.has(c.commentId)
    );
  };

  const addProductComment = async (input: {
    productId: string;
    productName: string;
    productImage?: string;
    authorName: string;
    rating: number;
    highlights?: string[];
    commentText: string;
  }): Promise<ProductCommentItem> => {
    const created = await createProductComment({
      ...input,
      userId: googleUser?.uid,
      authorEmail: googleUser?.email || undefined,
      authorPhotoURL: googleUser?.photoURL || null,
      isVerifiedBuyer: customerOrders.length > 0 || Boolean(googleUser?.email),
    });
    setProductComments((prev) => [
      created,
      ...prev.filter((c) => c.commentId !== created.commentId),
    ]);
    return created;
  };

  const markCommentHelpful = async (commentId: string) => {
    setProductComments((prev) =>
      prev.map((c) =>
        c.commentId === commentId
          ? { ...c, helpfulCount: (c.helpfulCount || 0) + 1 }
          : c
      )
    );
    await markProductCommentHelpful(commentId);
  };

  const deleteProductComment = async (commentId: string) => {
    setProductComments((prev) => prev.filter((c) => c.commentId !== commentId));
    await removeProductComment(commentId);
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
        isCustomerDashboardOpen,
        setIsCustomerDashboardOpen,
        customerDashboardTab,
        setCustomerDashboardTab,
        openCustomerDashboard,
        customerOrders,
        activeCategory,
        setActiveCategory,
        googleUser,
        needsGoogleAuth,
        isSigningInGoogle,
        handleGooglePopupSignIn,
        handleGoogleLogin,
        handleGoogleLogout,
        updateGoogleUserPhoto,
        scheduledOrders,
        refreshBackendOrders,
        addScheduledOrder,
        updateLocalOrderStatus,
        cancelOrder,
        deleteOrder,
        productComments,
        getCommentsForProduct,
        addProductComment,
        markCommentHelpful,
        deleteProductComment,
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
