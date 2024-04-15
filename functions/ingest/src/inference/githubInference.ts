import { Account, Action, Artifact } from '../types';
import { GitHubEventSchema } from '../types/githubSchema';

// see https://docs.github.com/en/webhooks/webhook-events-and-payload

const orgEvents = [
  'repository',
  'repository_ruleset',
  'branch_protection_rule',
  'membership',
  'member',
  'organization',
];
export const inferArtifact = (eventName: string): Artifact => {
  return orgEvents.includes(eventName) ? 'codeOrg' : 'code';
};

const createdEvents = ['push', 'create'];
const updatedEvents = [
  'issue_comment',
  'pull_request',
  'pull_request_review',
  'pull_request_review_comment',
  'pull_request_review_thread',
  'label',
  'membership',
  'member',
  'release',
];
const deletedEvents = ['deleted', 'delete'];
const createdActions = ['added', 'created', 'member_added', 'member_invited'];
const updatedActions = ['edited', 'renamed'];
const deletedActions = ['member_removed'];

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
  if (codeAction) {
    if (createdActions.includes(codeAction)) {
      return 'created';
    }
    if (updatedActions.includes(codeAction)) {
      return 'updated';
    }
    if (deletedActions.includes(codeAction)) {
      return 'deleted';
    }
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
