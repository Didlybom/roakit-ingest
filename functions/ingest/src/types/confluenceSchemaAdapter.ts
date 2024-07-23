import type { Attachments, Comment, Label, Page, Space } from '.';
import type {
  CommentSchema,
  ConfluenceEventSchema,
  PageSchema,
  SpaceSchema,
} from './confluenceSchema';

export const toSpace = (props: SpaceSchema): Space => ({
  id: `${props.id}`,
  author: props.creatorAccountId,
  key: props.key,
  title: props.title,
  isPersonalSpace: props.isPersonalSpace,
  uri: props.self,
  created: props.creationDate,
  updated: props.modificationDate,
  updateAuthor: props.lastModifierAccountId,
});

export const toPage = (props: PageSchema): Page => ({
  id: props.id,
  author: props.creatorAccountId,
  title: props.title,
  version: props.version,
  uri: props.self,
  spaceKey: props.spaceKey,
  created: props.creationDate,
  updated: props.modificationDate,
  updateAuthor: props.lastModifierAccountId,
});

export const toComment = (props: CommentSchema): Comment => ({
  id: props.id,
  body: undefined,
  author: props.creatorAccountId,
  uri: props.self,
  created: props.creationDate,
  updated: props.modificationDate,
  updateAuthor: props.lastModifierAccountId,
  ...(props.inReplyTo && { inReplyToId: props.inReplyTo.id }),
  ...(props.parent && {
    parent: {
      type: props.parent.contentType,
      id: props.parent.id,
      title: props.parent.title,
      uri: props.parent.self,
    },
  }),
});

export const toAttachments = (props: ConfluenceEventSchema): Attachments | undefined => {
  if (!props.attachments && !props.attachedTo) {
    return undefined;
  }
  return {
    files: props.attachments!.map(attach => ({
      id: attach.id,
      author: attach.creatorAccountId,
      uri: attach.self,
      filename: attach.fileName,
      comment: attach.comment,
      created: attach.creationDate,
    })),
    parent: {
      type: props.attachedTo!.contentType,
      id: props.attachedTo!.id,
      title: props.attachedTo!.title,
      uri: props.attachedTo!.self,
    },
  };
};

export const toLabel = (props: ConfluenceEventSchema): Label | undefined => {
  if (!props.labeled) {
    return undefined;
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
