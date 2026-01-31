# Background Reliability & EAS Release Guide 🚀

This document outlines important notes about background reliability for the Tiger mobile app and step-by-step instructions to build production releases using EAS (Expo Application Services).

---

## 1) Background Reliability — Key Notes ⚠️

- **OS limits are real**: Background execution frequency (especially for tasks like periodic pings) is controlled by the OS. `expo-background-fetch` and `expo-task-manager` are great for opportunistic/background work but are *not* guaranteed to run every 40s. iOS in particular heavily throttles background work.

- **Foreground Service on Android for reliability**:
  - If you require near-real-time background behavior on Android, implement a native **Foreground Service** (a persistent notification + service) that runs your background task. This means adding native Android code (Java/Kotlin), updating the `AndroidManifest.xml` (permissions, `foregroundServiceType`), and using `startForeground()`.
  - In the Expo-managed flow, this requires using EAS to prebuild or switching to a custom dev client (see below) because it's a native change.

- **iOS constraints**:
  - iOS background execution is limited to specific modes (VoIP, audio, location, background fetch). For periodic network pings, rely on **silent push notifications** to wake the app when immediate action is required, or accept larger intervals.

- **Testing recommendations**:
  - Use physical devices for background tests; emulators/sims are not reliable for exact scheduling behavior.
  - Use `adb` (Android) logs and `logcat` to verify wakeups and service behavior.
  - For Android-native foreground services, test with battery optimizations disabled for the test device.

---

## 2) EAS Build & Release (Android + iOS) — Quick Steps 🔧

Prerequisites:
- Node.js, npm/yarn
- An Expo account
- `eas` CLI installed: `npm install -g eas-cli`
- App configured (`app.json` / `app.config.js`) and `eas.json` in project root

Basic `eas.json` snippet:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "simulator": false
      }
    }
  }
}
```

Steps:
1. Login to EAS: `eas login`
2. Configure Android signing or let EAS manage it: `eas credentials` (or run `eas build` and follow prompts)
3. Build Android/App Bundle: `eas build --platform android --profile production`
4. Build iOS: `eas build --platform ios --profile production` (requires Apple Developer credentials)
5. Download artifacts from the EAS build page and upload to stores (Play/App Store)

Notes for native changes (e.g., foreground service):
- Run `eas prebuild` to generate native projects and make necessary `AndroidManifest.xml` or iOS changes.
- Add the foreground service and required permissions in `android/app/src/main/AndroidManifest.xml` before running `eas build` (or modify the prebuild templates).
- While developing with native changes, prefer `expo prebuild` + `eas build` or `eas build --profile development` and install the generated APK/IPA on your device for testing.

---

## 3) Environment Variables & Secrets 🌐

- Don't hardcode secrets such as `TELEGRAM_BOT_TOKEN`. Use server-side env vars (for server) or EAS build-time env variables via `eas secrets` / `eas env`.
- Important env vars for the server: `MONGO_URI`, `PORT` (optional). For production Telegram, user tokens remain stored per-user in DB.

---

## 4) Recommended Action Items (prioritized) ✅
1. If you need reliable <1min background pings on Android, implement an Android Foreground Service and build with EAS.
2. For iOS, use push-based wakeups for immediate work or accept larger background intervals.
3. Add a runtime preference in the app to automatically disable the 40s heartbeat when the app is in background to avoid battery drain and OS penalties.
4. Document testing steps and add a ‘Background Testing’ checklist to the repo (optional: a CI script that validates server endpoints still respond under simulated load).

---

If you'd like, I can add example `AndroidManifest.xml` snippets for a foreground service and a ready-to-use `eas.json` tailored to your project. Which one should I add next: Android manifest snippet, or a sample `eas.json` with env export examples?