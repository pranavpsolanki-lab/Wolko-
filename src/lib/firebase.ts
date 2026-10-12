import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Persist Google Authentication permanently across browser reloads and tabs
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Fallback if restricted by iframe storage rules
});

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('profile');
googleAuthProvider.addScope('email');

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function sanitizeId(raw: string, fallbackPrefix: string): string {
  const cleaned = String(raw || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);
  return cleaned.length >= 1 ? cleaned : `${fallbackPrefix}_${Date.now()}`;
}

function clampString(
  val: unknown,
  minLen: number,
  maxLen: number,
  fallback: string
): string {
  const str = String(val ?? '').trim();
  const effective = str.length >= minLen ? str : fallback;
  return effective.slice(0, maxLen);
}

export interface FirestoreCustomerInput {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface FirestoreOrderInput {
  orderId: string;
  userId: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  productsSummary: string;
  totalAmount: string;
  paymentMethod: string;
  whatsappSentTo: string;
  orderStatus: string;
  aiCallStatus: string;
  voiceResponse: string;
  timestamp: string;
}

/**
 * Fetches the authenticated customer's saved profile and delivery address from `/customers/{uid}`.
 */
export async function fetchCustomerProfileFromFirestore(): Promise<FirestoreCustomerInput | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const safeUid = sanitizeId(currentUser.uid, 'user');
  const path = `customers/${safeUid}`;
  const customerRef = doc(db, 'customers', safeUid);

