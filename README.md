# NOX Planer

A simple activity organizer for the Albion Online alliance **Schattenwandler**.

## Features

- **User Authentication**: Self-registration with name only
- **Activity Management**: Any user can create activities; creator becomes owner
- **Role System**: Owners define roles with custom attributes
- **Sign-ups**: Users can join activities with role confirmation
- **Overlap Detection**: Warns users about overlapping timeframes
- **Status Management**: Activities have statuses (recruiting, full, running)
- **Filtering**: Filter by my activities, signed up, upcoming, past

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + Prisma
- **Database**: PostgreSQL (hosted on Neon)

## Development

### Prerequisites

- Node.js 18+ and npm

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up database**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

3. **Start development servers**:
   ```bash
   # Start both frontend and backend
   npm run dev:all

   # Or start separately:
   npm run dev:server  # Backend on http://localhost:3001
   npm run dev          # Frontend on http://localhost:3000
   ```

4. **Access the app**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api

## Environment Variables

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://user:password@ep-example.neon.tech/neondb?sslmode=require"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3001
NODE_ENV=development
```

## Database Management

- **View database**: `npm run prisma:studio`
- **Create migration**: `npm run prisma:migrate`
- **Reset database**: `npx prisma migrate reset` (warning: deletes all data)

## Deployment

Hosted on **Render** (app) + **Neon** (PostgreSQL). Auto-deploys on every push to `main`:

```bash
git add .
git commit -m "your changes"
git push origin main
```

See `DEPLOYMENT.md` for full setup instructions and troubleshooting.
