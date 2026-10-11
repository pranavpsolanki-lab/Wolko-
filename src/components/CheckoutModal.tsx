import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ArrowRight,
  Truck,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  PhoneCall,
  UserCheck,
  AlertCircle,
  Loader2,
  LogOut,
  Mail,
} from 'lucide-react';
import { useShop, CartItem } from '../context/ShopContext';
import { BRAND_ASSETS } from '../data/products';
import { saveOrderToBackend, SheetOrderRow } from '../lib/googleSheets';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    clearCart,
    googleUser,
    needsGoogleAuth,
    isSigningInGoogle,
    handleGoogleLogin,
    handleGoogleLogout,
    addScheduledOrder,
  } = useShop();

  const [step, setStep] = useState<'google-auth' | 'details-form' | 'confirmed'>(
    'google-auth'
  );
  const [showGoogleAccountInput, setShowGoogleAccountInput] =
    useState<boolean>(false);
  const [googleSignupEmail, setGoogleSignupEmail] = useState<string>('');
  const [googleSignupName, setGoogleSignupName] = useState<string>('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '+91 ',
    address: '402, Gardenia Residency, 12th Main, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    paymentMethod: 'upi',
    deliveryNotes: 'Please ring bell upon delivery',
  });

  const [orderNumber, setOrderNumber] = useState('');
  const [placedCartSnapshot, setPlacedCartSnapshot] = useState<CartItem[]>([]);
  const [placedGrandTotal, setPlacedGrandTotal] = useState<number>(0);
  const [whatsappMessage, setWhatsappMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Sync step & prefill user info when Google user signs in
  useEffect(() => {
    if (!needsGoogleAuth && googleUser) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || googleUser.displayName || '',
        email: googleUser.email || prev.email || '',
      }));
      if (step === 'google-auth') {
        setStep('details-form');
      }
    } else if (needsGoogleAuth && step !== 'confirmed') {
      setStep('google-auth');
    }
  }, [needsGoogleAuth, googleUser, step]);

  if (!isCheckoutOpen) return null;

  const shippingCost = cartSubtotal >= 1999 ? 0 : 150;
  const currentGrandTotal = cartSubtotal + shippingCost;

  const handleGoogleAccountContinue = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCheckoutError(null);

    if (!showGoogleAccountInput) {
      setShowGoogleAccountInput(true);
      return;
    }

    const emailToUse = googleSignupEmail.trim();
    if (!emailToUse || !emailToUse.includes('@')) {
      setCheckoutError('Please enter your Google email address (e.g. yourname@gmail.com).');
      return;
    }

    try {
      const profile = await handleGoogleLogin(
        emailToUse,
        googleSignupName.trim() || undefined
      );
      if (profile) {
        setFormData((prev) => ({
          ...prev,
          fullName: prev.fullName || profile.displayName || '',
          email: profile.email || prev.email || '',
        }));
        setStep('details-form');
      }
    } catch (err: unknown) {
      setCheckoutError(
        err instanceof Error
          ? err.message
          : 'Google Sign-Up failed. Please check your email and try again.'
      );
    }
  };

  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setCheckoutError('Please enter both your Full Name and Phone Number.');
      return;
    }

    setIsPlacingOrder(true);

    const generatedOrderNum = `WOLKO-${Math.floor(
      10000 + Math.random() * 90000
    )}`;
    const itemsSnapshot = [...cart];
    const itemsSummaryForSheet = itemsSnapshot
      .map(
        (item) =>
          `${item.product.name} (${item.selectedColor || 'Standard'}) x${
            item.quantity
          }`
      )
      .join(', ');

    const timestampStr = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newOrderRow: SheetOrderRow = {
      orderId: generatedOrderNum,
      timestamp: timestampStr,
      customerName: formData.fullName.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || googleUser?.email || '',
      productsSummary: itemsSummaryForSheet,
      totalAmount: `${currentGrandTotal}`,
      paymentMethod: formData.paymentMethod.toUpperCase(),
      deliveryAddress: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pincode}`,
      orderStatus: 'PENDING_CONFIRMATION',
      aiCallStatus: 'SCHEDULED (5 MIN TIMER)',
      voiceResponse: 'Waiting for 5-Min AI Voice Call...',
    };

    try {
      // Automatically save order in Backend Google Sheets database & schedule 5-min AI Voice Call
      const savedOrder = await saveOrderToBackend(newOrderRow);

      setOrderNumber(generatedOrderNum);
      setPlacedCartSnapshot(itemsSnapshot);
      setPlacedGrandTotal(currentGrandTotal);

      const itemsListText = itemsSnapshot
        .map(
          (item, index) =>
            `${index + 1}. *${item.product.name}*\n   - Color/Variant: ${
              item.selectedColor || 'Standard'
            }\n   - Quantity: ${item.quantity} pc(s)\n   - Price: ₹${
              item.product.price
            } each (Total: ₹${(
              item.product.price * item.quantity
            ).toLocaleString('en-IN')})`
        )
        .join('\n\n');

      const orderMsg = `✨ *NEW WOLKO STORE ORDER PLACED* ✨
