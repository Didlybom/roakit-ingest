import { z } from 'zod';

const zuser = z.object({ login: z.string(), html_url: z.string() });

export const githubEventSchema = z.object({
  repository: z.object({ name: z.string() }).optional(),
  sender: zuser.optional(),
  action: z.string().optional(),

  // pull_request
  pull_request: z
    .object({
      title: z.string(),
      assignee: zuser.optional().nullable(),
      created_at: z.string(),
      changed_files: z.number().optional(),
      deletions: z.number().optional(),
      comments: z.number().optional(),
      commits: z.number().optional(),
      head: z.object({ ref: z.string() }),
      html_url: z.string().url(),
    })
    .optional(),

  // pull_request_review_comment
  comment: z.object({ body: z.string(), html_url: z.string(), user: zuser }).optional(),

  // push
  commits: z.object({ message: z.string() }).array().optional(),

  // release
  release: z.object({ body: z.string() }).optional(),
});
export type GitHubEventSchema = z.infer<typeof githubEventSchema>;
