import mongoose from 'mongoose';
import { Requirement } from '../models/Requirement';
import type { RequirementInput } from '../validators/requirement';

export async function createRequirement(input: RequirementInput) {
  const { category, ...common } = input;

  const requirement = await Requirement.create({
    ...common,
    category,
    details: input.details,
    status: 'submitted',
  });

  return requirement;
}

export async function getRequirement(id: string) {
  if (!mongoose.isValidObjectId(id)) {
    return { invalidId: true as const };
  }

  const requirement = await Requirement.findById(id).lean();

  return { invalidId: false as const, requirement };
}

export async function listRequirements(category: string | undefined, page: number, limit: number) {
  const filter = category ? { category } : {};

  const [items, total] = await Promise.all([
    Requirement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-additionalDetails.contactMethod -additionalDetails.specialInstructions')
      .lean(),
    Requirement.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}
