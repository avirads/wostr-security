/* global Pear */
import http from 'http'
import { WebSocketServer } from 'ws'
import ui from 'pear-electron'

// Window UI elements
const connectBtn = document.getElementById('connect-btn')
const disconnectBtn = document.getElementById('disconnect-btn')
const connectSection = document.getElementById('connect-section')
const statusIndicator = document.getElementById('status-indicator')
const warningMessage = document.getElementById('warning-message')
const statusMsg = document.querySelector('.status-msg')

let server = null
const BRIDGE_PORT = 8989

const BRIDGE_HTML = `<!DOCTYPE html>
<html>
<head>
    <title>Kaspa Bridge</title>
    <style>
        body {
            background: #0f172a;
            color: #f8fafc;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .card {
            background: #1e293b;
            padding: 2rem;
            border-radius: 1rem;
            text-align: center;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            border: 1px solid #334155;
            max-width: 400px;
        }
        .status {
            color: #94a3b8;
            font-size: 0.9rem;
            margin-top: 1rem;
        }
        .spinner {
            border: 3px solid rgba(255, 255, 255, 0.1);
            border-left-color: #38bdf8;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1.5rem;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="card">
        <div class="spinner"></div>
        <h2 id="title">Connecting to KasWare...</h2>
        <p id="msg">Please approve the connection in your wallet extension.</p>
        <div id="status" class="status">Waiting for Extension...</div>
    </div>
    <script>
        const port = window.location.port || 8989;
        const ws = new WebSocket(\`ws://localhost:\${port}\`);
        async function connectWallet(retries = 10) {
            const statusEl = document.getElementById('status');
            const titleEl = document.getElementById('title');
            const msgEl = document.getElementById('msg');
            if (typeof window.kasware === 'undefined') {
                if (retries > 0) {
                    statusEl.innerText = \`Searching for KasWare... (\${retries} attempts left)\`;
                    setTimeout(() => connectWallet(retries - 1), 500);
                    return;
                }
                titleEl.innerText = 'Wallet Not Found';
                msgEl.innerText = 'Please ensure KasWare is installed and active in this browser.';
                statusEl.innerText = 'Detection Failed';
                return;
            }
            try {
                statusEl.innerText = 'Connecting to Wallet...';
                const accounts = await window.kasware.requestAccounts();
                statusEl.innerText = 'Fetching KRC20 Balances...';
                const balance = await window.kasware.getBalance();
                let krc20 = [];
                if (window.kasware.getKRC20Balance) {
                    krc20 = await window.kasware.getKRC20Balance();
                }
                const data = { type: 'wallet_data', address: accounts[0], balance: balance.total, tokens: krc20 };
                ws.send(JSON.stringify(data));
                titleEl.innerText = 'Connected!';
                msgEl.innerText = 'Data securely bridged to Desktop.';
                statusEl.innerText = 'Success';
                setTimeout(() => window.close(), 2000);
            } catch (err) {
                titleEl.innerText = 'Connection Failed';
                msgEl.innerText = err.message;
                statusEl.innerText = 'Error';
            }
        }
        ws.onopen = () => {
            document.getElementById('status').innerText = 'Bridge Active';
            connectWallet();
        };
        ws.onerror = () => {
            document.getElementById('status').innerText = 'Bridge Error';
        };
    </script>
</body>
</html>`;

function startBridgeServer() {
  if (server) return

  const httpServer = http.createServer((req, res) => {
    if (req.url.startsWith('/bridge')) {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(BRIDGE_HTML)
    } else {
      res.writeHead(404)
      res.end()
    }
  })

  const wss = new WebSocketServer({ server: httpServer })

  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      const data = JSON.parse(message)
      if (data.type === 'wallet_data') {
        handleWalletData(data)
        ws.close()
        httpServer.close()
        server = null
      }
    })
  })

  httpServer.listen(BRIDGE_PORT, '127.0.0.1', () => {
    console.log(`Bridge server active on http://localhost:${BRIDGE_PORT}`)

    const bridgeUrl = `http://localhost:${BRIDGE_PORT}/bridge`

    setTimeout(() => {
      window.open(bridgeUrl, '_blank')
    }, 100)

    statusMsg.innerText = 'Bridge opened in browser. Awaiting wallet connection...'
  })

  server = httpServer
}

function handleWalletData(data) {
  connectSection.style.display = 'none'
  disconnectBtn.style.display = 'block'

  const hasTokens = data.tokens && data.tokens.length > 0 &&
    data.tokens.some(token => parseFloat(token.balance) > 0)

  if (hasTokens) {
    statusIndicator.className = 'status-indicator active'
    statusIndicator.style.display = 'block'
    warningMessage.style.display = 'none'
  } else {
    statusIndicator.className = 'status-indicator inactive'
    statusIndicator.style.display = 'block'
    warningMessage.style.display = 'block'
  }
}

function disconnectWallet() {
  connectSection.style.display = 'flex'
  disconnectBtn.style.display = 'none'
  statusIndicator.style.display = 'none'
  warningMessage.style.display = 'none'
  statusMsg.innerText = 'Connect your KasWare wallet to bridge KRC20 tokens.'
}

connectBtn.onclick = () => {
  statusMsg.innerText = 'Starting bridge server...'
  startBridgeServer()
}

disconnectBtn.onclick = () => {
  disconnectWallet()
}


// Window Controls
const self = ui.app
const Window = ui.Window

document.getElementById('min-btn').onclick = () => self.minimize().catch(console.error)

let isMaximized = false
const maxBtn = document.getElementById('max-btn')

maxBtn.onclick = async () => {
  try {
    if (isMaximized) {
      await self.restore()
      maxBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12"><rect width="10" height="10" x="1" y="1" fill="none" stroke="white"/></svg>'
      isMaximized = false
    } else {
      await self.maximize()
      maxBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12"><rect width="8" height="8" x="3" y="1" fill="none" stroke="white"/><rect width="8" height="8" x="1" y="3" fill="none" stroke="white"/></svg>'
      isMaximized = true
    }
  } catch (err) {
    console.error('Maximize/Restore error:', err)
  }
}

document.getElementById('close-btn').onclick = () => self.close().catch(console.error)

if (Pear.app) {
  Pear.app.onupdate = () => {
    console.log('App updated!')
  }
}

