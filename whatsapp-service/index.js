const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

const SHARED_SECRET = process.env.WHATSAPP_SHARED_SECRET || 'dev-only-change-me';

let isReady = false;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' }),
  puppeteer: {
    headless: true,
    executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
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
    const chatId = to.replace(/^\+/, '') + '@c.us';
    await client.sendMessage(chatId, message);
    console.log(`📤 Sent to ${to}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`❌ Failed to send to ${to}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /status
app.get('/status', (req, res) => {
  res.json({ ready: isReady });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 FlexiWork WhatsApp service running on http://localhost:${PORT}`);
  console.log('   Waiting for WhatsApp to initialize...\n');
});
