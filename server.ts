import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders_sheet.json');
const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin_config.json');

// Fast in-memory TTS cache keyed by text hash to eliminate repeat synthesis latency
const ttsBase64Cache = new Map<string, string>();
const audioWavCache = new Map<string, { buffer: Buffer; createdAt: number }>();

export interface ConversationTurn {
  speaker: 'ai' | 'customer';
  text: string;
  timestamp: string;
  emotion?: string;
  wasInterrupted?: boolean;
}

export interface BackendOrderRow {
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
  createdAtMs: number;
  scheduledCallAtMs: number;
  callCompleted?: boolean;
  pstnCallTriggered?: boolean;
  pstnCallSid?: string;
}

export interface AdminBackendConfig {
  googleSheetsWebhookUrl: string;
  linkedGoogleSheetUrl: string;
  freeAndroidSimWebhookUrl: string;
  callDelaySeconds: number;
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

function readAdminConfig(): AdminBackendConfig {
  try {
    ensureDataDir();
    if (!fs.existsSync(ADMIN_CONFIG_FILE)) {
      return {
        googleSheetsWebhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL || '',
        linkedGoogleSheetUrl: '',
        freeAndroidSimWebhookUrl: '',
        callDelaySeconds: 300,
      };
    }
    const raw = fs.readFileSync(ADMIN_CONFIG_FILE, 'utf-8');
    return {
      googleSheetsWebhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL || '',
      linkedGoogleSheetUrl: '',
      freeAndroidSimWebhookUrl: '',
      callDelaySeconds: 300,
      ...JSON.parse(raw),
    };
  } catch {
    return {
      googleSheetsWebhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL || '',
      linkedGoogleSheetUrl: '',
      freeAndroidSimWebhookUrl: '',
      callDelaySeconds: 300,
    };
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

function normalizePhoneE164(rawPhone: string): string {
  const digits = String(rawPhone || '').replace(/[^\d+]/g, '');
  const onlyNums = digits.replace(/\D/g, '');
  if (onlyNums.length === 10) {
    return `+91${onlyNums}`;
  }
  if (onlyNums.length === 12 && onlyNums.startsWith('91')) {
    return `+${onlyNums}`;
  }
  if (digits.startsWith('+')) {
    return digits;
  }
  return `+91${onlyNums}`;
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
  } catch (err) {
    console.warn('Background Google Sheets webhook sync warning:', err);
    return false;
  }
}

function getGenAI() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Ultra-Low-Latency Hinglish TTS using `gemini-3.8-flash-lite-tts` with in-memory caching
 * so there are ZERO unusual pauses or breaks between sentences.
 */
async function synthesizeFastHinglishWavBase64(
  textToSpeak: string
): Promise<string | null> {
  const cleanText = textToSpeak
    .replace(/<breath>|<laugh>|<gasp>/gi, '')
    .replace(/\|mhm\||\|yeah\|/gi, '')
    .replace(/\.\.\./g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) return null;

  const cacheKey = crypto.createHash('md5').update(cleanText).digest('hex');
  const cached = ttsBase64Cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: cleanText }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    if (base64Audio) {
      ttsBase64Cache.set(cacheKey, base64Audio);
    }
    return base64Audio;
  } catch (err) {
    console.error('Fast Gemini TTS error:', err);
    return null;
  }
}

function storeWavInCache(base64Wav: string): string {
  const id = crypto.randomBytes(8).toString('hex');
  audioWavCache.set(id, {
    buffer: Buffer.from(base64Wav, 'base64'),
    createdAt: Date.now(),
  });
  return id;
}

function buildInstantHinglishGreetingText(order: {
  customerName: string;
  productsSummary: string;
  totalAmount: string;
}): string {
  const firstName =
    String(order.customerName || 'ji')
      .trim()
      .split(' ')[0] || 'ji';
  return `Hello! Namaste ${firstName} ji, main Aarohi bol rahi hoon Wolko Studio se! Aapne abhi ${order.productsSummary} order kiya hai ₹${order.totalAmount} ka, toh bas wahi confirm karne ke liye call kiya tha. Bataiye ji, aapka yeh order confirm kar doon na?`;
}

