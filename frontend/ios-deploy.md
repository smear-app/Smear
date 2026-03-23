# Getting Smear on your iPhone (dev build)

## Prerequisites

- Mac with Xcode installed
- Apple ID (free account works)
- iPhone + USB cable
- Access to the repo

## One-time setup

**1. Install dependencies and add iOS platform**
```bash
cd frontend
npm install
npx cap add ios
```

**2. Build and sync**
```bash
npm run build && npx cap sync
```

**3. Open in Xcode**
```bash
npx cap open ios
```

**4. Sign the app in Xcode**
- Click **App** in the left sidebar → **Signing & Capabilities** tab
- Check **Automatically manage signing**
- Under **Team**, add your Apple ID and select your personal team

**5. Plug in your iPhone** — tap **Trust** when prompted on your phone

**6. Run it**
- In the top bar, select your iPhone from the device picker
- Hit **▶** (or `Cmd+R`) — first build takes ~2 min

**7. Trust the cert on your phone**
- If the app is blocked when opening: **Settings → General → VPN & Device Management → [your Apple ID] → Trust**

## Daily dev workflow

```bash
cd frontend
npm run build && npx cap sync
npx cap open ios   # then Cmd+R in Xcode
```

Or for live hot-reload over WiFi (both on same network):
```bash
npx cap run ios --livereload --external
```

## Note

Free Apple certs expire every **7 days** — just hit `Cmd+R` in Xcode again to re-sign and reinstall.
