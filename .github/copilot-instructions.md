# Copilot Instructions for Tiger2 🐯

## Project overview
- Two pieces: **Mobile app** (Expo React Native) and **Server** (Express in `tiger-server/`).
- App responsibilities: listen for incoming SMS (Android), fetch location, and POST sanitized payloads to `/log-sms`. Background work via `expo-background-fetch` and native services/receivers on Android.
- Server responsibilities: accept `/log-sms`, store recent logs in-memory and forward alerts to Telegram (`tiger-server/server.js`).

---

## Quick start & debug commands 🔧
- App (root):
  - `npm start` — start Expo dev tools
  - `npm run android` — build & install on Android device (native changes require a dev client or rebuilding)
  - `npm run web` — run the web dashboard
- Server (inside `tiger-server/`):
  - `cd tiger-server && npm start` — start the Express server on `PORT` (defaults to 10000)
- Helpful debug tips:
  - Use `adb emu sms send <number> "<msg>"` (emulator) to simulate SMS.
  - For local HTTP testing, `android/app/src/main/AndroidManifest.xml` already sets `android:usesCleartextTraffic="true"`.
  - If using local server toggle in-app (Monitoring Dashboard) to `Localhost` (uses `http://localhost:10000/log-sms`).

---

## Key files & patterns to inspect 📁
- `App.js` — registers the background fetch task and initializes hooks. Primary startup flow.
- `src/hooks/usePermissions.js` — central permission acquisition logic (requests multiple Android permissions at once, expects SMS + location).
- `src/hooks/useTracking.js` — SMS listener, location capture, exponential backoff retry logic and target URL toggle for local vs Render. See `sendWithRetry()` and `sendDataToServer()` usage.
- `src/services/ApiService.js` — canonical API wrapper, checks `response.ok`, logs detailed errors, notes that `API_URL` must end with `/`.
- `src/services/SmsService.js` — utilities to fetch and batch-send SMS from inbox.
- `tiger-server/server.js` — server endpoint `/log-sms`, in-memory `smsLogs`, and Telegram integration. Tokens are currently hard-coded — treat as secrets.
- `src/screens/WebDashboard.js` & `src/components/MonitoringDashboard.js` — how the web dashboard polls logs and how the app exposes a toggle for local/remote server.

---

## Project-specific conventions & constraints ⚠️
- Comments and logs include Hindi/English; follow existing style when adding inline notes.
- API endpoints and payload shapes are fixed (e.g., `/log-sms` expects {sender, message, device, timestamp, location}). Change both client & server if renaming.
- `ApiService` normalizes endpoints: it expects `API_URL` with trailing `/`. Keep this convention or adjust the helper when changing base URLs.
- Native changes (e.g., adding an Android service) require rebuilding the app (`expo run:android` / custom dev client). Don't expect hot reloading to apply Java/Kotlin/manifest changes.
- Background tasks rely on `expo-task-manager` + `expo-background-fetch`. If modifying task names, update the `BACKGROUND_FETCH_TASK` constant in `App.js` and any registrations.

---

## Security & secrets 🔐
- `tiger-server/server.js` contains `BOT_TOKEN` and `CHAT_ID` in the repo — **do not commit new secrets.** Prefer `process.env` and document expected env var names (e.g., `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).

---

## How to validate a change / manual QA checklist ✅
1. Run `tiger-server` locally and verify `POST /log-sms` returns 200 and adds to `/get-logs`.
2. Toggle `Use Local Server` in `MonitoringDashboard` and `Test Server Ping` should succeed.
3. Use `adb emu sms send` to simulate SMS and confirm:
   - `useTracking` logs the incoming SMS
   - the app sends a payload to the selected server (watch logs in Xcode/adb or `console.log` outputs)
   - the server forwards the message to Telegram (or stores it in `smsLogs`)
4. If changing Android manifest / native modules, rebuild the app.

---

## Guidance for AI agents (do's & don'ts) 🤖
- DO focus on local reproducibility: use the `useLocalServer` toggle and local `tiger-server` for end-to-end tests.
- DO respect permission flow: ensure code checks `usePermissions` and adapts gracefully if permissions are `denied` or `error`.
- DO add verbose logs similar to existing style (e.g., `[useTracking] ...`) to aid manual debugging.
- DON'T change endpoints, payload fields, or background task names silently — update both app & server and include QA steps.
- DON'T commit secrets; extract tokens to env vars and update `tiger-server/README` (if added) with setup steps.

---

If anything looks incomplete or you'd like examples added for a specific file or workflow, tell me which area to expand and I'll iterate. 🔧