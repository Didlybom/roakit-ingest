import { Account, Action, Artifact } from '../types';
import { GitHubEventSchema } from '../types/githubSchema';

export const inferArtifact = (eventName: string): Artifact => {
  return eventName === 'repository' || eventName === 'membership' ? 'codeOrg' : 'code';
};

const updatedEvents = [
  'issue_comment',
  'pull_request',
  'pull_request_review',
  'pull_request_review_comment',
  'pull_request_review_thread',
  'label',
  'membership',
  'release',
];
const createdEvents = ['push', 'pull_request_review_comment', 'create'];
const deletedEvents = ['delete'];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const inferAction = (eventName: string, codeAction?: string): Action => {
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
};

export const inferAccount = (props: GitHubEventSchema) => {
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
