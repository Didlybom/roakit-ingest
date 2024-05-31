import { z } from 'zod';

const zspace = z.object({
  id: z.number(),
  creatorAccountId: z.string(),
  lastModifierAccountId: z.string(),
  self: z.string(),
  key: z.string(),
  isPersonalSpace: z.boolean(),
  title: z.string(),
  description: z.string().optional(),
  creationDate: z.number(),
  modificationDate: z.number(),
});
export type SpaceSchema = z.infer<typeof zspace>;

const zpage = z.object({
  id: z.string(),
  creatorAccountId: z.string(),
  lastModifierAccountId: z.string(),
  spaceKey: z.string(),
  spaceId: z.number(),
  self: z.string(),
  contentType: z.string(),
  title: z.string(),
  version: z.number().optional(),
  creationDate: z.number(),
  modificationDate: z.number(),
});
export type PageSchema = z.infer<typeof zpage>;

const zcomment = z.object({
  id: z.string(),
  creatorAccountId: z.string(),
  lastModifierAccountId: z.string(),
  spaceKey: z.string(),
  self: z.string(),
  creationDate: z.number(),
  modificationDate: z.number(),
  parent: zpage.optional(),
});
export type CommentSchema = z.infer<typeof zcomment>;

export const confluenceEventSchema = z.object({
  userAccountId: z.string().optional(),
  updateTrigger: z.string().optional(),
  space: zspace.optional(),
  page: zpage.optional(),
  comment: zcomment.optional(),
});
export type ConfluenceEventSchema = z.infer<typeof confluenceEventSchema>;
