import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateName, findUserByName } from '../services/nameValidation';
import prisma from '../lib/prisma';

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
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return user;
  } catch (error: any) {
    // If creation fails (e.g., duplicate), try to find again
    if (error.code === 'P2002') {
      user = await findUserByName(name);
      if (user) {
        return user;
      }
    }
    throw error;
  }
}

// Register - name-only authentication
// Validates name and auto-creates user if needed
router.post('/register', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const trimmedName = name.trim();

    // Validate name (can be swapped for external API validation)
    const isValid = await validateName(trimmedName);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid name' });
    }

    // Find or create user
    const user = await findOrCreateUser(trimmedName);

    // Generate token
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

    res.json({ user, token });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// Login - name-only authentication
// Validates name and auto-creates user if needed
router.post('/login', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const trimmedName = name.trim();

    // Validate name (can be swapped for external API validation)
    const isValid = await validateName(trimmedName);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid name' });
    }

    // Find or create user
    const user = await findOrCreateUser(trimmedName);

    // Generate token
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '7d' });

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
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
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
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user' });
  }
});

export default router;
