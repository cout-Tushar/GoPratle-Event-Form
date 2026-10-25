import { z } from 'zod';

const text = z.string().trim().max(2000);
const nonEmpty = z.string().trim().min(1).max(160);
const positive = z.coerce.number().int().positive();
const nonNegative = z.preprocess(value => value === '' || value === null ? undefined : value, z.coerce.number().min(0).optional());
const budget = { budgetMin: nonNegative, budgetMax: nonNegative };
const budgetCheck = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.refine((v) => {
    const { budgetMin, budgetMax } = v as Record<string, unknown>;
    return typeof budgetMin !== 'number' || typeof budgetMax !== 'number' || budgetMax >= budgetMin;
  }, { path: ['budgetMax'], message: 'Maximum budget must be at least the minimum.' });

const planner = budgetCheck(z.object({
  services: z.array(nonEmpty).min(1), guestCount: positive, planningScope: z.enum(['full-service', 'partial-planning', 'day-of']),
  ...budget, additionalRequirements: text.optional()
}).strict());
const performer = budgetCheck(z.object({
  performanceType: z.enum(['singer', 'dj', 'band', 'dancer', 'host', 'other']), durationMinutes: positive, performerCount: positive,
  ...budget, technicalRequirements: z.array(nonEmpty).default([]), additionalRequirements: text.optional()
}).strict());
const crew = budgetCheck(z.object({
  crewRoles: z.array(nonEmpty).min(1), crewCount: positive, workingHours: positive, ...budget,
  equipmentSkills: text.optional(), additionalRequirements: text.optional()
}).strict());

export const requirementSchema = z.object({
  eventName: nonEmpty,
  eventType: z.enum(['Wedding', 'Corporate', 'Concert', 'Private Party', 'Festival', 'Other']),
  startDate: z.coerce.date(), endDate: z.coerce.date(), location: nonEmpty, venue: text.optional(),
  category: z.enum(['planner', 'performer', 'crew']),
  details: z.unknown(),
  additionalDetails: z.object({
    description: text.optional(), specialInstructions: text.optional(),
    contactMethod: z.enum(['email', 'phone']).optional(), responseDeadline: z.coerce.date().optional()
  }).strict().default({})
}).strict().superRefine((value, ctx) => {
  if (value.endDate < value.startDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['endDate'], message: 'End date must be on or after start date.' });
  if (value.additionalDetails.responseDeadline && value.additionalDetails.responseDeadline > value.startDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['additionalDetails', 'responseDeadline'], message: 'Response deadline must be on or before the event start date.' });
  const schemas = { planner, performer, crew };
  const parsed = schemas[value.category].safeParse(value.details);
  if (!parsed.success) for (const issue of parsed.error.issues) ctx.addIssue({ ...issue, path: ['details', ...issue.path] });
});

export type RequirementInput = z.infer<typeof requirementSchema>;
