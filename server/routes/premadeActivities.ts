import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { handleError, handleNotFound, handleUnauthorized, handleValidationError } from '../lib/errorHandler';

const router = express.Router();

// Get all premade activities
router.get('/', authenticateToken, async (req, res) => {
  try {
    const premadeActivities = await prisma.premadeActivity.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        roles: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse JSON attributes for roles
    const activitiesWithParsedRoles = premadeActivities.map(activity => ({
      ...activity,
      roles: activity.roles.map(role => ({
        ...role,
        attributes: JSON.parse(role.attributes),
      })),
    }));

    res.json(activitiesWithParsedRoles);
  } catch (error: unknown) {
    handleError(res, error, 'Failed to fetch premade activities');
  }
});

// Get single premade activity
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const premadeActivity = await prisma.premadeActivity.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        roles: true,
      },
    });

    if (!premadeActivity) {
      return handleNotFound(res, 'Premade activity');
    }

    // Parse JSON attributes for roles
    const activityWithParsedRoles = {
      ...premadeActivity,
      roles: premadeActivity.roles.map(role => ({
        ...role,
        attributes: JSON.parse(role.attributes),
      })),
    };

    res.json(activityWithParsedRoles);
  } catch (error: unknown) {
    handleError(res, error, 'Failed to fetch premade activity');
  }
});

// Create premade activity
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, description, zone, minEquip, type, roles } = req.body;

    if (!name || !description) {
      return handleValidationError(res, 'Name and description are required');
    }

    // Create premade activity with roles in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const premadeActivity = await tx.premadeActivity.create({
        data: {
          name,
          description,
          zone: zone || null,
          minEquip: minEquip || null,
          type: type || 'regular',
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

      // Create roles if provided
      if (roles && Array.isArray(roles) && roles.length > 0) {
        await Promise.all(
          roles.map((role: { name: string; slots: number; attributes?: Record<string, unknown> }) =>
            tx.premadeRole.create({
              data: {
                premadeActivityId: premadeActivity.id,
                name: role.name,
                slots: parseInt(String(role.slots)),
                attributes: JSON.stringify(role.attributes || {}),
              },
            })
          )
        );
      }

      // Fetch the created activity with roles
      const createdWithRoles = await tx.premadeActivity.findUnique({
        where: { id: premadeActivity.id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          roles: true,
        },
      });

      return createdWithRoles!;
    });

    // Parse JSON attributes for roles
    const response = {
      ...result,
      roles: result.roles.map(role => ({
        ...role,
        attributes: JSON.parse(role.attributes),
      })),
    };

    res.status(201).json(response);
  } catch (error: unknown) {
    handleError(res, error, 'Failed to create premade activity');
  }
});

// Update premade activity
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const premadeActivity = await prisma.premadeActivity.findUnique({
      where: { id: req.params.id },
    });

    if (!premadeActivity) {
      return handleNotFound(res, 'Premade activity');
    }

    if (premadeActivity.creatorId !== req.userId) {
      return handleUnauthorized(res, 'Only the creator can update this premade activity');
    }

    const { name, description, zone, minEquip, type, roles } = req.body;

    // Update premade activity and roles in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the premade activity
      const updated = await tx.premadeActivity.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(zone !== undefined && { zone: zone || null }),
          ...(minEquip !== undefined && { minEquip: minEquip || null }),
          ...(type !== undefined && { type }),
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

      // If roles are provided, replace all existing roles
      if (roles !== undefined) {
        // Delete all existing roles
        await tx.premadeRole.deleteMany({
          where: { premadeActivityId: req.params.id },
        });

        // Create new roles if provided
        if (Array.isArray(roles) && roles.length > 0) {
          await Promise.all(
            roles.map((role: { name: string; slots: number; attributes?: Record<string, unknown> }) =>
              tx.premadeRole.create({
                data: {
                  premadeActivityId: req.params.id,
                  name: role.name,
                  slots: parseInt(String(role.slots)),
                  attributes: JSON.stringify(role.attributes || {}),
                },
              })
            )
          );
        }
      }

      // Fetch the updated activity with roles
      const updatedWithRoles = await tx.premadeActivity.findUnique({
        where: { id: req.params.id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          roles: true,
        },
      });

      return updatedWithRoles!;
    });

    // Parse JSON attributes for roles
    const response = {
      ...result,
      roles: result.roles.map(role => ({
        ...role,
        attributes: JSON.parse(role.attributes),
      })),
    };

    res.json(response);
  } catch (error: unknown) {
    handleError(res, error, 'Failed to update premade activity');
  }
});

// Delete premade activity
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const premadeActivity = await prisma.premadeActivity.findUnique({
      where: { id: req.params.id },
    });

    if (!premadeActivity) {
      return handleNotFound(res, 'Premade activity');
    }

    if (premadeActivity.creatorId !== req.userId) {
      return handleUnauthorized(res, 'Only the creator can delete this premade activity');
    }

    // Cascade delete will handle roles automatically
    await prisma.premadeActivity.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Premade activity deleted' });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to delete premade activity');
  }
});

export default router;
