import {
  auth,
  googleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  deleteOrderFromFirestore,
  fetchUserOrdersFromFirestore,
  fetchCustomerProfileFromFirestore,
  saveCustomerProfileToFirestore,
  subscribeToUserOrdersInFirestore,
  saveProductCommentToFirestore,
  deleteProductCommentFromFirestore,
  subscribeToPublicCommentsInFirestore,
} from './firebase';

export const STORE_WHATSAPP_NUMBER = '918591542015';
export const STORE_WHATSAPP_DISPLAY = '+91 85915 42015';

export interface SheetOrderRow {
  orderId: string;
  userId?: string;
  timestamp: string;
  customerName: string;
  phone: string;
  email: string;
  address?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  deliveryNotes?: string;
  productsSummary: string;
  totalAmount: string;
  paymentMethod: string;
  deliveryAddress: string;
  whatsappSentTo?: string;
  orderStatus: string;
  aiCallStatus: string;
  voiceResponse: string;
  createdAtMs?: number;
  scheduledCallAtMs?: number;
  callCompleted?: boolean;
  estimatedDeliveryDate?: string;
}

export interface CustomerGoogleProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface SavedCustomerAddressProfile {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  deliveryNotes: string;
}

export interface OrderTrackingComputed {
  stageIndex: number; // 1 = Confirmed, 2 = Artisan Crafting, 3 = Shipped / In Transit, 4 = Delivered
  stageLabel: string;
  stageDescription: string;
  progressPercent: number;
  isDelivered: boolean;
  isCancelled: boolean;
  isInProgress: boolean;
  estimatedDeliveryDateFormatted: string;
  arrivalCountdownLabel: string;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  firstSheetTitle: string;
}

const LOCAL_ORDERS_KEY = 'wolko_scheduled_orders';
const LOCAL_DELETED_ORDERS_KEY = 'wolko_deleted_order_ids';
const LOCAL_CANCELLED_ORDERS_KEY = 'wolko_cancelled_order_ids';
const LOCAL_USER_KEY = 'wolko_google_user';
const LOCAL_CUSTOMER_KEY = 'wolko_google_customer';
const LOCAL_CUSTOM_AVATAR_KEY = 'wolko_custom_avatar_url';
const LOCAL_ADDRESS_PROFILE_KEY = 'wolko_saved_customer_profile';
const LOCAL_WEBHOOK_KEY = 'wolko_google_sheets_webhook';

export function resolveGooglePhotoUrl(
  email?: string | null,
  existingPhotoURL?: string | null
): string | null {
  try {
    const customSaved = localStorage.getItem(LOCAL_CUSTOM_AVATAR_KEY);
    if (customSaved && customSaved.trim()) {
      return customSaved.trim();
    }
  } catch {
    // ignore
  }

  const firebasePhoto =
    auth.currentUser?.photoURL ||
    auth.currentUser?.providerData?.find((p) => p?.photoURL)?.photoURL ||
    null;
  if (firebasePhoto && firebasePhoto.trim()) {
    return firebasePhoto.trim();
  }

  if (
    existingPhotoURL &&
    existingPhotoURL.trim() &&
    !existingPhotoURL.includes('ui-avatars.com')
  ) {
    return existingPhotoURL.trim();
  }

  const cleanEmail = (email || auth.currentUser?.email || '')
    .trim()
    .toLowerCase();
  if (cleanEmail && cleanEmail.includes('@')) {
    return `https://unavatar.io/google/${encodeURIComponent(cleanEmail)}?fallback=false`;
  }

  return null;
}

export function getSavedGoogleUser(): CustomerGoogleProfile | null {
  try {
    const rawPrimary = localStorage.getItem(LOCAL_USER_KEY);
    if (rawPrimary) {
      const parsed = JSON.parse(rawPrimary) as CustomerGoogleProfile;
      if (parsed && parsed.email) {
        return {
          ...parsed,
          photoURL: resolveGooglePhotoUrl(parsed.email, parsed.photoURL),
        };
      }
    }
    const rawSecondary = localStorage.getItem(LOCAL_CUSTOMER_KEY);
    if (rawSecondary) {
      const parsed = JSON.parse(rawSecondary) as CustomerGoogleProfile;
      if (parsed && parsed.email) {
        return {
          ...parsed,
          photoURL: resolveGooglePhotoUrl(parsed.email, parsed.photoURL),
        };
      }
    }
  } catch {
    // ignore storage errors
  }
  return null;
}