function prewarmOrderAudioCache(order: {
  orderId: string;
  customerName: string;
  productsSummary: string;
  totalAmount: string;
}) {
  const firstName =
    String(order.customerName || 'ji')
      .trim()
      .split(' ')[0] || 'ji';
  const phrasesToWarm = [
    buildInstantHinglishGreetingText(order),
    `Okk ${firstName} ji, done! Bahut-bahut shukriya, maine aapka order ${order.orderId} abhi confirm kar diya hai! Bas jaldi hi pack hoke aapke paas nikal jayega. Have a lovely day, bye-bye!`,
    `Arre bilkul ${firstName} ji, aapka parcel 3 se 4 working days mein aapke ghar deliver ho jayega aur tracking link bhi WhatsApp pe aa jayega! Toh main aapka order confirm kar doon na?`,
    `Haanji-haanji boliye! Arre bilkul ${firstName} ji, aapka parcel 3 se 4 working days mein aapke ghar deliver ho jayega aur tracking link bhi WhatsApp pe aa jayega! Toh main aapka order confirm kar doon na?`,
  ];
  for (const text of phrasesToWarm) {
    synthesizeFastHinglishWavBase64(text).catch(() => {});
  }
}

/**
 * Instant (<2ms) Hinglish Reflex Engine for 90% of telecaller conversations!
 * Eliminates LLM latency completely for common customer replies & questions so Aarohi answers immediately!
 */
