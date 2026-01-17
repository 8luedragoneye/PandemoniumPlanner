import { PrismaClient } from '@prisma/client';

// Shared Prisma client instance (singleton pattern)
// This ensures we reuse the same connection across all routes
const prisma = new PrismaClient();

export default prisma;