export function persistGoogleUserLocally(profile: CustomerGoogleProfile) {
  try {
    const enriched: CustomerGoogleProfile = {
      ...profile,
      photoURL: resolveGooglePhotoUrl(profile.email, profile.photoURL),
    };
    const serialized = JSON.stringify(enriched);
    localStorage.setItem(LOCAL_USER_KEY, serialized);
    localStorage.setItem(LOCAL_CUSTOMER_KEY, serialized);
  } catch {
    // ignore storage errors
  }
}

export function saveCustomGoogleAvatarUrl(photoDataUrlOrUrl: string | null) {
  try {
    if (photoDataUrlOrUrl && photoDataUrlOrUrl.trim()) {
      localStorage.setItem(LOCAL_CUSTOM_AVATAR_KEY, photoDataUrlOrUrl.trim());
    } else {
      localStorage.removeItem(LOCAL_CUSTOM_AVATAR_KEY);
    }
    const current = getSavedGoogleUser();
    if (current) {
      persistGoogleUserLocally({
        ...current,
        photoURL: photoDataUrlOrUrl?.trim() || resolveGooglePhotoUrl(current.email, null),
      });
    }
  } catch {
    // ignore
  }
}

export function getSavedCustomerAddressProfile(): SavedCustomerAddressProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_ADDRESS_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedCustomerAddressProfile;
  } catch {
    return null;
  }
}

