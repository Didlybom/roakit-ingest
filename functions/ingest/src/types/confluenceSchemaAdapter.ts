import type { Comment, Page, Space } from '.';
import type { CommentSchema, PageSchema, SpaceSchema } from './confluenceSchema';

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
    ...(props.parent && {
      parent: {
        type: props.parent.contentType,
        id: props.parent.id,
        title: props.parent.title,
      },
    }),
  };
};
