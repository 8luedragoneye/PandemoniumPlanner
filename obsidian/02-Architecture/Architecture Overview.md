# Architecture Overview

## System Overview

NOX Planer follows a traditional client-server architecture with a React frontend and Express.js backend.

## Frontend Architecture

### Structure
```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── lib/            # Utilities and API client
├── types/          # TypeScript type definitions
└── contexts/       # React contexts
```

### Key Technologies
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **date-fns**: Date manipulation (CET timezone)

### State Management
- React Context API for global state (auth)
- Local component state for UI
- PocketBase realtime subscriptions for live updates

## Backend Architecture

### Structure
```
server/
├── routes/         # API route handlers
├── services/       # Business logic
├── middleware/     # Express middleware
└── lib/            # Shared utilities
```

### Key Technologies
- **Express.js**: Web framework
- **Prisma**: ORM and database client
- **SQLite**: Local development database
- **PostgreSQL**: Production database
- **JWT**: Authentication tokens

### Database
- **Prisma Schema**: Type-safe database schema
- **Migrations**: Version-controlled schema changes
- See [[Database Schema]] for details

## Data Flow

1. User interacts with React frontend
2. Frontend calls API via `lib/api.ts`
3. Express routes handle requests
4. Services contain business logic
5. Prisma queries database
6. Response sent back to frontend
7. Realtime updates via PocketBase subscriptions

## Authentication

- JWT tokens stored in localStorage
- Protected routes check authentication
- API routes verify JWT tokens

## Related

- [[Database Schema]]
- [[API Reference]]
- [[Component Structure]]
