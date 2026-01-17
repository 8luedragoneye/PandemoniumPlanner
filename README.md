# Pandemonium Planner

A simple activity organizer for the Albion Online guild **Pandemonium**.

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
- **Backend**: Express.js + Prisma + SQLite
- **Database**: SQLite (local) / PostgreSQL (production)

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
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3001
VITE_API_URL=http://localhost:3001/api
```

## Database Management

- **View database**: `npm run prisma:studio`
- **Create migration**: `npm run prisma:migrate`
- **Reset database**: Delete `prisma/dev.db` and run `npm run prisma:migrate`

## Deployment

For production, use PostgreSQL instead of SQLite:

1. Update `DATABASE_URL` in `.env` to your PostgreSQL connection string
2. Update `prisma/schema.prisma` datasource to `postgresql`
3. Run migrations: `npm run prisma:migrate`
4. Deploy backend to Render.com or similar
5. Deploy frontend (static site) with `VITE_API_URL` pointing to your backend

See `DEPLOYMENT.md` for detailed instructions.
