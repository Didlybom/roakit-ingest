import { Account, Action, Commit, PullRequest, PullRequestComment, Release } from '.';
import { toTimestamp } from '../utils/dateUtils';
import {
  CommentSchema,
  CommitsSchema,
  GitHubEventSchema,
  PullRequestSchema,
  ReleaseSchema,
  RepositorySchema,
} from './githubSchema';

const updatedEvents = [
  'issue_comment',
  'pull_request',
  'pull_request_review',
  'pull_request_review_comment',
  'pull_request_review_thread',
  'release',
];
const createdEvents = ['push', 'pull_request_review_comment', 'create'];
const deletedEvents = ['delete'];
export const toAction = (eventName: string): Action => {
  if (updatedEvents.includes(eventName)) {
    return 'updated';
  }
  if (createdEvents.includes(eventName)) {
    return 'created';
  }
  if (deletedEvents.includes(eventName)) {
    return 'deleted';
  }
  return 'unknown';
  // gitHub action field is also interesting
};

export const toAccount = (props: GitHubEventSchema) => {
  const sender = props.sender;
  // pull_request.assignee could be interesting too
  if (!sender) {
    return undefined;
  }
  return {
    id: sender.login,
    accountName: sender.login,
    accountUri: sender.html_url,
  } as Account;
};

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
