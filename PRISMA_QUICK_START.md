# Prisma Quick Start

## Setup Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

3. **Create database**:
   ```bash
   npm run prisma:migrate
   ```
   When prompted, name the migration: `init`

4. **Start both servers**:
   ```bash
   npm run dev:all
   ```

   Or separately:
   ```bash
   # Terminal 1: Backend
   npm run dev:server
   
   # Terminal 2: Frontend  
   npm run dev
   ```

5. **Open the app**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api

## First Use

1. Go to http://localhost:3000
2. Click "Register"
3. Enter your email, password, and name
4. Start creating activities!

## Troubleshooting

### "Cannot find module '@prisma/client'"
→ Run `npm run prisma:generate`

### "Database not found"
→ Run `npm run prisma:migrate`

### "Connection refused" errors
→ Make sure the backend is running (`npm run dev:server`)

### CORS errors
→ Backend should handle CORS automatically, but check that it's running on port 3001

## Database Location

- SQLite database: `prisma/dev.db`
- View/edit: `npm run prisma:studio` (opens at http://localhost:5555)
