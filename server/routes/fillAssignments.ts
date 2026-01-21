import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { handleError, handleNotFound, handleUnauthorized, handleValidationError } from '../lib/errorHandler';

const router = express.Router();

// Get all fill assignments for an activity
router.get('/activity/:activityId', authenticateToken, async (req, res) => {
  try {
    const assignments = await prisma.fillAssignment.findMany({
      where: { activityId: req.params.activityId },
      include: {
        provider: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            points: true
          }
        },
        pair: {
          include: {
            fighter: {
              include: {
                player: { select: { id: true, name: true } }
              }
            },
            transporter: {
              include: {
                player: { select: { id: true, name: true } }
              }
            }
          }
        }
      }
    });

    // Add priority to provider
    const assignmentsWithPriority = assignments.map(assignment => ({
      ...assignment,
      provider: {
        ...assignment.provider,
        priority: assignment.provider.points.reduce((sum, p) => sum + p.points, 0)
      }
    }));

    res.json(assignmentsWithPriority);
  } catch (error: unknown) {
    handleError(res, error, 'Failed to fetch fill assignments');
  }
});

// Auto-assign fill to all pairs in activity
router.post('/auto-assign', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { activityId } = req.body;

    if (!activityId) {
      return handleValidationError(res, 'Activity ID is required');
    }

    // Verify activity exists and user is creator
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      return handleNotFound(res, 'Activity');
    }

    if (activity.creatorId !== req.userId) {
      return handleUnauthorized(res, 'Only activity creator can auto-assign fill');
    }

    if (activity.type !== 'transport') {
      return handleValidationError(res, 'Auto-assign is only available for transport activities');
    }

    // Get all pairs for this activity
    const pairs = await prisma.transportPair.findMany({
      where: { activityId }
    });

    if (pairs.length === 0) {
      return handleValidationError(res, 'No pairs found for this activity');
    }

    // Get all active providers with priority
    const providers = await prisma.fillProvider.findMany({
      where: { isActive: true },
      include: {
        points: true,
        assignments: {
          where: { activityId }
        }
      }
    });

    // Calculate priority and filter by fill type
    const slotProviders = providers
      .filter(p => p.providesSlots)
      .map(p => ({
        ...p,
        priority: p.points.reduce((sum, point) => sum + point.points, 0),
        currentAssignments: p.assignments.filter(a => a.fillType === 'slots').length
      }))
      .sort((a, b) => b.priority - a.priority);

    const weightProviders = providers
      .filter(p => p.providesWeight)
      .map(p => ({
        ...p,
        priority: p.points.reduce((sum, point) => sum + point.points, 0),
        currentAssignments: p.assignments.filter(a => a.fillType === 'weight').length
      }))
      .sort((a, b) => b.priority - a.priority);

    // Check if we have enough providers
    if (slotProviders.length === 0 && weightProviders.length === 0) {
      return handleValidationError(res, 'No active fill providers available');
    }

    const createdAssignments = [];
    const pointEntries = [];

    // Get existing assignments to account for them in counts
    const existingAssignments = await prisma.fillAssignment.findMany({
      where: { activityId }
    });

    // Track provider assignment counts for this session (including existing)
    const slotProviderCounts = new Map<string, number>();
    const weightProviderCounts = new Map<string, number>();

    // Initialize counts with existing assignments
    existingAssignments.forEach(assignment => {
      if (assignment.fillType === 'slots') {
        const count = slotProviderCounts.get(assignment.providerId) || 0;
        slotProviderCounts.set(assignment.providerId, count + 1);
      } else if (assignment.fillType === 'weight') {
        const count = weightProviderCounts.get(assignment.providerId) || 0;
        weightProviderCounts.set(assignment.providerId, count + 1);
      }
    });

    // Assign fill to each pair
    for (const pair of pairs) {
      // Assign slot fill
      if (slotProviders.length > 0) {
        // Find provider with highest priority that hasn't reached max (2 pairs)
        const slotProvider = slotProviders.find(p => {
          const count = slotProviderCounts.get(p.id) || 0;
          return count < 2;
        });

        if (slotProvider) {
          // Check if assignment already exists for this pair
          const existing = existingAssignments.find(
            a => a.pairId === pair.id && a.fillType === 'slots'
          );

          if (!existing) {
            const assignment = await prisma.fillAssignment.create({
              data: {
                activityId,
                pairId: pair.id,
                providerId: slotProvider.id,
                fillType: 'slots'
              },
              include: {
                provider: {
                  include: {
                    user: { select: { id: true, name: true, email: true } }
                  }
                }
              }
            });

            createdAssignments.push(assignment);

            // Increment count
            const currentCount = slotProviderCounts.get(slotProvider.id) || 0;
            slotProviderCounts.set(slotProvider.id, currentCount + 1);

            // Add points: +1 for participation, -1 for assignment
            await prisma.fillProviderPoints.create({
              data: {
                providerId: slotProvider.id,
                activityId,
                points: 1,
                reason: 'session_participation'
              }
            });

            await prisma.fillProviderPoints.create({
              data: {
                providerId: slotProvider.id,
                activityId,
                points: -1,
                reason: 'assignment'
              }
            });
          }
        }
      }

      // Assign weight fill
      if (weightProviders.length > 0) {
        const weightProvider = weightProviders.find(p => {
          const count = weightProviderCounts.get(p.id) || 0;
          return count < 2;
        });

        if (weightProvider) {
          // Check if assignment already exists for this pair
          const existing = existingAssignments.find(
            a => a.pairId === pair.id && a.fillType === 'weight'
          );

          if (!existing) {
            const assignment = await prisma.fillAssignment.create({
              data: {
                activityId,
                pairId: pair.id,
                providerId: weightProvider.id,
                fillType: 'weight'
              },
              include: {
                provider: {
                  include: {
                    user: { select: { id: true, name: true, email: true } }
                  }
                }
              }
            });

            createdAssignments.push(assignment);

            const currentCount = weightProviderCounts.get(weightProvider.id) || 0;
            weightProviderCounts.set(weightProvider.id, currentCount + 1);

            await prisma.fillProviderPoints.create({
              data: {
                providerId: weightProvider.id,
                activityId,
                points: 1,
                reason: 'session_participation'
              }
            });

            await prisma.fillProviderPoints.create({
              data: {
                providerId: weightProvider.id,
                activityId,
                points: -1,
                reason: 'assignment'
              }
            });
          }
        }
      }
    }

    res.status(201).json({
      message: `Created ${createdAssignments.length} fill assignments`,
      assignments: createdAssignments
    });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to auto-assign fill');
  }
});

