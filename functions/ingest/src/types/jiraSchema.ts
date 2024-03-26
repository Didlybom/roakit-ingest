import { z } from 'zod';

const zdatetime = z.string().datetime({ offset: true });

const zuser = z.object({
  self: z.string().url().optional(),
  accountId: z.string(),
  displayName: z.string().optional(),
  emailAddress: z.string().email().optional(),
  timeZone: z.string().optional(),
});

const zissue = z.object({
  id: z.string(),
  key: z.string(),
  self: z.string().url(),
  fields: z.object({
    created: zdatetime.optional(),
    creator: zuser.optional(),
    reporter: zuser.optional(),
    assignee: zuser.optional().nullable(),
    issuetype: z.object({ name: z.string() }),
    summary: z.string(),
    description: z.string().optional().nullable(),
    priority: z.object({
      id: z.string(),
      name: z.string(),
    }),
    project: z.object({
      id: z.string(),
      key: z.string(),
      name: z.string(),
      self: z.string().url(),
    }),
    status: z.object({
      id: z.string(),
      name: z.string(),
      self: z.string().url(),
      statusCategory: z
        .object({
          id: z.number(),
          key: z.string(),
          name: z.string(),
          self: z.string().url(),
        })
        .optional(),
    }),
  }),
});
export type IssueSchema = z.infer<typeof zissue>;

const zcomment = z.object({
  id: z.string(),
  author: zuser,
  body: z.string(),
  created: zdatetime.optional(),
  updated: zdatetime.optional(),
  updateAuthor: zuser.optional(),
  self: z.string().url(),
});
export type CommentSchema = z.infer<typeof zcomment>;

const zattachment = z.object({
  id: z.string(),
  filename: z.string(),
  mimeType: z.string().optional(),
  created: zdatetime,
  author: zuser,
  content: z.string().url(),
  size: z.number(),
  self: z.string().url(),
});
export type AttachmentSchema = z.infer<typeof zattachment>;

const zchangeLog = z.object({
  id: z.string(),
  items: z
    .object({
      field: z.string().optional(),
      fieldId: z.string().optional(),
      fieldtype: z.string(),
      from: z.string().optional().nullable(),
      fromString: z.string().optional().nullable(),
      to: z.string().optional().nullable(),
      toString: z.string().optional().nullable(),
    })
    .array(),
});
export type ChangeLogSchema = z.infer<typeof zchangeLog>;

export const jiraEventSchema = z.object({
  user: zuser.optional(),
  issue: zissue.optional(),
  comment: zcomment.optional(),
  attachment: zattachment.optional(),
  changelog: zchangeLog.optional(),
});
export type JiraEventSchema = z.infer<typeof jiraEventSchema>;
