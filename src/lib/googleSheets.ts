export interface SheetOrderRow {
  orderId: string;
  timestamp: string;
  customerName: string;
  phone: string;
  email: string;
  productsSummary: string;
  totalAmount: string;
  paymentMethod: string;
  deliveryAddress: string;
  orderStatus: string;
  aiCallStatus: string;
  voiceResponse: string;
  createdAtMs?: number;
  scheduledCallAtMs?: number;
  callCompleted?: boolean;
}

export interface CustomerGoogleProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  firstSheetTitle: string;
}

const LOCAL_ORDERS_KEY = 'wolko_scheduled_orders';
const LOCAL_USER_KEY = 'wolko_google_user';
const LOCAL_WEBHOOK_KEY = 'wolko_google_sheets_webhook';

function getLocalOrders(): SheetOrderRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalOrders(orders: SheetOrderRow[]) {
  try {
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore storage errors
  }
}

export const initAuth = (
  onAuthSuccess?: (user: CustomerGoogleProfile, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  try {
    const saved = localStorage.getItem(LOCAL_USER_KEY);
    if (saved) {
      const profile = JSON.parse(saved) as CustomerGoogleProfile;
      if (profile && profile.email) {
        onAuthSuccess?.(profile, null);
        return () => {};
      }
    }
  } catch {
    // ignore
  }
  onAuthFailure?.();
  return () => {};
};

export const backendGoogleSignUp = async (
  email: string,
  displayName?: string
): Promise<CustomerGoogleProfile> => {
  try {
    const res = await fetch('/api/auth/google-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.user) {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(data.user));
        return data.user as CustomerGoogleProfile;
      }
    }
  } catch {
    // Fallback to client-side instant Google account profile creation
  }

  const cleanEmail = email.trim().toLowerCase();
  const nameFromEmail = cleanEmail
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
  const finalName = (displayName || '').trim() || nameFromEmail || 'Customer';

  const fallbackUser: CustomerGoogleProfile = {
    uid: `google_${Date.now()}`,
    displayName: finalName,
    email: cleanEmail,
    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(
      finalName
    )}&background=C87D55&color=fff&bold=true`,
  };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
  return fallbackUser;
};

export const logoutGoogle = async () => {
  try {
    localStorage.removeItem(LOCAL_USER_KEY);
  } catch {
    // ignore
  }
};

/**
 * Automatically saves a customer's new order to the backend (/api/orders)
 * and syncs with Google Sheets via Webhook (zero Google Cloud billing required).
 */
export async function saveOrderToBackend(
  order: SheetOrderRow
): Promise<SheetOrderRow> {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.order) {
        const existing = getLocalOrders();
        const updated = [
          data.order as SheetOrderRow,
          ...existing.filter((o) => o.orderId !== order.orderId),
        ];
        saveLocalOrders(updated);
        return data.order as SheetOrderRow;
      }
    }
  } catch {
    // Fallback to local + direct webhook if running as static build
  }

  const now = Date.now();
  const savedOrder: SheetOrderRow = {
    ...order,
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

/**
 * Fetches all orders and admin config from the backend Google Sheets store.
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
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        saveLocalOrders(data.orders);
      }
      return data;
    }
  } catch {
    // Fallback to localStorage orders
  }

  return {
    orders: getLocalOrders(),
    config: {
      googleSheetsWebhookUrl: localStorage.getItem(LOCAL_WEBHOOK_KEY) || '',
      linkedGoogleSheetUrl: '',
      callDelaySeconds: 300,
    },
    serverTimeMs: Date.now(),
  };
}

/**
 * Updates order confirmation status in the backend and connected Google Sheet webhook.
 */
export async function updateOrderConfirmationInBackend(
  orderId: string,
  newOrderStatus: string,
  newAiCallStatus: string,
  voiceResponseText: string
): Promise<void> {
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
