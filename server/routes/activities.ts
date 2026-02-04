import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { handleError, handleNotFound, handleUnauthorized, handleValidationError } from '../lib/errorHandler';
import { ACTIVITY_CLEANUP_HOURS, ACTIVITY_TYPES } from '../lib/constants';

const router = express.Router();

/**
 * Cleanup old activities (runs asynchronously, doesn't block response)
 * Deletes activities that are past by ACTIVITY_CLEANUP_HOURS
 * This works well with free hosting that has sleep/idle timeouts
 */
async function cleanupOldActivities(): Promise<void> {
  try {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - ACTIVITY_CLEANUP_HOURS);

    const deleted = await prisma.activity.deleteMany({
      where: {
        date: {
          lt: cutoffTime,
        },
      },
    });

    if (deleted.count > 0) {
      console.log(`🧹 Cleaned up ${deleted.count} old activity/activities`);
    }
  } catch (error) {
    // Don't throw - cleanup failures shouldn't break the API
    console.error('Error during activity cleanup:', error);
  }
}

// Get all activities
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Cleanup old activities asynchronously (doesn't block response)
    // This works well with free hosting that has sleep/idle timeouts
    cleanupOldActivities().catch(() => {
      // Silently fail - cleanup shouldn't affect the response
    });

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
  } catch (error: unknown) {
    handleError(res, error, 'Failed to fetch activities');
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
      return handleNotFound(res, 'Activity');
    }

    res.json(activity);
  } catch (error: unknown) {
    handleError(res, error, 'Failed to fetch activity');
  }
});

// Create activity
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, date, massupTime, description, zone, minEquip, status, type, activityTypes } = req.body;

    if (!name || !date || !description) {
      return handleValidationError(res, 'Name, date, and description are required');
    }

    // Validate activityTypes if provided
    let validatedActivityTypes: string[] = [];
    if (activityTypes && Array.isArray(activityTypes)) {
      validatedActivityTypes = activityTypes.filter((t: string) => 
        ACTIVITY_TYPES.includes(t as typeof ACTIVITY_TYPES[number])
      );
    }

    const activity = await prisma.activity.create({
      data: {
        name,
        date: new Date(date),
        massupTime: massupTime ? new Date(massupTime) : null,
        description,
        zone: zone || null,
        minEquip: minEquip || null,
        status: status || 'recruiting',
        type: type || 'regular',
        activityTypes: JSON.stringify(validatedActivityTypes),
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
  } catch (error: unknown) {
    handleError(res, error, 'Failed to create activity');
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

    const { name, date, massupTime, description, zone, minEquip, status, type, activityTypes } = req.body;

    // Validate activityTypes if provided
    let activityTypesData: { activityTypes: string } | undefined;
    if (activityTypes !== undefined) {
      const validatedActivityTypes = Array.isArray(activityTypes) 
        ? activityTypes.filter((t: string) => ACTIVITY_TYPES.includes(t as typeof ACTIVITY_TYPES[number]))
        : [];
      activityTypesData = { activityTypes: JSON.stringify(validatedActivityTypes) };
    }

    const updated = await prisma.activity.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(date && { date: new Date(date) }),
        ...(massupTime !== undefined && { massupTime: massupTime ? new Date(massupTime) : null }),
        ...(description && { description }),
        ...(zone !== undefined && { zone: zone || null }),
        ...(minEquip !== undefined && { minEquip: minEquip || null }),
        ...(status && { status }),
        ...(type !== undefined && { type }),
        ...activityTypesData,
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
  } catch (error: unknown) {
    handleError(res, error, 'Failed to update activity');
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
  } catch (error: unknown) {
    handleError(res, error, 'Failed to delete activity');
  }
});

export default router;
