import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

// Get all signups for an activity
router.get('/activity/:activityId', authenticateToken, async (req, res) => {
  try {
    const signups = await prisma.signup.findMany({
      where: { activityId: req.params.activityId },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            creatorId: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            slots: true,
          },
        },
        player: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(signups.map(s => ({
      ...s,
      attributes: JSON.parse(s.attributes),
    })));
  } catch (error: any) {
    console.error('Get signups error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch signups' });
  }
});

// Create signup
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { activityId, roleId, attributes, comment } = req.body;

    if (!activityId || !roleId) {
      return res.status(400).json({ error: 'Activity ID and role ID are required' });
    }

    // Check if already signed up
    const existing = await prisma.signup.findFirst({
      where: {
        activityId,
        playerId: req.userId!,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already signed up for this activity' });
    }

    // Check role exists and has slots
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        signups: true,
      },
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.signups.length >= role.slots) {
      return res.status(400).json({ error: 'Role is full' });
    }

    const signup = await prisma.signup.create({
      data: {
        activityId,
        roleId,
        playerId: req.userId!,
        attributes: JSON.stringify(attributes || {}),
        comment: comment || null,
      },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            creatorId: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            slots: true,
          },
        },
        player: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      ...signup,
      attributes: JSON.parse(signup.attributes),
    });
  } catch (error: any) {
    console.error('Create signup error:', error);
    res.status(500).json({ error: error.message || 'Failed to create signup' });
  }
});

// Update signup
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const signup = await prisma.signup.findUnique({
      where: { id: req.params.id },
      include: {
        activity: true,
      },
    });

    if (!signup) {
      return res.status(404).json({ error: 'Signup not found' });
    }

    // User can update their own signup, or activity creator can update any
    if (signup.playerId !== req.userId && signup.activity.creatorId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to update this signup' });
    }

    const { attributes, comment } = req.body;

    const updated = await prisma.signup.update({
      where: { id: req.params.id },
      data: {
        ...(attributes !== undefined && { attributes: JSON.stringify(attributes) }),
        ...(comment !== undefined && { comment: comment || null }),
      },
      include: {
        activity: {
          select: {
            id: true,
            name: true,
            creatorId: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            slots: true,
          },
        },
        player: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      ...updated,
      attributes: JSON.parse(updated.attributes),
    });
  } catch (error: any) {
    console.error('Update signup error:', error);
    res.status(500).json({ error: error.message || 'Failed to update signup' });
  }
});

// Delete signup
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const signup = await prisma.signup.findUnique({
      where: { id: req.params.id },
      include: {
        activity: true,
      },
    });

    if (!signup) {
      return res.status(404).json({ error: 'Signup not found' });
    }

    // User can delete their own signup, or activity creator can delete any
    if (signup.playerId !== req.userId && signup.activity.creatorId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this signup' });
    }

    await prisma.signup.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Signup deleted' });
  } catch (error: any) {
    console.error('Delete signup error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete signup' });
  }
});

export default router;
