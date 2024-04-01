import { Commit, PullRequest, PullRequestComment, Release } from '.';
import { toTimestamp } from '../utils/dateUtils';
import {
  CommentSchema,
  CommitsSchema,
  GitHubEventSchema,
  PullRequestSchema,
  ReleaseSchema,
  RepositorySchema,
} from './githubSchema';

export const toCodeAction = (props: GitHubEventSchema) => props.action;

export const toRepository = (props: RepositorySchema): string => props.name;

export const toPullRequest = (props: PullRequestSchema): PullRequest => {
  return {
    title: props.title,
    created: toTimestamp(props.created_at),
    additions: props.additions,
    deletions: props.deletions,
    changedFiles: props.changed_files,
    comments: props.comments,
    commits: props.commits,
    ref: props.head.ref,
    uri: props.html_url,
  };
};

export const toPullRequestComment = (props: CommentSchema): PullRequestComment => {
  return {
    body: props.body,
    author: props.user.login,
    uri: props.html_url,
  };
};

export const toCommits = (props: CommitsSchema): Commit[] =>
  props.map(prop => {
    return { message: prop.message, url: prop.url };
  });

export const toRelease = (props: ReleaseSchema): Release => {
  return {
    body: props.body,
  };
};
