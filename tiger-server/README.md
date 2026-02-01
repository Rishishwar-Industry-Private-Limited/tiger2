# Tiger Server — Quick Setup 🚀

This folder runs the Express server that receives `/log-sms` payloads and provides an admin UI.

## Environment variables
- `PORT` (optional): server port (default 10000)
- `MONGO_URI` (optional): MongoDB connection string (default `mongodb://localhost:27017/tiger2`)
- `JWT_SECRET` (strong secret for signing tokens) — recommended in production
- `ADMIN_SETUP_TOKEN` (one-time token used to create the initial admin user via `/auth/create`)

## Quick start
1. Install dependencies:
   ```bash
   cd tiger-server
   npm install
   ```
2. Run the server (dev):
   ```bash
   PORT=10000 JWT_SECRET=dev_secret npm start
   ```
3. Use the admin UI at `http://localhost:10000/admin` (login/create admin via the API)

## Notes
- If MongoDB is not available the server will fall back to an in-memory store for recent logs.
- For telegram notifications you must configure per-user `telegramBotToken` and `telegramChatId` via the admin UI.
- Do not commit secret tokens into the repo. Use environment variables or a secrets manager.

## Photo Uploads
We now accept photo uploads via `POST /upload-photo` (multipart form, field `photo`). The endpoint stores the file in `tiger-server/uploads/` and records metadata in the `PhotoLog` Mongo collection. Use `GET /get-photos` to list recent uploaded photos.

Example cURL:

```bash
curl -F "photo=@./selfie.jpg" -F "deviceId=phone-123" http://localhost:10000/upload-photo
```

Make sure to run `npm install` in `tiger-server` to pick up `multer`.

