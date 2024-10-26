import { z } from 'zod';

export const identitySchema = z.object({
  email: z.string().optional(),
  displayName: z.string().optional(),
  timeZone: z.string().optional(),
  groups: z.string().array().optional(),
  accounts: z
    .object({
      feedId: z.number(),
      type: z.string(),
      id: z.string().optional(),
      name: z.string().optional(),
      url: z.string().optional(),
    })
    .array()
    .optional(),
  lastLastUpdatedTimestamp: z.number().optional(),
});
