# Setup Guide

Quick start guide for Pandemonium Planner.

## Prerequisites

- Node.js 18+ and npm
- PocketBase (download from https://pocketbase.io/docs/)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Download PocketBase

1. Go to https://pocketbase.io/docs/
2. Download PocketBase for your OS
3. Extract and place `pocketbase` (or `pocketbase.exe` on Windows) in the project root

### 3. Start PocketBase

```bash
# Linux/Mac
./pocketbase serve

# Windows
pocketbase.exe serve
```

PocketBase will start on http://localhost:8090

### 4. Set Up Collections

1. Open http://localhost:8090/_/ in your browser
2. Create an admin account (first time only)
3. Follow the instructions in `pocketbase-schema.md` to create collections:
   - `users` (auth collection)
   - `activities`
   - `roles`
   - `signups`
4. Set API rules as specified in the schema document

### 5. Start Frontend

```bash
npm run dev
```

Frontend will start on http://localhost:3000

### 6. Create Your First User

1. Go to http://localhost:3000
2. Click "Register"
3. Enter your email, password, and name
4. You're ready to create activities!

## Environment Variables

Create a `.env` file (optional, defaults work for local dev):

```env
VITE_POCKETBASE_URL=http://localhost:8090
```

## Production Build

```bash
npm run build
```

Output will be in the `dist/` folder.

## Troubleshooting

- **Port already in use**: Change the port in `vite.config.ts` or stop the conflicting service
- **PocketBase connection error**: Make sure PocketBase is running on port 8090
- **Collection errors**: Verify collections are created and API rules are set correctly
- **CORS errors**: PocketBase handles CORS automatically, but check if URL is correct

## Next Steps

- See `DEPLOYMENT.md` for production deployment
- See `pocketbase-schema.md` for collection setup details
