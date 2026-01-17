import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all roles for an activity
router.get('/activity/:activityId', authenticateToken, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      where: { activityId: req.params.activityId },
      include: {
        activity: {
          select: {
            id: true,
            creatorId: true,
          },
        },
      },
    });

    res.json(roles);
  } catch (error: any) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch roles' });
  }
});

// Create role
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { activityId, name, slots, attributes } = req.body;

    if (!activityId || !name || !slots) {
      return res.status(400).json({ error: 'Activity ID, name, and slots are required' });
    }

    // Verify user is the activity creator
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.creatorId !== req.userId) {
      return res.status(403).json({ error: 'Only the activity creator can create roles' });
    }

    const role = await prisma.role.create({
      data: {
        activityId,
        name,
        slots: parseInt(slots),
        attributes: JSON.stringify(attributes || {}),
      },
    });

    res.status(201).json({
      ...role,
      attributes: JSON.parse(role.attributes),
    });
  } catch (error: any) {
    console.error('Create role error:', error);
    res.status(500).json({ error: error.message || 'Failed to create role' });
  }
});

// Update role
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: {
        activity: true,
      },
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.activity.creatorId !== req.userId) {
      return res.status(403).json({ error: 'Only the activity creator can update roles' });
    }

    const { name, slots, attributes } = req.body;

    const updated = await prisma.role.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(slots !== undefined && { slots: parseInt(slots) }),
        ...(attributes !== undefined && { attributes: JSON.stringify(attributes) }),
      },
    });

    res.json({
      ...updated,
      attributes: JSON.parse(updated.attributes),
    });
  } catch (error: any) {
    console.error('Update role error:', error);
    res.status(500).json({ error: error.message || 'Failed to update role' });
  }
});

// Delete role
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: {
        activity: true,
      },
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.activity.creatorId !== req.userId) {
      return res.status(403).json({ error: 'Only the activity creator can delete roles' });
    }

    await prisma.role.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Role deleted' });
  } catch (error: any) {
    console.error('Delete role error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete role' });
  }
});

export default router;
