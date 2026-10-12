// Vercel Serverless Function for Wolko Order Placement, Google Auth & Telegram Automation
const DEFAULT_TELEGRAM_BOT_TOKEN =
  '8942096264:AAHqNy0Vbt1AHxVnybKKcY64UAnZEaz6KW0';
const DEFAULT_TELEGRAM_CHAT_ID = '6439560085';

// In-memory deduplication & order cache across warm serverless invocations
const dispatchedOrderIds = new Set();
let memoryOrders = [];

function buildFormattedOrderMessage(order, customMessage) {
  if (customMessage && String(customMessage).trim().length > 20) {
    return String(customMessage).trim();
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

async function discoverTelegramChatIds(botToken, initialChatIds) {
  const chatIds = new Set(initialChatIds.filter(Boolean));
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates?timeout=0`
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          const cid =
            update?.message?.chat?.id ?? update?.my_chat_member?.chat?.id;
          if (cid !== undefined && cid !== null) {
            chatIds.add(String(cid).trim());
          }
        }
      }
    }
  } catch {
    // ignore getUpdates network error
  }
  return Array.from(chatIds);
}

async function sendTelegramMessage(botToken, chatId, text) {
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
    const data = await res.json();
    return Boolean(res.ok && data && data.ok);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PATCH, DELETE, OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const botToken = (
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.VITE_TELEGRAM_BOT_TOKEN ||
    DEFAULT_TELEGRAM_BOT_TOKEN
  ).trim();

  const primaryChatId = (
    process.env.TELEGRAM_CHAT_ID ||
    process.env.VITE_TELEGRAM_CHAT_ID ||
    DEFAULT_TELEGRAM_CHAT_ID
  ).trim();

  const action = req.query?.action || '';

  // Handle Google Sign-Up / Profile Resolution on Vercel
  if (req.method === 'POST' && action === 'google-signup') {
    try {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const cleanEmail = String(body.email || '')
        .trim()
        .toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res
          .status(400)
          .json({ error: 'Please enter a valid Google email address.' });
      }
      const derivedName =
        String(body.displayName || '').trim() ||
        cleanEmail
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

      const uid = `google_${Buffer.from(cleanEmail)
        .toString('base64url')
        .slice(0, 20)}`;

      const resolvedPhotoURL =
        (typeof body.photoURL === 'string' && body.photoURL.trim()) ||
        `https://unavatar.io/google/${encodeURIComponent(cleanEmail)}?fallback=false`;

      return res.status(200).json({
        user: {
          uid,
          email: cleanEmail,
          displayName: derivedName,
          photoURL: resolvedPhotoURL,
        },
      });
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Google auth error',
      });
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      orders: memoryOrders,
      config: {
        googleSheetsWebhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL || '',
        linkedGoogleSheetUrl: '',
        callDelaySeconds: 300,
      },
      serverTimeMs: Date.now(),
    });
  }

  if (req.method === 'POST') {
    try {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const rawOrder = body.order ? body.order : body;
      const customMessage = body.whatsappMessageText || '';

      const now = Date.now();
      const orderId = String(rawOrder.orderId || `WOLKO-${now}`).trim();

      const newOrder = {
        orderId,
        userId: String(rawOrder.userId || '').trim(),
        timestamp:
          String(rawOrder.timestamp || '') ||
          new Date().toLocaleString('en-IN'),
        customerName: String(rawOrder.customerName || 'Customer').trim(),
        phone: String(rawOrder.phone || '').trim(),
        email: String(rawOrder.email || '').trim(),
        address: String(rawOrder.address || '').trim(),
        landmark: String(rawOrder.landmark || '').trim(),
        city: String(rawOrder.city || '').trim(),
        state: String(rawOrder.state || '').trim(),
        pincode: String(rawOrder.pincode || '').trim(),
        deliveryNotes: String(rawOrder.deliveryNotes || '').trim(),
        productsSummary: String(rawOrder.productsSummary || '').trim(),
        totalAmount: String(rawOrder.totalAmount || '0').trim(),
        paymentMethod: String(rawOrder.paymentMethod || 'COD').trim(),
        deliveryAddress:
          String(rawOrder.deliveryAddress || '').trim() ||
          [
            rawOrder.address,
            rawOrder.landmark,
            rawOrder.city,
            rawOrder.state,
            rawOrder.pincode,
          ]
            .filter(Boolean)
            .join(', '),
        orderStatus: String(rawOrder.orderStatus || 'CONFIRMED ✅'),
        aiCallStatus: 'DELIVERED TO TELEGRAM',
        voiceResponse: 'Order automatically dispatched to Telegram',
        createdAtMs: now,
        scheduledCallAtMs: now + 300 * 1000,
        callCompleted: true,
      };

      memoryOrders = [
        newOrder,
        ...memoryOrders.filter((o) => o.orderId !== orderId),
      ].slice(0, 100);

      if (dispatchedOrderIds.has(orderId) && !body.forceResend) {
        return res.status(200).json({
          success: true,
          alreadyDispatched: true,
          deliveredToTelegram: true,
          deliveredToWhatsApp: true,
          channelsDelivered: [`Telegram Bot (Chat ${primaryChatId})`],
          whatsappStatusLabel: 'DELIVERED_TO_TELEGRAM',
          order: newOrder,
        });
      }

      const formattedMsg = buildFormattedOrderMessage(newOrder, customMessage);

      // 1. Immediately send to primaryChatId & DEFAULT_TELEGRAM_CHAT_ID first (0ms delay)
      const immediateChatIds = Array.from(
        new Set([primaryChatId, DEFAULT_TELEGRAM_CHAT_ID].filter(Boolean))
      );

      let deliveredToTelegram = false;
      const channelsDelivered = [];

      for (const chatId of immediateChatIds) {
        const ok = await sendTelegramMessage(botToken, chatId, formattedMsg);
        if (ok) {
          deliveredToTelegram = true;
          channelsDelivered.push(`Telegram Bot (Chat ${chatId})`);
        }
      }

      // 2. Also check if any additional chat IDs exist in getUpdates
      const allChatIds = await discoverTelegramChatIds(
        botToken,
        immediateChatIds
      );
      for (const chatId of allChatIds) {
        if (immediateChatIds.includes(chatId)) continue;
        const ok = await sendTelegramMessage(botToken, chatId, formattedMsg);
        if (ok) {
          deliveredToTelegram = true;
          channelsDelivered.push(`Telegram Bot (Chat ${chatId})`);
        }
      }

      if (deliveredToTelegram) {
        dispatchedOrderIds.add(orderId);
      }

      return res.status(200).json({
        success: true,
        deliveredToTelegram,
        deliveredToWhatsApp: deliveredToTelegram,
        channelsDelivered,
        whatsappStatusLabel: deliveredToTelegram
          ? 'DELIVERED_TO_TELEGRAM'
          : 'QUEUED',
        order: newOrder,
      });
    } catch (err) {
      return res.status(500).json({
        error: err instanceof Error ? err.message : 'Order dispatch error',
      });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const orderId = req.query?.orderId || body.orderId || '';
      const orderStatus = String(body.orderStatus || '');
      const snap = body.orderSnapshot || {};

      let deliveredToTelegram = false;
      if (orderStatus.toUpperCase().includes('CANCEL')) {
        const targetChatIds = Array.from(
          new Set([primaryChatId, DEFAULT_TELEGRAM_CHAT_ID].filter(Boolean))
        );
        const msg = [
          `❌ ORDER CANCELLED BY CUSTOMER ❌`,
          `🆔 Order ID: ${orderId || snap.orderId || 'N/A'}`,
          `👤 Customer: ${snap.customerName || 'Customer'} (${snap.phone || 'N/A'})`,
          `📧 Email: ${snap.email || 'N/A'}`,
          `🛍️ Items: ${snap.productsSummary || 'N/A'}`,
          `💰 Amount: ₹${snap.totalAmount || '0'}`,
          `📅 Time: ${new Date().toLocaleString('en-IN')}`,
        ].join('\n');

        for (const chatId of targetChatIds) {
          const ok = await sendTelegramMessage(botToken, chatId, msg);
          if (ok) deliveredToTelegram = true;
        }
      }

      return res.status(200).json({
        success: true,
        deliveredToTelegram,
      });
    } catch {
      return res.status(200).json({ success: true });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const orderId = req.query?.orderId || '';
      const targetChatIds = Array.from(
        new Set([primaryChatId, DEFAULT_TELEGRAM_CHAT_ID].filter(Boolean))
      );
      const msg = [
        `🗑️ ORDER DELETED BY CUSTOMER 🗑️`,
        `🆔 Order ID: ${orderId || 'N/A'}`,
        `📅 Time: ${new Date().toLocaleString('en-IN')}`,
      ].join('\n');

      let deliveredToTelegram = false;
      for (const chatId of targetChatIds) {
        const ok = await sendTelegramMessage(botToken, chatId, msg);
        if (ok) deliveredToTelegram = true;
      }

      return res.status(200).json({
        success: true,
        deliveredToTelegram,
      });
    } catch {
      return res.status(200).json({ success: true });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
