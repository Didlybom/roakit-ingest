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
  | 'archived';

export interface Account {
  id: string;
  accountName: string;
  accountUri: string;
  timeZone: string;
  lastUpdatedTimestamp?: number;
}

export interface Issue {
  id: string;
  key: string;
  type: string;
  summary: string;
  description?: string;
  uri?: string;
  created?: string;
  createdBy?: string;
  reportedBy?: string;
  assignedTo?: string;
  project?: {
    id: string;
    key: string;
    name: string;
    uri: string;
  };
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
  created?: string;
  updated?: string;
  updateAuthor?: string;
}

export interface Attachment {
  id: string;
  author: string;
  filename: string;
  mimeType?: string;
  uri?: string;
  created?: string;
}

export interface ChangeLog {
  fieldId?: string;
  field?: string;
  oldId?: string;
  oldValue?: string;
  newId?: string;
  newValue?: string;
}

export interface Activity {
  objectId: string;
  event: string;
  createdTimestamp: number;
  customerId: number;
  artifact: 'task' | 'code';
  action: Action;
  actorAccountId?: string;
  priority?: number;
  initiative: string; // not undefined, so Firestore can index the field (as '')
  effort?: number;
  metadata: {
    changeLog?: ChangeLog[];
    issue?: Issue;
    comment?: Comment;
    attachment?: Attachment;
    parent?: Issue;
  };
}
