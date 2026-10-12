import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ArrowRight,
  Truck,
  UserCheck,
  AlertCircle,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  CreditCard,
  Banknote,
  Package,
  Calendar,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { UserAvatar } from './UserAvatar';
import {
  saveOrderToBackend,
  getSavedGoogleUser,
  getSavedCustomerAddressProfile,
  syncCustomerAddressProfileFromFirestore,
  computeOrderTrackingDetails,
  SheetOrderRow,
  STORE_WHATSAPP_NUMBER,
} from '../lib/googleSheets';

const STUDIO_UPI_ID = 'wolkohandcrafted@upi';

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    isCheckoutOpen,
    setIsCheckoutOpen,
    clearCart,
    googleUser,
    isSigningInGoogle,
    handleGooglePopupSignIn,
    handleGoogleLogin,
    addScheduledOrder,
    openCustomerDashboard,
  } = useShop();

  const [step, setStep] = useState<
    'google-auth' | 'details-form' | 'confirmed'
  >('google-auth');
  const [orderNumber, setOrderNumber] = useState('');
  const [placedOrderSnapshot, setPlacedOrderSnapshot] =
    useState<SheetOrderRow | null>(null);

  // Instant Google Sign-In Fallback inputs (if popup is blocked in iframe)
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Customer Details & Complete Address Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState<'COD' | 'UPI'>('COD');

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Pre-fill customer details from saved profile + Google user
  useEffect(() => {
    const activeUser = googleUser || getSavedGoogleUser();
    const savedProfile = getSavedCustomerAddressProfile();

    if (savedProfile) {
      if (savedProfile.customerName) setFullName(savedProfile.customerName);
      if (savedProfile.phone) setPhone(savedProfile.phone);
      if (savedProfile.email) setEmail(savedProfile.email);
      if (savedProfile.address) setAddress(savedProfile.address);
      if (savedProfile.landmark) setLandmark(savedProfile.landmark);
      if (savedProfile.city) setCity(savedProfile.city);
      if (savedProfile.state) setState(savedProfile.state);
      if (savedProfile.pincode) setPincode(savedProfile.pincode);
      if (savedProfile.deliveryNotes)
        setDeliveryNotes(savedProfile.deliveryNotes);
    }

    if (activeUser) {
      if (activeUser.displayName && !fullName) {
        setFullName(activeUser.displayName);
      }
      if (activeUser.email && !email) {
        setEmail(activeUser.email);
      }
    }
  }, [googleUser]);

  // Whenever Checkout Modal opens, skip Google Sign-Up if user is already signed in
  useEffect(() => {
    if (!isCheckoutOpen) return;

    const activeUser = googleUser || getSavedGoogleUser();
    if (activeUser && activeUser.email) {
      setStep('details-form');
      if (activeUser.displayName && !fullName) {
        setFullName(activeUser.displayName);
      }
      if (activeUser.email && !email) {
        setEmail(activeUser.email);
      }
      // Also pull latest saved address from Firestore in background
      syncCustomerAddressProfileFromFirestore()
        .then((remoteProfile) => {
          if (remoteProfile) {
            setFullName((prev) => prev || remoteProfile.customerName || '');
            setPhone((prev) => prev || remoteProfile.phone || '');
            setEmail((prev) => prev || remoteProfile.email || '');
            setAddress((prev) => prev || remoteProfile.address || '');
            setLandmark((prev) => prev || remoteProfile.landmark || '');
            setCity((prev) => prev || remoteProfile.city || '');
            setState((prev) => prev || remoteProfile.state || '');
            setPincode((prev) => prev || remoteProfile.pincode || '');
          }
        })
        .catch(() => {});
    } else {
      setStep('google-auth');
    }
  }, [isCheckoutOpen, googleUser]);

  if (!isCheckoutOpen) return null;

  const shippingCost = cartSubtotal >= 1999 ? 0 : 150;
  const grandTotal = cartSubtotal + shippingCost;

  const buildOrderSummaryText = () => {
    return cart
      .map(
        (item) =>
          `${item.product.name} (${item.selectedColor}${
            item.selectedSize ? `, ${item.selectedSize}` : ''
          }) x${item.quantity}`
      )
      .join(' | ');
  };

  const buildAutomatedWhatsAppMessage = (orderIdStr: string) => {
    const itemLines = cart.map(
      (item, idx) =>
        `${idx + 1}. *${item.product.name}* (${item.selectedColor}${
          item.selectedSize ? `, Size: ${item.selectedSize}` : ''
        }) × ${item.quantity} = *₹${(
          item.product.price * item.quantity
        ).toLocaleString('en-IN')}*`
    );

    const fullAddr = [
      address.trim(),
      landmark.trim() ? `Landmark: ${landmark.trim()}` : '',
      `${city.trim()}, ${state.trim()} - ${pincode.trim()}`,
    ]
      .filter(Boolean)
      .join(', ');

    return [
      `✨ *NEW WOLKO ORDER PLACED* ✨`,
      `🆔 *Order ID:* ${orderIdStr}`,
      `📅 *Date:* ${new Date().toLocaleString('en-IN')}`,
      ``,
      `👤 *Customer Details:*`,
      `• *Name:* ${fullName.trim()}`,
      `• *Phone / WhatsApp:* ${phone.trim()}`,
      `• *Google Email:* ${email.trim() || googleUser?.email || 'N/A'}`,
      ``,
      `📍 *Complete Delivery Address:*`,
      `• *Street / House:* ${address.trim()}`,
      landmark.trim() ? `• *Landmark:* ${landmark.trim()}` : null,
      `• *City / State:* ${city.trim()}, ${state.trim()}`,
      `• *Pincode:* ${pincode.trim()}`,
      deliveryNotes.trim() ? `• *Delivery Note:* ${deliveryNotes.trim()}` : null,
      ``,
      `🛍️ *Items Ordered:*`,
      ...itemLines,
      ``,
      `🚚 *Shipping:* ${
        shippingCost === 0 ? 'FREE Express Shipping' : `₹${shippingCost}`
      }`,
      `💰 *Total Amount:* *₹${grandTotal.toLocaleString('en-IN')}*`,
      `💳 *Payment Method:* *${
        paymentMode === 'COD'
          ? 'Cash on Delivery (COD)'
          : `UPI (${STUDIO_UPI_ID})`
      }*`,
      ``,
      `📦 *Full Address Line:* ${fullAddr}`,
    ]
      .filter((line) => line !== null)
      .join('\n');
  };

  // Handler 1: Real Firebase Google Sign-In Popup
  const onFirebaseGoogleSignInClick = async () => {
    setAuthError(null);
    try {
      const profile = await handleGooglePopupSignIn();
      if (profile) {
        if (profile.displayName) setFullName(profile.displayName);
        if (profile.email) setEmail(profile.email);
        setStep('details-form');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('popup-blocked') ||
        msg.includes('unauthorized-domain') ||
        msg.includes('operation-not-supported') ||
        msg.includes('cancelled-popup-request')
      ) {
        setShowEmailFallback(true);
        setAuthError(
          'Browser popup was restricted in preview mode. Enter your Google email below to continue.'
        );
      } else if (msg.includes('popup-closed-by-user')) {
        setShowEmailFallback(true);
      } else {
        setShowEmailFallback(true);
      }
    }
  };

  // Handler 2: Instant Google Account Verification Fallback
  const onGoogleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanEmail = googleEmailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid Google email address.');
      return;
    }

    const profile = await handleGoogleLogin(
      cleanEmail,
      googleNameInput.trim()
    );
    if (profile) {
      if (profile.displayName) setFullName(profile.displayName);
      if (profile.email) setEmail(profile.email);
      setStep('details-form');
    } else {
      setAuthError('Could not sign in. Please check your email and try again.');
    }
  };

  // Step 2: Submit Customer Details Form -> Save to Firestore + Automated Backend Dispatch -> Show Compact Thank You Popup
  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingOrder) return;

    setIsSubmittingOrder(true);
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const generatedOrderId = `WOLKO-${randomNum}`;
    setOrderNumber(generatedOrderId);

    const fullDeliveryAddress = [
      address.trim(),
      landmark.trim() ? `Near ${landmark.trim()}` : '',
      `${city.trim()}, ${state.trim()} - ${pincode.trim()}`,
    ]
      .filter(Boolean)
      .join(', ');

    const nowMs = Date.now();
    const deliveryDateFormatted = new Date(
      nowMs + 4 * 24 * 60 * 60 * 1000
    ).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const waMessageText = buildAutomatedWhatsAppMessage(generatedOrderId);

    const newOrderRow: SheetOrderRow = {
      orderId: generatedOrderId,
      userId: googleUser?.uid || '',
      timestamp: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      customerName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || googleUser?.email || '',
      address: address.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      deliveryNotes: deliveryNotes.trim(),
      productsSummary: buildOrderSummaryText(),
      totalAmount: String(grandTotal),
      paymentMethod: paymentMode,
      deliveryAddress: fullDeliveryAddress,
      whatsappSentTo: STORE_WHATSAPP_NUMBER,
      orderStatus: 'CONFIRMED ✅',
      aiCallStatus: 'AUTO-DISPATCHED TO WHATSAPP 8591542015',
      voiceResponse:
        'Order details automatically forwarded to studio WhatsApp.',
      createdAtMs: nowMs,
      scheduledCallAtMs: nowMs + 300 * 1000,
      callCompleted: false,
      estimatedDeliveryDate: deliveryDateFormatted,
    };

    try {
      const savedOrder = await saveOrderToBackend(newOrderRow, waMessageText);
      addScheduledOrder(savedOrder);
      setPlacedOrderSnapshot(savedOrder);
    } catch {
      addScheduledOrder(newOrderRow);
      setPlacedOrderSnapshot(newOrderRow);
    } finally {
      setIsSubmittingOrder(false);
      setStep('confirmed');
      clearCart();
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setTimeout(() => {
      const activeUser = googleUser || getSavedGoogleUser();
      setStep(activeUser ? 'details-form' : 'google-auth');
    }, 250);
  };

  const handleOpenDashboardFromThankYou = () => {
    setIsCheckoutOpen(false);
    openCustomerDashboard('orders');
  };

  const trackingInfo = placedOrderSnapshot
    ? computeOrderTrackingDetails(placedOrderSnapshot)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-[#24211E]/60 backdrop-blur-xs transition-opacity"
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div className="relative w-full max-w-xl bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#EAE2D8] overflow-hidden flex flex-col my-6">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#EAE2D8] bg-white flex items-center justify-between">
            <div>
              <h3 className="font-editorial text-lg sm:text-xl font-semibold text-[#24211E] tracking-tight">
                {step === 'confirmed'
                  ? 'Order Confirmed'
                  : 'Wolko Express Checkout'}
              </h3>
              <p className="text-xs text-[#8C827A]">
                {step === 'google-auth' &&
                  'Sign in once with Google to continue'}
                {step === 'details-form' &&
                  'Enter your delivery address to complete your order'}
                {step === 'confirmed' &&
                  `Thank you for shopping with Wolko Handcrafted`}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-[#8C827A] hover:text-[#24211E] rounded-full hover:bg-[#F5EFEB] transition-colors"
              aria-label="Close checkout"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 sm:p-7 overflow-y-auto max-h-[82vh]">
            {/* =================================================================
                STEP 1: GOOGLE SIGN-IN (Only shown if user has NEVER signed in)
               ================================================================= */}
            {step === 'google-auth' && (
              <div className="py-4 text-center max-w-md mx-auto space-y-5">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#EAE2D8] shadow-xs flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-editorial text-2xl text-[#24211E] font-medium">
                    Continue with Google
                  </h4>
                  <p className="text-xs text-[#6B6158] leading-relaxed">
                    Sign in once with your Google account to save your delivery
                    address and track your live order status anytime in your
                    Personal Dashboard.
                  </p>
                </div>

                {/* Order Preview */}
                <div className="p-3.5 rounded-xl bg-white border border-[#EAE2D8] text-left flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-[#8C827A]">
                      Order Total ({cart.reduce((a, b) => a + b.quantity, 0)}{' '}
                      items)
                    </div>
                    <div className="text-xs font-medium text-[#24211E] truncate max-w-[230px]">
                      {cart.map((c) => c.product.name).join(', ')}
                    </div>
                  </div>
                  <div className="font-mono text-base font-bold text-[#24211E] tabular-nums">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={onFirebaseGoogleSignInClick}
                    disabled={isSigningInGoogle}
                    className="w-full py-3.5 px-5 rounded-xl bg-white hover:bg-[#F5EFEB] text-[#24211E] border-2 border-[#24211E] text-xs font-semibold transition-all flex items-center justify-center gap-3 shadow-sm cursor-pointer disabled:opacity-60"
                  >
                    {isSigningInGoogle ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#C87D65]" />
                        <span>Signing in with Google...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        <span>Sign Up / Continue with Google</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {!showEmailFallback && (
                    <button
                      type="button"
                      onClick={() => setShowEmailFallback(true)}
                      className="text-[11px] text-[#6B6158] hover:text-[#24211E] underline cursor-pointer"
                    >
                      Or enter your Google email directly
                    </button>
                  )}
                </div>

                {showEmailFallback && (
                  <form
                    onSubmit={onGoogleFallbackSubmit}
                    className="p-4 rounded-xl bg-white border border-[#EAE2D8] text-left space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-medium text-[#24211E] mb-1">
                        Google Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={googleEmailInput}
                          onChange={(e) => setGoogleEmailInput(e.target.value)}
                          placeholder="yourname@gmail.com"
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E] focus:outline-none focus:border-[#24211E]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#24211E] mb-1">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={googleNameInput}
                        onChange={(e) => setGoogleNameInput(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E] focus:outline-none focus:border-[#24211E]"
                      />
                    </div>

                    {authError && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSigningInGoogle}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#24211E] hover:bg-[#3A3530] text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Address Form</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* =================================================================
                STEP 2: CUSTOMER DETAILS & DELIVERY ADDRESS FORM
               ================================================================= */}
            {step === 'details-form' && (
              <form onSubmit={handlePlaceOrderSubmit} className="space-y-4">
                {/* Connected Google Account Bar (No repeated login prompt) */}
                {googleUser && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#F5EFEB] border border-[#EAE2D8] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 text-[#24211E] min-w-0">
                      <UserAvatar
                        photoURL={googleUser.photoURL}
                        email={googleUser.email}
                        name={googleUser.displayName}
                        sizeClass="w-7 h-7"
                        textClass="text-xs"
                        showGoogleBadge={true}
                      />
                      <div className="min-w-0 truncate">
                        <span className="font-medium">
                          Signed in as {googleUser.displayName || googleUser.email}
                        </span>
                        <span className="text-[#8C827A] hidden sm:inline">
                          {' '}
                          · {googleUser.email}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#7B8A78] font-medium flex items-center gap-1 shrink-0">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  </div>
                )}

                {/* Customer Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#24211E] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CFC4] bg-white text-xs text-[#24211E] focus:outline-none focus:border-[#24211E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#24211E] mb-1">
                      Phone / WhatsApp Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#D9CFC4] bg-white text-xs text-[#24211E] font-mono focus:outline-none focus:border-[#24211E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Complete Delivery Address */}
                <div>
                  <label className="block text-xs font-medium text-[#24211E] mb-1">
                    Complete Delivery Address (House No., Building, Street) *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-[#8C827A] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Flat / House No., Building Name, Street, Area"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#D9CFC4] bg-white text-xs text-[#24211E] focus:outline-none focus:border-[#24211E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-[#574E45] mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near Metro, Park, Temple"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D9CFC4] bg-white text-xs text-[#24211E] focus:outline-none focus:border-[#24211E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#574E45] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D9CFC4] bg-white text-xs text-[#24211E] focus:outline-none focus:border-[#24211E]"
                    />
                  </div>
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
                      placeholder="Mumbai"
                      className="w-full px-3 py-2 rounded-xl border border-[#D9CFC4] bg-white text-xs text-[#24211E] focus:outline-none focus:border-[#24211E]"
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
                      placeholder="Maharashtra"
                      className="w-full px-3 py-2 rounded-xl border border-[#D9CFC4] bg-white text-xs text-[#24211E] focus:outline-none focus:border-[#24211E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#574E45] mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]{6}"
                      title="6-digit Indian Postal Pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="400001"
                      className="w-full px-3 py-2 rounded-xl border border-[#D9CFC4] bg-white text-xs text-[#24211E] font-mono focus:outline-none focus:border-[#24211E]"
                    />
                  </div>
                </div>

                {/* Delivery Notes (Optional) */}
                <div>
                  <label className="block text-xs font-medium text-[#574E45] mb-1">
                    Delivery Instructions / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="Gate code, preferred delivery time, or gift note"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#D9CFC4] bg-white text-xs text-[#24211E] focus:outline-none focus:border-[#24211E]"
                  />
                </div>

                {/* Payment Method */}
                <div className="pt-1">
                  <label className="block text-xs font-medium text-[#24211E] mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('COD')}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        paymentMode === 'COD'
                          ? 'bg-[#24211E] text-white border-[#24211E]'
                          : 'bg-white text-[#24211E] border-[#D9CFC4] hover:border-[#24211E]'
                      }`}
                    >
                      <Banknote
                        className={`w-4 h-4 shrink-0 ${
                          paymentMode === 'COD'
                            ? 'text-[#E09F67]'
                            : 'text-[#6B6158]'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-semibold">
                          Cash on Delivery
                        </div>
                        <div
                          className={`text-[10px] ${
                            paymentMode === 'COD'
                              ? 'text-white/75'
                              : 'text-[#8C827A]'
                          }`}
                        >
                          Pay at your doorstep
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('UPI')}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        paymentMode === 'UPI'
                          ? 'bg-[#24211E] text-white border-[#24211E]'
                          : 'bg-white text-[#24211E] border-[#D9CFC4] hover:border-[#24211E]'
                      }`}
                    >
                      <CreditCard
                        className={`w-4 h-4 shrink-0 ${
                          paymentMode === 'UPI'
                            ? 'text-[#E09F67]'
                            : 'text-[#6B6158]'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-semibold">Instant UPI</div>
                        <div
                          className={`text-[10px] ${
                            paymentMode === 'UPI'
                              ? 'text-white/75'
                              : 'text-[#8C827A]'
                          }`}
                        >
                          GPay, PhonePe, Paytm
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Order Summary & Submit CTA */}
                <div className="p-4 bg-white rounded-xl border border-[#EAE2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5 text-xs">
                    <div className="text-[#6B6158]">
                      Total Payable ({cart.reduce((a, b) => a + b.quantity, 0)}{' '}
                      items):{' '}
                      <strong className="font-mono text-base text-[#24211E] tabular-nums">
                        ₹{grandTotal.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    <div className="text-[11px] text-[#7B8A78] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        Free Express Delivery · Arrives in 4 Days
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="py-3.5 px-7 bg-[#24211E] hover:bg-[#3A3530] text-[#FAF8F5] text-xs uppercase tracking-wider font-semibold rounded-full transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <span>Place Order</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* =================================================================
                STEP 3: COMPACT "THANK YOU" CONFIRMATION POPUP (Form-sized, no manual WhatsApp click required)
               ================================================================= */}
            {step === 'confirmed' && (
              <div className="py-3 space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-editorial text-2xl sm:text-3xl text-[#24211E] font-medium">
                    Thank You, {fullName.split(' ')[0] || 'Valued Guest'}!
                  </h4>
                  <p className="text-xs text-[#6B6158] max-w-md mx-auto leading-relaxed">
                    Your order{' '}
                    <span className="font-mono font-semibold text-[#24211E]">
                      #{orderNumber}
                    </span>{' '}
                    has been placed and your details have been automatically
                    registered with our studio dispatch team.
                  </p>
                </div>

                {/* Live Delivery ETA & Progress Card */}
                <div className="p-4 rounded-xl bg-white border border-[#EAE2D8] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#C87D65]" />
                      <div>
                        <div className="text-[11px] text-[#8C827A]">
                          Expected Delivery Date
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-[#24211E]">
                          {trackingInfo?.estimatedDeliveryDateFormatted ||
                            'Within 4 Business Days'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                      {trackingInfo?.stageLabel || 'Order Confirmed'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-[#EAE2D8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#24211E] rounded-full transition-all duration-500"
                      style={{
                        width: `${trackingInfo?.progressPercent || 35}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-4 text-[10px] text-[#6B6158] pt-0.5">
                    <div className="font-semibold text-[#24211E]">
                      1. Confirmed
                    </div>
                    <div className="text-center font-medium text-[#24211E]">
                      2. Crafting
                    </div>
                    <div className="text-center">3. Shipped</div>
                    <div className="text-right">4. Delivered</div>
                  </div>
                </div>

                {/* Compact Order Details Summary */}
                <div className="p-4 rounded-xl bg-[#F5EFEB]/70 border border-[#EAE2D8] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B6158]">Order ID</span>
                    <span className="font-mono font-semibold text-[#24211E]">
                      #{orderNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6B6158]">Amount & Payment</span>
                    <span className="font-mono font-semibold text-[#24211E] tabular-nums">
                      ₹
                      {Number(
                        placedOrderSnapshot?.totalAmount || grandTotal
                      ).toLocaleString('en-IN')}{' '}
                      ({paymentMode})
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-4 pt-1 border-t border-[#EAE2D8]">
                    <span className="text-[#6B6158] shrink-0">Delivering To</span>
                    <span className="text-[#24211E] text-right font-medium">
                      {fullName}, {address}, {city}, {state} - {pincode}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenDashboardFromThankYou}
                    className="w-full py-3 px-4 bg-[#24211E] hover:bg-[#3A3530] text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Package className="w-4 h-4" />
                    <span>Track Order in My Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full py-3 px-4 bg-white hover:bg-[#F5EFEB] text-[#24211E] border border-[#D9CFC4] text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
