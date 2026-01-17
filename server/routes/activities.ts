import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all activities
router.get('/', authenticateToken, async (req, res) => {
  try {
    const activities = await prisma.activity.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    res.json(activities);
  } catch (error: any) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch activities' });
  }
});

// Get single activity
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activity);
  } catch (error: any) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch activity' });
  }
});

// Create activity
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, date, description, zone, minIP, minFame, status } = req.body;

    if (!name || !date || !description) {
      return res.status(400).json({ error: 'Name, date, and description are required' });
    }

    const activity = await prisma.activity.create({
      data: {
        name,
        date: new Date(date),
        description,
        zone: zone || null,
        minIP: minIP ? parseInt(minIP) : null,
        minFame: minFame ? parseInt(minFame) : null,
        status: status || 'recruiting',
        creatorId: req.userId!,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(activity);
  } catch (error: any) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: error.message || 'Failed to create activity' });
  }
});

// Update activity
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.id },
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.creatorId !== req.userId) {
      return res.status(403).json({ error: 'Only the creator can update this activity' });
    }

    const { name, date, description, zone, minIP, minFame, status } = req.body;

    const updated = await prisma.activity.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(date && { date: new Date(date) }),
        ...(description && { description }),
        ...(zone !== undefined && { zone: zone || null }),
        ...(minIP !== undefined && { minIP: minIP ? parseInt(minIP) : null }),
        ...(minFame !== undefined && { minFame: minFame ? parseInt(minFame) : null }),
        ...(status && { status }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update activity error:', error);
    res.status(500).json({ error: error.message || 'Failed to update activity' });
  }
});

// Delete activity
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.id },
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    if (activity.creatorId !== req.userId) {
      return res.status(403).json({ error: 'Only the creator can delete this activity' });
    }

    await prisma.activity.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Activity deleted' });
  } catch (error: any) {
    console.error('Delete activity error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete activity' });
  }
});

export default router;
