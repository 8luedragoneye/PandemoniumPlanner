# Development Setup

## Prerequisites

- Node.js 18+ and npm
- Git

## Initial Setup

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd PandemoniumPlanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create `.env` file:
   ```env
   DATABASE_URL="file:./prisma/dev.db"
   JWT_SECRET="your-secret-key-change-in-production"
   PORT=3001
   VITE_API_URL=http://localhost:3001/api
   ```

4. **Set up database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Start development servers**
   ```bash
   npm run dev:all
   ```

## Development URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## Useful Commands

- `npm run dev` - Start frontend only
- `npm run dev:server` - Start backend only
- `npm run dev:all` - Start both
- `npm run prisma:studio` - Open database GUI
- `npm run build` - Build for production

## Database Management

- **View database**: `npm run prisma:studio`
- **Create migration**: `npm run prisma:migrate`
- **Reset database**: Delete `prisma/dev.db` and run `npm run prisma:migrate`

## Related

- [[Deployment Guide]]
- See `README.md` for more details