  try {
    const snap = await getDoc(customerRef);
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      uid: String(d.uid || safeUid),
      email: String(d.email || currentUser.email || ''),
      displayName: String(d.displayName || currentUser.displayName || ''),
      phone: String(d.phone || ''),
      address: String(d.address || ''),
      landmark: String(d.landmark || ''),
      city: String(d.city || ''),
      state: String(d.state || ''),
      pincode: String(d.pincode || ''),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Saves or updates the authenticated customer's profile in Firestore (`/customers/{uid}`).
 */
export async function saveCustomerProfileToFirestore(
  input: FirestoreCustomerInput
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const safeUid = sanitizeId(currentUser.uid, 'user');
  const path = `customers/${safeUid}`;
  const customerRef = doc(db, 'customers', safeUid);

  const sanitizedFields = {
    uid: safeUid,
    email: clampString(
      input.email || currentUser.email,
      3,
      200,
      'customer@gmail.com'
    ),
    displayName: clampString(
      input.displayName || currentUser.displayName,
      1,
      120,
      'Customer'
    ),
    phone: clampString(input.phone, 5, 30, '+910000000000'),
    address: clampString(input.address, 1, 500, 'Address Pending'),
    landmark: clampString(input.landmark ?? '', 0, 200, ''),
    city: clampString(input.city, 1, 100, 'Mumbai'),
    state: clampString(input.state, 1, 100, 'Maharashtra'),
    pincode: clampString(input.pincode, 4, 20, '400001'),
  };

  let existsAlready = false;
  try {
    const snap = await getDoc(customerRef);
    existsAlready = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!existsAlready) {
    try {
      await setDoc(customerRef, {
        ...sanitizedFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      const { uid: _uid, ...updatableFields } = sanitizedFields;
      await updateDoc(customerRef, {
        ...updatableFields,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}

/**
 * Saves a newly placed customer order to Firestore (`/orders/{orderId}`).
 * Ensures the parent `/customers/{uid}` document exists first for relational integrity.
 */
export async function saveOrderToFirestore(
  input: FirestoreOrderInput
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const safeUid = sanitizeId(currentUser.uid, 'user');
  const safeOrderId = sanitizeId(input.orderId, 'WOLKO');

  await saveCustomerProfileToFirestore({
    uid: safeUid,
    email: input.email || currentUser.email || 'customer@gmail.com',
    displayName: input.customerName || currentUser.displayName || 'Customer',
    phone: input.phone,
    address: input.address,
    landmark: input.landmark,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
  });

  const path = `orders/${safeOrderId}`;
  const orderRef = doc(db, 'orders', safeOrderId);

  const normalizedPayment =
    String(input.paymentMethod || 'UPI').toUpperCase() === 'COD'
      ? 'COD'
      : 'UPI';

  const orderDocPayload = {
    orderId: safeOrderId,
    userId: safeUid,
    customerName: clampString(input.customerName, 1, 120, 'Customer'),
    phone: clampString(input.phone, 5, 30, '+910000000000'),
    email: clampString(
      input.email || currentUser.email,
      3,
      200,
      'customer@gmail.com'
    ),
    address: clampString(input.address, 1, 500, 'Delivery Address'),
    landmark: clampString(input.landmark ?? '', 0, 200, ''),
    city: clampString(input.city, 1, 100, 'City'),
    state: clampString(input.state, 1, 100, 'State'),
    pincode: clampString(input.pincode, 4, 20, '000000'),
    deliveryAddress: clampString(
      input.deliveryAddress,
      5,
      800,
      'Delivery Address'
    ),
    deliveryNotes: clampString(input.deliveryNotes ?? '', 0, 400, ''),
    productsSummary: clampString(
      input.productsSummary,
      1,
      1500,
      'Wolko Handcrafted Order'
    ),
    totalAmount: clampString(input.totalAmount, 1, 40, '0'),
    paymentMethod: normalizedPayment,
    whatsappSentTo: clampString(
      input.whatsappSentTo || '918591542015',
      10,
      30,
      '918591542015'
    ),
    orderStatus: clampString(input.orderStatus, 1, 60, 'CONFIRMED ✅'),
    aiCallStatus: clampString(
      input.aiCallStatus,
      1,
      100,
      'AUTO-SENT TO WHATSAPP 8591542015'
    ),
    voiceResponse: clampString(
      input.voiceResponse,
      1,
      500,
      'Automatically dispatched to WhatsApp 8591542015'
    ),
    timestamp: clampString(input.timestamp, 1, 100, new Date().toISOString()),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(orderRef, orderDocPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Updates order confirmation status in Firestore (`/orders/{orderId}`).
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  orderStatus: string,
  aiCallStatus: string,
  voiceResponse: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const safeOrderId = sanitizeId(orderId, 'WOLKO');
  const path = `orders/${safeOrderId}`;
  const orderRef = doc(db, 'orders', safeOrderId);

  try {
    await updateDoc(orderRef, {
      orderStatus: clampString(orderStatus, 1, 60, 'CONFIRMED ✅'),
      aiCallStatus: clampString(aiCallStatus, 1, 100, 'CONFIRMED'),
      voiceResponse: clampString(voiceResponse, 1, 500, 'Confirmed'),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Deletes an order document from Firestore (`/orders/{orderId}`).
 */
export async function deleteOrderFromFirestore(
  orderId: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const safeOrderId = sanitizeId(orderId, 'WOLKO');
  const path = `orders/${safeOrderId}`;
  const orderRef = doc(db, 'orders', safeOrderId);

  try {
    await deleteDoc(orderRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Fetches orders from Firestore for the current authenticated user (or all orders if admin).
 */
export async function fetchUserOrdersFromFirestore(): Promise<
  Record<string, unknown>[]
> {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const path = 'orders';
  const isAdminUser = currentUser.email === 'krishprakashsolanki@gmail.com';

  try {
    const q = isAdminUser
      ? query(collection(db, 'orders'))
      : query(
          collection(db, 'orders'),
          where('userId', '==', currentUser.uid)
        );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

const triggeredOrderIdsInSession = new Set<string>();

/**
 * Firebase Order Placement Trigger handler:
 * Programmatically forwards newly created Firestore `/orders/{orderId}` documents
 * to the backend WhatsApp & Webhook dispatch pipeline for 8591542015.
 */
export async function triggerWhatsAppFromFirestoreOrder(
  orderData: Record<string, unknown>
): Promise<void> {
  const orderId = String(orderData.orderId || '').trim();
  if (!orderId || triggeredOrderIdsInSession.has(orderId)) {
    return;
  }
  triggeredOrderIdsInSession.add(orderId);

  try {
    const res = await fetch('/api/triggers/firebase-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order: orderData,
      }),
    });
    if (res.ok) {
      const result = await res.json();
      if (
        result.deliveredToWhatsApp &&
        !result.alreadyDispatched &&
        auth.currentUser
      ) {
        await updateOrderStatusInFirestore(
          orderId,
          String(orderData.orderStatus || 'CONFIRMED ✅'),
          'WHATSAPP DELIVERED TO 8591542015',
          `Automatically delivered to WhatsApp 8591542015 (${(
            result.channelsDelivered || []
          ).join(', ')})`
        ).catch(() => {});
      }
    }
  } catch {
    // Backend trigger handled via primary /api/orders route
  }
}

/**
 * Subscribes in real time (`onSnapshot`) to the current user's orders in Firestore
 * and executes the Firebase Order Placement Trigger for newly added order documents.
 */
export function subscribeToUserOrdersInFirestore(
  onOrdersUpdate: (orders: Record<string, unknown>[]) => void
): () => void {
  const currentUser = auth.currentUser;
  if (!currentUser) return () => {};

  const path = 'orders';
  const isAdminUser = currentUser.email === 'krishprakashsolanki@gmail.com';
  const q = isAdminUser
    ? query(collection(db, 'orders'))
    : query(collection(db, 'orders'), where('userId', '==', currentUser.uid));

  return onSnapshot(
    q,
    (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const data = change.doc.data();
          triggerWhatsAppFromFirestoreOrder(data).catch(() => {});
        }
      }
      const docs = snapshot.docs.map((d) => d.data());
      onOrdersUpdate(docs);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}

export interface FirestoreProductCommentInput {
  commentId: string;
  productId: string;
  productName: string;
  authorName: string;
  authorPhotoURL?: string | null;
  rating: number;
  commentText: string;
  helpfulCount?: number;
  timestamp: string;
}

export async function saveProductCommentToFirestore(
  input: FirestoreProductCommentInput
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const safeCommentId = sanitizeId(input.commentId, 'CMT');
  const safeProductId = sanitizeId(input.productId, 'prod');
  const safeUid = sanitizeId(currentUser.uid, 'user');
  const path = `comments/${safeCommentId}`;
  const commentRef = doc(db, 'comments', safeCommentId);

  const safePhoto =
    input.authorPhotoURL &&
    !input.authorPhotoURL.startsWith('data:') &&
    input.authorPhotoURL.length <= 500
      ? input.authorPhotoURL
      : currentUser.photoURL && currentUser.photoURL.length <= 500
        ? currentUser.photoURL
        : '';

  const payload = {
    commentId: safeCommentId,
    productId: safeProductId,
    productName: clampString(input.productName, 1, 120, 'Wolko Handcrafted'),
    userId: safeUid,
    authorName: clampString(
      input.authorName || currentUser.displayName,
      1,
      80,
      'Customer'
    ),
    authorPhotoURL: clampString(safePhoto, 0, 500, ''),
    rating: Math.min(5, Math.max(1, Math.round(Number(input.rating) || 5))),
    commentText: clampString(input.commentText, 1, 1000, 'Loved this piece!'),
    helpfulCount: Math.max(
      0,
      Math.min(100000, Math.round(Number(input.helpfulCount) || 0))
    ),
    timestamp: clampString(input.timestamp, 1, 100, new Date().toISOString()),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(commentRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteProductCommentFromFirestore(
  commentId: string
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const safeCommentId = sanitizeId(commentId, 'CMT');
  const path = `comments/${safeCommentId}`;
  const commentRef = doc(db, 'comments', safeCommentId);

  try {
    await deleteDoc(commentRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToPublicCommentsInFirestore(
  onCommentsUpdate: (comments: Record<string, unknown>[]) => void
): () => void {
  const path = 'comments';
  const q = query(
    collection(db, 'comments'),
    where('rating', '>=', 1),
    where('rating', '<=', 5)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const docs = snapshot.docs.map((d) => d.data());
      onCommentsUpdate(docs);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}

export { signInWithPopup, signOut, onAuthStateChanged };
export type { User };


