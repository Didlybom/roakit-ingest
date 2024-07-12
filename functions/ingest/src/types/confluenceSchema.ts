import { z } from 'zod';

const zspace = z.object({
  id: z.coerce.string(),
  creatorAccountId: z.coerce.string(),
  lastModifierAccountId: z.coerce.string(),
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
  id: z.coerce.string(),
  creatorAccountId: z.coerce.string(),
  lastModifierAccountId: z.coerce.string(),
  spaceKey: z.string(),
  spaceId: z.coerce.string(),
  self: z.string(),
  contentType: z.string().optional(),
  title: z.string().optional(),
  version: z.number().optional(),
  creationDate: z.number(),
  modificationDate: z.number(),
});
export type PageSchema = z.infer<typeof zpage>;

const zcomment = z.object({
  id: z.coerce.string(),
  creatorAccountId: z.coerce.string(),
  lastModifierAccountId: z.coerce.string(),
  spaceKey: z.string(),
  self: z.string(),
  creationDate: z.number(),
  modificationDate: z.number(),
  parent: zpage.optional(),
  inReplyTo: z.object({ id: z.coerce.string() }).optional(),
});
export type CommentSchema = z.infer<typeof zcomment>;

const zattachment = z.object({
  id: z.coerce.string(),
  creatorAccountId: z.coerce.string(),
  lastModifierAccountId: z.coerce.string(),
  self: z.string(),
  creationDate: z.number(),
  modificationDate: z.number(),
  fileName: z.string(),
  fileSize: z.number().optional(),
  comment: z.string().optional(),
  version: z.number().optional(),
});
export type AttachmentSchema = z.infer<typeof zattachment>;

const zattachedTo = z.object({
  id: z.coerce.string(),
  creatorAccountId: z.coerce.string(),
  lastModifierAccountId: z.coerce.string(),
  spaceKey: z.string(),
  self: z.string(),
  creationDate: z.number(),
  modificationDate: z.number(),
  title: z.string().optional(),
  contentType: z.string().optional(),
});
export type AttachedToSchema = z.infer<typeof zattachedTo>;

const zlabeled = z.object({
  id: z.coerce.string(),
  creatorAccountId: z.coerce.string(),
  lastModifierAccountId: z.coerce.string(),
  spaceKey: z.string(),
  contentType: z.string().optional(),
  self: z.string(),
  creationDate: z.number(),
  modificationDate: z.number(),
  labels: z.object({ name: z.string() }).array(),
});
export type LabeledSchema = z.infer<typeof zlabeled>;

const zlabel = z.object({
  name: z.string(),
  self: z.string(),
  title: z.string(),
  ownerAccountId: z.coerce.string(),
});
export type LabelSchema = z.infer<typeof zlabel>;

export const confluenceEventSchema = z.object({
  timestamp: z.number(),
  userAccountId: z.coerce.string().optional(),
  updateTrigger: z.string().optional(),
  space: zspace.optional(),
  page: zpage.optional(),
  content: zpage.optional(),
  comment: zcomment.optional(),
  attachments: zattachment.array().optional(),
  attachedTo: zattachedTo.optional(),
  labeled: zlabeled.optional(),
  label: zlabel.optional(),
  oldParent: zpage.optional(),
  newParent: zpage.optional(),
});
export type ConfluenceEventSchema = z.infer<typeof confluenceEventSchema>;
