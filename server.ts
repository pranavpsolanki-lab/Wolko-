import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders_sheet.json');
const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin_config.json');
const TELEGRAM_OUTBOX_FILE = path.join(DATA_DIR, 'telegram_outbox.json');
const COMMENTS_FILE = path.join(DATA_DIR, 'product_comments.json');

export interface ProductCommentRecord {
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

export interface BackendOrderRow {
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
  whatsappDeliveryStatus?: string;
  whatsappChannelsUsed?: string[];
  orderStatus: string;
  aiCallStatus: string;
  voiceResponse: string;
  createdAtMs: number;
  scheduledCallAtMs: number;
  callCompleted?: boolean;
}

export interface AdminBackendConfig {
  telegramBotToken: string;
  telegramChatId: string;
  telegramChatIds: string[];
  lastTelegramUpdateId: number;
  googleSheetsWebhookUrl: string;
  linkedGoogleSheetUrl: string;
  whatsappWebhookUrl: string;
  ntfyTopic: string;
}

export interface TelegramOutboxRecord {
  orderId: string;
  dispatchedAt: string;
  lastAttemptAt?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  deliveryNotes?: string;
  deliveryAddress: string;
  productsSummary: string;
  totalAmount: string;
  paymentMethod: string;
  message: string;
  status: string;
  deliveredToTelegram: boolean;
  deliveredChatIds: string[];
  webhookDelivered?: boolean;
  errorDetails?: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readOrdersFromDisk(): BackendOrderRow[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(ORDERS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed reading orders_sheet.json:', err);
    return [];
  }
}

function writeOrdersToDisk(orders: BackendOrderRow[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing orders_sheet.json:', err);
  }
}

function readTelegramOutbox(): TelegramOutboxRecord[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(TELEGRAM_OUTBOX_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(TELEGRAM_OUTBOX_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTelegramOutbox(records: TelegramOutboxRecord[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(
      TELEGRAM_OUTBOX_FILE,
      JSON.stringify(records, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.error('Failed writing telegram_outbox.json:', err);
  }
}

function readCommentsFromDisk(): ProductCommentRecord[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(COMMENTS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(COMMENTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCommentsToDisk(comments: ProductCommentRecord[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing product_comments.json:', err);
  }
}

const DEFAULT_TELEGRAM_BOT_TOKEN =
  '8942096264:AAHqNy0Vbt1AHxVnybKKcY64UAnZEaz6KW0';
const DEFAULT_TELEGRAM_CHAT_ID = '6439560085';

function readAdminConfig(): AdminBackendConfig {
  const envToken = (
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.VITE_TELEGRAM_BOT_TOKEN ||
    DEFAULT_TELEGRAM_BOT_TOKEN
  ).trim();
  const envChatId = (
    process.env.TELEGRAM_CHAT_ID ||
    process.env.VITE_TELEGRAM_CHAT_ID ||
    DEFAULT_TELEGRAM_CHAT_ID
  ).trim();

  const defaults: AdminBackendConfig = {
    telegramBotToken: envToken,
    telegramChatId: envChatId,
    telegramChatIds: [
      ...new Set([envChatId, DEFAULT_TELEGRAM_CHAT_ID].filter(Boolean)),
    ],
    lastTelegramUpdateId: 0,
    googleSheetsWebhookUrl: (process.env.GOOGLE_SHEETS_WEBHOOK_URL || '').trim(),
    linkedGoogleSheetUrl: '',
    whatsappWebhookUrl: (process.env.WHATSAPP_WEBHOOK_URL || '').trim(),
    ntfyTopic: (
      process.env.NTFY_WHATSAPP_TOPIC || 'wolko_orders_8591542015'
    ).trim(),
  };

  try {
    ensureDataDir();
    if (!fs.existsSync(ADMIN_CONFIG_FILE)) {
      return defaults;
    }
    const raw = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    const mergedChatIds = new Set<string>([DEFAULT_TELEGRAM_CHAT_ID]);
    if (envChatId) mergedChatIds.add(envChatId);
    if (parsed.telegramChatId)
      mergedChatIds.add(String(parsed.telegramChatId).trim());
    if (Array.isArray(parsed.telegramChatIds)) {
      for (const id of parsed.telegramChatIds) {
        if (id) mergedChatIds.add(String(id).trim());
      }
    }

    return {
      ...defaults,
      ...parsed,
      telegramBotToken:
        parsed.telegramBotToken || envToken || DEFAULT_TELEGRAM_BOT_TOKEN,
      telegramChatId:
        parsed.telegramChatId ||
        envChatId ||
        Array.from(mergedChatIds)[0] ||
        DEFAULT_TELEGRAM_CHAT_ID,
      telegramChatIds: Array.from(mergedChatIds),
      lastTelegramUpdateId: Number(parsed.lastTelegramUpdateId || 0),
    };
  } catch {
    return defaults;
  }
}

function writeAdminConfig(config: AdminBackendConfig) {
  try {
    ensureDataDir();
    fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed writing admin_config.json:', err);
  }
}

export function buildFormattedOrderMessage(
  order: BackendOrderRow,
  customMessage?: string
): string {
  if (customMessage && customMessage.trim().length > 20) {
    return customMessage.trim();
  }
  const fullAddr =
    order.deliveryAddress ||
    [
      order.address,
      order.landmark ? `Landmark: ${order.landmark}` : '',
      order.city,
      order.state,
      order.pincode,
    ]
      .filter(Boolean)
      .join(', ');

  return [
    `✨ NEW WOLKO ORDER PLACED ✨`,
    `🆔 Order ID: ${order.orderId}`,
    `📅 Date: ${order.timestamp || new Date().toLocaleString('en-IN')}`,
    ``,
    `👤 Customer Details:`,
    `• Name: ${order.customerName}`,
    `• Phone / Mobile: ${order.phone}`,
    `• Google Email: ${order.email || 'N/A'}`,
    ``,
    `📍 Complete Delivery Address:`,
    order.address ? `• Street / House: ${order.address}` : null,
    order.landmark ? `• Landmark: ${order.landmark}` : null,
    order.city || order.state
      ? `• City / State: ${[order.city, order.state].filter(Boolean).join(', ')}`
      : null,
    order.pincode ? `• Pincode: ${order.pincode}` : null,
    order.deliveryNotes ? `• Delivery Note: ${order.deliveryNotes}` : null,
    `• Full Address: ${fullAddr}`,
    ``,
    `🛍️ Items Ordered:`,
    `${order.productsSummary}`,
    ``,
    `💰 Total Amount: ₹${order.totalAmount}`,
    `💳 Payment Method: ${order.paymentMethod || 'COD'}`,
  ]
    .filter((line) => line !== null)
    .join('\n');
}

// ============================================================================
// TELEGRAM BOT ORDER AUTOMATION ENGINE
// 1. Automatically detects owner's Chat ID when they send /start to their Bot
// 2. Immediately sends every new customer order via Telegram Bot API
// ============================================================================
let isPollingTelegram = false;

async function sendTelegramMessageToChat(
  botToken: string,
  chatId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      }
    );
    const data = (await res.json()) as { ok?: boolean; description?: string };
    if (res.ok && data.ok) {
      return { ok: true };
    }
    return {
      ok: false,
      error: data.description || `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Automatically polls `getUpdates` on the configured Telegram Bot so the owner
 * only has to tap "Start" (/start) in their Telegram bot—no manual Chat ID lookup needed!
 */
async function syncTelegramBotSubscribers(): Promise<string[]> {
  const config = readAdminConfig();
  const botToken = (
    process.env.TELEGRAM_BOT_TOKEN ||
    config.telegramBotToken ||
    ''
  ).trim();

  if (!botToken || isPollingTelegram) {
    return config.telegramChatIds;
  }

  isPollingTelegram = true;
  try {
    const offset = config.lastTelegramUpdateId
      ? config.lastTelegramUpdateId + 1
      : 0;
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=1`
    );
    if (!res.ok) {
      return config.telegramChatIds;
    }

    const data = (await res.json()) as {
      ok?: boolean;
      result?: Array<{
        update_id: number;
        message?: {
          chat?: { id: number | string; first_name?: string; username?: string };
          text?: string;
        };
        my_chat_member?: {
          chat?: { id: number | string };
        };
      }>;
    };

    if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) {
      return config.telegramChatIds;
    }

    const chatIdsSet = new Set<string>(config.telegramChatIds);
    if (process.env.TELEGRAM_CHAT_ID?.trim()) {
      chatIdsSet.add(process.env.TELEGRAM_CHAT_ID.trim());
    }

    let maxUpdateId = config.lastTelegramUpdateId || 0;
    const newlyLinkedChatIds: string[] = [];

    for (const update of data.result) {
      if (update.update_id > maxUpdateId) {
        maxUpdateId = update.update_id;
      }
      const rawChatId =
        update.message?.chat?.id ?? update.my_chat_member?.chat?.id;
      if (rawChatId !== undefined && rawChatId !== null) {
        const chatIdStr = String(rawChatId).trim();
        const isFirstTime = !chatIdsSet.has(chatIdStr);
        chatIdsSet.add(chatIdStr);

        if (
          isFirstTime ||
          (update.message?.text &&
            update.message.text.trim().toLowerCase().startsWith('/start'))
        ) {
          newlyLinkedChatIds.push(chatIdStr);
        }
      }
    }

    const updatedChatIds = Array.from(chatIdsSet);
    writeAdminConfig({
      ...config,
      telegramBotToken: botToken,
      telegramChatId: updatedChatIds[0] || config.telegramChatId || '',
      telegramChatIds: updatedChatIds,
      lastTelegramUpdateId: maxUpdateId,
    });

    // Send confirmation welcome message & flush pending orders for newly linked chat IDs
    for (const newChatId of newlyLinkedChatIds) {
      await sendTelegramMessageToChat(
        botToken,
        newChatId,
        [
          `✅ Wolko Studio Telegram Order Automation Active!`,
          `🆔 Linked Chat ID: ${newChatId}`,
          ``,
          `Whenever any customer places an order on your website, their complete details (Name, Phone, Email, Full Delivery Address, Items, Total Amount & Payment Method) will arrive here automatically!`,
        ].join('\n')
      );
    }

    if (newlyLinkedChatIds.length > 0) {
      setTimeout(() => {
        flushPendingTelegramOutbox(false).catch(() => {});
      }, 300);
    }

    return updatedChatIds;
  } catch {
    return config.telegramChatIds;
  } finally {
    isPollingTelegram = false;
  }
}

/**
 * Dispatches an order immediately to Telegram (and optional webhook) in the backend.
 */
async function dispatchOrderToTelegramBackend(
  order: BackendOrderRow,
  customMessage?: string
): Promise<{
  deliveredToTelegram: boolean;
  webhookDelivered: boolean;
  channelsDelivered: string[];
  statusLabel: string;
  outboxRecord: TelegramOutboxRecord;
}> {
  // First auto-sync any new /start messages on the bot so chat IDs are always up to date
  await syncTelegramBotSubscribers();

  const config = readAdminConfig();
  const botToken = (
    process.env.TELEGRAM_BOT_TOKEN ||
    config.telegramBotToken ||
    ''
  ).trim();

  const targetChatIds = new Set<string>(config.telegramChatIds);
  if (process.env.TELEGRAM_CHAT_ID?.trim()) {
    targetChatIds.add(process.env.TELEGRAM_CHAT_ID.trim());
  }
  if (config.telegramChatId?.trim()) {
    targetChatIds.add(config.telegramChatId.trim());
  }

  const formattedMsg = buildFormattedOrderMessage(order, customMessage);
  const channelsDelivered: string[] = [];
  const deliveredChatIds: string[] = [];
  const errors: string[] = [];
  let deliveredToTelegram = false;
  let webhookDelivered = false;

  // 1. Official Telegram Bot API Dispatch
  if (botToken && targetChatIds.size > 0) {
    for (const chatId of targetChatIds) {
      const sendRes = await sendTelegramMessageToChat(
        botToken,
        chatId,
        formattedMsg
      );
      if (sendRes.ok) {
        deliveredToTelegram = true;
        deliveredChatIds.push(chatId);
        channelsDelivered.push(`Telegram Bot (Chat ${chatId})`);
      } else if (sendRes.error) {
        errors.push(`Telegram (${chatId}): ${sendRes.error}`);
      }
    }
  } else if (!botToken) {
    errors.push('TELEGRAM_BOT_TOKEN not set in Secrets');
  } else if (targetChatIds.size === 0) {
    errors.push(
      'Bot token ready — open your Telegram Bot and tap /start (or set TELEGRAM_CHAT_ID)'
    );
  }

  // 2. Optional Custom Webhook
  const customWebhook = (
    config.whatsappWebhookUrl ||
    process.env.WHATSAPP_WEBHOOK_URL ||
    ''
  ).trim();
  if (customWebhook) {
    try {
      const res = await fetch(customWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'ORDER_PLACED',
          message: formattedMsg,
          orderId: order.orderId,
          timestamp: order.timestamp,
          customer: {
            name: order.customerName,
            phone: order.phone,
            email: order.email,
            address: order.address || '',
            landmark: order.landmark || '',
            city: order.city || '',
            state: order.state || '',
            pincode: order.pincode || '',
            deliveryNotes: order.deliveryNotes || '',
            fullDeliveryAddress: order.deliveryAddress,
          },
          orderSummary: {
            productsSummary: order.productsSummary,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
          },
          order,
        }),
      });
      if (res.ok) {
        webhookDelivered = true;
        channelsDelivered.push('Custom Webhook');
      }
    } catch {
      // ignore optional webhook error
    }
  }

  const statusLabel = deliveredToTelegram
    ? `DELIVERED_TO_TELEGRAM (${deliveredChatIds.join(', ')})`
    : botToken
      ? 'AWAITING_TELEGRAM_BOT_START'
      : 'QUEUED_AWAITING_TELEGRAM_BOT_TOKEN';

  const existingOutbox = readTelegramOutbox();
  const existingIdx = existingOutbox.findIndex(
    (item) => item.orderId === order.orderId
  );

  const outboxRecord: TelegramOutboxRecord = {
    orderId: order.orderId,
    dispatchedAt:
      existingIdx !== -1
        ? existingOutbox[existingIdx].dispatchedAt
        : new Date().toISOString(),
    lastAttemptAt: new Date().toISOString(),
    customerName: order.customerName,
    customerPhone: order.phone,
    customerEmail: order.email,
    address: order.address,
    landmark: order.landmark,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    deliveryNotes: order.deliveryNotes,
    deliveryAddress: order.deliveryAddress,
    productsSummary: order.productsSummary,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    message: formattedMsg,
    status: statusLabel,
    deliveredToTelegram,
    deliveredChatIds,
    webhookDelivered,
    errorDetails: errors.length > 0 ? errors.join(' | ') : undefined,
  };

  if (existingIdx !== -1) {
    existingOutbox[existingIdx] = outboxRecord;
    writeTelegramOutbox(existingOutbox);
  } else {
    writeTelegramOutbox([outboxRecord, ...existingOutbox]);
  }

  // Update order record in orders_sheet.json
  const allOrders = readOrdersFromDisk();
  const orderIdx = allOrders.findIndex((o) => o.orderId === order.orderId);
  if (orderIdx !== -1) {
    allOrders[orderIdx] = {
      ...allOrders[orderIdx],
      whatsappDeliveryStatus: statusLabel,
      whatsappChannelsUsed: channelsDelivered,
      aiCallStatus: deliveredToTelegram
        ? 'DELIVERED TO TELEGRAM'
        : 'QUEUED FOR TELEGRAM',
    };
    writeOrdersToDisk(allOrders);
  }

  return {
    deliveredToTelegram,
    webhookDelivered,
    channelsDelivered,
    statusLabel,
    outboxRecord,
  };
}

/**
 * Automatically flushes any queued orders in data/telegram_outbox.json or orders_sheet.json
 * as soon as TELEGRAM_BOT_TOKEN and a Chat ID become available.
 */
async function flushPendingTelegramOutbox(forceAll = false): Promise<{
  totalProcessed: number;
  deliveredCount: number;
}> {
  const outbox = readTelegramOutbox();
  const orders = readOrdersFromDisk();
  let deliveredCount = 0;

  // Ensure any orders from orders_sheet.json that aren't in telegram_outbox yet are included
  const existingIds = new Set(outbox.map((o) => o.orderId));
  for (const ord of orders) {
    if (!existingIds.has(ord.orderId)) {
      outbox.push({
        orderId: ord.orderId,
        dispatchedAt: ord.timestamp,
        customerName: ord.customerName,
        customerPhone: ord.phone,
        customerEmail: ord.email,
        address: ord.address,
        landmark: ord.landmark,
        city: ord.city,
        state: ord.state,
        pincode: ord.pincode,
        deliveryNotes: ord.deliveryNotes,
        deliveryAddress: ord.deliveryAddress,
        productsSummary: ord.productsSummary,
        totalAmount: ord.totalAmount,
        paymentMethod: ord.paymentMethod,
        message: buildFormattedOrderMessage(ord),
        status: 'QUEUED',
        deliveredToTelegram: false,
        deliveredChatIds: [],
      });
    }
  }

  const itemsToProcess = [...outbox].reverse().filter((item) => {
    if (forceAll) return true;
    return !item.deliveredToTelegram;
  });

  for (const item of itemsToProcess) {
    const matchedOrder: BackendOrderRow = orders.find(
      (o) => o.orderId === item.orderId
    ) || {
      orderId: item.orderId,
      timestamp: item.dispatchedAt,
      customerName: item.customerName,
      phone: item.customerPhone,
      email: item.customerEmail,
      address: item.address,
      landmark: item.landmark,
      city: item.city,
      state: item.state,
      pincode: item.pincode,
      deliveryNotes: item.deliveryNotes,
      productsSummary: item.productsSummary,
      totalAmount: item.totalAmount,
      paymentMethod: item.paymentMethod,
      deliveryAddress: item.deliveryAddress,
      orderStatus: 'CONFIRMED ✅',
      aiCallStatus: 'AUTO-DISPATCHED TO TELEGRAM',
      voiceResponse: 'Automatically forwarded to Studio Telegram',
      createdAtMs: Date.now(),
      scheduledCallAtMs: Date.now(),
    };

    const res = await dispatchOrderToTelegramBackend(
      matchedOrder,
      item.message
    );
    if (res.deliveredToTelegram) {
      deliveredCount++;
    }
  }

  return {
    totalProcessed: itemsToProcess.length,
    deliveredCount,
  };
}

async function pushOrderToGoogleSheetsWebhook(
  action: 'APPEND_ORDER' | 'UPDATE_ORDER',
  order: BackendOrderRow
): Promise<boolean> {
  const config = readAdminConfig();
  const webhookUrl = config.googleSheetsWebhookUrl?.trim();
  if (!webhookUrl) return false;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        order,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function escapeCsvCell(val: string): string {
  const str = String(val ?? '').replace(/\r?\n/g, ' ');
  if (str.includes(',') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Background Telegram Bot subscriber sync & pending order flush
  setTimeout(() => {
    syncTelegramBotSubscribers()
      .then((chatIds) => {
        if (chatIds.length > 0) {
          return flushPendingTelegramOutbox(false);
        }
      })
      .catch(() => {});
  }, 1000);

  setInterval(() => {
    syncTelegramBotSubscribers().catch(() => {});
  }, 4000);

  app.post('/api/auth/google-signup', (req, res) => {
    const { email, displayName, photoURL } = req.body;
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      res
        .status(400)
        .json({ error: 'Please enter a valid Google email address.' });
      return;
    }

    const derivedName =
      String(displayName || '').trim() ||
      cleanEmail
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const uid = `google_${Buffer.from(cleanEmail)
      .toString('base64url')
      .slice(0, 20)}`;

    const resolvedPhotoURL =
      (typeof photoURL === 'string' && photoURL.trim()) ||
      `https://unavatar.io/google/${encodeURIComponent(cleanEmail)}?fallback=false`;

    res.json({
      user: {
        uid,
        email: cleanEmail,
        displayName: derivedName,
        photoURL: resolvedPhotoURL,
      },
    });
  });

  app.get('/api/orders', (_req, res) => {
    const orders = readOrdersFromDisk();
    const config = readAdminConfig();
    const outbox = readTelegramOutbox();
    res.json({
      orders,
      config,
      outbox,
      serverTimeMs: Date.now(),
    });
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const {
        orderId,
        userId,
        timestamp,
        customerName,
        phone,
        email,
        address,
        landmark,
        city,
        state,
        pincode,
        deliveryNotes,
        productsSummary,
        totalAmount,
        paymentMethod,
        deliveryAddress,
        whatsappMessageText,
      } = req.body;

      const now = Date.now();
      const resolvedOrderId = String(
        orderId || `WOLKO-${Math.floor(10000 + Math.random() * 90000)}`
      ).trim();

      const resolvedAddress = String(address || '').trim();
      const resolvedLandmark = String(landmark || '').trim();
      const resolvedCity = String(city || '').trim();
      const resolvedState = String(state || '').trim();
      const resolvedPincode = String(pincode || '').trim();
      const resolvedDeliveryNotes = String(deliveryNotes || '').trim();

      const computedDeliveryAddress =
        String(deliveryAddress || '').trim() ||
        [
          resolvedAddress,
          resolvedLandmark ? `Near ${resolvedLandmark}` : '',
          [resolvedCity, resolvedState].filter(Boolean).join(', '),
          resolvedPincode,
        ]
          .filter(Boolean)
          .join(', ');

      const newOrder: BackendOrderRow = {
        orderId: resolvedOrderId,
        userId: String(userId || '').trim(),
        timestamp:
          String(timestamp || '') ||
          new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        customerName: String(customerName || '').trim(),
        phone: String(phone || '').trim(),
        email: String(email || '').trim(),
        address: resolvedAddress,
        landmark: resolvedLandmark,
        city: resolvedCity,
        state: resolvedState,
        pincode: resolvedPincode,
        deliveryNotes: resolvedDeliveryNotes,
        productsSummary: String(productsSummary || '').trim(),
        totalAmount: String(totalAmount || '0').trim(),
        paymentMethod: String(paymentMethod || 'COD').trim(),
        deliveryAddress: computedDeliveryAddress,
        orderStatus: 'CONFIRMED ✅',
        aiCallStatus: 'DISPATCHING TO TELEGRAM...',
        voiceResponse: 'Automatically forwarded to Studio Telegram',
        createdAtMs: now,
        scheduledCallAtMs: now,
        callCompleted: true,
      };

      const orders = readOrdersFromDisk();
      const filteredOrders = orders.filter(
        (o) => o.orderId !== newOrder.orderId
      );
      const updatedOrders = [newOrder, ...filteredOrders];
      writeOrdersToDisk(updatedOrders);

      pushOrderToGoogleSheetsWebhook('APPEND_ORDER', newOrder).catch(() => {});

      const dispatchResult = await dispatchOrderToTelegramBackend(
        newOrder,
        typeof whatsappMessageText === 'string'
          ? whatsappMessageText
          : undefined
      );

      newOrder.whatsappDeliveryStatus = dispatchResult.statusLabel;
      newOrder.whatsappChannelsUsed = dispatchResult.channelsDelivered;
      newOrder.aiCallStatus = dispatchResult.deliveredToTelegram
        ? 'DELIVERED TO TELEGRAM'
        : 'QUEUED FOR TELEGRAM';

      res.json({
        success: true,
        deliveredToTelegram: dispatchResult.deliveredToTelegram,
        deliveredToWhatsApp: dispatchResult.deliveredToTelegram,
        webhookDelivered: dispatchResult.webhookDelivered,
        channelsDelivered: dispatchResult.channelsDelivered,
        whatsappStatusLabel: dispatchResult.statusLabel,
        order: newOrder,
      });
    } catch (error: unknown) {
      console.error('Error creating order in backend:', error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to create order',
      });
    }
  });

  /**
   * Dedicated Firebase Function / Firestore Order Placement Trigger Endpoint.
   * Invoked automatically whenever a new order document is created in Firestore (`/orders/{orderId}`).
   * Ensures customer form data is captured and programmatically sent to Telegram without duplicates.
   */
  app.post('/api/triggers/firebase-order', async (req, res) => {
    try {
      const { order, whatsappMessageText, forceResend } = req.body;
      if (!order || !order.orderId) {
        res.status(400).json({ error: 'Missing order payload or orderId' });
        return;
      }

      const existingOutbox = readTelegramOutbox();
      const existingOutboxItem = existingOutbox.find(
        (item) => item.orderId === order.orderId
      );

      if (
        existingOutboxItem &&
        existingOutboxItem.deliveredToTelegram &&
        !forceResend
      ) {
        res.json({
          success: true,
          alreadyDispatched: true,
          deliveredToTelegram: true,
          deliveredToWhatsApp: true,
          channelsDelivered: existingOutboxItem.deliveredChatIds,
          statusLabel: existingOutboxItem.status,
        });
        return;
      }

      const allOrders = readOrdersFromDisk();
      let backendOrder = allOrders.find((o) => o.orderId === order.orderId);

      if (!backendOrder) {
        const now = Date.now();
        backendOrder = {
          orderId: String(order.orderId).trim(),
          userId: String(order.userId || '').trim(),
          timestamp:
            String(order.timestamp || '') ||
            new Date().toLocaleString('en-IN'),
          customerName: String(order.customerName || '').trim(),
          phone: String(order.phone || '').trim(),
          email: String(order.email || '').trim(),
          address: String(order.address || '').trim(),
          landmark: String(order.landmark || '').trim(),
          city: String(order.city || '').trim(),
          state: String(order.state || '').trim(),
          pincode: String(order.pincode || '').trim(),
          deliveryNotes: String(order.deliveryNotes || '').trim(),
          productsSummary: String(order.productsSummary || '').trim(),
          totalAmount: String(order.totalAmount || '0').trim(),
          paymentMethod: String(order.paymentMethod || 'COD').trim(),
          deliveryAddress:
            String(order.deliveryAddress || '').trim() ||
            [
              order.address,
              order.landmark,
              order.city,
              order.state,
              order.pincode,
            ]
              .filter(Boolean)
              .join(', '),
          orderStatus: String(order.orderStatus || 'CONFIRMED ✅'),
          aiCallStatus: 'TRIGGERED VIA FIREBASE ORDER PLACEMENT',
          voiceResponse: 'Automatically forwarded via Firebase Order Trigger to Telegram',
          createdAtMs: now,
          scheduledCallAtMs: now,
          callCompleted: true,
        };
        writeOrdersToDisk([backendOrder, ...allOrders]);
      }

      const dispatchResult = await dispatchOrderToTelegramBackend(
        backendOrder,
        whatsappMessageText
      );

      res.json({
        success: true,
        alreadyDispatched: false,
        deliveredToTelegram: dispatchResult.deliveredToTelegram,
        deliveredToWhatsApp: dispatchResult.deliveredToTelegram,
        webhookDelivered: dispatchResult.webhookDelivered,
        channelsDelivered: dispatchResult.channelsDelivered,
        statusLabel: dispatchResult.statusLabel,
        outboxRecord: dispatchResult.outboxRecord,
      });
    } catch (error: unknown) {
      console.error('Firebase order trigger error:', error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process Firebase order trigger',
      });
    }
  });

