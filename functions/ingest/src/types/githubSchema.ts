import { z } from 'zod';

const zdatetime = z.string().datetime({ offset: true });

const zuser = z.object({ login: z.string(), html_url: z.string() });

const zrepository = z.object({ name: z.string() });
export type RepositorySchema = z.infer<typeof zrepository>;

const zpullrequest = z.object({
  title: z.string(),
  assignee: zuser.optional().nullable(),
  created_at: zdatetime,
  changed_files: z.number().optional(),
  additions: z.number().optional(),
  deletions: z.number().optional(),
  comments: z.number().optional(),
  commits: z.number().optional(),
  head: z.object({ ref: z.string() }),
  html_url: z.string().url(),
});
export type PullRequestSchema = z.infer<typeof zpullrequest>;

const zcomment = z.object({ body: z.string(), html_url: z.string(), user: zuser });
export type CommentSchema = z.infer<typeof zcomment>;

const zissue = z.object({ title: z.string(), html_url: z.string() });
export type IssueSchema = z.infer<typeof zissue>;

const zcommits = z
  .object({ message: z.string(), url: z.string().url(), timestamp: zdatetime })
  .array();
export type CommitsSchema = z.infer<typeof zcommits>;

const zrelease = z.object({ body: z.string() });
export type ReleaseSchema = z.infer<typeof zrelease>;

const zlabel = z.object({
  id: z.coerce.string(),
  name: z.string(),
  url: z.string().url().optional(),
});
export type LabelSchema = z.infer<typeof zlabel>;

export const githubEventSchema = z.object({
  hook: z.object({ created_at: z.string().optional() }).optional(),
  sender: zuser.optional(),
  action: z.string().optional(),
  repository: zrepository.optional(),

  // action: pull_request
  pull_request: zpullrequest.optional(),

  // action: pull_request_review_comment, issue_comment
  comment: zcomment.optional(),

  // action: issue_comment
  issue: zissue.optional(),

  // action: push
  commits: zcommits.optional(),

  // action: release
  release: zrelease.optional(),

  // action pull_request labeled
  label: zlabel.optional(),
});
export type GitHubEventSchema = z.infer<typeof githubEventSchema>;
