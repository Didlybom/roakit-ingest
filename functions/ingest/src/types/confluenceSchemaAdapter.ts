import type { Comment, Label, Page, Space } from '.';
import type {
  CommentSchema,
  ConfluenceEventSchema,
  PageSchema,
  SpaceSchema,
} from './confluenceSchema';

export const toSpace = (props: SpaceSchema): Space => {
  return {
    id: `${props.id}`,
    author: props.creatorAccountId,
    key: props.key,
    title: props.title,
    isPersonalSpace: props.isPersonalSpace,
    uri: props.self,
    created: props.creationDate,
    updated: props.modificationDate,
    updateAuthor: props.lastModifierAccountId,
  };
};

export const toPage = (props: PageSchema): Page => {
  return {
    id: props.id,
    author: props.creatorAccountId,
    title: props.title,
    version: props.version,
    uri: props.self,
    spaceKey: props.spaceKey,
    created: props.creationDate,
    updated: props.modificationDate,
    updateAuthor: props.lastModifierAccountId,
  };
};

export const toComment = (props: CommentSchema): Comment => {
  return {
    id: props.id,
    body: undefined,
    author: props.creatorAccountId,
    uri: props.self,
    created: props.creationDate,
    updated: props.modificationDate,
    updateAuthor: props.lastModifierAccountId,
    ...(props.inReplyTo && {
      inReplyToId: props.inReplyTo.id,
    }),
    ...(props.parent && {
      parent: {
        type: props.parent.contentType,
        id: props.parent.id,
        title: props.parent.title,
      },
    }),
  };
};

export const toLabel = (props: ConfluenceEventSchema): Label | null => {
  if (!props.labeled) {
    return null;
  }
  return {
    id: props.labeled.id,
    name: props.label?.name,
    author: props.label?.ownerAccountId,
    uri: props.label?.self,
    contentUri: props.labeled.self,
    spaceKey: props.labeled.spaceKey,
    contentType: props.labeled.contentType,
    created: props.labeled.creationDate,
    updated: props.labeled.modificationDate,
    updateAuthor: props.labeled.lastModifierAccountId,
  };
};
