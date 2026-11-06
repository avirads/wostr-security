// Web edition: talks to the KasWare extension directly (no localhost bridge needed).
const $ = (id) => document.getElementById(id)
const connectBtn = $('connect-btn')
const disconnectBtn = $('disconnect-btn')
const connectSection = $('connect-section')
const statusIndicator = $('status-indicator')
const warningMessage = $('warning-message')
const statusMsg = document.querySelector('.status-msg')

const DEFAULT_MSG = 'Connect your KasWare wallet to check KRC20 tokens.'

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

// Login page
function showLogin (msg = DEFAULT_MSG) {
  connectSection.style.display = 'flex'
  disconnectBtn.style.display = 'none'
  statusIndicator.style.display = 'none'
  warningMessage.style.display = 'none'
  statusMsg.innerText = msg
}

// App page (same as the desktop app after login)
function showApp (tokens) {
  connectSection.style.display = 'none'
  disconnectBtn.style.display = 'block'

  const hasTokens = tokens.some(t => parseFloat(t.balance) > 0)
  statusIndicator.className = 'status-indicator ' + (hasTokens ? 'active' : 'inactive')
  statusIndicator.style.display = 'block'
  warningMessage.style.display = hasTokens ? 'none' : 'block'
}

async function loadTokens (kasware) {
  let tokens = []
  if (kasware.getKRC20Balance) {
    try {
      const res = await kasware.getKRC20Balance()
      tokens = Array.isArray(res) ? res : (res?.list || res?.result || [])
    } catch {}
  }
  showApp(tokens)
}

async function connect () {
  connectBtn.disabled = true
  try {
    const kasware = await waitForKasware()
    statusMsg.innerText = 'Connecting to wallet...'
    const accounts = await kasware.requestAccounts()
    if (!accounts?.length) throw new Error('No account returned by KasWare.')
    statusMsg.innerText = 'Checking KRC20 tokens...'
    await loadTokens(kasware)
  } catch (err) {
    showLogin(err.message || String(err))
  } finally {
    connectBtn.disabled = false
  }
}

// Go straight to the app page on reload if the site is still authorised in KasWare.
async function tryResume () {
  try {
    const kasware = await waitForKasware(4, true)
    const accounts = await kasware.getAccounts()
    if (accounts?.length) await loadTokens(kasware)
    kasware.on?.('accountsChanged', (accs) => {
      if (accs?.length) loadTokens(kasware)
      else showLogin()
    })
  } catch {}
}

connectBtn.onclick = connect
disconnectBtn.onclick = () => {
  try { window.kasware?.disconnect?.(location.origin) } catch {}
  showLogin()
}
showLogin()
tryResume()
