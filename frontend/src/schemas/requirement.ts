import { z } from 'zod';

const words = z
  .string()
  .trim()
  .min(1, 'This field is required.')
  .max(160, 'Keep this under 160 characters.');
const optionalText = z
  .string()
  .trim()
  .max(2000, 'Keep this under 2000 characters.')
  .optional();
const positive = z.coerce.number().int('Enter a whole number.').positive('Enter a number greater than zero.');
const money = z.preprocess(
  value => (value === '' || value === null ? undefined : value),
  z.coerce.number().min(0, 'Amount cannot be negative.').optional(),
);
const budgetFields = { budgetMin: money, budgetMax: money };
const budgetRange = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.refine(
    value => {
      const { budgetMin, budgetMax } = value as Record<string, unknown>;

      return (
        typeof budgetMin !== 'number' ||
        typeof budgetMax !== 'number' ||
        budgetMax >= budgetMin
      );
    },
    {
      path: ['budgetMax'],
      message: 'Maximum must be at least the minimum.',
    },
  );

export const plannerDetailsSchema = budgetRange(
  z.object({
    services: z.array(z.string()).min(1, 'Choose at least one service.'),
    guestCount: positive,
    planningScope: z.enum(['full-service', 'partial-planning', 'day-of'] as const),
    ...budgetFields,
    additionalRequirements: optionalText,
  }),
);

export const performerDetailsSchema = budgetRange(
  z.object({
    performanceType: z.enum(['singer', 'dj', 'band', 'dancer', 'host', 'other'] as const),
    durationMinutes: positive,
    performerCount: positive,
    ...budgetFields,
    technicalRequirements: z.array(z.string()),
    additionalRequirements: optionalText,
  }),
);

export const crewDetailsSchema = budgetRange(
  z.object({
    crewRoles: z.array(z.string()).min(1, 'Choose at least one crew role.'),
    crewCount: positive,
    workingHours: positive,
    ...budgetFields,
    equipmentSkills: optionalText,
    additionalRequirements: optionalText,
  }),
);

export const requirementSchema = z.object({
  eventName: words,
  eventType: z.enum(['Wedding', 'Corporate', 'Concert', 'Private Party', 'Festival', 'Other']),
  startDate: z.string().min(1, 'Choose a start date.'),
  endDate: z.string().min(1, 'Choose an end date.'),
  location: words,
  venue: z.string().trim().max(200).optional(),
  category: z.enum(['planner', 'performer', 'crew']),
  details: z.union([plannerDetailsSchema, performerDetailsSchema, crewDetailsSchema]),
  additionalDetails: z.object({
    description: optionalText,
    specialInstructions: optionalText,
    contactMethod: z.enum(['email', 'phone']).optional(),
    responseDeadline: z.string().optional(),
  }),
}).superRefine((value, ctx) => {
  if (value.endDate < value.startDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'End date must be on or after start date.',
    });
  }

  if (
    value.additionalDetails.responseDeadline &&
    value.additionalDetails.responseDeadline > value.startDate
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['additionalDetails', 'responseDeadline'],
      message: 'Response deadline must be on or before the event start date.',
    });
  }

  if (value.category === 'planner' && !plannerDetailsSchema.safeParse(value.details).success) {
    ctx.addIssue({ code: 'custom', path: ['details'], message: 'Check planner requirements.' });
  }

  if (value.category === 'performer' && !performerDetailsSchema.safeParse(value.details).success) {
    ctx.addIssue({ code: 'custom', path: ['details'], message: 'Check performer requirements.' });
  }

  if (value.category === 'crew' && !crewDetailsSchema.safeParse(value.details).success) {
    ctx.addIssue({ code: 'custom', path: ['details'], message: 'Check crew requirements.' });
  }
});

export const eventStepSchema = z
  .object({
    eventName: words,
    eventType: z.string().min(1, 'Choose an event type.'),
    startDate: z.string().min(1, 'Choose a start date.'),
    endDate: z.string().min(1, 'Choose an end date.'),
    location: words,
    category: z.enum(['planner', 'performer', 'crew']),
  })
  .refine(value => value.endDate >= value.startDate, {
    path: ['endDate'],
    message: 'End date must be on or after start date.',
  });

export type ValidatedRequirement = z.output<typeof requirementSchema>;
