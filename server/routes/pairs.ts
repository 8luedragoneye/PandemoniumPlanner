import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { handleError, handleNotFound, handleUnauthorized, handleValidationError } from '../lib/errorHandler';

const router = express.Router();

// Get all pairs for an activity
router.get('/activity/:activityId', authenticateToken, async (req, res) => {
  try {
    const activity = await prisma.activity.findUnique({
      where: { id: req.params.activityId },
    });

    if (!activity) {
      return handleNotFound(res, 'Activity');
    }

    const pairs = await prisma.transportPair.findMany({
      where: { activityId: req.params.activityId },
      include: {
        fighter: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        transporter: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.json(pairs.map(p => ({
      ...p,
      fighter: {
        ...p.fighter,
        attributes: JSON.parse(p.fighter.attributes),
      },
      transporter: {
        ...p.transporter,
        attributes: JSON.parse(p.transporter.attributes),
      },
    })));
  } catch (error: unknown) {
    handleError(res, error, 'Failed to fetch pairs');
  }
});

// Create a pair
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { activityId, fighterId, transporterId } = req.body;

    if (!activityId || !fighterId || !transporterId) {
      return handleValidationError(res, 'Activity ID, fighter ID, and transporter ID are required');
    }

    // Verify activity exists and user is creator
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return handleNotFound(res, 'Activity');
    }

    if (activity.creatorId !== req.userId) {
      return handleUnauthorized(res, 'Only the activity creator can create pairs');
    }

    // Verify signups exist and are from the same activity
    const [fighter, transporter] = await Promise.all([
      prisma.signup.findUnique({
        where: { id: fighterId },
        include: { activity: true },
      }),
      prisma.signup.findUnique({
        where: { id: transporterId },
        include: { activity: true },
      }),
    ]);

    if (!fighter || !transporter) {
      return handleNotFound(res, 'Fighter or transporter signup not found');
    }

    if (fighter.activityId !== activityId || transporter.activityId !== activityId) {
      return handleValidationError(res, 'Signups must be from the same activity');
    }

    // Verify they are different roles
    const fighterAttrs = JSON.parse(fighter.attributes);
    const transporterAttrs = JSON.parse(transporter.attributes);

    if (fighterAttrs.role !== 'Fighter' || transporterAttrs.role !== 'Transporter') {
      return handleValidationError(res, 'Pair must consist of one Fighter and one Transporter');
    }

    // Check if either is already paired
    const existingPair = await prisma.transportPair.findFirst({
      where: {
        activityId,
        OR: [
          { fighterId },
          { transporterId },
        ],
      },
    });

    if (existingPair) {
      return handleValidationError(res, 'One or both participants are already paired');
    }

    const pair = await prisma.transportPair.create({
      data: {
        activityId,
        fighterId,
        transporterId,
      },
      include: {
        fighter: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        transporter: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      ...pair,
      fighter: {
        ...pair.fighter,
        attributes: JSON.parse(pair.fighter.attributes),
      },
      transporter: {
        ...pair.transporter,
        attributes: JSON.parse(pair.transporter.attributes),
      },
    });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to create pair');
  }
});

// Update a pair
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const pair = await prisma.transportPair.findUnique({
      where: { id: req.params.id },
      include: {
        activity: true,
      },
    });

    if (!pair) {
      return handleNotFound(res, 'Pair');
    }

    if (pair.activity.creatorId !== req.userId) {
      return handleUnauthorized(res, 'Only the activity creator can update pairs');
    }

    const { fighterId, transporterId } = req.body;

    // Validate new signups if provided
    if (fighterId || transporterId) {
      const activityId = pair.activityId;
      const newFighterId = fighterId || pair.fighterId;
      const newTransporterId = transporterId || pair.transporterId;

      const [fighter, transporter] = await Promise.all([
        prisma.signup.findUnique({
          where: { id: newFighterId },
          include: { activity: true },
        }),
        prisma.signup.findUnique({
          where: { id: newTransporterId },
          include: { activity: true },
        }),
      ]);

      if (!fighter || !transporter) {
        return handleNotFound(res, 'Fighter or transporter signup not found');
      }

      if (fighter.activityId !== activityId || transporter.activityId !== activityId) {
        return handleValidationError(res, 'Signups must be from the same activity');
      }

      const fighterAttrs = JSON.parse(fighter.attributes);
      const transporterAttrs = JSON.parse(transporter.attributes);

      if (fighterAttrs.role !== 'Fighter' || transporterAttrs.role !== 'Transporter') {
        return handleValidationError(res, 'Pair must consist of one Fighter and one Transporter');
      }

      // Check if new signups are already paired (excluding current pair)
      const existingPair = await prisma.transportPair.findFirst({
        where: {
          activityId,
          id: { not: pair.id },
          OR: [
            { fighterId: newFighterId },
            { transporterId: newTransporterId },
          ],
        },
      });

      if (existingPair) {
        return handleValidationError(res, 'One or both participants are already paired');
      }
    }

    const updated = await prisma.transportPair.update({
      where: { id: req.params.id },
      data: {
        ...(fighterId && { fighterId }),
        ...(transporterId && { transporterId }),
      },
      include: {
        fighter: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        transporter: {
          include: {
            player: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    res.json({
      ...updated,
      fighter: {
        ...updated.fighter,
        attributes: JSON.parse(updated.fighter.attributes),
      },
      transporter: {
        ...updated.transporter,
        attributes: JSON.parse(updated.transporter.attributes),
      },
    });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to update pair');
  }
});

// Delete a pair
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const pair = await prisma.transportPair.findUnique({
      where: { id: req.params.id },
      include: {
        activity: true,
      },
    });

    if (!pair) {
      return handleNotFound(res, 'Pair');
    }

    if (pair.activity.creatorId !== req.userId) {
      return handleUnauthorized(res, 'Only the activity creator can delete pairs');
    }

    await prisma.transportPair.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Pair deleted' });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to delete pair');
  }
});

export default router;
