import { Account, Action } from '.';
import { GitHubEventSchema } from './githubSchema';

export const toAccount = (props: GitHubEventSchema) => {
  return {
    id: props.sender?.login,
    accountName: props.sender?.login,
    accountUri: props.sender?.html_url,
  } as Account;
  // pull_request.assignee etc. could be better
};

export const toAction = (eventName: string): Action => {
  throw new Error('Failed to map action for event name ' + eventName);
};
