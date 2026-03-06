## Notification Server (Node.js + PostgreSQL)

This folder contains a small Express + Socket.IO backend that powers the in‑app notification system for Go‑For‑Fun.

### Features

- Stores notifications in **PostgreSQL** only (no MongoDB).
- Admin endpoints:
  - `POST /api/admin/notifications/broadcast`
  - `POST /api/admin/notifications/personal`
  - `GET  /api/admin/users`
- User endpoints:
  - `GET  /api/notifications`
  - `GET  /api/notifications/unread-count`
  - `PATCH /api/notifications/:notificationId/read`
  - `PATCH /api/notifications/read-all`
- Real‑time notification signals via **Socket.IO** (`notification:broadcast`), matching the existing frontend socket client.

### Environment

Set the following variables before running:

- `DATABASE_URL` (recommended, full Postgres URL), **or**:
  - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
- `PORT` (default: `5577`)
- `CLIENT_ORIGIN` – comma‑separated list of allowed origins for CORS/Socket.IO (or `*` for all).

### Install & Run

```bash
cd server
npm install
npm run dev    # or: npm start
```

The server will:

- Initialize required tables (`app_users`, `notifications`, `user_notifications`) if they do not exist.
- Start listening on the configured `PORT`.

