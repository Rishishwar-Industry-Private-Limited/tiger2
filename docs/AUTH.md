# Authentication & Admin User Setup

This project uses JWT authentication for the admin dashboard.

Environment variables:
- `JWT_SECRET` — a strong secret used to sign tokens. **Set this in production.**
- `ADMIN_SETUP_TOKEN` — a one-time token used to create the initial admin account via the `/auth/create` endpoint.

Creating the first admin (recommended):
1. Set `ADMIN_SETUP_TOKEN` in your environment (e.g., export ADMIN_SETUP_TOKEN=mysupersecret) and set `JWT_SECRET`.
2. Call the create endpoint:
   curl -X POST http://localhost:10000/auth/create -H "Content-Type: application/json" -H "x-admin-setup-token: mysupersecret" -d '{"username":"admin","password":"StrongPass123"}'
3. The server will create the user and you can then `POST /auth/login` to get a token.

Notes:
- Sign-up is intentionally disabled: use the `/auth/create` endpoint only with `ADMIN_SETUP_TOKEN` or seed the database.
- Tokens are returned by `/auth/login` and should be stored client-side (e.g., `localStorage['tiger_token']`) and sent as `Authorization: Bearer <token>`.
- For security in production, serve the admin UI over HTTPS and use secure cookies where possible.