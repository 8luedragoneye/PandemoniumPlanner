import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { handleError, handleNotFound, handleUnauthorized, handleValidationError } from '../lib/errorHandler';

const router = express.Router();

// Get all fill providers with calculated priority (sorted)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const providers = await prisma.fillProvider.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        points: true
      }
    });

    // Calculate priority (sum of all points, higher = higher priority)
    const providersWithPriority = providers.map(provider => {
      const totalPoints = provider.points.reduce((sum, p) => sum + p.points, 0);
      return {
        ...provider,
        priority: totalPoints
      };
    });

    // Sort by priority (descending)
    providersWithPriority.sort((a, b) => b.priority - a.priority);

    res.json(providersWithPriority);
  } catch (error: unknown) {
    handleError(res, error, 'Failed to fetch fill providers');
  }
});

// Get single provider details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const provider = await prisma.fillProvider.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        points: {
          include: {
            activity: {
              select: { id: true, name: true, date: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!provider) {
      return handleNotFound(res, 'Fill provider');
    }

    const totalPoints = provider.points.reduce((sum, p) => sum + p.points, 0);

    res.json({
      ...provider,
      priority: totalPoints
    });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to fetch fill provider');
  }
});

// Self-service registration
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { providesSlots, providesWeight, slotOrigin, slotTarget, weightOrigin, weightTarget, notes } = req.body;

    if (!providesSlots && !providesWeight) {
      return handleValidationError(res, 'Must provide at least one fill type (slots or weight)');
    }

    // Check if already registered
    const existing = await prisma.fillProvider.findUnique({
      where: { userId: req.userId! }
    });

    if (existing) {
      return handleValidationError(res, 'Already registered as fill provider');
    }

    // Verify user has participated in at least one transport activity
    const hasParticipated = await prisma.signup.findFirst({
      where: {
        playerId: req.userId!,
        activity: {
          type: 'transport'
        }
      }
    });

    if (!hasParticipated) {
      return handleValidationError(res, 'Must have participated in at least one transport activity');
    }

    // Validate required fields based on fill types
    if (providesSlots && (!slotOrigin || !slotTarget)) {
      return handleValidationError(res, 'Slot origin and target are required when providing slot fill');
    }

    if (providesWeight && (!weightOrigin || !weightTarget)) {
      return handleValidationError(res, 'Weight origin and target are required when providing weight fill');
    }

    const provider = await prisma.fillProvider.create({
      data: {
        userId: req.userId!,
        providesSlots: providesSlots || false,
        providesWeight: providesWeight || false,
        slotOrigin: providesSlots ? slotOrigin : null,
        slotTarget: providesSlots ? slotTarget : null,
        weightOrigin: providesWeight ? weightOrigin : null,
        weightTarget: providesWeight ? weightTarget : null,
        notes: notes || null
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({
      ...provider,
      priority: 0
    });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to register fill provider');
  }
});

// Update fill provider (only own provider)
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const provider = await prisma.fillProvider.findUnique({
      where: { id: req.params.id }
    });

    if (!provider) {
      return handleNotFound(res, 'Fill provider');
    }

    if (provider.userId !== req.userId) {
      return handleUnauthorized(res, 'Not authorized to update this fill provider');
    }

    const { providesSlots, providesWeight, slotOrigin, slotTarget, weightOrigin, weightTarget, notes, isActive } = req.body;

    // Validate required fields based on fill types
    if (providesSlots && (!slotOrigin || !slotTarget)) {
      return handleValidationError(res, 'Slot origin and target are required when providing slot fill');
    }

    if (providesWeight && (!weightOrigin || !weightTarget)) {
      return handleValidationError(res, 'Weight origin and target are required when providing weight fill');
    }

    const updated = await prisma.fillProvider.update({
      where: { id: req.params.id },
      data: {
        providesSlots,
        providesWeight,
        slotOrigin: providesSlots ? slotOrigin : null,
        slotTarget: providesSlots ? slotTarget : null,
        weightOrigin: providesWeight ? weightOrigin : null,
        weightTarget: providesWeight ? weightTarget : null,
        notes,
        ...(isActive !== undefined && { isActive })
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        points: true
      }
    });

    const totalPoints = updated.points.reduce((sum, p) => sum + p.points, 0);

    res.json({
      ...updated,
      priority: totalPoints
    });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to update fill provider');
  }
});

// Add points to fill provider (organizer only)
router.post('/:id/points', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { activityId, points, reason, notes } = req.body;

    if (!points || !reason) {
      return handleValidationError(res, 'Points and reason are required');
    }

    // Verify provider exists
    const provider = await prisma.fillProvider.findUnique({
      where: { id: req.params.id }
    });

    if (!provider) {
      return handleNotFound(res, 'Fill provider');
    }

    // If activityId provided, verify user is activity creator
    if (activityId) {
      const activity = await prisma.activity.findUnique({
        where: { id: activityId }
      });

      if (!activity) {
        return handleNotFound(res, 'Activity');
      }

      if (activity.creatorId !== req.userId) {
        return handleUnauthorized(res, 'Only activity creator can add points for activities');
      }
    }

    const pointEntry = await prisma.fillProviderPoints.create({
      data: {
        providerId: req.params.id,
        activityId: activityId || null,
        points,
        reason,
        notes: notes || null
      }
    });

    res.status(201).json(pointEntry);
  } catch (error: unknown) {
    handleError(res, error, 'Failed to add points');
  }
});

export default router;
