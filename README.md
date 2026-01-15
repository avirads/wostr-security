# WOSTR Security - Kaspa Wallet Bridge

A desktop application for bridging KasWare wallet KRC20 token data to display token holdings.

## Features

- Connect KasWare wallet via browser bridge
- Display wallet address
- Show KRC20 token balances
- Detect if wallet has KRC20 LIVE tokens
- Window controls (minimize, maximize, close)

## Installation

1. Install Pear runtime:
   ```bash
   npm install -g pear
   ```

2. Run the app:
   ```bash
   pear run pear://wnqgttesiocxeoj7j8ddcttqr6digkydnjtwjotejxo1uyoqc5by
   ```

## Usage

1. Launch the application
2. Click "Connect Wallet" button
3. A browser window will open the bridge page
4. Approve connection in KasWare wallet extension
5. The app will display:
   - Connected wallet address
   - KRC20 token balances
   - Warning if no LIVE tokens found

## Requirements

- KasWare browser extension installed
- KRC20 LIVE tokens in wallet (for full functionality)

## Troubleshooting

- If browser doesn't open automatically, manually navigate to `http://localhost:8989/bridge`
- Ensure KasWare extension is installed and unlocked
- Refresh the bridge page if connection fails
