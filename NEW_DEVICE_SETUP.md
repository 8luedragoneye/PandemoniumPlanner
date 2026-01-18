# New Device Setup Guide

Quick setup instructions for cloning and running this project on a new device.

## Prerequisites

- **Node.js 18+** and npm installed
  - Check with: `node --version` and `npm --version`
  - Download from: https://nodejs.org/

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PandemoniumPlanner
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages for both frontend and backend.

### 3. Create Environment File

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3001
VITE_API_URL=http://localhost:3001/api
```

**Note:** Change `JWT_SECRET` to a random string for security (especially in production).

### 4. Set Up Database

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

This creates the SQLite database file at `prisma/dev.db` and sets up all tables.

### 5. Start the Application

You have two options:

**Option A: Start both servers together (Recommended)**
```bash
npm run dev:all
```

**Option B: Start servers separately**
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend  
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## Verification

1. Open http://localhost:3000 in your browser
2. You should see the login/register page
3. Register a new account to test the setup

## Troubleshooting

### Port Already in Use
- **Port 3000**: Change in `vite.config.ts` or stop the conflicting service
- **Port 3001**: Change `PORT` in `.env` or stop the conflicting service

### Database Errors
- Delete `prisma/dev.db` and `prisma/dev.db-journal` (if exists)
- Run `npm run prisma:migrate` again

### Module Not Found Errors
- Make sure you ran `npm install` completely
- Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Prisma Client Not Generated
- Run `npm run prisma:generate` manually

## Additional Commands

- **View database**: `npm run prisma:studio` (opens Prisma Studio at http://localhost:5555)
- **Create new migration**: `npm run prisma:migrate`
- **Build for production**: `npm run build`

## What Gets Created

- `node_modules/` - Dependencies (gitignored)
- `prisma/dev.db` - SQLite database (gitignored)
- `.env` - Environment variables (gitignored)
- `dist/` - Production build output (gitignored)

## Next Steps

- See `README.md` for project overview
- See `DEPLOYMENT.md` for production deployment instructions
- See `IMPLEMENTATION.md` for technical details
