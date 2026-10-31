// domains/activity/activity.types.ts
// Canonical activity type strings written to the Activity table.
// Using dot-notation namespacing: entity.action (e.g. resource.published).
// Add new types here as new domains are introduced - the DB column is String
// so any value is valid, but keeping them here prevents typos and makes
// querying the activity feed predictable.

export const ActivityType = {
  // Resources
  RESOURCE_CREATED:     "resource.created",
  RESOURCE_UPDATED:     "resource.updated",
  RESOURCE_PUBLISHED:   "resource.published",
  RESOURCE_ARCHIVED:    "resource.archived",
  RESOURCE_DELETED:     "resource.deleted",
  RESOURCE_VERSIONED:   "resource.versioned",
  // Saves / bookmarks
  RESOURCE_SAVED:       "resource.saved",
  RESOURCE_UNSAVED:     "resource.unsaved",
  // Graph edges
  RESOURCE_CONNECTED:   "resource.connected",
  RESOURCE_DISCONNECTED:"resource.disconnected",
  // Comments
  COMMENT_ADDED:        "comment.added",
  COMMENT_DELETED:      "comment.deleted",
  // Collections
  COLLECTION_CREATED:   "collection.created",
  COLLECTION_UPDATED:   "collection.updated",
  COLLECTION_DELETED:   "collection.deleted",
  COLLECTION_RESOURCE_ADDED:   "collection.resource.added",
  COLLECTION_RESOURCE_REMOVED: "collection.resource.removed",
  // Auth
  USER_REGISTERED:      "auth.registered",
  PROFILE_UPDATED:      "profile.updated",
} as const;

export type ActivityTypeValue = (typeof ActivityType)[keyof typeof ActivityType];