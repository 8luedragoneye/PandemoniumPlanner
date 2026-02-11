import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateName, findUserByName } from '../services/nameValidation';
import prisma from '../lib/prisma';
import { handleError, handleValidationError, handleNotFound } from '../lib/errorHandler';
import { JWT_EXPIRATION, DEFAULT_JWT_SECRET } from '../lib/constants';

const router = express.Router();

// Helper function to find or create user
// Note: Authentication is name-only. Email and password are placeholders for database schema requirements.
async function findOrCreateUser(name: string) {
  // Try to find existing user by name
  let user = await findUserByName(name);

  if (user) {
    return user;
  }

  // User doesn't exist, create it
  // Generate unique email to satisfy database unique constraint (not used for authentication)
  const email = `${name.replace(/\s+/g, '_')}_${Date.now()}@local`;
  
  try {
    user = await prisma.user.create({
      data: {
        email, // Placeholder - not used for authentication
        password: 'no-password', // Placeholder - not used for authentication
        name: name.trim(), // This is what we use for authentication
        username: name.trim(),
      },
    });
    return user;
  } catch (error: unknown) {
    // If creation fails (e.g., duplicate), try to find again
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      user = await findUserByName(name);
      if (user) {
        return user;
      }
    }
    throw error;
  }
}

// Register - name-only authentication
// Validates name against Albion Online guild membership and auto-creates user if needed
router.post('/register', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const trimmedName = name.trim();

    // Validate name against Albion Online guild membership
    const isValid = await validateName(trimmedName);
    if (!isValid) {
      return handleValidationError(res, 'Player not found in guild');
    }

    // Find or create user
    const user = await findOrCreateUser(trimmedName);
    if (!user) {
      return handleNotFound(res, 'User');
    }

    // Generate token
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: JWT_EXPIRATION });

    res.json({ user, token });
  } catch (error: unknown) {
    handleError(res, error, 'Registration failed');
  }
});

// Login - name-only authentication
// Validates name against Albion Online guild membership and auto-creates user if needed
router.post('/login', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return handleValidationError(res, 'Name is required');
    }

    const trimmedName = name.trim();

    // Validate name against Albion Online guild membership
    const isValid = await validateName(trimmedName);
    if (!isValid) {
      return res.status(401).json({ error: 'Player not found in guild' });
    }

    // Find or create user
    const user = await findOrCreateUser(trimmedName);
    if (!user) {
      return handleNotFound(res, 'User');
    }

    // Generate token
    const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: JWT_EXPIRATION });

    res.json({
      user: {
        id: user.id,
        email: user.email, // Included for compatibility, but not used for auth
        username: user.username,
        name: user.name, // This is the authentication identifier
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (error: unknown) {
    handleError(res, error, 'Login failed');
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return handleNotFound(res, 'User');
    }

    res.json({ user });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to get user');
  }
});

export default router;
