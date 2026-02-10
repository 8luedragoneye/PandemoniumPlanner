# Deployment Guide

This guide explains how to deploy Pandemonium Planner to popular hosting platforms. The app uses **Express.js + Prisma + SQLite** (with optional PostgreSQL) and a **React + Vite** frontend.

## Prerequisites

- **Node.js 18+** installed locally for testing
- **GitHub account** with your repository pushed
- **Hosting platform account** (Railway, Render, or Fly.io)

---

## Tech Stack Overview

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite (TypeScript), builds to `dist/` |
| Backend | Express.js at `server/index.ts`, port from `PORT` env or 3001 |
| Database | SQLite via Prisma (can switch to PostgreSQL) |
| Auth | JWT (jsonwebtoken) |
| API URL | Configured via `VITE_API_URL` env var (defaults to `/api`) |

---

## Environment Variables

Set these on your hosting platform:

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `PORT` | No | Port to listen on (platforms usually inject this) |
| `DATABASE_URL` | Yes | SQLite: `file:./prisma/dev.db` or path to `.db` file; PostgreSQL: connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (use a long random string) |
| `VITE_API_URL` | No | Frontend API base URL; use `/api` when frontend and backend share the same origin |

---

## Build & Start Commands

**Build:**
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

For a compiled server, add the server build step:
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npx tsc -p tsconfig.server.json && npm run build
```

**Start (compiled):**
```bash
node dist/index.js
```

**Start (TypeScript with tsx, no server build):**
```bash
npx tsx server/index.ts
```

> **Note:** When using the compiled server, ensure the server is built during the build phase. The `tsconfig.server.json` outputs to `dist/` alongside the Vite frontend build.

---

## 1. Recommended: Railway

Railway is beginner-friendly and works well for full-stack Node.js apps.

### Step-by-Step

1. **Sign up** at [railway.app](https://railway.app) and connect your GitHub account.

2. **Create a new project** → **Deploy from GitHub repo** → select `PandemoniumPlanner`.

3. **Configure the service:**
   - **Root Directory:** leave empty (or `./` if needed)
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npx prisma migrate deploy && npx tsc -p tsconfig.server.json && npm run build
     ```
   - **Start Command:**
     ```bash
     node dist/index.js
     ```
   - **Watch Paths:** leave default

4. **Add environment variables** (Settings → Variables):
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `file:./prisma/data.db` (for SQLite; use an absolute path if needed)
   - `JWT_SECRET` = your secret (e.g. generate with `openssl rand -base64 32`)
   - `VITE_API_URL` = `/api`

5. **Optional: Add PostgreSQL** (recommended for production):
   - In your project, click **+ New** → **Database** → **PostgreSQL**
   - Copy the `DATABASE_URL` from the new database
   - Update your Prisma schema to use `postgresql` (see [Switch to PostgreSQL](#optional-switch-to-postgresql) below)
   - Add the `DATABASE_URL` to your service variables

6. **Deploy** — Railway builds and deploys on each push.

Railway assigns a public URL (e.g. `https://your-app.up.railway.app`). For SQLite, ensure you use a persistent volume if supported, or switch to PostgreSQL for reliable persistence.

---

## 2. Alternative: Render

### Web Service + Persistent Disk (SQLite)

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npx prisma migrate deploy && npx tsc -p tsconfig.server.json && npm run build
     ```
   - **Start Command:** `node dist/index.js`

4. Add a **Persistent Disk**:
   - **Mount Path:** `/opt/render/project/src/prisma`
   - **Size:** 1 GB minimum  
   This keeps the SQLite file (`dev.db` or `data.db`) across deploys.

5. Set `DATABASE_URL` to a path on the disk, e.g.:
   ```
   file:/opt/render/project/src/prisma/data.db
   ```

6. Add `NODE_ENV`, `JWT_SECRET`, and `VITE_API_URL` as above.

### Separate Frontend (Optional)

- Create a **Static Site** for the frontend
- Set `VITE_API_URL` to your Web Service URL, e.g. `https://your-api.onrender.com/api`

---

## 3. Alternative: Fly.io

1. Install the [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) and sign in:
   ```bash
   fly auth login
   ```

2. From your project root:
   ```bash
   fly launch
   ```
   Follow prompts; choose a region.

3. Add a **Persistent Volume** for SQLite:
   ```bash
   fly volumes create data --size 1
   ```

4. Update `fly.toml` (or create it) with build and start commands, and set your env vars:
   ```bash
   fly secrets set NODE_ENV=production JWT_SECRET=your-secret DATABASE_URL=file:/data/db.sqlite
   ```

5. Deploy:
   ```bash
   fly deploy
   ```

For SQLite on Fly.io, mount the volume and point `DATABASE_URL` to a path on that volume. For simpler setups, use PostgreSQL (see below).

---

## Optional: Switch to PostgreSQL

Most platforms offer managed PostgreSQL. Switching makes deployment easier and avoids SQLite persistence issues.

### 1. Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Set `DATABASE_URL`:

Use the connection string from your host, e.g.:
```
postgresql://user:password@host:5432/dbname?sslmode=require
```

### 3. Create and run migrations:

```bash
npx prisma migrate dev --name init_postgres
```

### 4. Deploy:

Use the same build/start commands; `prisma migrate deploy` will apply migrations to PostgreSQL.

---

## Troubleshooting

| Issue | Possible fix |
|-------|--------------|
| **502 Bad Gateway** | Check start command, ensure server listens on `0.0.0.0` or `PORT` from env. Express binds to all interfaces by default when using `app.listen(PORT, ...)`. |
| **Database locked / SQLite errors** | SQLite does not handle high concurrency. Switch to PostgreSQL for production, or ensure only one process writes to the DB. |
| **Data lost on redeploy** | SQLite file must be on a persistent disk/volume. Confirm mount path and `DATABASE_URL`. Prefer PostgreSQL when possible. |
| **CORS errors** | `VITE_API_URL` should match the backend URL. If frontend and backend share the same origin, use `VITE_API_URL=/api`. |
| **JWT / Auth failures** | Ensure `JWT_SECRET` is set and identical across restarts. Use a long random string. |
| **Build fails: Prisma** | Run `npx prisma generate` before the app build. Include it in the build command. |
| **Build fails: Module not found** | Run `npm install` (or `npm ci`) before build. Ensure `node_modules` is not in `.gitignore` for the install step. |
| **Port errors** | Use `process.env.PORT` (or your platform’s port). The server already reads `PORT` with fallback to 3001. |

---

## Serving the Frontend from Express (Single Service)

To serve the React app from the same Express server:

1. Build the frontend and server as above (both output to `dist/`).

2. In `server/index.ts`, add **before** `app.listen`:

```ts
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '..', 'dist');

// Serve static files from Vite build
app.use(express.static(distPath));

// SPA fallback – serve index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});
```

3. Use `VITE_API_URL=/api` so the frontend talks to the same origin.

4. Run the server from the project root (e.g. `node dist/index.js`). With this setup, `__dirname` is the `dist/` folder containing the compiled server; `path.join(__dirname, '..', 'dist')` resolves to that same `dist/` directory where Vite's `index.html` and `assets/` also live. Adjust the path if your build layout differs.
