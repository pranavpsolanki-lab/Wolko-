import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  User,
  Package,
  MapPin,
  Heart,
  LogOut,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  ShoppingBag,
  Save,
  RefreshCw,
  ArrowRight,
  Phone,
  Mail,
  XCircle,
  Trash2,
  Camera,
  Loader2,
} from 'lucide-react';
import { useShop, CustomerDashboardTab } from '../context/ShopContext';
import { UserAvatar } from './UserAvatar';
import {
  computeOrderTrackingDetails,
  getSavedCustomerAddressProfile,
  saveCustomerAddressProfile,
  syncCustomerAddressProfileFromFirestore,
} from '../lib/googleSheets';

export const CustomerDashboardModal: React.FC = () => {
  const {
    isCustomerDashboardOpen,
    setIsCustomerDashboardOpen,
    customerDashboardTab,
    setCustomerDashboardTab,
    customerOrders,
    refreshBackendOrders,
    googleUser,
    isSigningInGoogle,
    handleGooglePopupSignIn,
    handleGoogleLogin,
    handleGoogleLogout,
    updateGoogleUserPhoto,
    cancelOrder,
    deleteOrder,
    wishlist,
    setIsWishlistOpen,
  } = useShop();

  // Saved Profile & Address form state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  // Order Cancel & Delete state
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(
    null
  );
  const [processingAction, setProcessingAction] = useState<
    'cancel' | 'delete' | null
  >(null);
  const [orderActionNotice, setOrderActionNotice] = useState<string | null>(
    null
  );

  // Instant Google email sign-in fallback if not signed in
  const [fallbackEmail, setFallbackEmail] = useState('');
  const [fallbackName, setFallbackName] = useState('');
  const [showEmailSignIn, setShowEmailSignIn] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isCustomerDashboardOpen) return;

    const localSaved = getSavedCustomerAddressProfile();
    const latestOrder = customerOrders[0];

    setCustomerName(
      localSaved?.customerName ||
        googleUser?.displayName ||
        latestOrder?.customerName ||
        ''
    );
    setPhone(localSaved?.phone || latestOrder?.phone || '');
    setEmail(
      localSaved?.email || googleUser?.email || latestOrder?.email || ''
    );
    setAddress(
      localSaved?.address ||
        latestOrder?.address ||
        latestOrder?.deliveryAddress ||
        ''
    );
    setLandmark(localSaved?.landmark || latestOrder?.landmark || '');
    setCity(localSaved?.city || latestOrder?.city || '');
    setState(localSaved?.state || latestOrder?.state || '');
    setPincode(localSaved?.pincode || latestOrder?.pincode || '');
    setDeliveryNotes(
      localSaved?.deliveryNotes || latestOrder?.deliveryNotes || ''
    );

    syncCustomerAddressProfileFromFirestore()
      .then((remote) => {
        if (remote) {
          if (remote.customerName) setCustomerName(remote.customerName);
          if (remote.phone) setPhone(remote.phone);
          if (remote.email) setEmail(remote.email);
          if (remote.address) setAddress(remote.address);
          if (remote.landmark) setLandmark(remote.landmark);
          if (remote.city) setCity(remote.city);
          if (remote.state) setState(remote.state);
          if (remote.pincode) setPincode(remote.pincode);
        }
      })
      .catch(() => {});
  }, [isCustomerDashboardOpen, googleUser, customerOrders]);

  // Compute live KPI summary for the customer's orders
  const orderStats = useMemo(() => {
    const enriched = customerOrders.map((order) => ({
      order,
      tracking: computeOrderTrackingDetails(order),
    }));

    const totalOrders = enriched.length;
    const inProgressOrders = enriched.filter(
      (item) => item.tracking.isInProgress
    );
    const deliveredOrders = enriched.filter(
      (item) => item.tracking.isDelivered
    );
    const cancelledOrders = enriched.filter(
      (item) => item.tracking.isCancelled
    );

    const totalSpent = enriched
      .filter((item) => !item.tracking.isCancelled)
      .reduce((sum, item) => {
        const cleaned = String(item.order.totalAmount || '0').replace(
          /[^\d.]/g,
          ''
        );
        const num = parseFloat(cleaned);
        return sum + (Number.isNaN(num) ? 0 : num);
      }, 0);

    // Next arriving active order ("kon sa order kab aane wala h")
    const nextArriving = inProgressOrders[0] || null;

    return {
      enriched,
      totalOrders,
      inProgressCount: inProgressOrders.length,
      deliveredCount: deliveredOrders.length,
      cancelledCount: cancelledOrders.length,
      totalSpent,
      nextArriving,
    };
  }, [customerOrders]);

  if (!isCustomerDashboardOpen) return null;

  const handleRefreshClick = async () => {
    setIsRefreshingOrders(true);
    await refreshBackendOrders();
    setTimeout(() => setIsRefreshingOrders(false), 350);
  };

  const handleCancelOrderClick = async (orderId: string) => {
    if (processingOrderId) return;
    setProcessingOrderId(orderId);
    setProcessingAction('cancel');
    setOrderActionNotice(null);
    try {
      await cancelOrder(orderId);
      setOrderActionNotice(`Order #${orderId} has been cancelled.`);
      setTimeout(() => setOrderActionNotice(null), 4000);
    } finally {
      setProcessingOrderId(null);
      setProcessingAction(null);
    }
  };

  const handleDeleteOrderClick = async (orderId: string) => {
    if (processingOrderId) return;
    setProcessingOrderId(orderId);
    setProcessingAction('delete');
    setOrderActionNotice(null);
    try {
      await deleteOrder(orderId);
      setOrderActionNotice(`Order #${orderId} was deleted from your account.`);
      setTimeout(() => setOrderActionNotice(null), 4000);
    } finally {
      setProcessingOrderId(null);
      setProcessingAction(null);
    }
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateGoogleUserPhoto(reader.result);
        setSaveSuccessMsg('Your profile photo has been updated.');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileOrAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setSaveSuccessMsg(null);
    try {
      await saveCustomerAddressProfile({
        customerName: customerName.trim(),
        phone: phone.trim(),
        email: email.trim() || googleUser?.email || '',
        address: address.trim(),
        landmark: landmark.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        deliveryNotes: deliveryNotes.trim(),
      });
      setSaveSuccessMsg('Your details have been saved for future orders.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenWishlistFromMenu = () => {
    setIsCustomerDashboardOpen(false);
    setIsWishlistOpen(true);
  };

  const handleGoogleSignInClick = async () => {
    try {
      await handleGooglePopupSignIn();
    } catch {
      setShowEmailSignIn(true);
    }
  };

  const handleFallbackSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallbackEmail.trim()) return;
    await handleGoogleLogin(fallbackEmail.trim(), fallbackName.trim());
    setShowEmailSignIn(false);
  };

  const navItems: {
    id: CustomerDashboardTab;
    label: string;
    icon: React.ReactNode;
    count?: number;
  }[] = [
    {
      id: 'profile',
      label: 'My Profile',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <Package className="w-4 h-4" />,
      count: orderStats.totalOrders,
    },
    {
      id: 'addresses',
      label: 'Saved Addresses',
      icon: <MapPin className="w-4 h-4" />,
    },
  ];

  const activeDisplayName =
    customerName || googleUser?.displayName || 'Customer';
  const activeEmail = googleUser?.email || email || '';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Your Account Dashboard"
    >
      {/* Backdrop */}
      <div
        onClick={() => setIsCustomerDashboardOpen(false)}
        className="fixed inset-0 bg-[#24211E]/60 backdrop-blur-xs transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-4xl bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#EAE2D8] overflow-hidden flex flex-col my-6">
          {/* Top Bar with Customer's Google Profile Picture */}
          <div className="px-6 py-4 bg-white border-b border-[#EAE2D8] flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <UserAvatar
                photoURL={googleUser?.photoURL}
                email={activeEmail}
                name={activeDisplayName}
                sizeClass="w-10 h-10"
                textClass="text-sm"
                showGoogleBadge={Boolean(googleUser || activeEmail)}
              />
              <div>
                <h2 className="font-editorial text-lg sm:text-xl font-semibold text-[#24211E] leading-tight">
                  Your Account
                </h2>
                <p className="text-xs text-[#8C827A]">
                  {activeEmail
                    ? `${activeDisplayName} · ${activeEmail}`
                    : 'Personal Order Tracking & Saved Address'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefreshClick}
                className="p-2 text-[#6B6158] hover:text-[#24211E] rounded-full hover:bg-[#F5EFEB] transition-colors cursor-pointer"
                title="Refresh order status"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isRefreshingOrders ? 'animate-spin' : ''
                  }`}
                />
              </button>
              <button
                type="button"
                onClick={() => setIsCustomerDashboardOpen(false)}
                className="p-2 text-[#6B6158] hover:text-[#24211E] rounded-full hover:bg-[#F5EFEB] transition-colors cursor-pointer"
                aria-label="Close dashboard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Dashboard Layout: Clean Sidebar + Content Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px] max-h-[82vh] overflow-y-auto">
            {/* Left Sidebar ("Your Account" Menu with only essential options) */}
            <aside className="md:col-span-4 lg:col-span-3 bg-white border-b md:border-b-0 md:border-r border-[#EAE2D8] p-4 flex flex-col justify-between">
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-[#8C827A]">
                  Account Menu
                </div>

                {navItems.map((item) => {
                  const isActive = customerDashboardTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCustomerDashboardTab(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#24211E] text-[#FAF8F5]'
                          : 'text-[#24211E] hover:bg-[#F5EFEB]'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </span>
                      {typeof item.count === 'number' && item.count > 0 && (
                        <span
                          className={`font-mono text-[11px] tabular-nums ${
                            isActive ? 'text-[#E09F67]' : 'text-[#8C827A]'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Wishlist shortcut */}
                <button
                  type="button"
                  onClick={handleOpenWishlistFromMenu}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#24211E] hover:bg-[#F5EFEB] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <Heart className="w-4 h-4" />
                    <span>Wishlist</span>
                  </span>
                  {wishlist.length > 0 && (
                    <span className="font-mono text-[11px] text-[#8C827A] tabular-nums">
                      {wishlist.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Logout at bottom */}
              {googleUser && (
                <div className="pt-4 mt-4 border-t border-[#EAE2D8]">
                  <button
                    type="button"
                    onClick={handleGoogleLogout}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </aside>

            {/* Right Content Area */}
            <div className="md:col-span-8 lg:col-span-9 p-5 sm:p-6 space-y-6 overflow-y-auto">
              {/* Top Live Summary Strip: Total Orders, In Progress, & When Next Order Arrives */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-white border border-[#EAE2D8]">
                  <div className="text-[11px] text-[#8C827A]">
                    Total Orders Placed
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-semibold text-[#24211E] tabular-nums">
                      {orderStats.totalOrders}
                    </span>
                    <span className="text-xs text-[#6B6158] font-mono tabular-nums">
                      ₹{orderStats.totalSpent.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#EAE2D8]">
                  <div className="text-[11px] text-[#8C827A]">
                    Orders In Progress
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-semibold text-[#C87D65] tabular-nums">
                      {orderStats.inProgressCount}
                    </span>
                    <span className="text-xs text-[#6B6158]">
                      {orderStats.deliveredCount} Delivered
                      {orderStats.cancelledCount > 0
                        ? ` · ${orderStats.cancelledCount} Cancelled`
                        : ''}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#EAE2D8]">
                  <div className="text-[11px] text-[#8C827A]">
                    Next Order Arrival
                  </div>
                  {orderStats.nextArriving ? (
                    <div className="mt-1">
                      <div className="text-xs font-semibold text-[#24211E] truncate">
                        {
                          orderStats.nextArriving.tracking
                            .estimatedDeliveryDateFormatted
                        }
                      </div>
                      <div className="text-[11px] text-[#7B8A78] font-medium mt-0.5">
                        #{orderStats.nextArriving.order.orderId} ·{' '}
                        {orderStats.nextArriving.tracking.arrivalCountdownLabel}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-[#8C827A]">
                      No active deliveries
                    </div>
                  )}
                </div>
              </div>

              {orderActionNotice && (
                <div className="px-4 py-2.5 rounded-xl bg-white border border-[#EAE2D8] text-xs font-medium text-[#24211E] flex items-center justify-between shadow-2xs">
                  <span>{orderActionNotice}</span>
                  <button
                    type="button"
                    onClick={() => setOrderActionNotice(null)}
                    className="text-[#8C827A] hover:text-[#24211E] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* ===============================================================
                  TAB: ORDERS & LIVE DELIVERY TRACKING
                 =============================================================== */}
              {customerDashboardTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-editorial text-lg font-semibold text-[#24211E]">
                        My Orders & Live Delivery Status
                      </h3>
                      <p className="text-xs text-[#8C827A]">
                        Real-time progress, expected delivery dates, and order
                        management
                      </p>
                    </div>
                  </div>

                  {orderStats.enriched.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white border border-[#EAE2D8] text-center space-y-3">
                      <div className="w-11 h-11 rounded-full bg-[#F5EFEB] text-[#6B6158] flex items-center justify-center mx-auto">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-editorial text-lg text-[#24211E] font-medium">
                          No orders placed yet
                        </h4>
                        <p className="text-xs text-[#8C827A] max-w-sm mx-auto">
                          Once you place an order, you can track its live
                          hand-crafting progress and exact delivery date right
                          here.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCustomerDashboardOpen(false)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#24211E] text-white text-xs font-semibold hover:bg-[#3A3530] transition-colors cursor-pointer"
                      >
                        <span>Explore Crochet Collection</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orderStats.enriched.map(({ order, tracking }) => {
                        const isThisOrderBusy =
                          processingOrderId === order.orderId;
                        return (
                          <div
                            key={order.orderId}
                            className={`p-5 rounded-2xl bg-white border space-y-4 transition-all ${
                              tracking.isCancelled
                                ? 'border-rose-200/80 bg-rose-50/10'
                                : 'border-[#EAE2D8]'
                            }`}
                          >
                            {/* Order Header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#EAE2D8]">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-sm font-bold text-[#24211E]">
                                    #{order.orderId}
                                  </span>
                                  <span className="text-[#8C827A]">·</span>
                                  <span className="text-xs text-[#6B6158]">
                                    Placed on {order.timestamp || 'Today'}
                                  </span>
                                  {tracking.isCancelled && (
                                    <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[11px] font-semibold">
                                      Cancelled
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#24211E] font-medium mt-1">
                                  {order.productsSummary}
                                </div>
                              </div>

                              <div className="text-right">
                                <div
                                  className={`font-mono text-base font-semibold tabular-nums ${
                                    tracking.isCancelled
                                      ? 'line-through text-[#8C827A]'
                                      : 'text-[#24211E]'
                                  }`}
                                >
                                  ₹
                                  {Number(
                                    String(order.totalAmount || '0').replace(
                                      /[^\d.]/g,
                                      ''
                                    ) || 0
                                  ).toLocaleString('en-IN')}
                                </div>
                                <div className="text-[11px] text-[#8C827A]">
                                  {order.paymentMethod || 'COD'}
                                </div>
                              </div>
                            </div>

                            {/* Expected Delivery Date ("Kab Aane Wala Hai") & Current Status */}
                            {tracking.isCancelled ? (
                              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                  <div>
                                    <div className="text-xs font-semibold text-rose-900">
                                      Order Cancelled
                                    </div>
                                    <div className="text-[11px] text-rose-700">
                                      This order has been cancelled and will not
                                      be dispatched.
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <Calendar className="w-4 h-4 text-[#C87D65] shrink-0" />
                                  <div>
                                    <div className="text-[11px] text-[#8C827A]">
                                      Expected Delivery Date
                                    </div>
                                    <div className="text-xs sm:text-sm font-semibold text-[#24211E]">
                                      {tracking.estimatedDeliveryDateFormatted}{' '}
                                      <span className="text-[#7B8A78] font-normal">
                                        ({tracking.arrivalCountdownLabel})
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs font-medium text-[#24211E]">
                                  {tracking.isDelivered ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-[#C87D65]" />
                                  )}
                                  <span>{tracking.stageLabel}</span>
                                </div>
                              </div>
                            )}

                            {/* 4-Stage Visual Progress Bar */}
                            {!tracking.isCancelled && (
                              <div className="space-y-2">
                                <div className="w-full h-1.5 bg-[#EAE2D8] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-[#24211E] rounded-full transition-all duration-500"
                                    style={{
                                      width: `${tracking.progressPercent}%`,
                                    }}
                                  />
                                </div>
                                <div className="grid grid-cols-4 text-[11px] text-[#8C827A]">
                                  <div
                                    className={
                                      tracking.stageIndex >= 1
                                        ? 'font-semibold text-[#24211E]'
                                        : ''
                                    }
                                  >
                                    1. Confirmed
                                  </div>
                                  <div
                                    className={`text-center ${
                                      tracking.stageIndex >= 2
                                        ? 'font-semibold text-[#24211E]'
                                        : ''
                                    }`}
                                  >
                                    2. Hand-Crafting
                                  </div>
                                  <div
                                    className={`text-center ${
                                      tracking.stageIndex >= 3
                                        ? 'font-semibold text-[#24211E]'
                                        : ''
                                    }`}
                                  >
                                    3. Shipped
                                  </div>
                                  <div
                                    className={`text-right ${
                                      tracking.stageIndex >= 4
                                        ? 'font-semibold text-emerald-800'
                                        : ''
                                    }`}
                                  >
                                    4. Delivered
                                  </div>
                                </div>
                                <p className="text-[11px] text-[#6B6158]">
                                  {tracking.stageDescription}
                                </p>
                              </div>
                            )}

                            {/* Delivery Address & Order Cancel / Delete Actions */}
                            <div className="pt-3 border-t border-[#EAE2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[#6B6158]">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Truck className="w-3.5 h-3.5 text-[#8C827A] shrink-0" />
                                <span className="truncate">
                                  Delivering to:{' '}
                                  <strong className="text-[#24211E] font-medium">
                                    {order.customerName}
                                  </strong>
                                  , {order.deliveryAddress} ({order.phone})
                                </span>
                              </div>

                              {/* Cancel Order & Delete Order Buttons */}
                              <div className="flex items-center gap-2 shrink-0">
                                {!tracking.isCancelled &&
                                  !tracking.isDelivered && (
                                    <button
                                      type="button"
                                      disabled={isThisOrderBusy}
                                      onClick={() =>
                                        handleCancelOrderClick(order.orderId)
                                      }
                                      className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      {isThisOrderBusy &&
                                      processingAction === 'cancel' ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <XCircle className="w-3.5 h-3.5 text-amber-700" />
                                      )}
                                      <span>Cancel Order</span>
                                    </button>
                                  )}

                                <button
                                  type="button"
                                  disabled={isThisOrderBusy}
                                  onClick={() =>
                                    handleDeleteOrderClick(order.orderId)
                                  }
                                  className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                                  title="Delete this order from your history"
                                >
                                  {isThisOrderBusy &&
                                  processingAction === 'delete' ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>Delete Order</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ===============================================================
                  TAB: MY PROFILE (With Google Account Profile Picture)
                 =============================================================== */}
              {customerDashboardTab === 'profile' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-editorial text-lg font-semibold text-[#24211E]">
                      My Profile
                    </h3>
                    <p className="text-xs text-[#8C827A]">
                      Your Google account profile picture and contact details
                    </p>
                  </div>

                  {/* Google Profile Picture & Account Card */}
                  <div className="p-5 rounded-2xl bg-white border border-[#EAE2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        photoURL={googleUser?.photoURL}
                        email={activeEmail}
                        name={activeDisplayName}
                        sizeClass="w-16 h-16"
                        textClass="text-xl"
                        showGoogleBadge={true}
                      />
                      <div>
                        <div className="text-base font-semibold text-[#24211E]">
                          {activeDisplayName}
                        </div>
                        <div className="text-xs text-[#8C827A]">
                          {activeEmail || 'Not signed in with Google yet'}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoFileChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg border border-[#D9CFC4] bg-[#FAF8F5] hover:bg-[#F5EFEB] text-[11px] font-medium text-[#24211E] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Camera className="w-3 h-3 text-[#C87D65]" />
                            <span>Update Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleGoogleSignInClick}
                            disabled={isSigningInGoogle}
                            className="px-2.5 py-1 rounded-lg border border-[#D9CFC4] bg-white hover:bg-[#F5EFEB] text-[11px] font-medium text-[#24211E] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${
                                isSigningInGoogle ? 'animate-spin' : ''
                              }`}
                            />
                            <span>Sync Google Profile</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!googleUser ? (
                    <div className="p-6 rounded-2xl bg-white border border-[#EAE2D8] space-y-4">
                      <p className="text-xs text-[#6B6158]">
                        Sign in once with your Google account so we can keep
                        your Google profile photo, orders, and delivery address
                        synced across sessions.
                      </p>
                      <button
                        type="button"
                        onClick={handleGoogleSignInClick}
                        disabled={isSigningInGoogle}
                        className="py-3 px-5 rounded-xl bg-[#24211E] hover:bg-[#3A3530] text-white text-xs font-semibold flex items-center gap-2.5 cursor-pointer"
                      >
                        <span>Continue with Google</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {showEmailSignIn && (
                        <form
                          onSubmit={handleFallbackSignInSubmit}
                          className="pt-3 border-t border-[#EAE2D8] space-y-3"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                              type="text"
                              required
                              value={fallbackName}
                              onChange={(e) => setFallbackName(e.target.value)}
                              placeholder="Your Full Name"
                              className="px-3.5 py-2.5 rounded-xl border border-[#D9CFC4] text-xs"
                            />
                            <input
                              type="email"
                              required
                              value={fallbackEmail}
                              onChange={(e) => setFallbackEmail(e.target.value)}
                              placeholder="yourname@gmail.com"
                              className="px-3.5 py-2.5 rounded-xl border border-[#D9CFC4] text-xs"
                            />
                          </div>
                          <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-[#24211E] text-white text-xs font-semibold cursor-pointer"
                          >
                            Save Account
                          </button>
                        </form>
                      )}
                    </div>
                  ) : null}

                  <form
                    onSubmit={handleSaveProfileOrAddress}
                    className="p-5 rounded-2xl bg-white border border-[#EAE2D8] space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#24211E] mb-1">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Your full name"
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E] focus:outline-none focus:border-[#24211E]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#24211E] mb-1">
                          Google Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="yourname@gmail.com"
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E] focus:outline-none focus:border-[#24211E]"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-[#24211E] mb-1">
                          Phone / WhatsApp Number
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="10-digit mobile number"
                            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E] font-mono focus:outline-none focus:border-[#24211E]"
                          />
                        </div>
                      </div>
                    </div>

                    {saveSuccessMsg && (
                      <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg">
                        {saveSuccessMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="py-2.5 px-5 rounded-xl bg-[#24211E] hover:bg-[#3A3530] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>
                        {isSavingProfile ? 'Saving...' : 'Save Profile'}
                      </span>
                    </button>
                  </form>
                </div>
              )}

              {/* ===============================================================
                  TAB: SAVED ADDRESSES
                 =============================================================== */}
              {customerDashboardTab === 'addresses' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-editorial text-lg font-semibold text-[#24211E]">
                      Saved Delivery Address
                    </h3>
                    <p className="text-xs text-[#8C827A]">
                      This address is automatically pre-filled whenever you
                      place an order
                    </p>
                  </div>

                  <form
                    onSubmit={handleSaveProfileOrAddress}
                    className="p-5 rounded-2xl bg-white border border-[#EAE2D8] space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-medium text-[#24211E] mb-1">
                          Recipient Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#24211E] mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E] font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#24211E] mb-1">
                        House / Flat No., Building & Street *
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Flat / House No., Building, Street, Area"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#574E45] mb-1">
                        Landmark (Optional)
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="Near Metro, Temple, Park"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[#574E45] mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="City"
                          className="w-full px-3 py-2 rounded-xl border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#574E45] mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          placeholder="State"
                          className="w-full px-3 py-2 rounded-xl border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#574E45] mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          required
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          placeholder="400001"
                          className="w-full px-3 py-2 rounded-xl border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E] font-mono"
                        />
                      </div>
                    </div>

                    {saveSuccessMsg && (
                      <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg">
                        {saveSuccessMsg}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="py-2.5 px-5 rounded-xl bg-[#24211E] hover:bg-[#3A3530] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>
                        {isSavingProfile ? 'Saving...' : 'Save Address'}
                      </span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
