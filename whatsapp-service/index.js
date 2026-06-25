const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

const SHARED_SECRET = process.env.WHATSAPP_SHARED_SECRET || 'dev-only-change-me';

let isReady = false;

// executablePath: only set it when CHROME_PATH is provided (e.g. a Windows dev box pointing at an
// installed Chrome). When unset, puppeteer falls back to its own bundled Chromium, which is what
// makes the service portable to a Linux container. Never hardcode an OS-specific path here.
// WHATSAPP_WEB_VERSION pins the WhatsApp Web build (via wppconnect's wa-version cache). Newer
// builds broke direct-message delivery in whatsapp-web.js (sends to real recipients failed with
// ack=-1; only self-messages worked). Pinning this older build restored delivery (verified
// 2026-06-24: ack=2 DELIVERED to a real third-party number). Bump only if WhatsApp forces it and
// re-verify delivery. Override via the WHATSAPP_WEB_VERSION env var if needed.
const PINNED_WEB_VERSION = process.env.WHATSAPP_WEB_VERSION || '2.3000.1038088231';

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  ...(PINNED_WEB_VERSION ? {
    webVersion: PINNED_WEB_VERSION,
    webVersionCache: {
      type: 'remote',
      remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${PINNED_WEB_VERSION}.html`,
    },
  } : {}),
  puppeteer: {
    headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

// First run: print QR code in terminal — scan with WhatsApp once, never again
client.on('qr', (qr) => {
  console.log('\n========================================');
  console.log('  Scan this QR code with your WhatsApp');
  console.log('  WhatsApp > Linked Devices > Link a Device');
  console.log('========================================\n');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
  console.log('✅ WhatsApp authenticated — session saved.');
});

client.on('ready', () => {
  isReady = true;
  console.log('✅ WhatsApp client ready. FlexiWork can now send messages.');
});

client.on('disconnected', (reason) => {
  isReady = false;
  console.warn('⚠️  WhatsApp disconnected:', reason);
});

client.initialize();

// ── REST API ──────────────────────────────────────────────────────────────────

// POST /send  { to: "+94771234567", message: "Hello" }
app.post('/send', async (req, res) => {
  if (req.header('X-Internal-Secret') !== SHARED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Both "to" and "message" are required.' });
  }
  if (!isReady) {
    return res.status(503).json({ error: 'WhatsApp client not ready yet. Check terminal for QR code.' });
  }

  try {
    const numberId = await client.getNumberId(to.replace(/^\+/, ''));
    if (!numberId) {
      console.warn(`⚠️  ${to} is not registered on WhatsApp — message not sent.`);
      return res.status(422).json({ error: `${to} is not registered on WhatsApp.` });
    }
    const sent = await client.sendMessage(numberId._serialized, message);
    console.log(`📤 Sent to ${to} (resolved id: ${numberId._serialized})`);

    // Wait briefly for the delivery acknowledgement so callers can tell a real
    // delivery from a silent failure. ack levels: -1 error, 0 pending, 1 server,
    // 2 device (delivered), 3 read. Anything >= 2 means it reached the recipient.
    const ack = await new Promise((resolve) => {
      if (sent.ack >= 2) return resolve(sent.ack);
      const onAck = (msg, a) => {
        if (msg.id._serialized === sent.id._serialized && a >= 2) {
          client.removeListener('message_ack', onAck);
          resolve(a);
        }
      };
      client.on('message_ack', onAck);
      setTimeout(() => { client.removeListener('message_ack', onAck); resolve(sent.ack); }, 6000);
    });
    const ackName = { '-1': 'ERROR', 0: 'PENDING', 1: 'SERVER_ONLY', 2: 'DELIVERED', 3: 'READ' }[ack] || String(ack);
    console.log(`   ack=${ack} (${ackName})`);
    // ack === -1 means WhatsApp actively rejected delivery (e.g. the recipient can't be
    // reached). Report it as a failure so callers don't treat a dead-on-arrival message as
    // sent. ack 0/1 within the wait window is still in-flight, so we report those as success.
    if (ack === -1) {
      console.warn(`⚠️  Delivery failed for ${to} (ack=-1). Recipient may be unreachable.`);
      return res.status(502).json({ success: false, ack, ackName, error: 'WhatsApp rejected delivery to this recipient.' });
    }
    res.json({ success: true, ack, ackName });
  } catch (err) {
    console.error(`❌ Failed to send to ${to}:`, err.message);
    // Puppeteer's underlying page/frame died (e.g. the linked WhatsApp
    // session was invalidated or reused on another machine) — mark not
    // ready instead of letting every future /send fail the same silent way.
    if (/detached frame|session closed|protocol error/i.test(err.message)) {
      isReady = false;
      console.error('   WhatsApp session appears dead. Restart this service and re-scan the QR code.');
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /status
app.get('/status', (req, res) => {
  res.json({ ready: isReady });
});

// GET /check/:number — read-only registration lookup, sends nothing. Lets the backend (or you,
// while debugging) confirm a number can actually receive WhatsApp messages before relying on it.
app.get('/check/:number', async (req, res) => {
  if (req.header('X-Internal-Secret') !== SHARED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!isReady) {
    return res.status(503).json({ error: 'WhatsApp client not ready yet.' });
  }
  const numberId = await client.getNumberId(req.params.number.replace(/^\+/, ''));
  res.json({ number: req.params.number, registered: !!numberId });
});

// GET /me — which WhatsApp account is this session logged in as. Read-only, sends nothing.
app.get('/me', (req, res) => {
  if (req.header('X-Internal-Secret') !== SHARED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!isReady || !client.info) {
    return res.status(503).json({ error: 'WhatsApp client not ready yet.' });
  }
  res.json({ linkedNumber: '+' + client.info.wid.user, pushname: client.info.pushname });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 FlexiWork WhatsApp service running on http://localhost:${PORT}`);
  console.log('   Waiting for WhatsApp to initialize...\n');
});
