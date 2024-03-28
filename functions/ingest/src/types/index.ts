export enum EventType {
  github = 'github',
  jira = 'jira',
}

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
  username?: string;
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
  id: string;
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
