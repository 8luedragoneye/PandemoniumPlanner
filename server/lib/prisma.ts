import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Set default DATABASE_URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}

// Shared Prisma client instance (singleton pattern)
// This ensures we reuse the same connection across all routes
const prisma = new PrismaClient();

export default prisma;