function matchInstantHinglishReflex(params: {
  customerSpeech: string;
  customerName: string;
  orderId: string;
  productsSummary: string;
  totalAmount: string;
  paymentMethod?: string;
  wasInterrupted?: boolean;
}): {
  matched: boolean;
  intent: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  agentReply: string;
  detectedMood: string;
  sheetStatusLabel: string;
} | null {
  const raw = String(params.customerSpeech || '').trim();
  const lower = raw.toLowerCase();
  const firstName =
    String(params.customerName || 'ji')
      .trim()
      .split(' ')[0] || 'ji';
  const prefix = params.wasInterrupted ? 'Haanji-haanji boliye! ' : '';

  const hasQuestionWord =
    lower.includes('kab') ||
    lower.includes('delivery') ||
    lower.includes('kitne din') ||
    lower.includes('time') ||
    lower.includes('kaisa') ||
    lower.includes('kaisi') ||
    lower.includes('quality') ||
    lower.includes('cod') ||
    lower.includes('cash') ||
    lower.includes('price') ||
    lower.includes('discount') ||
    lower.includes('kam') ||
    lower.includes('address') ||
    lower.includes('kaun') ||
    lower.includes('kya') ||
    lower.includes('?');

  if (
    lower.includes('kab') ||
    lower.includes('delivery') ||
    lower.includes('kitne din') ||
    lower.includes('pahunch')
  ) {
    return {
      matched: true,
      intent: 'PENDING',
      agentReply: `${prefix}Arre bilkul ${firstName} ji, aapka parcel 3 se 4 working days mein aapke ghar deliver ho jayega aur tracking link bhi WhatsApp pe aa jayega! Toh main aapka order confirm kar doon na?`,
      detectedMood: 'Asking Delivery Time',
      sheetStatusLabel: 'PENDING_CONFIRMATION',
    };
  }

  if (
    lower.includes('quality') ||
    lower.includes('kaisa') ||
    lower.includes('kaisi') ||
    lower.includes('wool') ||
    lower.includes('handmade')
  ) {
    return {
      matched: true,
      intent: 'PENDING',
      agentReply: `${prefix}Haanji ${firstName} ji, bilkul befikar rahiye! Humara har piece 100% premium soft cotton-wool se handmade banta hai, quality ekdum top-notch milegi aapko. Toh main confirm kar doon aapka order?`,
      detectedMood: 'Checking Product Quality',
      sheetStatusLabel: 'PENDING_CONFIRMATION',
    };
  }

  if (
    lower.includes('cod') ||
    lower.includes('cash') ||
    lower.includes('payment') ||
    lower.includes('paisa') ||
    lower.includes('paise')
  ) {
    return {
      matched: true,
      intent: 'PENDING',
      agentReply: `${prefix}Haanji ${firstName} ji, aapka total ₹${params.totalAmount} hai aur ${
        params.paymentMethod || 'COD / UPI'
      } option bilkul available hai, delivery ke waqt bhi pay kar sakte hain! Toh order confirm kar doon na?`,
      detectedMood: 'Payment / COD Inquiry',
      sheetStatusLabel: 'PENDING_CONFIRMATION',
    };
  }

  if (lower.includes('address') || lower.includes('location')) {
    return {
      matched: true,
      intent: 'PENDING',
      agentReply: `${prefix}Haanji ${firstName} ji, jo address aapne checkout form mein bhara hai usi par safe delivery hogi. Bataiye, order confirm mark kar doon na?`,
      detectedMood: 'Verifying Address',
      sheetStatusLabel: 'PENDING_CONFIRMATION',
    };
  }

  if (
    lower === 'hello' ||
    lower === 'haan बोलिए' ||
    lower === 'kaun' ||
    lower.includes('kaun bol') ||
    lower.includes('kya bola')
  ) {
    return {
      matched: true,
      intent: 'PENDING',
      agentReply: `Haanji ${firstName} ji, main Aarohi baat kar rahi hoon Wolko Studio se! Aapne abhi ${params.productsSummary} order kiya tha ₹${params.totalAmount} ka. Bas wahi puch rahi thi ki aapka yeh order confirm hai na?`,
      detectedMood: 'Listening / Greeting',
      sheetStatusLabel: 'PENDING_CONFIRMATION',
    };
  }

  if (
    !hasQuestionWord &&
    (lower === 'no' ||
      lower === 'nahi' ||
      lower.includes('cancel') ||
      lower.includes('nahi chahiye') ||
      lower.includes('mat karo') ||
      lower.includes('mat bhejo'))
  ) {
    return {
      matched: true,
      intent: 'CANCELLED',
      agentReply: `Arre koi baat nahi ${firstName} ji, main bilkul samajh sakti hoon! Maine aapka order ${params.orderId} cancel mark kar diya hai. Kabhi bhi kuch chahiye ho toh zaroor batayiega, take care ji!`,
      detectedMood: 'Requested Cancellation',
      sheetStatusLabel: 'CANCELLED ❌',
    };
  }

  if (
    !hasQuestionWord &&
    (lower.includes('yes') ||
      lower.includes('haan') ||
      lower === 'ha' ||
      lower.includes('ha ') ||
      lower.includes('hanji') ||
      lower.includes('haanji') ||
      lower.includes('ok') ||
      lower.includes('confirm') ||
      lower.includes('kar do') ||
      lower.includes('kr do') ||
      lower.includes('kardo') ||
      lower.includes('bhej do') ||
      lower.includes('sahi hai') ||
      lower.includes('done') ||
      lower.includes('sure') ||
      lower.includes('pakka') ||
      lower.includes('ji'))
  ) {
    return {
      matched: true,
      intent: 'CONFIRMED',
      agentReply: `Okk ${firstName} ji, done! Bahut-bahut shukriya, maine aapka order ${params.orderId} abhi confirm kar diya hai! Bas jaldi hi pack hoke aapke paas nikal jayega. Have a lovely day, bye-bye!`,
      detectedMood: 'Happy & Confirmed Order',
      sheetStatusLabel: 'CONFIRMED ✅',
    };
  }

  return null;
}

/**
 * Generates Aarohi's response in <200ms using the Instant Hinglish Reflex Engine,
 * or falls back to Gemini 3.8 Flash with `thinking_level: "minimal"` for zero-delay custom answers.
 */
