# WOSTR Security - Kaspa Wallet Bridge

A desktop application for bridging KasWare wallet KRC20 token data to display token holdings.

## Demo Video

Watch the app in action: [intro.mp4](intro.mp4)

## Features

- Connect KasWare wallet via browser bridge
- Display wallet address
- Show KRC20 token balances
- Detect if wallet has KRC20 LIVE tokens
- Window controls (minimize, maximize, close)

## Getting LIVE Tokens

This app requires KRC20 LIVE tokens to function properly. If you don't have LIVE tokens:

1. Get Kaspa (KAS) from an exchange
2. Use the Kaspa Telegram bot to swap for LIVE tokens:
   - Open Telegram
   - Search for: **@kspr_home_bot**
   - Follow the bot instructions to swap KAS for LIVE tokens

## Installation

1. Install Pear runtime:
   ```bash
   npm install -g pear
   ```

2. Clone and run:
   ```bash
   git clone https://github.com/avirads/wostr-security.git
   cd wostr-security
   run.bat
   ```

   Or simply double-click `run.bat` in the project folder.

## Quick Run

After cloning, run the app by executing:
```
run.bat
```

## Adding App Icon

To add a custom icon to the launcher:

1. Right-click `run.bat` → **Create shortcut**
2. Right-click the shortcut → **Properties** → **Change Icon**
3. Select `wostr-sec.ico` from the project folder
4. Rename the shortcut to "WOSTR Security" and place it on your desktop

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
- Make sure you have LIVE tokens in your wallet
