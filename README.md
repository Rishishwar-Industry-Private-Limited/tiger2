# Tiger2 🐯

**Mobile (Expo React Native) + Server (Express)**

A small app + server to listen for incoming SMS (Android), capture location, and forward logs to a server which saves them in-memory and forwards alerts to Telegram.

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