// Web edition: talks to the KasWare extension directly (no localhost bridge needed).
const connectBtn = document.getElementById('connect-btn')
const disconnectBtn = document.getElementById('disconnect-btn')
const statusIndicator = document.getElementById('status-indicator')
const warningMessage = document.getElementById('warning-message')
const statusMsg = document.querySelector('.status-msg')
const addrEl = document.getElementById('addr')
const tokensEl = document.getElementById('tokens')

const DEFAULT_MSG = 'Connect your KasWare wallet to check KRC20 tokens.'

function waitForKasware (retries = 10) {
  return new Promise((resolve, reject) => {
    const tick = (left) => {
      if (typeof window.kasware !== 'undefined') return resolve(window.kasware)
      if (left <= 0) return reject(new Error('KasWare not found. Install/unlock the extension and refresh.'))
      statusMsg.innerText = `Searching for KasWare... (${left} attempts left)`
      setTimeout(() => tick(left - 1), 500)
    }
    tick(retries)
  })
}

function tokenName (t) {
  return t.tick || t.ticker || t.name || t.ca || 'token'
}

function tokenAmount (t) {
  const raw = parseFloat(t.balance)
  const dec = parseInt(t.dec ?? t.decimals ?? 0, 10)
  if (!isFinite(raw)) return t.balance
  return dec ? (raw / 10 ** dec).toLocaleString() : raw.toLocaleString()
}

function render (data) {
  connectBtn.style.display = 'none'
  disconnectBtn.style.display = 'block'
  statusMsg.innerText = 'Wallet connected.'
  addrEl.innerText = data.address

  tokensEl.innerHTML = ''
  for (const t of data.tokens) {
    const li = document.createElement('li')
    const name = document.createElement('span')
    const amt = document.createElement('span')
    name.textContent = String(tokenName(t)).toUpperCase()
    amt.textContent = tokenAmount(t)
    li.append(name, amt)
    tokensEl.append(li)
  }

  const hasTokens = data.tokens.some(t => parseFloat(t.balance) > 0)
  statusIndicator.className = 'status-indicator ' + (hasTokens ? 'active' : 'inactive')
  statusIndicator.style.display = 'block'
  warningMessage.style.display = hasTokens ? 'none' : 'block'
}

async function connect () {
  connectBtn.disabled = true
  try {
    const kasware = await waitForKasware()
    statusMsg.innerText = 'Connecting to wallet...'
    const accounts = await kasware.requestAccounts()
    statusMsg.innerText = 'Fetching KRC20 balances...'
    let tokens = []
    if (kasware.getKRC20Balance) {
      const res = await kasware.getKRC20Balance()
      tokens = Array.isArray(res) ? res : (res?.list || res?.result || [])
    }
    render({ address: accounts[0], tokens })
  } catch (err) {
    statusMsg.innerText = err.message || String(err)
  } finally {
    connectBtn.disabled = false
  }
}

function disconnect () {
  connectBtn.style.display = 'inline-block'
  disconnectBtn.style.display = 'none'
  statusIndicator.style.display = 'none'
  warningMessage.style.display = 'none'
  addrEl.innerText = ''
  tokensEl.innerHTML = ''
  statusMsg.innerText = DEFAULT_MSG
}

connectBtn.onclick = connect
disconnectBtn.onclick = disconnect
