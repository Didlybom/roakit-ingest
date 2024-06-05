import { Action, Artifact } from '../types';
import type { ConfluenceEventSchema } from '../types/confluenceSchema';

export const inferArtifact = (eventName: string): Artifact => {
  if (eventName.startsWith('space')) {
    return 'docOrg';
  }
  return 'doc';
};

export const inferAction = (props: ConfluenceEventSchema): Action => {
  if (props.updateTrigger) {
    return 'updated';
  } else if (props.labeled) {
    return 'updated';
  } else if (props.comment) {
    return 'updated';
  } else if (props.attachedTo) {
    return 'updated';
  } else {
    return 'created';
  }
};
