import { Account, Action, Artifact } from '../types';
import { JiraEventSchema } from '../types/jiraSchema';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const inferArtifact = (eventName: string): Artifact => {
  if (eventName.startsWith('board')) {
    return 'taskOrg';
  }
  return 'task'; // obviously need improvement
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
export const inferAction = (eventName: string): Action => {
  if (eventName.startsWith('comment')) {
    return 'updated';
  }
  for (const action of jiraActionSuffixes) {
    if (eventName.endsWith(action)) {
      return action;
    }
    // simplistic for now
  }
  return 'unknown';
};

export const inferAccount = (props: JiraEventSchema) => {
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
