# Tiger2 🐯

**Mobile (Expo React Native) + Server (Express)**

A small app + server to listen for incoming SMS (Android), capture location, and forward logs to a server which saves them in-memory and forwards alerts to Telegram.

---

## 🧭 Project details — Kya karta hai & Kaise (What it does & How it works)

- App (Android) continuously listens for incoming SMS using a native SMS listener (`react-native-get-sms-android`). On receiving an SMS it captures the sender and message body and prepares a payload to send to the server (`/log-sms`).
- Before sending SMS logs, the app attempts to fetch the device's current location (`expo-location`) and includes it in the payload when available.
- The app also maintains a persistent `deviceId` (stored in `AsyncStorage`) used to correlate logs from the same device and to route Telegram notifications to a registered user.
- The server (`tiger-server/`) stores received logs in MongoDB (with an in-memory fallback) and can forward alerts to Telegram for users who configured their `telegramBotToken` & `telegramChatId`.
- The app supports a local/remote toggle for end-to-end testing (use the Monitoring Dashboard 'Use Local Server').

### 📦 Collected device data (what goes to the server)

- **SMS data:** sender number (`originatingAddress` / `address`), message body, and message timestamp
- **Device info:** `Device.brand`, `Device.modelName`, `Device.osVersion`
- **Persistent device identifier:** `deviceId` (generated and stored in `AsyncStorage`)
- **Location:** latitude,longitude (if location permission & GPS available). If fetch fails, payload contains `location: "Disabled"`.
- **Heartbeat/ping entries:** periodic pings sent by the app with `sender: 'heartbeat'` or `message: 'ping'` for health checks

> Note: The server stores logs in the `SmsLog` model and uses these fields to show entries and notify configured Telegram users.

### 🔒 Permissions requested by the app (and why)

- `RECEIVE_SMS` — **Core:** detect incoming SMS in real-time (required to trigger uploads)
- `READ_SMS` — read SMS inbox for batch import or historical sync
- `SEND_SMS` — requested by the app (reserved for potential future features)
- `READ_CALL_LOG` — requested (not currently core to SMS/Location flow)
- `READ_CONTACTS` — requested (not currently required by main flow)
- `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION` — **Core:** obtain device location when capturing an SMS event (fine location is preferred)
- `RECORD_AUDIO`, `CAMERA` — requested (not required for the SMS/location flow; kept for potential extra features)
- `READ_PHONE_STATE` — requested (may be used to access device identifiers / network info)

**Core permissions required for tracking to start:** `RECEIVE_SMS` + `ACCESS_FINE_LOCATION` (app prompts user and shows an alert to retry if these are denied).

For details: see `src/hooks/usePermissions.js`, `src/hooks/useTracking.js`, and `src/services/SmsService.js`.

---

## 🔧 Project structure (high-level)

- Root: Expo React Native app
  - `App.js` — app entry & background task registration
  - `src/` — app code (components, hooks, services, utils)
- `tiger-server/` — Express server
  - `server.js` — main server and Telegram forwarding
  - `routes/`, `models/`, `middleware/` — API and models

---

## 🚀 Quick start

Prereqs: Node.js, npm, Android SDK (for Android testing), adb (recommended for emulator SMS testing)

1. Install dependencies (root and server):

   - App: `npm install`
   - Server: `cd tiger-server && npm install`

2. Start the server (defaults to port 10000):

   ```bash
   cd tiger-server
   npm start
   # or set envs: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, PORT
   ```

3. Start the Expo app (root):

   ```bash
   npm start
   # or to run on Android: npm run android
   # to run web dashboard: npm run web
   ```

4. Toggle "Use Local Server" in the Monitoring Dashboard (app) to test end-to-end with local `tiger-server`.

---

## ✅ Quick validation & QA checklist

- Run `tiger-server` locally and POST `/log-sms` returns 200 and `GET /get-logs` shows entries.
- Toggle `Use Local Server` in the app and use "Test Server Ping" — it should succeed.
- Simulate SMS on emulator: `adb emu sms send <number> "<msg>"` and confirm the app logs it and sends to server.
- Verify server forwards message to Telegram (if env vars are configured) and that `smsLogs` contains the log.

---

## 🔐 Secrets & environment

- Do **not** commit tokens. Move hard-coded values to env vars:
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_CHAT_ID`
  - `PORT` (optional)
- Server currently contains hard-coded tokens in `tiger-server/server.js` — please switch to `process.env`.

---

## 📋 Key files to inspect

- App:
  - `App.js` — background task name (`BACKGROUND_FETCH_TASK`) and registration
  - `src/hooks/usePermissions.js` — permission flow for SMS & location
  - `src/hooks/useTracking.js` — SMS listener, location capture, retry/backoff logic
  - `src/services/ApiService.js` — API wrapper; note: `API_URL` must end with `/`
  - `src/services/SmsService.js` — SMS reading & batching logic
- Server:
  - `tiger-server/server.js` — `/log-sms` endpoint and Telegram integration

---

## 🧪 Notes for developers

- Native changes (Android manifest, services) require a rebuilt dev client or `expo run:android` — hot reload won't apply native edits.
- For local debugging, `AndroidManifest.xml` already sets `android:usesCleartextTraffic="true"` for HTTP to `localhost`.

---

## Contributing

- Follow existing logging style (e.g., `[useTracking] ...`) and add tests or QA steps for changes that affect app/server interplay.
- Don't commit secrets; update README or server readme when adding env var names.

---

## License

Add a `LICENSE` (e.g., MIT) if you want to explicitly set terms.

---

If you want, I can also add a short `tiger-server/README.md` with environment examples and a `.env.example` file. Want that? 🇮🇳

---

## Camera & Background Photo Notes
This repository now contains initial server support for photo uploads and client-side placeholders for background photo capture. Important notes:

- Server endpoints:
  - `POST /upload-photo` — accepts multipart `photo` field and `deviceId` string; saved into `tiger-server/uploads/` and recorded in `PhotoLog`.
  - `GET /get-photos` — list recent uploaded photos.

- Client-side:
  - `src/services/CameraService.js` provides a JS queue and placeholder `requestImmediatePhoto()` that must be backed by a native module to support background/foreground camera captures.
  - `src/services/ApiService.js` has `uploadPhoto(fileUri, filename, deviceId)` to POST images to server.
  - `src/components/MonitoringDashboard.js` includes a "Get Photo" button and controls to manage the background photo service (placeholders).

- Android native changes are required for full background capture (Foreground Service + Camera + persistent notification). You must rebuild the native app (`expo run:android` or a custom dev client) after adding native modules.

Security & Privacy: show an explicit consent screen before enabling continuous camera capture. Play Store policies require user-visible notification for background camera usage and a clear privacy policy describing how and why photos are taken.
