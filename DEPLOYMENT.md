# Deployment Guide

Pandemonium Planner is hosted on **Render** (app server) + **Neon** (PostgreSQL database). Render auto-deploys from the `main` branch on every push.

---

## Architecture

| Service | What | URL |
|---------|------|-----|
| **Render** | Express.js server + React frontend | [nox-planner.onrender.com](https://nox-planner.onrender.com) |
| **Render Dashboard** | Deploy logs & settings | [dashboard.render.com](https://dashboard.render.com/web/srv-d65tvkngi27c73diisi0/events) |
| **Neon** | PostgreSQL database | [console.neon.tech](https://console.neon.tech/app/projects/soft-morning-26455949?database=neondb) |

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite (TypeScript), builds to `dist/` |
| Backend | Express.js at `server/index.ts`, port from `PORT` env or 3001 |
| Database | PostgreSQL via Prisma (hosted on Neon) |
| Auth | JWT (jsonwebtoken) |

---

## Environment Variables

Set these on **Render** (Environment tab):

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | `production` |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | Long random string for signing JWT tokens |
| `VITE_API_URL` | Yes | `/api` (frontend and backend share the same origin) |
| `PORT` | No | Render injects this automatically |

---

## Render Configuration

| Setting | Value |
|---------|-------|
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | `npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build` |
| **Start Command** | `npm start` |

> `npm start` runs `cross-env NODE_ENV=production node --import tsx server/index.ts`, which serves both the API and the built React frontend from the same process.

---

## Deploying Updates (Git Pipeline)

Render auto-deploys every time you push to `main`. Your workflow is:

```bash
git add .
git commit -m "describe your changes"
git push origin main
```

That's it. Render detects the push, rebuilds, and redeploys automatically. You can monitor the deploy in the Render dashboard under **Events**.

---

## Initial Setup (from scratch)

If you need to set this up again from zero:

### 1. Create the Neon database

1. Sign up at [neon.tech](https://neon.tech) (free, no credit card)
2. Create a project (region: **EU Frankfurt** for lowest latency to Albion API)
3. Copy the connection string — it looks like:
   ```
   postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require
   ```

### 2. Create the initial migration

Set `DATABASE_URL` in your local `.env` to the Neon connection string, then:

```bash
npx prisma migrate dev --name init
```

Commit and push the generated `prisma/migrations/` folder.

### 3. Deploy on Render

1. Sign up at [render.com](https://render.com) (free, no credit card)
2. **New** > **Web Service** > connect your GitHub repo > pick the `main` branch
3. Set the **Build Command** and **Start Command** from the table above
4. Add all **Environment Variables** from the table above
5. Click **Create Web Service**

Render builds and gives you a public URL.

---

## Database Migrations

When you change `prisma/schema.prisma`:

1. Run locally:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
2. Commit the new migration files in `prisma/migrations/`
3. Push to `main` — Render runs `prisma migrate deploy` during the build

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Build fails: devDependencies missing** | Ensure build command uses `npm install --include=dev` (NODE_ENV=production skips devDeps otherwise) |
| **Build fails: Prisma errors** | Check that `DATABASE_URL` is set on Render and starts with `postgresql://` |
| **502 Bad Gateway** | Check start command, ensure server listens on `PORT` from env |
| **CORS errors** | `VITE_API_URL` should be `/api` when frontend and backend share the same origin |
| **JWT / Auth failures** | Ensure `JWT_SECRET` is set and consistent across deploys |
| **App slow on first visit** | Render free tier spins down after 15 min of inactivity; first request takes ~30s to wake up |
| **Migration not applied** | Ensure `prisma/migrations/` is committed and pushed; `prisma migrate deploy` runs during build |

---

## Local Development

For local development, you can use the same Neon database or a local PostgreSQL instance:

```env
# .env
DATABASE_URL="postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require"
JWT_SECRET="dev-secret"
PORT=3001
NODE_ENV=development
```

Then run:

```bash
npm run dev:all
```

This starts the Express backend on `http://localhost:3001` and the Vite dev server on `http://localhost:3000` with API proxying.
