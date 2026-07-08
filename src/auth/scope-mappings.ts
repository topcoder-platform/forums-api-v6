export const FORUMS_SCOPE_CREATE = 'create:forums';
export const FORUMS_SCOPE_READ = 'read:forums';
export const FORUMS_SCOPE_UPDATE = 'update:forums';
export const FORUMS_SCOPE_DELETE = 'delete:forums';
export const FORUMS_SCOPE_ALL = 'all:forums';
export const FORUMS_SCOPE_READ_TOPICS = 'read:forums-topics';
export const FORUMS_SCOPE_CREATE_TOPIC = 'create:forums-topics';
export const FORUMS_SCOPE_UPDATE_TOPIC = 'update:forums-topics';
export const FORUMS_SCOPE_DELETE_TOPIC = 'delete:forums-topics';
export const FORUMS_SCOPE_READ_POSTS = 'read:forums-posts';
export const FORUMS_SCOPE_CREATE_POST = 'create:forums-posts';
export const FORUMS_SCOPE_UPDATE_POST = 'update:forums-posts';
export const FORUMS_SCOPE_DELETE_POST = 'delete:forums-posts';
export const FORUMS_SCOPE_ADD_WATCH = 'add:forums-topic-watch';
export const FORUMS_SCOPE_REMOVE_WATCH = 'remove:forums-topic-watch';
export const FORUMS_SCOPE_MODERATE = 'moderate:forums';

export const BATCH_1_FORUMS_SCOPES = [
  FORUMS_SCOPE_CREATE,
  FORUMS_SCOPE_READ,
  FORUMS_SCOPE_UPDATE,
  FORUMS_SCOPE_DELETE,
] as const;

export const BATCH_3_FORUMS_SCOPES = [
  FORUMS_SCOPE_READ_TOPICS,
  FORUMS_SCOPE_CREATE_TOPIC,
  FORUMS_SCOPE_UPDATE_TOPIC,
  FORUMS_SCOPE_DELETE_TOPIC,
  FORUMS_SCOPE_READ_POSTS,
  FORUMS_SCOPE_CREATE_POST,
  FORUMS_SCOPE_UPDATE_POST,
  FORUMS_SCOPE_DELETE_POST,
  FORUMS_SCOPE_ADD_WATCH,
  FORUMS_SCOPE_REMOVE_WATCH,
] as const;

export const ALL_SCOPE_MAPPINGS: Readonly<Record<string, readonly string[]>> = {
  [FORUMS_SCOPE_CREATE]: [
    FORUMS_SCOPE_CREATE_TOPIC,
    FORUMS_SCOPE_CREATE_POST,
    FORUMS_SCOPE_ADD_WATCH,
  ],
  [FORUMS_SCOPE_READ]: [FORUMS_SCOPE_READ_TOPICS, FORUMS_SCOPE_READ_POSTS],
  [FORUMS_SCOPE_UPDATE]: [FORUMS_SCOPE_UPDATE_TOPIC, FORUMS_SCOPE_UPDATE_POST],
  [FORUMS_SCOPE_DELETE]: [
    FORUMS_SCOPE_DELETE_TOPIC,
    FORUMS_SCOPE_DELETE_POST,
    FORUMS_SCOPE_REMOVE_WATCH,
  ],
  [FORUMS_SCOPE_ALL]: [...BATCH_1_FORUMS_SCOPES, ...BATCH_3_FORUMS_SCOPES],
};
