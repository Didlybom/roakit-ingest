import { z } from 'zod';

const zdatetime = z.string().datetime({ offset: true });

const zuser = z.object({
  self: z.string().url().optional(),
  accountId: z.string(),
  displayName: z.string().optional(),
  emailAddress: z.string().optional(),
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

const zsprint = z.object({
  id: z.string().or(z.number()),
  name: z.string(),
  state: z.string(),
  originalBoardId: z.number().optional(),
  goal: z.string().optional(),
  createdDate: zdatetime,
  startDate: zdatetime.optional(),
  endDate: zdatetime.optional(),
  completeDate: zdatetime.optional(),
  self: z.string().url(),
});
export type SprintSchema = z.infer<typeof zsprint>;

const zworklog = z.object({
  id: z.string(),
  created: zdatetime,
  updated: zdatetime,
  started: zdatetime,
  author: zuser,
  updateAuthor: zuser.optional(),
  issueId: z.string(),
  timeSpentSeconds: z.number().optional(),
  self: z.string().url(),
});
export type WorklogSchema = z.infer<typeof zworklog>;

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
  sprint: zsprint.optional(),
  worklog: zworklog.optional(),
  changelog: zchangeLog.optional(),
});
export type JiraEventSchema = z.infer<typeof jiraEventSchema>;
