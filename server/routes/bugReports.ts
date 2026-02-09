import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';
import { handleError, handleValidationError, handleNotFound } from '../lib/errorHandler';

const router = express.Router();

// Get all bug reports
router.get('/', authenticateToken, async (_req: AuthRequest, res) => {
  try {
    const bugReports = await prisma.bugReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    res.json(bugReports);
  } catch (error: unknown) {
    handleError(res, error, 'Failed to fetch bug reports');
  }
});

// Create a bug report
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return handleValidationError(res, 'Title is required');
    }

    if (!description || !description.trim()) {
      return handleValidationError(res, 'Description is required');
    }

    const bugReport = await prisma.bugReport.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        reporterId: req.userId!,
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json(bugReport);
  } catch (error: unknown) {
    handleError(res, error, 'Failed to create bug report');
  }
});

// Update bug report status
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!status || !validStatuses.includes(status)) {
      return handleValidationError(res, `Status must be one of: ${validStatuses.join(', ')}`);
    }

    const existing = await prisma.bugReport.findUnique({ where: { id } });
    if (!existing) {
      return handleNotFound(res, 'Bug report');
    }

    const bugReport = await prisma.bugReport.update({
      where: { id },
      data: { status },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    res.json(bugReport);
  } catch (error: unknown) {
    handleError(res, error, 'Failed to update bug report');
  }
});

// Delete a bug report (only by reporter)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.bugReport.findUnique({ where: { id } });
    if (!existing) {
      return handleNotFound(res, 'Bug report');
    }

    if (existing.reporterId !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own bug reports' });
    }

    await prisma.bugReport.delete({ where: { id } });

    res.json({ message: 'Bug report deleted' });
  } catch (error: unknown) {
    handleError(res, error, 'Failed to delete bug report');
  }
});

export default router;