  app.get('/api/telegram/status', async (_req, res) => {
    const chatIds = await syncTelegramBotSubscribers();
    const config = readAdminConfig();
    const outbox = readTelegramOutbox();
    const hasToken = Boolean(
      (process.env.TELEGRAM_BOT_TOKEN || config.telegramBotToken || '').trim()
    );
    res.json({
      hasBotToken: hasToken,
      linkedChatIds: chatIds,
      pendingOrdersCount: outbox.filter((o) => !o.deliveredToTelegram).length,
      outbox: outbox.slice(0, 30),
    });
  });

  app.patch('/api/orders/:orderId/confirm', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { orderStatus, aiCallStatus, voiceResponse, orderSnapshot } =
        req.body;

      const orders = readOrdersFromDisk();
      const idx = orders.findIndex((o) => o.orderId === orderId);
      let updatedOrder: BackendOrderRow;

      if (idx === -1) {
        updatedOrder = {
          orderId,
          timestamp:
            orderSnapshot?.timestamp || new Date().toLocaleString('en-IN'),
          customerName: orderSnapshot?.customerName || 'Customer',
          phone: orderSnapshot?.phone || '',
          email: orderSnapshot?.email || '',
          productsSummary: orderSnapshot?.productsSummary || '',
          totalAmount: String(orderSnapshot?.totalAmount || '0'),
          paymentMethod: orderSnapshot?.paymentMethod || 'COD',
          deliveryAddress: orderSnapshot?.deliveryAddress || '',
          orderStatus: orderStatus || 'CANCELLED ❌',
          aiCallStatus: aiCallStatus || 'UPDATED BY CUSTOMER',
          voiceResponse: voiceResponse || 'Updated by customer',
          createdAtMs: Date.now(),
          scheduledCallAtMs: Date.now(),
          callCompleted: true,
        };
        orders.unshift(updatedOrder);
      } else {
        updatedOrder = {
          ...orders[idx],
          orderStatus: orderStatus || orders[idx].orderStatus,
          aiCallStatus: aiCallStatus || orders[idx].aiCallStatus,
          voiceResponse: voiceResponse || orders[idx].voiceResponse,
          callCompleted: true,
        };
        orders[idx] = updatedOrder;
      }

      writeOrdersToDisk(orders);
      pushOrderToGoogleSheetsWebhook('UPDATE_ORDER', updatedOrder).catch(
        () => {}
      );

      // If order was cancelled by customer, notify store owner on Telegram immediately
      if (String(updatedOrder.orderStatus).toUpperCase().includes('CANCEL')) {
        (async () => {
          try {
            await syncTelegramBotSubscribers();
            const config = readAdminConfig();
            const botToken = (
              process.env.TELEGRAM_BOT_TOKEN ||
              config.telegramBotToken ||
              ''
            ).trim();
            const targetChatIds = new Set<string>(config.telegramChatIds);
            if (process.env.TELEGRAM_CHAT_ID?.trim()) {
              targetChatIds.add(process.env.TELEGRAM_CHAT_ID.trim());
            }
            if (config.telegramChatId?.trim()) {
              targetChatIds.add(config.telegramChatId.trim());
            }

            if (botToken && targetChatIds.size > 0) {
              const cancelMsg = [
                `❌ *ORDER CANCELLED BY CUSTOMER* ❌`,
                `━━━━━━━━━━━━━━━━━━━━`,
                `🆔 *Order ID:* #${updatedOrder.orderId}`,
                `📅 *Cancelled At:* ${new Date().toLocaleString('en-IN')}`,
                `👤 *Customer:* ${updatedOrder.customerName || 'N/A'}`,
                `📞 *Phone:* ${updatedOrder.phone || 'N/A'}`,
                `📧 *Email:* ${updatedOrder.email || 'N/A'}`,
                `🛍️ *Items:* ${updatedOrder.productsSummary || 'N/A'}`,
                `💰 *Amount:* ₹${updatedOrder.totalAmount || '0'} (${updatedOrder.paymentMethod || 'COD'})`,
                `━━━━━━━━━━━━━━━━━━━━`,
              ].join('\n');

              for (const chatId of targetChatIds) {
                await sendTelegramMessageToChat(botToken, chatId, cancelMsg);
              }
            }
          } catch {
            // ignore background notification error
          }
        })();
      }

      res.json({
        success: true,
        deliveredToTelegram: true,
        order: updatedOrder,
      });
    } catch (error: unknown) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to update order',
      });
    }
  });

  app.delete('/api/orders/:orderId', (req, res) => {
    try {
      const { orderId } = req.params;
      const orders = readOrdersFromDisk();
      const filteredOrders = orders.filter((o) => o.orderId !== orderId);
      writeOrdersToDisk(filteredOrders);

      const outbox = readTelegramOutbox();
      const filteredOutbox = outbox.filter((o) => o.orderId !== orderId);
      writeTelegramOutbox(filteredOutbox);

      res.json({
        success: true,
        deletedOrderId: orderId,
      });
    } catch (error: unknown) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to delete order',
      });
    }
  });

  // =========================================================================
  // REAL PUBLIC PRODUCT COMMENTS API (Starts empty, populates as users post)
  // =========================================================================
  app.get('/api/comments', (_req, res) => {
    const comments = readCommentsFromDisk();
    res.json({
      comments,
    });
  });

  app.post('/api/comments', (req, res) => {
    try {
      const {
        commentId,
        productId,
        productName,
        productImage,
        userId,
        authorName,
        authorEmail,
        authorPhotoURL,
        rating,
        highlights,
        commentText,
        isVerifiedBuyer,
      } = req.body;

      const cleanText = String(commentText || '').trim();
      const cleanProductId = String(productId || '').trim();
      if (!cleanText || !cleanProductId) {
        res
          .status(400)
          .json({ error: 'Product and comment text are required.' });
        return;
      }

      const cleanEmail = String(authorEmail || '').trim().toLowerCase();
      const cleanAuthorName =
        String(authorName || '').trim() ||
        (cleanEmail ? cleanEmail.split('@')[0] : 'Wolko Guest');

      const resolvedPhoto =
        (typeof authorPhotoURL === 'string' && authorPhotoURL.trim()) ||
        (cleanEmail && cleanEmail.includes('@')
          ? `https://unavatar.io/google/${encodeURIComponent(cleanEmail)}?fallback=false`
          : null);

      const numericRating = Math.min(
        5,
        Math.max(1, Number(rating) || 5)
      );

      const newComment: ProductCommentRecord = {
        commentId:
          String(commentId || '').trim() ||
          `CMT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        productId: cleanProductId,
        productName: String(productName || 'Wolko Handcrafted Piece').trim(),
        productImage: String(productImage || '').trim(),
        userId: String(userId || '').trim(),
        authorName: cleanAuthorName.slice(0, 80),
        authorEmail: cleanEmail,
        authorPhotoURL: resolvedPhoto,
        rating: numericRating,
        highlights: Array.isArray(highlights)
          ? highlights.map((h) => String(h).trim()).filter(Boolean).slice(0, 5)
          : [],
        commentText: cleanText.slice(0, 1000),
        isVerifiedBuyer: Boolean(isVerifiedBuyer),
        helpfulCount: 0,
        timestamp: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        createdAtMs: Date.now(),
      };

      const existing = readCommentsFromDisk();
      const filtered = existing.filter(
        (c) => c.commentId !== newComment.commentId
      );
      const updated = [newComment, ...filtered];
      writeCommentsToDisk(updated);

      res.json({
        success: true,
        comment: newComment,
      });
    } catch (error: unknown) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to post comment',
      });
    }
  });

  app.post('/api/comments/:commentId/helpful', (req, res) => {
    try {
      const { commentId } = req.params;
      const existing = readCommentsFromDisk();
      const idx = existing.findIndex((c) => c.commentId === commentId);
      if (idx === -1) {
        res.status(404).json({ error: 'Comment not found' });
        return;
      }
      existing[idx] = {
        ...existing[idx],
        helpfulCount: (existing[idx].helpfulCount || 0) + 1,
      };
      writeCommentsToDisk(existing);
      res.json({
        success: true,
        comment: existing[idx],
      });
    } catch (error: unknown) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to update comment',
      });
    }
  });

  app.delete('/api/comments/:commentId', (req, res) => {
    try {
      const { commentId } = req.params;
      const existing = readCommentsFromDisk();
      const filtered = existing.filter((c) => c.commentId !== commentId);
      writeCommentsToDisk(filtered);
      res.json({
        success: true,
        deletedCommentId: commentId,
      });
    } catch (error: unknown) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to delete comment',
      });
    }
  });

  app.get('/api/orders/google-sheet.csv', (_req, res) => {
    const orders = readOrdersFromDisk();
    const headers = [
      'Order ID',
      'Date & Time',
      'Customer Name',
      'Phone Number',
      'Google Email',
      'Products Ordered',
      'Total Amount (INR)',
      'Payment Mode',
      'Delivery Address',
      'Order Status',
      'Dispatch Status',
    ];

    const csvLines = [
      headers.map(escapeCsvCell).join(','),
      ...orders.map((o) =>
        [
          o.orderId,
          o.timestamp,
          o.customerName,
          o.phone,
          o.email,
          o.productsSummary,
          o.totalAmount,
          o.paymentMethod,
          o.deliveryAddress,
          o.orderStatus,
          o.aiCallStatus,
        ]
          .map(escapeCsvCell)
          .join(',')
      ),
    ];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="wolko_customer_orders_google_sheet.csv"'
    );
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.send(csvLines.join('\r\n'));
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wolko server running on http://localhost:${PORT}`);
  });
}

startServer();
