import { Account, Action, Attachment, ChangeLog, Comment, Issue } from '.';
import {
  AttachmentSchema,
  ChangeLogSchema,
  CommentSchema,
  IssueSchema,
  JiraEventSchema,
} from './jiraSchema';

export const toPriority = (props: JiraEventSchema) => {
  const priorityId = props.issue?.fields.priority.id;
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

export const toAccount = (props: JiraEventSchema) => {
  const account = props.comment?.author ?? props.attachment?.author ?? props.user;
  // issue.fields.creator/assignee could be interesting too, depending on action
  if (!account) {
    return undefined;
  }
  return {
    id: account.accountId,
    accountName: account.displayName ?? account.emailAddress,
    accountUri: account.self,
    timeZone: account.timeZone,
  } as Account;
};

export const toChangelog = (props: ChangeLogSchema) => {
  const changeLog: ChangeLog[] = [];
  props?.items.forEach(item => {
    changeLog.push({
      fieldId: item.fieldId,
      field: item.field,
      oldId: item.from ?? undefined,
      oldValue: item.fromString ?? undefined,
      newId: item.to ?? undefined,
      newValue: item.toString ?? undefined,
    });
  });
  return changeLog;
};

export const toProject = (props: IssueSchema['fields']['project']) => {
  return { id: props.id, key: props.key, name: props.name, uri: props.self };
};

export const toStatus = (props: IssueSchema['fields']['status']) => {
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

export const toIssue = (props: IssueSchema) => {
  const issue: Issue = {
    id: props.id,
    key: props.key,
    uri: props.self,
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

export const toComment = (props: CommentSchema) => {
  return {
    id: props.id,
    author: props.author.accountId,
    body: props.body,
    uri: props.self,
    created: props.created,
    updated: props.updated,
    updateAuthor: props.updateAuthor?.accountId,
  } as Comment;
};

export const toAttachment = (props: AttachmentSchema) => {
  return {
    id: props.id,
    author: props.author.accountId,
    filename: props.filename,
    mimeType: props.mimeType,
    uri: props.self,
    created: props.created,
  } as Attachment;
};
