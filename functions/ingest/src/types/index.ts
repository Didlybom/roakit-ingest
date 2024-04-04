export enum EventType {
  github = 'github',
  jira = 'jira',
}

export const FEEDS = [
  { id: 1, type: EventType.github },
  { id: 2, type: EventType.jira },
];

export interface Event {
  contentLength: number;
  instanceId: string;
  pluginName: string;
  createTimestamp: number;
  eventTimestamp: number;
  customerId: number;
  feedId: number;
  name: string;
  hookId?: string;
  targetId?: number;
  targetType?: string;
  senderAccount?: string;
  properties?: Record<string, unknown>; // the raw webhook payload
  headers?: Record<string, string>;
  banned?: boolean;
}

export type Action =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'started'
  | 'closed'
  | 'released'
  | 'archived'
  | 'unknown';

export interface Account {
  id: string;
  accountName: string;
  accountUri: string;
  timeZone: string;
  lastUpdatedTimestamp?: number;
}

export interface Identity {
  id: string;
  email?: string;
  displayName?: string;
  timeZone?: string;
  accounts: { feedId: number; type: string; id?: Account['id']; name?: string; url?: string }[];
}
export type IdentityMap = Map<string, Omit<Identity, 'id'>>;

/**
 * FIXME if we want to handle identities automatically, we need to be able for example to find that
 * an existing Jira account (no username, only full name) belongs to the same identity as an incoming GitHub account (no full name).
 *
 * Unused.
 */
export const findIdentity = (
  identities: IdentityMap,
  feedId: number,
  accountId: string,
  accountName?: string
) => {
  return [...identities].find(
    ([, identity]) =>
      !!identity.accounts.find(
        account =>
          account.feedId === feedId &&
          (account.id === accountId || (accountName && account.name === accountName))
      )
  );
};

export interface Project {
  id: string;
  key: string;
  name: string;
  uri?: string;
}

export interface Ticket {
  id: string;
  key: string;
  summary: string;
  uri?: string;
  priority?: number;
  project?: Project;
  lastUpdatedTimestamp?: number;
}

export interface Issue {
  id: string;
  key: string;
  type: string;
  summary: string;
  description?: string;
  uri?: string;
  created?: number;
  createdBy?: string;
  reportedBy?: string;
  assignedTo?: string;
  project?: Project;
  status?: {
    id: string;
    name: string;
    uri: string;
    category?: {
      id: number;
      key: string;
      name: string;
      uri: string;
    };
  };
}

export interface Comment {
  id: string;
  author: string;
  body: string;
  uri?: string;
  created?: number;
  updated?: number;
  updateAuthor?: string;
}

export interface Attachment {
  id: string;
  author: string;
  filename: string;
  mimeType?: string;
  uri?: string;
  created?: number;
}

export interface Sprint {
  id: string | number;
  name: string;
  state: string;
  uri?: string;
  created?: number;
  startDate?: number;
  endDate?: number;
  completeDate?: number;
}

export interface Worklog {
  id: string;
  author: string;
  uri?: string;
  created?: number;
  updated?: number;
  updateAuthor?: string;
  started?: number;
  timeSpentSeconds?: number;
}

export interface ChangeLog {
  fieldId?: string;
  field?: string;
  oldId?: string;
  oldValue?: string;
  newId?: string;
  newValue?: string;
}

export interface PullRequest {
  title: string;
  assignee?: string;
  created?: number;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  commits?: number;
  comments?: number;
  ref?: string;
  uri?: string;
}

export interface PullRequestComment {
  body: string;
  author: string;
  uri?: string;
}

export interface Commit {
  message: string;
  uri?: string;
}

export interface Release {
  body: string;
}

export type Artifact = 'task' | 'taskOrg' | 'code' | 'codeOrg';

export interface Activity {
  objectId: string;
  event: string;
  createdTimestamp: number;
  customerId: number;
  artifact: Artifact;
  action: Action;
  actorAccountId?: string;
  priority?: number;
  initiative: string; // not undefined, so Firestore can index the field (as '')
  effort?: number;
  metadata: {
    // project software (jira)
    changeLog?: ChangeLog[];
    issue?: Issue;
    comment?: Comment;
    attachment?: Attachment;
    sprint?: Sprint;
    worklog?: Worklog;
    parent?: Issue;

    // code software (github)
    codeAction?: string;
    repository?: string;
    pullRequest?: PullRequest;
    pullRequestComment?: PullRequestComment;
    commits?: Commit[];
    release?: Release;
  };
}
