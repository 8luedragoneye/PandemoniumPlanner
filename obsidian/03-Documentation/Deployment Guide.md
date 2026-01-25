# Deployment Guide

## Overview

Pandemonium Planner can be deployed to Render.com or similar platforms.

## Prerequisites

- Render.com account (free tier works)
- Git repository (GitHub/GitLab/Bitbucket)

## Deployment Options

### Option 1: Single Service (PocketBase + Static Files)
- PocketBase serves both API and static frontend
- Simpler deployment
- See `DEPLOYMENT.md` for details

### Option 2: Separate Services (Recommended)
- PocketBase as Web Service
- Frontend as Static Site
- Better separation of concerns

## Steps

1. **Build frontend**
   ```bash
   npm run build
   ```

2. **Configure environment variables**
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secure random string
   - `VITE_API_URL`: Backend API URL

3. **Deploy backend**
   - Create Web Service on Render
   - Add persistent disk for database
   - Set start command

4. **Deploy frontend**
   - Create Static Site on Render
   - Set build command
   - Configure environment variables

## Post-Deployment

1. Run database migrations
2. Create initial admin user
3. Configure API rules
4. Test all features

## Related

- See `DEPLOYMENT.md` for detailed instructions
- [[Development Setup]]
