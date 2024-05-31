import { Action, Artifact } from '../types';
import type { ConfluenceEventSchema } from '../types/confluenceSchema';

export const inferArtifact = (): Artifact => {
  return 'taskOrg';
};

export const inferAction = (props: ConfluenceEventSchema): Action => {
  if (props.updateTrigger) {
    return 'updated';
  } else {
    return 'created'; // could be a comment
  }
};
