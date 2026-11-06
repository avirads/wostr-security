// Web edition: talks to the KasWare extension directly (no localhost bridge needed).
const $ = (id) => document.getElementById(id)
const connectBtn = $('connect-btn')
const disconnectBtn = $('disconnect-btn')
const connectSection = $('connect-section')
const appSection = $('app-section')
const statusIndicator = $('status-indicator')
const warningMessage = $('warning-message')
const statusMsg = document.querySelector('.status-msg')
const addrEl = $('addr')
const tokensEl = $('tokens')
const noTokensEl = $('no-tokens')
const accessEl = $('access-status')
const kasEl = $('kas-balance')

const DEFAULT_MSG = 'Connect your KasWare wallet to check KRC20 tokens.'
const SOMPI = 1e8

function waitForKasware (retries = 10, quiet = false) {
  return new Promise((resolve, reject) => {
    const tick = (left) => {
      if (typeof window.kasware !== 'undefined') return resolve(window.kasware)
      if (left <= 0) return reject(new Error('KasWare not found. Install/unlock the extension and refresh.'))
      if (!quiet) statusMsg.innerText = `Searching for KasWare... (${left} attempts left)`
      setTimeout(() => tick(left - 1), 500)
    }
    tick(retries)
  })
}

const tokenName = (t) => t.tick || t.ticker || t.name || t.ca || 'token'

function tokenAmount (t) {
  const raw = parseFloat(t.balance)
  const dec = parseInt(t.dec ?? t.decimals ?? 0, 10)
  if (!isFinite(raw)) return String(t.balance)
  return (dec ? raw / 10 ** dec : raw).toLocaleString()
}

function showConnect (msg = DEFAULT_MSG) {
  connectSection.style.display = 'flex'
  appSection.style.display = 'none'
  disconnectBtn.style.display = 'none'
  statusIndicator.style.display = 'none'
  warningMessage.style.display = 'none'
  statusMsg.innerText = msg
}

function showApp (data) {
  connectSection.style.display = 'none'
  appSection.style.display = 'block'
  disconnectBtn.style.display = 'block'

  addrEl.innerText = data.address
  kasEl.innerText = data.kas == null ? '—' : `${(data.kas / SOMPI).toLocaleString(undefined, { maximumFractionDigits: 8 })} KAS`

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
  noTokensEl.style.display = data.tokens.length ? 'none' : 'block'

  const hasTokens = data.tokens.some(t => parseFloat(t.balance) > 0)
  statusIndicator.className = 'status-indicator ' + (hasTokens ? 'active' : 'inactive')
  statusIndicator.style.display = 'block'
  accessEl.className = 'access ' + (hasTokens ? 'ok' : 'bad')
  accessEl.innerText = hasTokens ? 'Active — KRC20 tokens detected' : 'Inactive — no KRC20 tokens'
  warningMessage.style.display = hasTokens ? 'none' : 'block'
}

async function loadWallet (kasware, address) {
  let kas = null
  try {
    const b = await kasware.getBalance()
    kas = b?.total ?? null
  } catch {}
  let tokens = []
  if (kasware.getKRC20Balance) {
    try {
      const res = await kasware.getKRC20Balance()
      tokens = Array.isArray(res) ? res : (res?.list || res?.result || [])
    } catch {}
  }
  showApp({ address, kas, tokens })
}

async function connect () {
  connectBtn.disabled = true
  try {
    const kasware = await waitForKasware()
    statusMsg.innerText = 'Connecting to wallet...'
    const accounts = await kasware.requestAccounts()
    if (!accounts?.length) throw new Error('No account returned by KasWare.')
    statusMsg.innerText = 'Fetching balances...'
    await loadWallet(kasware, accounts[0])
  } catch (err) {
    showConnect(err.message || String(err))
  } finally {
    connectBtn.disabled = false
  }
}

// Restore the app page on reload if the site is already authorised in KasWare.
async function tryResume () {
  try {
    const kasware = await waitForKasware(4, true)
    const accounts = await kasware.getAccounts()
    if (accounts?.length) await loadWallet(kasware, accounts[0])
    kasware.on?.('accountsChanged', (accs) => {
      if (accs?.length) loadWallet(kasware, accs[0])
      else showConnect()
    })
  } catch {}
}

connectBtn.onclick = connect
disconnectBtn.onclick = () => {
  try { window.kasware?.disconnect?.(location.origin) } catch {}
  showConnect()
}
showConnect()
tryResume()
