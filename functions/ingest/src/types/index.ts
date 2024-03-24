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
  properties?: Record<string, unknown>;
  headers?: Record<string, string>;
}