🪔 *Order ID:* ${generatedOrderNum}
📅 *Date:* ${timestampStr}

👤 *Customer Details:*
• Name: ${formData.fullName}
• Phone: ${formData.phone}
• Email: ${formData.email}

📍 *Delivery Address:*
${formData.address}
${formData.city}, ${formData.state} - ${formData.pincode}

🛍️ *Products Ordered (${itemsSnapshot.length} item(s)):*
${itemsListText}

💰 *Total Payable:* *₹${currentGrandTotal.toLocaleString('en-IN')}* (${formData.paymentMethod.toUpperCase()})`;

      setWhatsappMessage(orderMsg);

      // Start the 5-minute background AI Voice Call timer
      addScheduledOrder(savedOrder);

      setStep('confirmed');
      clearCart();
    } catch (err: unknown) {
      setCheckoutError(
        err instanceof Error
          ? err.message
          : 'Could not place order. Please try again.'
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleCopyOrder = () => {
    if (whatsappMessage) {
      navigator.clipboard.writeText(whatsappMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setCheckoutError(null);
    setShowGoogleAccountInput(false);
    setStep(needsGoogleAuth ? 'google-auth' : 'details-form');
  };

  const primaryWhatsappUrl = `https://wa.me/918237323043?text=${encodeURIComponent(
    whatsappMessage
  )}`;
  const secondaryWhatsappUrl = `https://wa.me/918591542015?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-[#24211E]/60 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#EAE2D8] overflow-hidden flex flex-col my-8">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#EAE2D8] bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[#EAE2D8]">
                <img
                  src={BRAND_ASSETS.logo}
                  alt="Wolko Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-editorial text-lg font-semibold text-[#24211E] uppercase tracking-wider">
                  Wolko Express Checkout
                </h3>
                <p className="text-[10px] text-[#8C827A] uppercase tracking-wider">
                  Handcrafted Studio · Secure Order Checkout
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-[#8C827A] hover:text-[#24211E] rounded-full hover:bg-[#F5EFEB]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress */}
          {step !== 'confirmed' && (
            <div className="px-6 py-3 bg-[#F5EFEB] border-b border-[#EAE2D8] flex items-center justify-center gap-6 text-xs font-medium">
              <span
                className={`flex items-center gap-1.5 ${
                  step === 'google-auth'
                    ? 'text-[#24211E] font-semibold'
                    : 'text-emerald-700'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                    step === 'google-auth'
                      ? 'bg-[#24211E] text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {step === 'google-auth' ? '1' : '✓'}
                </span>
                <span>1. Sign up with Google</span>
              </span>

              <span className="text-[#D9CFC4]">——</span>

              <span
                className={`flex items-center gap-1.5 ${
                  step === 'details-form'
                    ? 'text-[#24211E] font-semibold'
                    : 'text-[#8C827A]'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                    step === 'details-form'
                      ? 'bg-[#24211E] text-white'
                      : 'bg-[#D9CFC4] text-[#6B6158]'
                  }`}
                >
                  2
                </span>
                <span>2. Name, Phone & Delivery Details</span>
              </span>
            </div>
          )}

          {/* Content Body */}
          <div className="p-6 sm:p-8 overflow-y-auto max-h-[78vh]">
            {checkoutError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">{checkoutError}</div>
              </div>
            )}

            {/* STEP 1: SIGN UP WITH GOOGLE */}
            {step === 'google-auth' && (
              <div className="py-6 text-center max-w-md mx-auto space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#EAE2D8] shadow-sm mx-auto flex items-center justify-center">
                  <UserCheck className="w-8 h-8 text-[#C87D65]" />
                </div>

                <div>
                  <h4 className="font-editorial text-2xl sm:text-3xl text-[#24211E] font-medium">
                    Sign Up with Google to Order
                  </h4>
                  <p className="text-xs text-[#6B6158] font-light mt-2 leading-relaxed">
                    Sign in with your Google account to proceed to the customer
                    details form and complete your order.
                  </p>
                </div>

                {!showGoogleAccountInput ? (
                  <div className="pt-2 flex flex-col items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowGoogleAccountInput(true)}
                      disabled={isSigningInGoogle}
                      className="gsi-material-button"
                    >
                      <div className="gsi-material-button-state"></div>
                      <div className="gsi-material-button-content-wrapper">
                        <div className="gsi-material-button-icon">
                          <svg
                            version="1.1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 48 48"
                            style={{ display: 'block' }}
                          >
                            <path
                              fill="#EA4335"
                              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                            ></path>
                            <path
                              fill="#4285F4"
                              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                            ></path>
                            <path
                              fill="#FBBC05"
                              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                            ></path>
                            <path
                              fill="#34A853"
                              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                            ></path>
                          </svg>
                        </div>
                        <span className="gsi-material-button-contents">
                          Sign in with Google
                        </span>
                      </div>
                    </button>
                    <span className="text-[11px] text-[#8C827A]">
                      Fast, secure customer verification for order updates
                    </span>
                  </div>
                ) : (
                  <form
                    onSubmit={handleGoogleAccountContinue}
                    className="p-5 rounded-2xl bg-white border border-[#EAE2D8] shadow-md text-left space-y-4 animate-in fade-in zoom-in-95"
                  >
                    <div className="flex items-center gap-2.5 pb-2 border-b border-[#F0EBE4]">
                      <svg
                        className="w-5 h-5 shrink-0"
                        viewBox="0 0 48 48"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                      </svg>
                      <div>
                        <div className="text-xs font-semibold text-[#24211E]">
                          Continue with Google Account
                        </div>
                        <div className="text-[10px] text-[#8C827A]">
                          Enter your Google email to link your order
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#24211E] mb-1">
                        Google Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          autoFocus
                          placeholder="yourname@gmail.com"
                          value={googleSignupEmail}
                          onChange={(e) => setGoogleSignupEmail(e.target.value)}
                          className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E] focus:outline-none focus:border-[#24211E] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#24211E] mb-1">
                        Your Name (Optional — can edit in next step)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Krish Solanki"
                        value={googleSignupName}
                        onChange={(e) => setGoogleSignupName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-[#D9CFC4] bg-[#FAF8F5] text-xs text-[#24211E] focus:outline-none focus:border-[#24211E] focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSigningInGoogle}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#24211E] hover:bg-[#3A3530] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      {isSigningInGoogle ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Signing in with Google...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue with Google</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* STEP 2: CUSTOMER NAME & PHONE NUMBER FORM + DELIVERY DETAILS */}
            {step === 'details-form' && (
              <form onSubmit={handlePlaceOrderSubmit} className="space-y-4">
                {/* Connected Google Profile Bar */}
                {googleUser && (
                  <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                        {(googleUser.displayName || googleUser.email || 'G')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-950 flex items-center gap-1.5">
                          <span>Signed in with Google</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          {googleUser.email}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      className="text-[11px] text-emerald-800 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-white/60 transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Switch</span>
                    </button>
                  </div>
                )}

                {/* Customer Name & Phone Number Form */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/50 border-2 border-[#C87D65]/40 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-[#C87D65]" />
                    <h4 className="font-editorial text-lg font-semibold text-[#24211E]">
                      Your Name & Phone Number
                    </h4>
                  </div>

                  <p className="text-[11px] text-[#6B6158] leading-relaxed">
                    Please enter your <strong>Full Name</strong> and active{' '}
                    <strong>Phone Number</strong> so we can confirm your order on
                    call before dispatch.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-[#24211E] mb-1">
                        Full Name (आपका नाम) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Krish Solanki"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#C87D65]/60 bg-white text-[#24211E] text-xs font-medium focus:outline-none focus:border-[#24211E] focus:ring-1 focus:ring-[#24211E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#24211E] mb-1">
                        Phone Number (फ़ोन नंबर) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 98765 43210"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#C87D65]/60 bg-white text-[#24211E] text-xs font-mono font-medium focus:outline-none focus:border-[#24211E] focus:ring-1 focus:ring-[#24211E]"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery & Payment Details */}
                <div className="flex items-center justify-between border-b border-[#EAE2D8] pb-2 pt-2">
                  <h4 className="font-editorial text-lg text-[#24211E] font-medium">
                    Delivery Address & Payment Mode
                  </h4>
                  <span className="text-xs text-[#7B8A78] flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Free Shipping on ₹1,999+</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#574E45] mb-1">
                      Street Address & Landmark *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D9CFC4] bg-white text-[#24211E] text-xs focus:outline-none focus:border-[#24211E]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#574E45] mb-1">
                      Google Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D9CFC4] bg-white text-[#24211E] text-xs focus:outline-none focus:border-[#24211E]"
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
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D9CFC4] bg-white text-[#24211E] text-xs focus:outline-none focus:border-[#24211E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#574E45] mb-1">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D9CFC4] bg-white text-[#24211E] text-xs focus:outline-none focus:border-[#24211E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#574E45] mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData({ ...formData, pincode: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-xl border border-[#D9CFC4] bg-white text-[#24211E] text-xs focus:outline-none focus:border-[#24211E]"
                    />
                  </div>
                </div>

                {/* Payment Mode */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 text-xs ${
                      formData.paymentMethod === 'upi'
                        ? 'border-[#24211E] bg-white font-semibold'
                        : 'border-[#EAE2D8] bg-[#FAF8F5]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={formData.paymentMethod === 'upi'}
                      onChange={() =>
                        setFormData({ ...formData, paymentMethod: 'upi' })
                      }
                      className="accent-[#24211E]"
                    />
                    <span>Instant UPI (GPay / PhonePe)</span>
                  </label>
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 text-xs ${
                      formData.paymentMethod === 'cod'
                        ? 'border-[#24211E] bg-white font-semibold'
                        : 'border-[#EAE2D8] bg-[#FAF8F5]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={formData.paymentMethod === 'cod'}
                      onChange={() =>
                        setFormData({ ...formData, paymentMethod: 'cod' })
                      }
                      className="accent-[#24211E]"
                    />
                    <span>Cash on Delivery (COD)</span>
                  </label>
                </div>

                {/* Order Total Bar */}
                <div className="p-3.5 bg-white rounded-xl border border-[#EAE2D8] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#6B6158]">
                      Total Payable ({cart.length} item(s)):
                    </span>
                    <span className="ml-2 font-mono text-base font-bold text-[#24211E]">
                      ₹{currentGrandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={isPlacingOrder}
                    className="py-3 px-6 bg-[#24211E] hover:bg-[#3A3530] text-white text-xs uppercase tracking-widest font-semibold rounded-full flex items-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-60"
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Placing Order...</span>
                      </>
                    ) : (
                      <>
                        <span>Place Order</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: ORDER CONFIRMED */}
            {step === 'confirmed' && (
              <div className="text-center py-3 space-y-5">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200 shadow-xs">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-emerald-700 font-semibold mb-1">
                    Order Received Successfully
                  </div>
                  <h3 className="font-editorial text-2xl sm:text-3xl text-[#24211E]">
                    Thank You, {formData.fullName}
                  </h3>
                  <p className="font-mono text-sm font-bold text-[#C87D65] mt-0.5">
                    {orderNumber}
                  </p>
                  <p className="text-xs text-[#6B6158] max-w-md mx-auto mt-2 leading-relaxed">
                    We have registered your order for{' '}
                    <strong>{formData.phone}</strong>. You will receive an
                    automated confirmation call within 5 minutes to verify your
                    order before dispatch.
                  </p>
                </div>

                {/* Ordered Items Summary */}
                <div className="p-4 bg-white rounded-xl border border-[#EAE2D8] max-w-lg mx-auto text-left text-xs space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE4] font-medium text-[#24211E]">
                    <span>Ordered Pieces ({placedCartSnapshot.length})</span>
                    <span className="font-mono font-bold">
                      ₹{placedGrandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {placedCartSnapshot.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[#574E45] py-1"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={item.variantImage || item.product.primaryImage}
                          alt={item.product.name}
                          className="w-8 h-8 rounded-md object-cover border border-[#EAE2D8]"
                        />
                        <div>
                          <p className="font-medium text-[#24211E] text-xs leading-none">
                            {item.product.name}
                          </p>
                          <span className="text-[10px] text-[#8C827A]">
                            Variant: {item.selectedColor} × {item.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-medium text-[#24211E]">
                        ₹
                        {(item.product.price * item.quantity).toLocaleString(
                          'en-IN'
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Optional WhatsApp Receipt */}
                <div className="p-4 bg-[#25D366]/10 rounded-2xl border border-[#25D366]/30 max-w-lg mx-auto text-left space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-[#128C7E]" />
                      <span className="text-xs font-semibold text-[#24211E]">
                        Share Order Receipt on WhatsApp
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyOrder}
                      className="text-[11px] flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#EAE2D8] text-[#24211E]"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href={primaryWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <span>WhatsApp (+91 82373 23043)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={secondaryWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 bg-[#24211E] hover:bg-[#3A3530] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <span>Backup (+91 85915 42015)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="py-2.5 px-8 border border-[#24211E] text-[#24211E] hover:bg-[#24211E] hover:text-white text-xs uppercase tracking-widest font-medium rounded-full transition-colors"
                >
                  Continue Exploring Wolko
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
