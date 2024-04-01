import { Attachment, ChangeLog, Comment, Issue, Sprint, Ticket, Worklog } from '.';
import { toTimestamp } from '../utils/dateUtils';
import {
  AttachmentSchema,
  ChangeLogSchema,
  CommentSchema,
  IssueSchema,
  JiraEventSchema,
  SprintSchema,
  WorklogSchema,
} from './jiraSchema';

export const toPriority = (props: JiraEventSchema) => {
  const priorityId = props.issue?.fields.priority.id;
  return priorityId ? +priorityId : undefined;
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

export const toIssue = (props: IssueSchema): Issue => {
  const issue: Issue = {
    id: props.id,
    key: props.key,
    uri: props.self,
    created: toTimestamp(props.fields.created),
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

export const toComment = (props: CommentSchema): Comment => {
  return {
    id: props.id,
    author: props.author.accountId,
    body: props.body,
    uri: props.self,
    created: toTimestamp(props.created),
    updated: toTimestamp(props.updated),
    updateAuthor: props.updateAuthor?.accountId,
  };
};

export const toAttachment = (props: AttachmentSchema): Attachment => {
  return {
    id: props.id,
    author: props.author.accountId,
    filename: props.filename,
    mimeType: props.mimeType,
    uri: props.self,
    created: toTimestamp(props.created),
  };
};

export const toSprint = (props: SprintSchema): Sprint => {
  return {
    id: props.id,
    name: props.name,
    state: props.state,
    created: toTimestamp(props.createdDate),
    startDate: toTimestamp(props.startDate),
    endDate: toTimestamp(props.endDate),
    completeDate: toTimestamp(props.completeDate),
    uri: props.self,
  };
};

export const toWorklog = (props: WorklogSchema): Worklog => {
  return {
    id: props.id,
    author: props.author.accountId,
    updateAuthor: props.updateAuthor?.accountId,
    created: toTimestamp(props.created),
    updated: toTimestamp(props.updated),
    started: toTimestamp(props.started),
    timeSpentSeconds: props.timeSpentSeconds,
    uri: props.self,
  };
};

export const toChangelog = (props: ChangeLogSchema): ChangeLog[] => {
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

export const toTicket = (props: IssueSchema): Ticket => {
  return {
    id: props.id,
    key: props.key,
    uri: props.self,
    summary: props.fields.summary,
    priority: +props.fields.priority.id,
    ...(props.fields.project && { project: toProject(props.fields.project) }),
  };
};
