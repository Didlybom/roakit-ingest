import { z } from 'zod';
import { Account, Action, ChangeLog, EventUser, Issue } from '.';

export const mapEventUser = (user: EventUser | undefined) => {
  let username;
  if (user) {
    if (user.name) {
      username = `name:${user.name}`;
    } else if (user.accountId) {
      username = `id:${user.accountId}`;
    } else if (user.emailAddress) {
      username = `email:${user.emailAddress}`;
    } else if (user.displayName) {
      username = `alias:${user.displayName}`;
    } else if (user.self) {
      username = `self:${user.self}`;
    }
  }
  return username;
};

const zuser = z.object({
  self: z.string().url().optional(),
  accountId: z.string(),
  displayName: z.string().optional(),
  emailAddress: z.string().email().optional(),
  timeZone: z.string().optional(),
});

const zchangeLog = z.object({
  id: z.string(),
  items: z
    .object({
      field: z.string().optional(),
      fieldId: z.string().optional(),
      fieldtype: z.string(),
      from: z.string().optional().nullable(),
      fromString: z.string().optional(),
      tmpToAccountId: z.string().optional(),
      to: z.string().optional().nullable(),
      toString: z.string().optional(),
    })
    .array(),
});

export const jiraEventSchema = z.object({
  user: zuser,

  issue: z.object({
    id: z.string(),
    key: z.string(),
    self: z.string().url(),
    fields: z.object({
      created: z.string().optional(),
      creator: zuser.optional(),
      reporter: zuser.optional(),
      assignee: zuser.optional(),
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
  }),

  comment: z.object({ author: zuser, body: z.string() }).optional(),

  changelog: zchangeLog.optional(),
});
export type JiraEventSchema = z.infer<typeof jiraEventSchema>;

export const toActor = (props: JiraEventSchema) => {
  return props.user.accountId;
  // issue.fields.creator could be interesting too
};

export const toPriority = (props: JiraEventSchema) => {
  const priorityId = props.issue.fields.priority.id;
  return priorityId ? +priorityId : undefined;
};

const jiraActionSuffixes = [
  'created',
  'updated',
  'deleted',
  'started',
  'closed',
  'released',
  'archived',
] as Action[];
export const toAction = (eventName: string): Action => {
  for (const action of jiraActionSuffixes) {
    if (eventName.endsWith(action)) {
      return action;
    }
    // simplistic for now
  }
  throw new Error('Failed to map action for event name ' + eventName);
};

export const toAccount = (props: JiraEventSchema['user']) => {
  return {
    id: props.accountId,
    accountName: props.displayName ?? props.emailAddress,
    accountUri: props.self,
    timeZone: props.timeZone,
  } as Account;
};

export const toChangelog = (props: JiraEventSchema['changelog']): ChangeLog[] => {
  const changeLog: ChangeLog[] = [];
  props?.items.forEach(item => {
    changeLog.push({
      fieldId: item.fieldId,
      field: item.field,
      oldId: item.from ?? undefined,
      oldValue: item.fromString,
      newId: item.to ?? undefined,
      newValue: item.toString,
    });
  });
  return changeLog;
};

export const toProject = (props: JiraEventSchema['issue']['fields']['project']) => {
  return { id: props.id, key: props.key, name: props.name, uri: props.self };
};

export const toStatus = (props: JiraEventSchema['issue']['fields']['status']) => {
  return {
    id: props.id,
    name: props.name,
    uri: props.self,
    ...(props.statusCategory && {
      category: {
        id: props.statusCategory.id,
        key: props.statusCategory.key,
        name: props.statusCategory.name,
        uri: props.statusCategory.self,
      },
    }),
  };
};

export const toIssue = (props: JiraEventSchema['issue']) => {
  const issue: Issue = {
    id: props.id,
    key: props.key,
    created: props.fields.created,
    type: props.fields.issuetype.name,
    createdBy: props.fields.creator?.accountId,
    reportedBy: props.fields.reporter?.accountId,
    assignedTo: props.fields.assignee?.accountId,
    summary: props.fields.summary,
    description: props.fields.description ?? undefined,
    ...(props.fields.project && { project: toProject(props.fields.project) }),
    ...(props.fields.status && { status: toStatus(props.fields.status) }),
    // FIXME parent field
  };
  return issue;
};