// Create fill assignment (manual)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { activityId, pairId, providerId, fillType } = req.body;

    if (!activityId || !pairId || !providerId || !fillType) {
      return handleValidationError(res, 'Activity ID, pair ID, provider ID, and fill type are required');
    }

    if (!['slots', 'weight'].includes(fillType)) {
      return handleValidationError(res, 'Fill type must be "slots" or "weight"');
    }

    // Verify activity exists and user is creator
    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      return handleNotFound(res, 'Activity');
    }

    if (activity.creatorId !== req.userId) {
      return handleUnauthorized(res, 'Only activity creator can create fill assignments');
    }

    // Verify provider can provide this fill type
    const provider = await prisma.fillProvider.findUnique({
      where: { id: providerId }
    });

    if (!provider || !provider.isActive) {
      return handleNotFound(res, 'Fill provider');
    }

    if (fillType === 'slots' && !provider.providesSlots) {
      return handleValidationError(res, 'Provider does not provide slot fill');
    }

    if (fillType === 'weight' && !provider.providesWeight) {
      return handleValidationError(res, 'Provider does not provide weight fill');
    }

    // Verify pair exists
    const pair = await prisma.transportPair.findUnique({
      where: { id: pairId }
    });

    if (!pair || pair.activityId !== activityId) {
      return handleNotFound(res, 'Transport pair');
    }

    // Check if provider already assigned to 2 pairs in this activity
    const existingAssignments = await prisma.fillAssignment.findMany({
      where: {
        activityId,
        providerId,
        fillType
      }
    });

    if (existingAssignments.length >= 2) {
      return handleValidationError(res, 'Provider already assigned to maximum of 2 pairs for this fill type');
    }

    // Create assignment
    const assignment = await prisma.fillAssignment.create({
      data: {
        activityId,
        pairId,
        providerId,
        fillType
      },
      include: {
        provider: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            points: true
          }
        },
        pair: {
          include: {
            fighter: {
              include: { player: { select: { id: true, name: true } } }
            },
            transporter: {
              include: { player: { select: { id: true, name: true } } }
            }
          }
        }
      }
    });

    // Add points: +1 for participation, -1 for assignment
    await prisma.fillProviderPoints.create({
      data: {
        providerId,
        activityId,
        points: 1,
        reason: 'session_participation'
      }
    });

    await prisma.fillProviderPoints.create({
      data: {
        providerId,
        activityId,
        points: -1,
        reason: 'assignment'
      }
    });

    const priority = assignment.provider.points.reduce((sum, p) => sum + p.points, 0);

    res.status(201).json({
      ...assignment,
      provider: {
        ...assignment.provider,
        priority
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return handleValidationError(res, 'This assignment already exists');
    }
    handleError(res, error, 'Failed to create fill assignment');
  }
});

// Delete fill assignment
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const assignment = await prisma.fillAssignment.findUnique({
      where: { id: req.params.id },
      include: {
        activity: true
      }
    });

    if (!assignment) {
      return handleNotFound(res, 'Fill assignment');
    }

    if (assignment.activity.creatorId !== req.userId) {
      return handleUnauthorized(res, 'Only activity creator can delete fill assignments');
    }

    await prisma.fillAssignment.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Fill assignment deleted' });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to delete fill assignment');
  }
});

export default router;
