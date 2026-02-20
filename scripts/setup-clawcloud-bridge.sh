#!/bin/bash

# --- BEACON SMS BRIDGE (ULTRA-MINIMAL / NO-TIMEOUT) ---
# Designed to prevent terminal crashes/reconnects on ClawCloud.

echo "🚀 Starting Silent Setup..."
export DEBIAN_FRONTEND=noninteractive

# 1. Update (Minimal)
apt-get update -qq

# 2. Install Node.js 20 (Silent & Robust)
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs > /dev/null 2>&1
fi

# 3. Install Core Utils
echo "📦 Installing Services..."
npm install -g pm2 ts-node typescript ngrok --silent > /dev/null 2>&1

# 4. Ngrok Config
ngrok config add-authtoken 39vo2tyFJIl0UU44ycN4oBXa66W_7Th9XoxYCWUe6R6CU2nW5 > /dev/null 2>&1

# 5. Build Bridge
mkdir -p ~/beacon-bridge && cd ~/beacon-bridge
if [ ! -f package.json ]; then
    npm init -y --silent > /dev/null
    npm install express cors socket.io pako --silent > /dev/null
    npm install --save-dev @types/express @types/cors @types/pako @types/node typescript --silent > /dev/null
fi

# 6. Write Bridge JS directly (Skip compilation to avoid memory stress)
echo "✍️ Writing Bridge Service..."
cat <<EOF > SMSBridge.js
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const pako = require('pako');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' }, pingTimeout: 60000 });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/sms/inbound', (req, res) => {
  const { from, body } = req.body;
  try {
    const binary = Buffer.from(body, 'base64');
    const decompressed = pako.inflate(binary, { to: 'string' });
    io.emit('bridged_event', { from, payload: JSON.parse(decompressed) });
    res.status(200).send('OK');
  } catch (err) { res.status(400).send('ERR'); }
});

io.on('connection', (s) => {
  s.on('send_sms', (d) => {
    const comp = Buffer.from(pako.deflate(JSON.stringify(d.payload))).toString('base64');
    io.emit('sms_outbound_status', { to: d.to, payload: comp, status: 'queued' });
  });
});

httpServer.listen(3005, () => console.log('BRIDGE_READY'));
EOF

# 7. Auto-Start
echo "� Launching Processes..."
pm2 delete all > /dev/null 2>&1 || true
pm2 start SMSBridge.js --name beacon-bridge > /dev/null
pm2 start "ngrok http 3005" --name beacon-tunnel > /dev/null
pm2 save --silent > /dev/null

echo "✅ DONE!"
echo "-----------------------------------"
echo "Public URL:"
sleep 3
ngrok list | grep -o 'http[s]://[^ ]*'
echo "-----------------------------------"
echo "Monitor with: pm2 logs"