export async function saveCustomerAddressProfile(
  profile: SavedCustomerAddressProfile
): Promise<void> {
  try {
    localStorage.setItem(LOCAL_ADDRESS_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
  if (auth.currentUser) {
    try {
      await saveCustomerProfileToFirestore({
        uid: auth.currentUser.uid,
        email: profile.email || auth.currentUser.email || 'customer@gmail.com',
        displayName:
          profile.customerName || auth.currentUser.displayName || 'Customer',
        phone: profile.phone,
        address: profile.address,
        landmark: profile.landmark,
        city: profile.city,
        state: profile.state,
        pincode: profile.pincode,
      });
    } catch {
      // ignore if offline
    }
  }
}

export async function syncCustomerAddressProfileFromFirestore(): Promise<SavedCustomerAddressProfile | null> {
  if (auth.currentUser) {
    try {
      const remote = await fetchCustomerProfileFromFirestore();
      if (remote) {
        const localExisting = getSavedCustomerAddressProfile();
        const merged: SavedCustomerAddressProfile = {
          customerName:
            remote.displayName || localExisting?.customerName || '',
          phone: remote.phone || localExisting?.phone || '',
          email: remote.email || localExisting?.email || '',
          address:
            remote.address && remote.address !== 'Address Pending'
              ? remote.address
              : localExisting?.address || '',
          landmark: remote.landmark || localExisting?.landmark || '',
          city: remote.city || localExisting?.city || '',
          state: remote.state || localExisting?.state || '',
          pincode:
            remote.pincode && remote.pincode !== '000000'
              ? remote.pincode
              : localExisting?.pincode || '',
          deliveryNotes: localExisting?.deliveryNotes || '',
        };
        localStorage.setItem(
          LOCAL_ADDRESS_PROFILE_KEY,
          JSON.stringify(merged)
        );
        return merged;
      }
    } catch {
      // fallback to local
    }
  }
  return getSavedCustomerAddressProfile();
}

/**
 * Computes real-time order progress stage and expected delivery date ("Kab aane wala hai").
 */
export function computeOrderTrackingDetails(
  order: SheetOrderRow
): OrderTrackingComputed {
  const statusUpper = String(order.orderStatus || '').toUpperCase();
  const isCancelled = statusUpper.includes('CANCEL');
  const isDelivered = statusUpper.includes('DELIVERED');

  let baseCreatedMs = order.createdAtMs || 0;
  if (!baseCreatedMs && order.timestamp) {
    const parsedDate = Date.parse(order.timestamp);
    if (!Number.isNaN(parsedDate)) {
      baseCreatedMs = parsedDate;
    }
  }
  if (!baseCreatedMs) {
    baseCreatedMs = Date.now();
  }

  // Standard Express Handcrafted Delivery: 4 days from order placement
  const deliveryTargetMs = baseCreatedMs + 4 * 24 * 60 * 60 * 1000;
  const deliveryDateObj = new Date(deliveryTargetMs);
  const estimatedDeliveryDateFormatted =
    order.estimatedDeliveryDate ||
    deliveryDateObj.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const now = Date.now();
  const elapsedHours = Math.max(0, (now - baseCreatedMs) / (1000 * 60 * 60));
  const remainingDays = Math.max(
    0,
    Math.ceil((deliveryTargetMs - now) / (1000 * 60 * 60 * 24))
  );

  if (isCancelled) {
    return {
      stageIndex: 0,
      stageLabel: 'Cancelled',
      stageDescription: 'This order was cancelled.',
      progressPercent: 0,
      isDelivered: false,
      isCancelled: true,
      isInProgress: false,
      estimatedDeliveryDateFormatted: 'Cancelled',
      arrivalCountdownLabel: 'Cancelled',
    };
  }

  if (isDelivered) {
    return {
      stageIndex: 4,
      stageLabel: 'Delivered',
      stageDescription: 'Handcrafted package delivered to your address.',
      progressPercent: 100,
      isDelivered: true,
      isCancelled: false,
      isInProgress: false,
      estimatedDeliveryDateFormatted,
      arrivalCountdownLabel: 'Delivered',
    };
  }

  if (
    statusUpper.includes('SHIPPED') ||
    statusUpper.includes('DISPATCH') ||
    statusUpper.includes('TRANSIT') ||
    elapsedHours >= 36
  ) {
    return {
      stageIndex: 3,
      stageLabel: 'Shipped & In Transit',
      stageDescription:
        'Packed in botanical seed paper and dispatched via Express Courier.',
      progressPercent: 78,
      isDelivered: false,
      isCancelled: false,
      isInProgress: true,
      estimatedDeliveryDateFormatted,
      arrivalCountdownLabel:
        remainingDays <= 1
          ? 'Arriving Tomorrow'
          : `Arriving in ${remainingDays} Days`,
    };
  }

  if (statusUpper.includes('CONFIRM') || elapsedHours >= 0.05) {
    return {
      stageIndex: 2,
      stageLabel: 'Artisan Hand-Crafting',
      stageDescription:
        'Our studio artisans are hand-crocheting and finishing your order.',
      progressPercent: 52,
      isDelivered: false,
      isCancelled: false,
      isInProgress: true,
      estimatedDeliveryDateFormatted,
      arrivalCountdownLabel:
        remainingDays <= 1
          ? 'Arriving Tomorrow'
          : `Arriving in ${remainingDays} Days`,
    };
  }

  return {
    stageIndex: 1,
    stageLabel: 'Order Confirmed',
    stageDescription:
      'Order received and queued for our studio artisans.',
    progressPercent: 28,
    isDelivered: false,
    isCancelled: false,
    isInProgress: true,
    estimatedDeliveryDateFormatted,
    arrivalCountdownLabel: `Arriving in ${Math.max(1, remainingDays)} Days`,
  };
}

export function getDeletedOrderIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_ORDERS_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function addDeletedOrderIdLocally(orderId: string) {
  try {
    const set = getDeletedOrderIds();
    set.add(orderId);
    localStorage.setItem(
      LOCAL_DELETED_ORDERS_KEY,
      JSON.stringify(Array.from(set))
    );
  } catch {
    // ignore
  }
}

export function getCancelledOrderIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_CANCELLED_ORDERS_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function addCancelledOrderIdLocally(orderId: string) {
  try {
    const set = getCancelledOrderIds();
    set.add(orderId);
    localStorage.setItem(
      LOCAL_CANCELLED_ORDERS_KEY,
      JSON.stringify(Array.from(set))
    );
  } catch {
    // ignore
  }
}

function getLocalOrders(): SheetOrderRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    const list: SheetOrderRow[] = raw ? JSON.parse(raw) : [];
    const deletedSet = getDeletedOrderIds();
    const cancelledSet = getCancelledOrderIds();
    return list
      .filter((o) => o && o.orderId && !deletedSet.has(o.orderId))
      .map((o) =>
        cancelledSet.has(o.orderId)
          ? {
              ...o,
              orderStatus: 'CANCELLED ❌',
              aiCallStatus: 'CANCELLED BY CUSTOMER',
            }
          : o
      );
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: SheetOrderRow[]) {
  try {
    const deletedSet = getDeletedOrderIds();
    const filtered = orders.filter(
      (o) => o && o.orderId && !deletedSet.has(o.orderId)
    );
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(filtered));
  } catch {
    // ignore storage errors
  }
}

/**
 * Listens to real Firebase Auth state (`onAuthStateChanged`), while preserving any saved Google session
 * so returning users are never asked to sign up again.
 */
