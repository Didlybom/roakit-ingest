import {
  Commit,
  PullRequest,
  PullRequestComment,
  type Label,
  type PullRequestIssue,
  type Release,
} from '.';
import { toTimestamp } from '../utils/dateUtils';
import {
  CommentSchema,
  CommitsSchema,
  GitHubEventSchema,
  PullRequestSchema,
  RepositorySchema,
  type IssueSchema,
  type LabelSchema,
  type ReleaseSchema,
} from './githubSchema';

export const toCodeAction = (props: GitHubEventSchema) => props.action;

export const toRepository = (props: RepositorySchema): string => props.name;

export const toPullRequest = (props: PullRequestSchema): PullRequest => ({
  title: props.title,
  created: toTimestamp(props.created_at),
  additions: props.additions,
  deletions: props.deletions,
  changedFiles: props.changed_files,
  comments: props.comments,
  commits: props.commits,
  ref: props.head.ref,
  uri: props.html_url,
});

export const toPullRequestComment = (props: CommentSchema): PullRequestComment => ({
  body: props.body,
  author: props.user.login,
  uri: props.html_url,
});

export const toPullRequestIssue = (props: IssueSchema): PullRequestIssue => ({
  title: props.title,
  uri: props.html_url,
});

export const toCommits = (props: CommitsSchema): Commit[] =>
  props.map(prop => ({ message: prop.message, url: prop.url }));

export const toRelease = (props: ReleaseSchema): Release => ({
  body: props.body,
});

export const toLabel = (props: LabelSchema): Label => ({
  id: props.id,
  name: props.name,
  uri: props.url,
});
