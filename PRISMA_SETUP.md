# Prisma Setup Guide

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

3. **Create database and run migrations**:
   ```bash
   npm run prisma:migrate
   ```
   This will:
   - Create the SQLite database file (`prisma/dev.db`)
   - Create all tables (users, activities, roles, signups)
   - Set up relationships and constraints

4. **Start development servers**:
   ```bash
   npm run dev:all
   ```
   - Backend: http://localhost:3001
   - Frontend: http://localhost:3000

## Database Management

### View Database (Prisma Studio)
```bash
npm run prisma:studio
```
Opens a visual database browser at http://localhost:5555

### Create a New Migration
After changing `prisma/schema.prisma`:
```bash
npm run prisma:migrate
```

### Reset Database
Delete `prisma/dev.db` and `prisma/dev.db-journal`, then:
```bash
npm run prisma:migrate
```

## Production (PostgreSQL on Render.com)

1. **Create Render Postgres database**:
   - Go to Render.com dashboard
   - Create new PostgreSQL database
   - Copy the connection string

2. **Update schema**:
   - Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`
   - Update `DATABASE_URL` in `.env` to your Render Postgres connection string

3. **Run migrations**:
   ```bash
   npm run prisma:migrate
   ```

4. **Deploy backend**:
   - Create Web Service on Render.com
   - Set build command: `npm install && npm run prisma:generate && npm run build`
   - Set start command: `node dist/server/index.js` (or use tsx)
   - Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`

## Schema Overview

- **User**: Authentication and user info
- **Activity**: Guild activities with creator ownership
- **Role**: Roles within activities (Tank, Healer, etc.)
- **Signup**: User sign-ups for specific roles

All relationships use cascade deletes (delete activity → deletes roles → deletes signups).