export const initAuth = (
  onAuthSuccess?: (user: CustomerGoogleProfile, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const googleProviderPhoto =
        firebaseUser.photoURL ||
        firebaseUser.providerData?.find((p) => p?.photoURL)?.photoURL ||
        resolveGooglePhotoUrl(firebaseUser.email, null);

      const profile: CustomerGoogleProfile = {
        uid: firebaseUser.uid,
        displayName:
          firebaseUser.displayName ||
          firebaseUser.providerData?.find((p) => p?.displayName)?.displayName ||
          (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Customer'),
        email: firebaseUser.email,
        photoURL: googleProviderPhoto,
      };
      persistGoogleUserLocally(profile);
      syncCustomerAddressProfileFromFirestore().catch(() => {});

      let token: string | null = null;
      try {
        token = await firebaseUser.getIdToken();
      } catch {
        token = null;
      }
      onAuthSuccess?.(profile, token);
      return;
    }

    // Check if the customer already signed in previously on this browser
    const savedProfile = getSavedGoogleUser();
    if (savedProfile && savedProfile.email) {
      persistGoogleUserLocally(savedProfile);
      onAuthSuccess?.(savedProfile, null);
      return;
    }

    onAuthFailure?.();
  });

  return unsubscribe;
};

/**
 * Authenticates the user with real Firebase Google Sign-In (`signInWithPopup`).
 */
export const signInWithFirebaseGooglePopup =
  async (): Promise<CustomerGoogleProfile> => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const user = result.user;
    const googleProviderPhoto =
      user.photoURL ||
      user.providerData?.find((p) => p?.photoURL)?.photoURL ||
      resolveGooglePhotoUrl(user.email, null);

    const profile: CustomerGoogleProfile = {
      uid: user.uid,
      displayName:
        user.displayName ||
        user.providerData?.find((p) => p?.displayName)?.displayName ||
        (user.email ? user.email.split('@')[0] : 'Customer'),
      email: user.email,
      photoURL: googleProviderPhoto,
    };
    persistGoogleUserLocally(profile);
    await syncCustomerAddressProfileFromFirestore().catch(() => {});
    return profile;
  };

export const backendGoogleSignUp = async (
  email: string,
  displayName?: string
): Promise<CustomerGoogleProfile> => {
  const cleanEmail = email.trim().toLowerCase();
  const resolvedPhoto = resolveGooglePhotoUrl(cleanEmail, null);

  try {
    const res = await fetch('/api/auth/google-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        displayName,
        photoURL: resolvedPhoto,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.user) {
        const userWithPhoto: CustomerGoogleProfile = {
          ...data.user,
          photoURL: resolveGooglePhotoUrl(cleanEmail, data.user.photoURL),
        };
        persistGoogleUserLocally(userWithPhoto);
        return userWithPhoto;
      }
    }
  } catch {
    // Fallback to client-side instant Google account profile creation
  }

  const nameFromEmail = cleanEmail
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
  const finalName = (displayName || '').trim() || nameFromEmail || 'Customer';

  const fallbackUser: CustomerGoogleProfile = {
    uid: `google_${Date.now()}`,
    displayName: finalName,
    email: cleanEmail,
    photoURL: resolvedPhoto,
  };
  persistGoogleUserLocally(fallbackUser);
  return fallbackUser;
};

export const logoutGoogle = async () => {
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(LOCAL_USER_KEY);
    localStorage.removeItem(LOCAL_CUSTOMER_KEY);
  } catch {
    // ignore
  }
};

/**
 * Saves a customer's new order to:
 * 1. Backend Database (`/api/orders`) + Automatic Multi-Channel WhatsApp & Webhook Dispatch to 8591542015
 * 2. Firebase Cloud Firestore Database (`/customers/{uid}` & `/orders/{orderId}`) + Firebase Order Trigger
 */
