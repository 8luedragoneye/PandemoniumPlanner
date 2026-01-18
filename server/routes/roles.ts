import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { handleError, handleNotFound, handleUnauthorized, handleValidationError } from '../lib/errorHandler';

const router = express.Router();

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

    res.json(roles.map(role => ({
      ...role,
      attributes: JSON.parse(role.attributes),
    })));
  } catch (error: unknown) {
    handleError(res, error, 'Failed to fetch roles');
  }
});

// Create role
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { activityId, name, slots, attributes } = req.body;

    if (!activityId || !name || !slots) {
      return handleValidationError(res, 'Activity ID, name, and slots are required');
    }

    // Verify user is the activity creator
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return handleNotFound(res, 'Activity');
    }

    if (activity.creatorId !== req.userId) {
      return handleUnauthorized(res, 'Only the activity creator can create roles');
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
  } catch (error: unknown) {
    handleError(res, error, 'Failed to create role');
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
      return handleNotFound(res, 'Role');
    }

    if (role.activity.creatorId !== req.userId) {
      return handleUnauthorized(res, 'Only the activity creator can update roles');
    }

    const { name, slots, attributes } = req.body;

    const updateData: {
      name?: string;
      slots?: number;
      attributes?: string;
    } = {};

    if (name !== undefined) {
      updateData.name = name;
    }
    if (slots !== undefined) {
      updateData.slots = parseInt(String(slots));
    }
    if (attributes !== undefined) {
      updateData.attributes = JSON.stringify(attributes);
    }

    const updated = await prisma.role.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json({
      ...updated,
      attributes: JSON.parse(updated.attributes),
    });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to update role');
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
      return handleNotFound(res, 'Role');
    }

    if (role.activity.creatorId !== req.userId) {
      return handleUnauthorized(res, 'Only the activity creator can delete roles');
    }

    await prisma.role.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Role deleted' });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to delete role');
  }
});

export default router;