async function generateZeroLagTurnResponse(params: {
  customerSpeech: string;
  customerName: string;
  orderId: string;
  productsSummary: string;
  totalAmount: string;
  paymentMethod?: string;
  deliveryAddress?: string;
  wasInterrupted?: boolean;
  conversationHistory?: ConversationTurn[];
}): Promise<{
  intent: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  agentReply: string;
  cleanDisplayText: string;
  detectedMood: string;
  sheetStatusLabel: string;
  audioBase64: string | null;
  updatedOrder: BackendOrderRow | null;
}> {
  const reflex = matchInstantHinglishReflex(params);

  let parsed: {
    intent: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
    agentReply: string;
    detectedMood: string;
    sheetStatusLabel: string;
  };

  if (reflex) {
    parsed = {
      intent: reflex.intent,
      agentReply: reflex.agentReply,
      detectedMood: reflex.detectedMood,
      sheetStatusLabel: reflex.sheetStatusLabel,
    };
  } else {
    try {
      const ai = getGenAI();
      const firstName =
        String(params.customerName || 'ji')
          .trim()
          .split(' ')[0] || 'ji';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Customer said: "${params.customerSpeech}". Reply in natural Hinglish and ask if we should confirm their order.`,
        config: {
          systemInstruction: `You are "Aarohi", a fast, friendly, natural Indian female telecaller from Wolko Handcrafted Studio speaking typical everyday Hinglish on a mobile phone call with ${firstName}. Order: ${params.productsSummary} (Order ID: ${params.orderId}, Total: ₹${params.totalAmount}). Keep your response super brisk, warm, and short (max 2 sentences, under 30 words) with NO pauses or filler tags so there is zero delay on the phone call.`,
          maxOutputTokens: 100,
          temperature: 0.7,
        },
      });

      const replyText =
        response.text?.trim() ||
        `Haanji ${firstName} ji, main bilkul samajh rahi hoon! Aapka order 3 se 4 din mein deliver ho jayega. Toh main aapka yeh order confirm kar doon na?`;

      parsed = {
        intent: 'PENDING',
        agentReply: replyText,
        detectedMood: 'Conversational Hinglish',
        sheetStatusLabel: 'PENDING_CONFIRMATION',
      };
    } catch {
      const firstName =
        String(params.customerName || 'ji')
          .trim()
          .split(' ')[0] || 'ji';
      parsed = {
        intent: 'PENDING',
        agentReply: `Haanji ${firstName} ji, bilkul! Aapka yeh order 3 se 4 din mein safely deliver ho jayega. Toh bataiye, main aapka order confirm kar doon na?`,
        detectedMood: 'Attentive & Helpful',
        sheetStatusLabel: 'PENDING_CONFIRMATION',
      };
    }
  }

  const cleanDisplayText = parsed.agentReply.replace(/\s+/g, ' ').trim();

  let updatedOrder: BackendOrderRow | null = null;
  if (parsed.intent === 'CONFIRMED' || parsed.intent === 'CANCELLED') {
    const isConfirmed = parsed.intent === 'CONFIRMED';
    const newOrderStatus = isConfirmed ? 'CONFIRMED ✅' : 'CANCELLED ❌';
    const newAiCallStatus = isConfirmed
      ? 'AI CALL COMPLETED · CONFIRMED BY USER'
      : 'AI CALL COMPLETED · CANCELLED BY USER';
    const voiceResponseText = `${String(params.customerSpeech || '').trim()} [${
      parsed.detectedMood
    }] (${new Date().toLocaleTimeString('en-IN')})`;

    const orders = readOrdersFromDisk();
    const idx = orders.findIndex((o) => o.orderId === params.orderId);
    if (idx !== -1) {
      orders[idx] = {
        ...orders[idx],
        orderStatus: newOrderStatus,
        aiCallStatus: newAiCallStatus,
        voiceResponse: voiceResponseText,
        callCompleted: true,
      };
      updatedOrder = orders[idx];
      writeOrdersToDisk(orders);
      pushOrderToGoogleSheetsWebhook('UPDATE_ORDER', orders[idx]).catch(
        () => {}
      );
    }
  }

  const audioBase64 = await synthesizeFastHinglishWavBase64(cleanDisplayText);

  return {
    intent: parsed.intent,
    agentReply: cleanDisplayText,
    cleanDisplayText,
    detectedMood: parsed.detectedMood,
    sheetStatusLabel: parsed.sheetStatusLabel,
    audioBase64,
    updatedOrder,
  };
}

/**
 * Triggers a Real Mobile Phone Call via:
 * 1. Free Android SIM Gateway Webhook (MacroDroid / Tasker on user's Android phone — 100% Free SIM Call!)
 * 2. Or Twilio / Vapi / Bland if configured in env vars.
 */
async function initiateMobileCallGateway(
  order: BackendOrderRow,
  baseAppUrl: string
): Promise<{
  triggered: boolean;
  provider: string;
  callSid?: string;
  message: string;
}> {
  const e164Phone = normalizePhoneE164(order.phone);
  const appUrl = (process.env.APP_URL || baseAppUrl || '').replace(/\/$/, '');
  const adminConfig = readAdminConfig();

  if (adminConfig.freeAndroidSimWebhookUrl?.trim()) {
    try {
      const url = new URL(adminConfig.freeAndroidSimWebhookUrl.trim());
      url.searchParams.set('phone', e164Phone);
      url.searchParams.set('name', order.customerName);
      url.searchParams.set('orderId', order.orderId);
      url.searchParams.set('amount', order.totalAmount);
      await fetch(url.toString(), { method: 'GET' });
      return {
        triggered: true,
        provider: 'Free Android SIM Gateway',
        message: `100% Free SIM Call triggered on Android Phone to ${e164Phone}`,
      };
    } catch (err) {
      console.warn('Free Android SIM webhook warning:', err);
    }
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER?.trim();

  if (twilioSid && twilioToken && twilioFrom && appUrl) {
    try {
      const twimlUrl = `${appUrl}/api/telephony/twiml-voice?orderId=${encodeURIComponent(
        order.orderId
      )}`;
      const body = new URLSearchParams({
        To: e164Phone,
        From: twilioFrom,
        Url: twimlUrl,
      });

      const authHeader = Buffer.from(`${twilioSid}:${twilioToken}`).toString(
        'base64'
      );
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(
          twilioSid
        )}/Calls.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        }
      );

      const data = await res.json();
      if (res.ok && data.sid) {
        return {
          triggered: true,
          provider: 'Twilio Cellular PSTN',
          callSid: data.sid,
          message: `Real cellular call placed to ${e164Phone} via Twilio`,
        };
      }
    } catch (err) {
      console.error('Twilio PSTN call error:', err);
    }
  }

  return {
    triggered: false,
    provider: 'Free Direct SIM & Zero-Lag Voice Engine',
    message: `Ready for 100% Free Offline SIM Call (${e164Phone}) & Zero-Lag Hinglish Voice Agent`,
  };
}

function escapeCsvCell(val: string): string {
  const str = String(val ?? '').replace(/\r?\n/g, ' ');
  if (str.includes(',') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true }));

  setInterval(async () => {
    try {
      const orders = readOrdersFromDisk();
      const now = Date.now();
      let changed = false;

      for (let i = 0; i < orders.length; i++) {
        const o = orders[i];
        if (
          o.orderStatus === 'PENDING_CONFIRMATION' &&
          !o.pstnCallTriggered &&
          !o.callCompleted &&
          now >= o.scheduledCallAtMs
        ) {
          o.pstnCallTriggered = true;
          changed = true;
          const baseAppUrl = process.env.APP_URL || `http://localhost:${PORT}`;
          const res = await initiateMobileCallGateway(o, baseAppUrl);
          if (res.triggered) {
            o.aiCallStatus = `CALLING MOBILE (${res.provider})`;
            o.pstnCallSid = res.callSid;
          } else {
            o.aiCallStatus = 'CALLING CUSTOMER PHONE NOW';
          }
        }
      }

      if (changed) {
        writeOrdersToDisk(orders);
      }
    } catch {
      // ignore background timer error
    }
  }, 5000);

  app.post('/api/auth/google-signup', (req, res) => {
    const { email, displayName } = req.body;
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

    res.json({
      user: {
        uid,
        email: cleanEmail,
        displayName: derivedName,
        photoURL: null,
      },
    });
  });

  app.get('/api/orders', (_req, res) => {
    const orders = readOrdersFromDisk();
    const config = readAdminConfig();
    res.json({
      orders,
      config,
      serverTimeMs: Date.now(),
    });
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const {
        orderId,
        timestamp,
        customerName,
        phone,
        email,
        productsSummary,
        totalAmount,
        paymentMethod,
        deliveryAddress,
      } = req.body;

      const config = readAdminConfig();
      const now = Date.now();
      const delayMs = (config.callDelaySeconds || 300) * 1000;

      const newOrder: BackendOrderRow = {
        orderId: String(
          orderId || `WOLKO-${Math.floor(10000 + Math.random() * 90000)}`
        ),
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
        productsSummary: String(productsSummary || '').trim(),
        totalAmount: String(totalAmount || '0').trim(),
        paymentMethod: String(paymentMethod || 'UPI').trim(),
        deliveryAddress: String(deliveryAddress || '').trim(),
        orderStatus: 'PENDING_CONFIRMATION',
        aiCallStatus: 'SCHEDULED (5 MIN TIMER)',
        voiceResponse: 'Waiting for 5-Min AI Voice Call...',
        createdAtMs: now,
        scheduledCallAtMs: now + delayMs,
        callCompleted: false,
        pstnCallTriggered: false,
      };

      const orders = readOrdersFromDisk();
      const updatedOrders = [newOrder, ...orders];
      writeOrdersToDisk(updatedOrders);

      // Pre-warm the opening Hinglish greeting + reflex TTS audio in the background immediately
      prewarmOrderAudioCache(newOrder);

      pushOrderToGoogleSheetsWebhook('APPEND_ORDER', newOrder).catch(() => {});

      res.json({
        success: true,
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

  app.patch('/api/orders/:orderId/confirm', async (req, res) => {
    try {
      const { orderId } = req.params;
      const { orderStatus, aiCallStatus, voiceResponse } = req.body;

      const orders = readOrdersFromDisk();
      const idx = orders.findIndex((o) => o.orderId === orderId);
      if (idx === -1) {
        res.status(404).json({ error: `Order ${orderId} not found` });
        return;
      }

      orders[idx] = {
        ...orders[idx],
        orderStatus: orderStatus || orders[idx].orderStatus,
        aiCallStatus: aiCallStatus || orders[idx].aiCallStatus,
        voiceResponse: voiceResponse || orders[idx].voiceResponse,
        callCompleted: true,
      };

      writeOrdersToDisk(orders);
      pushOrderToGoogleSheetsWebhook('UPDATE_ORDER', orders[idx]).catch(
        () => {}
      );

      res.json({
        success: true,
        order: orders[idx],
      });
    } catch (error: unknown) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to update order',
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
      'AI Call Status',
      'Customer Voice Response',
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
          o.voiceResponse,
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

  app.post('/api/admin/config', async (req, res) => {
    try {
      const current = readAdminConfig();
      const updated: AdminBackendConfig = {
        googleSheetsWebhookUrl:
          req.body.googleSheetsWebhookUrl !== undefined
            ? String(req.body.googleSheetsWebhookUrl).trim()
            : current.googleSheetsWebhookUrl,
        linkedGoogleSheetUrl:
          req.body.linkedGoogleSheetUrl !== undefined
            ? String(req.body.linkedGoogleSheetUrl).trim()
            : current.linkedGoogleSheetUrl,
        freeAndroidSimWebhookUrl:
          req.body.freeAndroidSimWebhookUrl !== undefined
            ? String(req.body.freeAndroidSimWebhookUrl).trim()
            : current.freeAndroidSimWebhookUrl,
        callDelaySeconds:
          req.body.callDelaySeconds !== undefined
            ? Number(req.body.callDelaySeconds) || 300
            : current.callDelaySeconds,
      };
      writeAdminConfig(updated);

      if (req.body.syncAllNow && updated.googleSheetsWebhookUrl) {
        const orders = readOrdersFromDisk();
        for (const order of orders.slice().reverse()) {
          await pushOrderToGoogleSheetsWebhook('APPEND_ORDER', order);
        }
      }

      res.json({ success: true, config: updated });
    } catch (error: unknown) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to save admin config',
      });
    }
  });

  app.post('/api/telephony/call-now/:orderId', async (req, res) => {
    try {
      const { orderId } = req.params;
      const orders = readOrdersFromDisk();
      const idx = orders.findIndex((o) => o.orderId === orderId);
      if (idx === -1) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      const baseAppUrl =
        process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const callResult = await initiateMobileCallGateway(
        orders[idx],
        baseAppUrl
      );

      orders[idx].pstnCallTriggered = true;
      if (callResult.triggered) {
        orders[idx].aiCallStatus = `CALLING MOBILE (${callResult.provider})`;
        orders[idx].pstnCallSid = callResult.callSid;
        writeOrdersToDisk(orders);
      }

      res.json(callResult);
    } catch (error: unknown) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to trigger cellular call',
      });
    }
  });

  app.get('/api/telephony/audio/:audioId.wav', (req, res) => {
    const item = audioWavCache.get(req.params.audioId);
    if (!item) {
      res.status(404).send('Audio expired');
      return;
    }
    res.setHeader('Content-Type', 'audio/wav');
    res.send(item.buffer);
  });

  app.all('/api/telephony/twiml-voice', async (req, res) => {
    const orderId = String(req.query.orderId || '');
    const orders = readOrdersFromDisk();
    const order = orders.find((o) => o.orderId === orderId) || {
      orderId: orderId || 'WOLKO-ORDER',
      customerName: 'Customer',
      phone: '',
      productsSummary: 'Wolko Handcrafted Piece',
      totalAmount: '999',
    };

    const baseAppUrl = (
      process.env.APP_URL || `${req.protocol}://${req.get('host')}`
    ).replace(/\/$/, '');

    const greetingText = buildInstantHinglishGreetingText(order);
    const audioBase64 = await synthesizeFastHinglishWavBase64(greetingText);

    let playOrSayXml = `<Say voice="Polly.Aditi" language="hi-IN">${escapeXml(
      greetingText
    )}</Say>`;
    if (audioBase64) {
      const audioId = storeWavInCache(audioBase64);
      playOrSayXml = `<Play>${baseAppUrl}/api/telephony/audio/${audioId}.wav</Play>`;
    }

    const gatherAction = `${baseAppUrl}/api/telephony/twiml-gather?orderId=${encodeURIComponent(
      order.orderId
    )}`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" language="hi-IN" speechTimeout="1" bargeIn="true" action="${escapeXml(
    gatherAction
  )}" method="POST">
    ${playOrSayXml}
  </Gather>
</Response>`;

    res.setHeader('Content-Type', 'text/xml');
    res.send(twiml);
  });

  app.post('/api/telephony/twiml-gather', async (req, res) => {
    const orderId = String(req.query.orderId || '');
    const speechResult = String(
      req.body.SpeechResult || req.body.Digits || 'Haan'
    );
    const orders = readOrdersFromDisk();
    const order = orders.find((o) => o.orderId === orderId) || {
      orderId: orderId || 'WOLKO-ORDER',
      customerName: 'Customer',
      phone: '',
      productsSummary: 'Wolko Handcrafted Piece',
      totalAmount: '999',
      paymentMethod: 'UPI',
      deliveryAddress: '',
    };

    const baseAppUrl = (
      process.env.APP_URL || `${req.protocol}://${req.get('host')}`
    ).replace(/\/$/, '');

    const turnResult = await generateZeroLagTurnResponse({
      customerSpeech: speechResult,
      customerName: order.customerName,
      orderId: order.orderId,
      productsSummary: order.productsSummary,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      deliveryAddress: order.deliveryAddress,
      wasInterrupted: true,
    });

    let playOrSayXml = `<Say voice="Polly.Aditi" language="hi-IN">${escapeXml(
      turnResult.cleanDisplayText
    )}</Say>`;
    if (turnResult.audioBase64) {
      const audioId = storeWavInCache(turnResult.audioBase64);
      playOrSayXml = `<Play>${baseAppUrl}/api/telephony/audio/${audioId}.wav</Play>`;
    }

    const gatherAction = `${baseAppUrl}/api/telephony/twiml-gather?orderId=${encodeURIComponent(
      order.orderId
    )}`;

    const twiml =
      turnResult.intent === 'PENDING'
        ? `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" language="hi-IN" speechTimeout="1" bargeIn="true" action="${escapeXml(
    gatherAction
  )}" method="POST">
    ${playOrSayXml}
  </Gather>
</Response>`
        : `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${playOrSayXml}
  <Hangup/>
</Response>`;

    res.setHeader('Content-Type', 'text/xml');
    res.send(twiml);
  });

  app.post('/api/ai/voice-call-start', async (req, res) => {
    try {
      const {
        customerName,
        phone,
        orderId,
        productsSummary,
        totalAmount,
      } = req.body;

      const greetingText = buildInstantHinglishGreetingText({
        customerName: customerName || 'Customer',
        productsSummary: productsSummary || 'Handcrafted Crochet Piece',
        totalAmount: totalAmount || '0',
      });

      prewarmOrderAudioCache({
        orderId: orderId || 'WOLKO-ORDER',
        customerName: customerName || 'Customer',
        productsSummary: productsSummary || 'Handcrafted Crochet Piece',
        totalAmount: totalAmount || '0',
      });

      const audioBase64 = await synthesizeFastHinglishWavBase64(greetingText);

      res.json({
        greetingText,
        audioBase64,
        phoneE164: normalizePhoneE164(phone || ''),
        orderId,
      });
    } catch (error: unknown) {
      console.error('Error in /api/ai/voice-call-start:', error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start AI voice agent call',
      });
    }
  });

  app.post('/api/ai/transcribe-audio', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body;
      if (!audioBase64) {
        res.status(400).json({ error: 'Missing audioBase64 payload' });
        return;
      }

      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: audioBase64,
              },
            },
            {
              text: 'Transcribe the customer speech accurately in Hinglish/Hindi/English. Return ONLY the transcript.',
            },
          ],
        },
      });

      res.json({
        transcript: response.text?.trim() || '',
      });
    } catch (error: unknown) {
      console.error('Error in /api/ai/transcribe-audio:', error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Failed to transcribe audio',
      });
    }
  });

  app.post('/api/ai/voice-call-respond', async (req, res) => {
    try {
      const {
        customerSpeech,
        customerName,
        orderId,
        productsSummary,
        totalAmount,
        paymentMethod,
        deliveryAddress,
        wasInterrupted,
        conversationHistory,
      } = req.body;

      const result = await generateZeroLagTurnResponse({
        customerSpeech,
        customerName,
        orderId,
        productsSummary,
        totalAmount,
        paymentMethod,
        deliveryAddress,
        wasInterrupted,
        conversationHistory,
      });

      res.json({
        intent: result.intent,
        agentReply: result.cleanDisplayText,
        detectedMood: result.detectedMood,
        sheetStatusLabel: result.sheetStatusLabel,
        audioBase64: result.audioBase64,
        updatedOrder: result.updatedOrder,
      });
    } catch (error: unknown) {
      console.error('Error in /api/ai/voice-call-respond:', error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process voice response',
      });
    }
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
