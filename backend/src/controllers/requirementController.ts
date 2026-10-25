import type { NextFunction, Request, Response } from 'express';
import {
  createRequirement,
  getRequirement,
  listRequirements,
} from '../services/requirementService';
import { requirementSchema } from '../validators/requirement';

export async function create(req: Request, res: Response, next: NextFunction) {
  const result = requirementSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: 'Please correct the highlighted fields.',
      errors: result.error.flatten(),
    });
  }

  try {
    const saved = await createRequirement(result.data);
    return res.status(201).json({
      success: true,
      message: 'Requirement created successfully',
      data: {
        id: saved.id,
        category: saved.category,
        status: saved.status,
        createdAt: saved.createdAt.toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id;
    if (typeof id !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid requirement ID.' });
    }

    const result = await getRequirement(id);
    if (result.invalidId) {
      return res.status(400).json({ success: false, message: 'Invalid requirement ID.' });
    }

    if (!result.requirement) {
      return res.status(404).json({ success: false, message: 'Requirement not found.' });
    }

    return res.json({ success: true, data: result.requirement });
  } catch (error) {
    return next(error);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  const category = req.query.category;
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  const invalidCategory =
    category !== undefined &&
    (typeof category !== 'string' || !['planner', 'performer', 'crew'].includes(category));
  const invalidPagination =
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100;

  if (invalidCategory || invalidPagination) {
    return res.status(400).json({
      success: false,
      message: 'Invalid category or pagination. Limit must be between 1 and 100.',
    });
  }

  try {
    return res.json({
      success: true,
      data: await listRequirements(category as string | undefined, page, limit),
    });
  } catch (error) {
    return next(error);
  }
}
