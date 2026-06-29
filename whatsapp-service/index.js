const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');
const fs = require('fs');

const app = express();
app.use(express.json());

const SHARED_SECRET = process.env.WHATSAPP_SHARED_SECRET || 'dev-only-change-me';
const SESSION_PATH = './baileys_session';
const PORT = process.env.PORT || 3001;

let sock = null;
let isReady = false;
let pairingRequested = false;
let reconnectTimer = null;

// ── Helpers ─────────────────────────────────────────────────────────────────

function wipeSession() {
  try {
    fs.rmSync(SESSION_PATH, { recursive: true, force: true });
    console.log(' Session folder wiped.');
  } catch (e) {
    console.error('⚠️  Failed to wipe session:', e.message);
  }
}

function formatNumber(raw) {
  let n = raw.replace(/[^0-9]/g, '');
  if (n.startsWith('0') && n.length === 10) {
    n = '94' + n.substring(1); // 07x → 947x
  } else if (!n.startsWith('94') && n.length === 9) {
    n = '94' + n;              // 7x  → 947x
  }
  return n + '@s.whatsapp.net';
}

// ── Core WhatsApp connector ──────────────────────────────────────────────────

async function connectToWhatsApp() {
  if (reconnectTimer) clearTimeout(reconnectTimer);

  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    logger: pino({ level: 'silent' }),
    syncFullHistory: false,          // avoids heavy sync that triggers ghost sessions
    markOnlineOnConnect: false,
    getMessage: async () => undefined, // prevents crash on missing pre-key messages
  });

  // ── Request pairing code (only once per fresh session) ──────────────────
  if (!sock.authState.creds.registered && !pairingRequested) {
    pairingRequested = true;
    setTimeout(async () => {
      const phone = (process.env.WA_PHONE || '94719731494').replace(/[^0-9]/g, '');
      try {
        console.log(`\n📡 Requesting pairing code for: ${phone}`);
        const code = await sock.requestPairingCode(phone);
        const formatted = code.match(/.{1,4}/g).join('-').toUpperCase();
        console.log('\n══════════════════════════════════════');
        console.log(`PAIRING CODE: [ ${formatted} ]`);
        console.log('══════════════════════════════════════\n');
      } catch (err) {
        console.error('❌ Pairing code request failed:', err.message);
        pairingRequested = false; // allow retry
      }
    }, 5000);
  }

  // ── Connection events ────────────────────────────────────────────────────
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    const statusCode = lastDisconnect?.error?.output?.statusCode;

    if (connection === 'open') {
      isReady = true;
      pairingRequested = false;
      console.log('✅ WhatsApp connected and ready.');
      return;
    }

    if (connection === 'close') {
      isReady = false;
      console.log(`Connection closed — status: ${statusCode}`);

      // 405 = connectionReplaced (ghost session / duplicate)
      if (
          statusCode === 405 ||
          statusCode === DisconnectReason.connectionReplaced
      ) {
        console.log('Ghost session detected. Wiping and restarting cleanly...');
        wipeSession();
        // Give Railway 15 s to fully kill the old container before restarting.
        // process.exit(1) signals Railway to redeploy a fresh instance.
        console.log('Exiting in 15 s to let Railway clean up old containers...');
        setTimeout(() => process.exit(1), 15_000);
        return;
      }

      // 401 = logged out (user removed device from WhatsApp)
      if (statusCode === DisconnectReason.loggedOut) {
        console.log('Logged out. Wiping session. Re-pair needed.');
        wipeSession();
        pairingRequested = false;
        reconnectTimer = setTimeout(connectToWhatsApp, 5000);
        return;
      }

      // All other drops — reconnect after 10 s
      console.log('Reconnecting in 10 s...');
      reconnectTimer = setTimeout(connectToWhatsApp, 10_000);
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// ── Boot (3 s grace for Railway to kill the previous container first) ────────
setTimeout(connectToWhatsApp, 3000);

// ── REST API ─────────────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  if (req.header('X-Internal-Secret') !== SHARED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// POST /send  — send a verification code (or any message)
app.post('/send', authMiddleware, async (req, res) => {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: '"to" and "message" are required.' });
  }
  if (!isReady || !sock) {
    return res.status(503).json({ error: 'WhatsApp client not ready.' });
  }

  try {
    const jid = formatNumber(to);


    let onWa;
    try {
      onWa = await sock.onWhatsApp(jid);
    } catch (e) {
      console.warn(`onWhatsApp lookup failed for ${jid}: ${e.message}`);
      onWa = null;
    }
    if (onWa !== null) {
      const registered = Array.isArray(onWa) && onWa.some((r) => r && r.exists && r.jid);
      if (!registered) {
        console.warn(`Number not on WhatsApp: ${jid}`);
        return res.status(422).json({ error: 'This number is not registered on WhatsApp.' });
      }
    }

    await sock.sendMessage(jid, { text: message });
    console.log(`Message sent to: ${jid}`);
    res.json({ success: true, sentTo: jid });
  } catch (err) {
    console.error(`❌ Send failed for ${to}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /status — health check
app.get('/status', (_req, res) => {
  res.json({ ready: isReady });
});

app.listen(PORT, () => {
  console.log(`\nFlexiWork WhatsApp service on port ${PORT}`);
});