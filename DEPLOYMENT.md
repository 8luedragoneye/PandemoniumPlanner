# Deployment Guide - Render.com

This guide explains how to deploy Pandemonium Planner to Render.com as a single service.

## Prerequisites

- Render.com account (free tier works)
- Git repository (GitHub/GitLab/Bitbucket)

## Architecture

- **Single Service**: PocketBase serves both backend API and can serve static frontend files
- **Alternative**: Deploy frontend separately on Render Static Site + PocketBase as Web Service

## Option 1: Single Service (PocketBase + Static Files)

### Step 1: Build Frontend

```bash
npm install
npm run build
```

This creates a `dist/` folder with static files.

### Step 2: Prepare PocketBase

1. Download PocketBase binary for Linux (amd64):
   ```bash
   wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip
   unzip pocketbase_0.22.0_linux_amd64.zip
   ```

2. Create a startup script `start.sh`:
   ```bash
   #!/bin/bash
   # Serve static files from dist/ and PocketBase API
   ./pocketbase serve --http=0.0.0.0:8090 --dir=./pb_data
   ```

3. Make it executable:
   ```bash
   chmod +x start.sh
   ```

### Step 3: Configure PocketBase to Serve Static Files

Create `pb_hooks/onServe.js`:
```javascript
routerAdd("GET", "/*", (c) => {
    const path = c.path();
    
    // API routes
    if (path.startsWith("/api/")) {
        return c.next();
    }
    
    // Serve static files from dist/
    return c.file("dist/index.html");
});
```

### Step 4: Deploy to Render

1. **Create New Web Service**:
   - Connect your Git repository
   - Name: `pandemonium-planner`
   - Environment: `Docker` or `Shell`
   - Build Command: 
     ```bash
     npm install && npm run build
     ```
   - Start Command:
     ```bash
     chmod +x pocketbase && ./start.sh
     ```

2. **Add Environment Variables**:
   - None required for basic setup

3. **Add Persistent Disk**:
   - Go to Settings → Persistent Disk
   - Mount path: `/opt/render/project/src/pb_data`
   - Size: 1GB (minimum)

4. **Deploy**

## Option 2: Separate Services (Recommended)

### Service 1: PocketBase Backend

1. **Create Web Service**:
   - Build Command: `echo "No build needed"`
   - Start Command: `./pocketbase serve --http=0.0.0.0:8090`
   - Add persistent disk for `pb_data/`

2. **Environment Variables**:
   - None required

### Service 2: Frontend Static Site

1. **Create Static Site**:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

2. **Environment Variables**:
   - `VITE_POCKETBASE_URL`: Your PocketBase service URL (e.g., `https://pandemonium-planner-api.onrender.com`)

3. **Update Frontend Config**:
   - The frontend will use the environment variable to connect to PocketBase

## Post-Deployment

1. **Access Admin UI**: `https://your-service.onrender.com/_/`
2. **Create Collections**: Follow `pocketbase-schema.md`
3. **Set API Rules**: Configure as specified in schema doc
4. **Create First User**: Use the admin UI or self-registration

## Notes

- **Free Tier Limitations**: Render free tier spins down after 15 minutes of inactivity
- **Database Persistence**: Use persistent disk for `pb_data/` to keep data
- **CORS**: PocketBase handles CORS automatically
- **HTTPS**: Render provides HTTPS automatically

## Troubleshooting

- **502 Bad Gateway**: Check if PocketBase is running and port is correct
- **Data Loss**: Ensure persistent disk is mounted correctly
- **CORS Errors**: Verify `VITE_POCKETBASE_URL` is set correctly
- **Build Failures**: Check Node.js version (use Node 18+)

## Alternative: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM alpine:latest
RUN apk add --no-cache wget unzip
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip && \
    unzip pocketbase_0.22.0_linux_amd64.zip && \
    chmod +x pocketbase && \
    rm pocketbase_0.22.0_linux_amd64.zip
COPY start.sh .
RUN chmod +x start.sh
EXPOSE 8090
CMD ["./start.sh"]
```

Then use Docker deployment on Render.