export async function saveOrderToBackend(
  order: SheetOrderRow,
  whatsappMessageText?: string
): Promise<SheetOrderRow> {
  // 1. Immediately persist customer address profile in localStorage so future orders are pre-filled
  const profilePayload: SavedCustomerAddressProfile = {
    customerName: order.customerName,
    phone: order.phone,
    email: order.email,
    address: order.address || order.deliveryAddress,
    landmark: order.landmark || '',
    city: order.city || '',
    state: order.state || '',
    pincode: order.pincode || '',
    deliveryNotes: order.deliveryNotes || '',
  };
  try {
    localStorage.setItem(
      LOCAL_ADDRESS_PROFILE_KEY,
      JSON.stringify(profilePayload)
    );
  } catch {
    // ignore localStorage error
  }

  // 2. Run Firestore persistence (which also saves customer profile in Firestore) in parallel with Backend API
  const firestorePromise = (async () => {
    if (!auth.currentUser) return;
    try {
      await saveOrderToFirestore({
        orderId: order.orderId,
        userId: auth.currentUser.uid,
        customerName: order.customerName,
        phone: order.phone,
        email: order.email || auth.currentUser.email || 'customer@gmail.com',
        address: order.address || order.deliveryAddress,
        landmark: order.landmark || '',
        city: order.city || 'India',
        state: order.state || 'India',
        pincode: order.pincode || '000000',
        deliveryAddress: order.deliveryAddress,
        deliveryNotes: order.deliveryNotes || '',
        productsSummary: order.productsSummary,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        whatsappSentTo: STORE_WHATSAPP_NUMBER,
        orderStatus: order.orderStatus || 'CONFIRMED ✅',
        aiCallStatus:
          order.aiCallStatus || 'AUTO-DISPATCHED TO WHATSAPP 8591542015',
        voiceResponse:
          order.voiceResponse ||
          'Automatically dispatched to WhatsApp 8591542015',
        timestamp: order.timestamp,
      });
    } catch (err) {
      console.warn(
        'Firestore save notice (backend WhatsApp dispatch active):',
        err
      );
    }
  })();

  // 3. Immediately POST to /api/orders to capture all customer form data & dispatch to 8591542015
  let backendSavedOrder: SheetOrderRow | null = null;
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...order,
        userId: auth.currentUser?.uid || order.userId || '',
        whatsappSentTo: STORE_WHATSAPP_NUMBER,
        whatsappMessageText: whatsappMessageText || '',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.order) {
        backendSavedOrder = data.order as SheetOrderRow;
      }
    }
  } catch {
    // Fallback to Firebase trigger endpoint if primary route encountered network error
    try {
      const triggerRes = await fetch('/api/triggers/firebase-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: {
            ...order,
            userId: auth.currentUser?.uid || order.userId || '',
            whatsappSentTo: STORE_WHATSAPP_NUMBER,
          },
          whatsappMessageText: whatsappMessageText || '',
        }),
      });
      if (triggerRes.ok) {
        backendSavedOrder = {
          ...order,
          whatsappSentTo: STORE_WHATSAPP_NUMBER,
        };
      }
    } catch {
      // ignore fallback error
    }
  }

  // Wait for Firestore write to settle as well
  await Promise.allSettled([firestorePromise]);

  if (backendSavedOrder) {
    const existing = getLocalOrders();
    const updated = [
      backendSavedOrder,
      ...existing.filter((o) => o.orderId !== order.orderId),
    ];
    saveLocalOrders(updated);
    return backendSavedOrder;
  }

  const now = Date.now();
  const savedOrder: SheetOrderRow = {
    ...order,
    whatsappSentTo: STORE_WHATSAPP_NUMBER,
    createdAtMs: order.createdAtMs || now,
    scheduledCallAtMs: order.scheduledCallAtMs || now + 300 * 1000,
    callCompleted: false,
  };

  const existing = getLocalOrders();
  saveLocalOrders([
    savedOrder,
    ...existing.filter((o) => o.orderId !== savedOrder.orderId),
  ]);

  const webhookUrl = localStorage.getItem(LOCAL_WEBHOOK_KEY);
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_order', order: savedOrder }),
    }).catch(() => {});
  }

  return savedOrder;
}


export function mapFirestoreDocToOrderRow(
  d: Record<string, unknown>
): SheetOrderRow {
  return {
    orderId: String(d.orderId || ''),
    userId: String(d.userId || ''),
    timestamp: String(d.timestamp || ''),
    customerName: String(d.customerName || ''),
    phone: String(d.phone || ''),
    email: String(d.email || ''),
    address: String(d.address || ''),
    landmark: String(d.landmark || ''),
    city: String(d.city || ''),
    state: String(d.state || ''),
    pincode: String(d.pincode || ''),
    deliveryNotes: String(d.deliveryNotes || ''),
    productsSummary: String(d.productsSummary || ''),
    totalAmount: String(d.totalAmount || '0'),
    paymentMethod: String(d.paymentMethod || 'COD'),
    deliveryAddress: String(d.deliveryAddress || ''),
    whatsappSentTo: String(d.whatsappSentTo || STORE_WHATSAPP_NUMBER),
    orderStatus: String(d.orderStatus || 'CONFIRMED ✅'),
    aiCallStatus: String(
      d.aiCallStatus || 'AUTO-DISPATCHED TO WHATSAPP 8591542015'
    ),
    voiceResponse: String(d.voiceResponse || ''),
  };
}

/**
 * Fetches all orders from Backend + Firebase Firestore.
 */
export async function fetchOrdersFromBackend(): Promise<{
  orders: SheetOrderRow[];
  config: {
    googleSheetsWebhookUrl: string;
    linkedGoogleSheetUrl: string;
    callDelaySeconds: number;
  };
  serverTimeMs: number;
}> {
  let firestoreOrders: SheetOrderRow[] = [];
  if (auth.currentUser) {
    try {
      const rawDocs = await fetchUserOrdersFromFirestore();
      firestoreOrders = rawDocs.map(mapFirestoreDocToOrderRow);
    } catch {
      // ignore if user has no orders yet
    }
  }

  const localList = getLocalOrders();
  const deletedSet = getDeletedOrderIds();
  const cancelledSet = getCancelledOrderIds();

  const normalizeOrderRow = (row: SheetOrderRow): SheetOrderRow => {
    if (cancelledSet.has(row.orderId)) {
      return {
        ...row,
        orderStatus: 'CANCELLED ❌',
        aiCallStatus: 'CANCELLED BY CUSTOMER',
      };
    }
    return row;
  };

  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const data = await res.json();
      const backendList: SheetOrderRow[] = Array.isArray(data.orders)
        ? data.orders
        : [];
      const mergedMap = new Map<string, SheetOrderRow>();
      for (const o of [...firestoreOrders, ...backendList, ...localList]) {
        if (
          o.orderId &&
          !deletedSet.has(o.orderId) &&
          !mergedMap.has(o.orderId)
        ) {
          mergedMap.set(o.orderId, normalizeOrderRow(o));
        }
      }
      const merged = Array.from(mergedMap.values());
      saveLocalOrders(merged);
      return {
        ...data,
        orders: merged,
      };
    }
  } catch {
    // Fallback to Firestore + localStorage orders
  }

  const mergedMap = new Map<string, SheetOrderRow>();
  for (const o of [...firestoreOrders, ...localList]) {
    if (o.orderId && !deletedSet.has(o.orderId) && !mergedMap.has(o.orderId)) {
      mergedMap.set(o.orderId, normalizeOrderRow(o));
    }
  }

  return {
    orders: Array.from(mergedMap.values()),
    config: {
      googleSheetsWebhookUrl: localStorage.getItem(LOCAL_WEBHOOK_KEY) || '',
      linkedGoogleSheetUrl: '',
      callDelaySeconds: 300,
    },
    serverTimeMs: Date.now(),
  };
}

/**
 * Cancels a customer order in LocalStorage, Backend (+ Telegram notification), and Firebase Firestore.
 */
export async function cancelCustomerOrderInBackend(
  orderId: string,
  orderSnapshot?: SheetOrderRow
): Promise<void> {
  addCancelledOrderIdLocally(orderId);

  const existing = getLocalOrders().map((o) =>
    o.orderId === orderId
      ? {
          ...o,
          orderStatus: 'CANCELLED ❌',
          aiCallStatus: 'CANCELLED BY CUSTOMER',
          voiceResponse: 'Order cancelled by customer from dashboard',
          callCompleted: true,
        }
      : o
  );
  saveLocalOrders(existing);

  const firestoreTask = (async () => {
    if (!auth.currentUser) return;
    try {
      await updateOrderStatusInFirestore(
        orderId,
        'CANCELLED ❌',
        'CANCELLED BY CUSTOMER',
        'Order cancelled by customer from dashboard'
      );
    } catch {
      // ignore if order was created before Firebase Auth session
    }
  })();

  const backendTask = (async () => {
    try {
      await fetch(`/api/orders/${encodeURIComponent(orderId)}/confirm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus: 'CANCELLED ❌',
          aiCallStatus: 'CANCELLED BY CUSTOMER',
          voiceResponse: 'Order cancelled by customer from dashboard',
          orderSnapshot,
        }),
      });
    } catch {
      // ignore offline
    }
  })();

  await Promise.allSettled([firestoreTask, backendTask]);
}

/**
 * Permanently deletes a customer order from LocalStorage, Backend, and Firebase Firestore.
 */
export async function deleteCustomerOrderInBackend(
  orderId: string
): Promise<void> {
  addDeletedOrderIdLocally(orderId);

  const existing = getLocalOrders().filter((o) => o.orderId !== orderId);
  saveLocalOrders(existing);

  const firestoreTask = (async () => {
    if (!auth.currentUser) return;
    try {
      await deleteOrderFromFirestore(orderId);
    } catch {
      // ignore if document doesn't exist in Firestore
    }
  })();

  const backendTask = (async () => {
    try {
      await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore offline
    }
  })();

  await Promise.allSettled([firestoreTask, backendTask]);
}

/**
 * Updates order confirmation status in Firebase Firestore + Backend.
 */
export async function updateOrderConfirmationInBackend(
  orderId: string,
  newOrderStatus: string,
  newAiCallStatus: string,
  voiceResponseText: string
): Promise<void> {
  if (String(newOrderStatus).toUpperCase().includes('CANCEL')) {
    addCancelledOrderIdLocally(orderId);
  }
  if (auth.currentUser) {
    try {
      await updateOrderStatusInFirestore(
        orderId,
        newOrderStatus,
        newAiCallStatus,
        voiceResponseText
      );
    } catch {
      // ignore if order belongs to different session
    }
  }

  try {
    const res = await fetch(
      `/api/orders/${encodeURIComponent(orderId)}/confirm`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderStatus: newOrderStatus,
          aiCallStatus: newAiCallStatus,
          voiceResponse: voiceResponseText,
        }),
      }
    );
    if (res.ok) {
      const existing = getLocalOrders().map((o) =>
        o.orderId === orderId
          ? {
              ...o,
              orderStatus: newOrderStatus,
              aiCallStatus: newAiCallStatus,
              voiceResponse: voiceResponseText,
              callCompleted: true,
            }
          : o
      );
      saveLocalOrders(existing);
      return;
    }
  } catch {
    // Fallback to local update
  }

  const existing = getLocalOrders().map((o) =>
    o.orderId === orderId
      ? {
          ...o,
          orderStatus: newOrderStatus,
          aiCallStatus: newAiCallStatus,
          voiceResponse: voiceResponseText,
          callCompleted: true,
        }
      : o
  );
  saveLocalOrders(existing);

  const webhookUrl = localStorage.getItem(LOCAL_WEBHOOK_KEY);
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_order',
        orderId,
        orderStatus: newOrderStatus,
        aiCallStatus: newAiCallStatus,
        voiceResponse: voiceResponseText,
      }),
    }).catch(() => {});
  }
}

export interface ProductCommentItem {
  commentId: string;
  productId: string;
  productName: string;
  productImage?: string;
  userId?: string;
  authorName: string;
  authorEmail?: string;
  authorPhotoURL?: string | null;
  rating: number;
  highlights?: string[];
  commentText: string;
  isVerifiedBuyer?: boolean;
  helpfulCount: number;
  timestamp: string;
  createdAtMs: number;
}

const LOCAL_COMMENTS_KEY = 'wolko_product_comments';
const LOCAL_DELETED_COMMENTS_KEY = 'wolko_deleted_comment_ids';

export function getDeletedCommentIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_COMMENTS_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function addDeletedCommentIdLocally(commentId: string) {
  try {
    const set = getDeletedCommentIds();
    set.add(commentId);
    localStorage.setItem(
      LOCAL_DELETED_COMMENTS_KEY,
      JSON.stringify(Array.from(set))
    );
  } catch {
    // ignore
  }
}

function getLocalComments(): ProductCommentItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_COMMENTS_KEY);
    const list: ProductCommentItem[] = raw ? JSON.parse(raw) : [];
    const deletedSet = getDeletedCommentIds();
    return Array.isArray(list)
      ? list.filter((c) => c && c.commentId && !deletedSet.has(c.commentId))
      : [];
  } catch {
    return [];
  }
}

function saveLocalComments(comments: ProductCommentItem[]) {
  try {
    const deletedSet = getDeletedCommentIds();
    const filtered = comments.filter(
      (c) => c && c.commentId && !deletedSet.has(c.commentId)
    );
    localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export function mapFirestoreDocToComment(
  d: Record<string, unknown>
): ProductCommentItem {
  return {
    commentId: String(d.commentId || ''),
    productId: String(d.productId || ''),
    productName: String(d.productName || 'Wolko Handcrafted'),
    userId: String(d.userId || ''),
    authorName: String(d.authorName || 'Customer'),
    authorPhotoURL: d.authorPhotoURL ? String(d.authorPhotoURL) : null,
    rating: Number(d.rating) || 5,
    highlights: Array.isArray(d.highlights)
      ? d.highlights.map((h) => String(h))
      : [],
    commentText: String(d.commentText || ''),
    helpfulCount: Number(d.helpfulCount) || 0,
    timestamp: String(d.timestamp || 'Just now'),
    createdAtMs: Number(d.createdAtMs) || Date.now(),
  };
}

export async function fetchProductComments(): Promise<ProductCommentItem[]> {
  const localList = getLocalComments();
  const deletedSet = getDeletedCommentIds();

  try {
    const res = await fetch('/api/comments');
    if (res.ok) {
      const data = await res.json();
      const backendList: ProductCommentItem[] = Array.isArray(data.comments)
        ? data.comments
        : [];
      const mergedMap = new Map<string, ProductCommentItem>();
      for (const c of [...backendList, ...localList]) {
        if (
          c &&
          c.commentId &&
          !deletedSet.has(c.commentId) &&
          !mergedMap.has(c.commentId)
        ) {
          mergedMap.set(c.commentId, c);
        }
      }
      const merged = Array.from(mergedMap.values()).sort(
        (a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)
      );
      saveLocalComments(merged);
      return merged;
    }
  } catch {
    // fallback to local
  }

  return localList.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
}

export async function createProductComment(input: {
  productId: string;
  productName: string;
  productImage?: string;
  userId?: string;
  authorName: string;
  authorEmail?: string;
  authorPhotoURL?: string | null;
  rating: number;
  highlights?: string[];
  commentText: string;
  isVerifiedBuyer?: boolean;
}): Promise<ProductCommentItem> {
  const commentId = `CMT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const timestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const resolvedPhoto = resolveGooglePhotoUrl(
    input.authorEmail,
    input.authorPhotoURL
  );

  const optimisticComment: ProductCommentItem = {
    commentId,
    productId: input.productId,
    productName: input.productName,
    productImage: input.productImage,
    userId: auth.currentUser?.uid || input.userId || '',
    authorName: input.authorName.trim() || 'Customer',
    authorEmail: input.authorEmail || '',
    authorPhotoURL: resolvedPhoto,
    rating: Math.min(5, Math.max(1, Number(input.rating) || 5)),
    highlights: input.highlights || [],
    commentText: input.commentText.trim(),
    isVerifiedBuyer: Boolean(input.isVerifiedBuyer),
    helpfulCount: 0,
    timestamp,
    createdAtMs: Date.now(),
  };

  const existing = getLocalComments();
  saveLocalComments([optimisticComment, ...existing]);

  const firestoreTask = (async () => {
    if (!auth.currentUser) return;
    try {
      await saveProductCommentToFirestore({
        commentId,
        productId: input.productId,
        productName: input.productName,
        authorName: optimisticComment.authorName,
        authorPhotoURL: resolvedPhoto,
        rating: optimisticComment.rating,
        commentText: optimisticComment.commentText,
        helpfulCount: 0,
        timestamp,
      });
    } catch {
      // ignore if unauthenticated in Firestore
    }
  })();

  let savedBackend: ProductCommentItem | null = null;
  try {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(optimisticComment),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.comment) {
        savedBackend = data.comment as ProductCommentItem;
      }
    }
  } catch {
    // ignore offline
  }

  await Promise.allSettled([firestoreTask]);

  if (savedBackend) {
    const updated = [
      savedBackend,
      ...getLocalComments().filter((c) => c.commentId !== commentId),
    ];
    saveLocalComments(updated);
    return savedBackend;
  }

  return optimisticComment;
}

export async function markProductCommentHelpful(
  commentId: string
): Promise<void> {
  const existing = getLocalComments().map((c) =>
    c.commentId === commentId
      ? { ...c, helpfulCount: (c.helpfulCount || 0) + 1 }
      : c
  );
  saveLocalComments(existing);

  try {
    await fetch(`/api/comments/${encodeURIComponent(commentId)}/helpful`, {
      method: 'POST',
    });
  } catch {
    // ignore
  }
}

export async function removeProductComment(commentId: string): Promise<void> {
  addDeletedCommentIdLocally(commentId);
  const existing = getLocalComments().filter((c) => c.commentId !== commentId);
  saveLocalComments(existing);

  const firestoreTask = (async () => {
    if (!auth.currentUser) return;
    try {
      await deleteProductCommentFromFirestore(commentId);
    } catch {
      // ignore
    }
  })();

  const backendTask = (async () => {
    try {
      await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore
    }
  })();

  await Promise.allSettled([firestoreTask, backendTask]);
}

export {
  subscribeToUserOrdersInFirestore,
  subscribeToPublicCommentsInFirestore,
};
