const userSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    identityId: { type: ["string", "null"] },
    username: { type: "string" },
    email: { type: "string" },
    displayName: { type: ["string", "null"] },
    avatarUrl: { type: ["string", "null"] },
    bio: { type: ["string", "null"] },
    onboardingStep: { type: "number" },
    hasCompletedOnboarding: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const publicUserSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    username: { type: "string" },
    displayName: { type: ["string", "null"] },
    avatarUrl: { type: ["string", "null"] },
    bio: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
  },
};

const directoryUserSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    username: { type: "string" },
    displayName: { type: ["string", "null"] },
    avatarUrl: { type: ["string", "null"] },
    bio: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
    isArchived: { type: "boolean" },
  },
};

const tagSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
};

const commentSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    content: { type: "string" },
    status: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    authorId: { type: "string" },
    resourceId: { type: "string" },
    parentId: { type: ["string", "null"] },
    author: {
      type: "object",
      properties: {
        id: { type: "string" },
        username: { type: "string" },
        displayName: { type: ["string", "null"] },
        avatarUrl: { type: ["string", "null"] },
      },
    },
  },
};

const reactionSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    type: { type: "string" },
    resourceId: { type: "string" },
    userId: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    user: {
      type: "object",
      properties: {
        id: { type: "string" },
        username: { type: "string" },
        displayName: { type: ["string", "null"] },
        avatarUrl: { type: ["string", "null"] },
      },
    },
  },
};

const resourceSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    slug: { type: ["string", "null"] },
    title: { type: ["string", "null"] },
    description: { type: ["string", "null"] },
    excerpt: { type: ["string", "null"] },
    type: { type: "string" },
    status: { type: "string" },
    visibility: { type: "string" },
    draftContentJson: { type: ["object", "null"] },
    publishedContentJson: { type: ["object", "null"] },
    content: { type: ["string", "null"] },
    category: { type: ["string", "null"] },
    language: { type: ["string", "null"] },
    thumbnailUrl: { type: ["string", "null"] },
    coverImageUrl: { type: ["string", "null"] },
    fileUrl: { type: ["string", "null"] },
    metadata: { type: ["object", "null"] },
    wordCount: { type: ["number", "null"] },
    estimatedTime: { type: ["number", "null"] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    publishedAt: { type: ["string", "null"], format: "date-time" },
    author: {
      type: ["object", "null"],
      properties: {
        id: { type: "string" },
        username: { type: "string" },
        displayName: { type: ["string", "null"] },
        avatarUrl: { type: ["string", "null"] },
      },
    },
    tags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
        },
      },
    },
    metrics: {
      type: ["object", "null"],
      properties: {
        views: { type: "number" },
        opens: { type: "number" },
        downloads: { type: "number" },
        shares: { type: "number" },
        likes: { type: "number" },
        bookmarks: { type: "number" },
        engagementScore: { type: "number" },
      },
    },
    _count: {
      type: ["object", "null"],
      properties: {
        children: { type: "number" },
        comments: { type: "number" },
        versions: { type: "number" },
      },
    },
  },
};

const collectionSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    slug: { type: "string" },
    title: { type: "string" },
    description: { type: ["string", "null"] },
    visibility: { type: "string" },
    metadata: { type: "object" },
    authorId: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    resources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          resourceId: { type: "string" },
          orderIndex: { type: "number" },
          addedAt: { type: "string", format: "date-time" },
          resource: {
            type: ["object", "null"],
            properties: {
              id: { type: "string" },
              title: { type: ["string", "null"] },
              type: { type: "string" },
            },
          },
        },
      },
    },
  },
};

const safeTagSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
  },
};

// The tag list adds the usage count the taxonomy view renders.
const tagListItemSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    resourceCount: { type: "number" },
  },
};

const searchItemSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: ["string", "null"] },
    excerpt: { type: ["string", "null"] },
    type: { type: "string" },
    slug: { type: ["string", "null"] },
    createdAt: { type: "string", format: "date-time" },
    tags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          slug: { type: "string" },
        },
      },
    },
  },
};

// Shared response shapes. Every Relnex list endpoint returns the same pagination
// envelope (`{ items, total, page, limit }` - see @/lib/pagination), and every
// handler wraps its payload in `{ success, data }`.
const paginated = (itemSchema: object) => ({
  type: "object",
  properties: {
    items: { type: "array", items: itemSchema },
    total: { type: "number" },
    page: { type: "number" },
    limit: { type: "number" },
  },
});

const envelope = (dataSchema: object) => ({
  type: "object",
  properties: {
    success: { type: "boolean" },
    data: dataSchema,
  },
});

export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Relnex Core Engine Node API",
    version: "1.0.0",
    description:
      "Internal programmatic specifications for the Relnex ecosystem data routing layers.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Local Node Environment",
    },
  ],
  paths: {
    // auth
    "/api/auth/register": {
      post: {
        summary: "Register a new user account",
        description:
          "Creates a new user identity, returns the created safe user payload, and sets the auth cookie.",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "email", "password", "confirmPassword"],
                properties: {
                  username: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                  confirmPassword: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: userSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Authenticate an existing user",
        description:
          "Validates credentials, returns the logged-in safe user payload, and sets the auth cookie.",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login succeeded",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: userSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        summary: "End the current session",
        description:
          "Clears the auth cookie and terminates the current browser session.",
        tags: ["Auth"],
        responses: {
          200: {
            description: "Logged out successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // users
    "/api/users": {
      get: {
        summary: "List active users",
        description:
          "Returns the active user directory listing for onboarded users.",
        tags: ["Users"],
        responses: {
          200: {
            description: "User directory fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: directoryUserSchema,
                    },
                  },
                },
              },
            },
          },
        },
      },
      patch: {
        summary: "Apply administrative user overrides",
        description:
          "Allows an admin user to archive or delete a target user account.",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["targetUserId", "isArchived", "isDeleted"],
                properties: {
                  targetUserId: { type: "string" },
                  isArchived: { type: "boolean" },
                  isDeleted: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Administrative action completed",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        summary: "Fetch the current authenticated user",
        description:
          "Returns the safe profile payload for the active session user.",
        tags: ["Auth"],
        responses: {
          200: {
            description: "Current user fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: userSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/me/onboarding": {
      put: {
        summary: "Advance onboarding state",
        description:
          "Stores onboarding progress for the active user and merges step-specific payload data.",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["step", "data"],
                properties: {
                  step: { type: "number" },
                  data: { type: "object", additionalProperties: true },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Onboarding step updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: userSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/me/profile": {
      put: {
        summary: "Update the active user's profile",
        description:
          "Updates the current user's display name, avatar URL, and bio.",
        tags: ["Users"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  displayName: { type: ["string", "null"] },
                  avatarUrl: { type: ["string", "null"], format: "uri" },
                  bio: { type: ["string", "null"] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: publicUserSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/{username}": {
      get: {
        summary: "Fetch a public user profile",
        description: "Returns the public profile for a user by username.",
        tags: ["Users"],
        parameters: [
          {
            name: "username",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Public profile fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: publicUserSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/{username}/analytics": {
      get: {
        summary: "Fetch user analytics",
        description:
          "Returns summary counters and heatmap data for the user's portfolio activity.",
        tags: ["Users"],
        parameters: [
          {
            name: "username",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Analytics fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        summary: {
                          type: "object",
                          properties: {
                            totalContributions: { type: "number" },
                            savedResourcesCount: { type: "number" },
                            collectionsCreatedCount: { type: "number" },
                          },
                        },
                        heatmap: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              date: { type: "string" },
                              count: { type: "number" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/{username}/collections": {
      get: {
        summary: "Fetch a user's nested collections",
        description:
          "Returns collections associated with the requested user profile.",
        tags: ["Users"],
        parameters: [
          {
            name: "username",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Nested collections fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: collectionSchema,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/{username}/graph": {
      get: {
        summary: "Fetch a user's knowledge graph",
        description:
          "Returns graph nodes and edges for the user's visible public resources.",
        tags: ["Users"],
        parameters: [
          {
            name: "username",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Knowledge graph fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        nodes: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              title: { type: ["string", "null"] },
                              type: { type: "string" },
                            },
                          },
                        },
                        edges: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              type: { type: "string" },
                              fromId: { type: "string" },
                              toId: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/{username}/resources": {
      get: {
        summary: "Fetch a user's nested resources",
        description: "Returns the resource list nested under a user profile.",
        tags: ["Users"],
        parameters: [
          {
            name: "username",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Nested resources fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: resourceSchema,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users/{username}/saved": {
      get: {
        summary: "Fetch a user's saved resources",
        description: "Returns saved resources for the profile owner only.",
        tags: ["Users"],
        parameters: [
          {
            name: "username",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Saved resources fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: resourceSchema,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/users/{username}/follow": {
      get: {
        summary: "Is the caller following this user?",
        description: "Returns the caller's follow state for the profile.",
        tags: ["Engagements"],
        parameters: [
          { name: "username", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Follow state fetched successfully",
            content: {
              "application/json": {
                schema: envelope({
                  type: "object",
                  properties: { following: { type: "boolean" } },
                }),
              },
            },
          },
        },
      },
      post: {
        summary: "Follow a user",
        description: "Creates a follow edge. Idempotent; 400 when following yourself.",
        tags: ["Engagements"],
        parameters: [
          { name: "username", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          201: { description: "Now following" },
          400: { description: "Cannot follow yourself" },
        },
      },
      delete: {
        summary: "Unfollow a user",
        description: "Removes the caller's follow edge. 404s when not following.",
        tags: ["Engagements"],
        parameters: [
          { name: "username", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Unfollowed" },
          404: { description: "Not following" },
        },
      },
    },
    "/api/users/{username}/followers": {
      get: {
        summary: "List a user's followers",
        description:
          "Users following this profile, newest first, in the standard paginated envelope.",
        tags: ["Engagements"],
        parameters: [
          { name: "username", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "number" } },
          { name: "limit", in: "query", schema: { type: "number" } },
        ],
        responses: {
          200: {
            description: "Followers fetched successfully",
            content: { "application/json": { schema: envelope(paginated(publicUserSchema)) } },
          },
        },
      },
    },
    "/api/users/{username}/following": {
      get: {
        summary: "List the users a user follows",
        description:
          "Profiles this user follows, newest first, in the standard paginated envelope.",
        tags: ["Engagements"],
        parameters: [
          { name: "username", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "number" } },
          { name: "limit", in: "query", schema: { type: "number" } },
        ],
        responses: {
          200: {
            description: "Following fetched successfully",
            content: { "application/json": { schema: envelope(paginated(publicUserSchema)) } },
          },
        },
      },
    },

    // resources
    "/api/resources": {
      get: {
        summary: "List resources",
        description:
          "Lists the resources the caller may see - their own in any state, plus everyone's published non-private ones. Standard paginated envelope.",
        tags: ["Resources"],
        parameters: [
          { name: "type", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "visibility", in: "query", schema: { type: "string" } },
          { name: "authorId", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "number" } },
          { name: "limit", in: "query", schema: { type: "number" } },
        ],
        responses: {
          200: {
            description: "Resources fetched successfully",
            content: {
              "application/json": { schema: envelope(paginated(resourceSchema)) },
            },
          },
        },
      },
      post: {
        summary: "Create a new resource draft",
        description:
          "Creates a draft resource container for the authenticated user.",
        tags: ["Resources"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type"],
                properties: {
                  type: { type: "string" },
                  tenantId: { type: ["string", "null"] },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Resource draft created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: resourceSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/resources/bulk": {
      post: {
        summary: "Run a bulk resource action",
        description:
          "Deletes or archives multiple resources in sequence and returns per-item success or failure.",
        tags: ["Resources"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["ids", "action"],
                properties: {
                  ids: {
                    type: "array",
                    items: { type: "string" },
                  },
                  action: {
                    type: "string",
                    enum: ["DELETE", "ARCHIVE"],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Bulk operation finished successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        successful: {
                          type: "array",
                          items: { type: "string" },
                        },
                        failed: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              error: { type: "string" },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/resources/{resourceId}": {
      get: {
        summary: "Fetch a resource",
        description: "Returns a single resource by id.",
        tags: ["Resources"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Resource fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: resourceSchema,
                  },
                },
              },
            },
          },
        },
      },
      patch: {
        summary: "Update a resource",
        description: "Applies partial updates to an existing resource.",
        tags: ["Resources"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  slug: { type: ["string", "null"] },
                  title: { type: ["string", "null"] },
                  description: { type: ["string", "null"] },
                  excerpt: { type: ["string", "null"] },
                  draftContentJson: { type: ["object", "null"] },
                  content: { type: ["string", "null"] },
                  status: { type: "string" },
                  visibility: { type: "string" },
                  category: { type: ["string", "null"] },
                  language: { type: "string" },
                  thumbnailUrl: { type: ["string", "null"], format: "uri" },
                  coverImageUrl: { type: ["string", "null"], format: "uri" },
                  fileUrl: { type: ["string", "null"], format: "uri" },
                  metadata: { type: ["object", "null"] },
                  wordCount: { type: ["number", "null"] },
                  estimatedTime: { type: ["number", "null"] },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Resource updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: resourceSchema,
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: "Delete a resource",
        description: "Soft-deletes a resource owned by the active user.",
        tags: ["Resources"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Resource deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/resources/{resourceId}/archive": {
      post: {
        summary: "Archive a resource",
        description: "Marks a resource as archived.",
        tags: ["Resources"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Resource archived successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: resourceSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/resources/{resourceId}/children": {
      get: {
        summary: "Fetch child resources",
        description: "Returns child resources for a given parent resource.",
        tags: ["Resources"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Child resources fetched successfully",
            content: {
              "application/json": { schema: envelope(paginated(resourceSchema)) },
            },
          },
        },
      },
    },
    "/api/resources/{resourceId}/comments": {
      get: {
        summary: "Fetch root comments for a resource",
        description:
          "Returns the top-level discussion thread for the resource.",
        tags: ["Resources", "Comments"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Comments fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    count: { type: "number" },
                    data: {
                      type: "array",
                      items: commentSchema,
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a top-level comment",
        description:
          "Creates a new root comment attached directly to the resource.",
        tags: ["Resources", "Comments"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: {
                  content: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Comment created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: commentSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/resources/{resourceId}/publish": {
      post: {
        summary: "Publish a resource",
        description: "Transitions the resource into the published state.",
        tags: ["Resources"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Resource published successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: resourceSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/resources/{resourceId}/relations": {
      post: {
        summary: "Create a resource relation",
        description:
          "Adds a new directed relation from the source resource to a target resource.",
        tags: ["Resources"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["type", "toId"],
                properties: {
                  type: { type: "string" },
                  toId: { type: "string" },
                  metadata: { type: ["object", "null"] },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Relation created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        type: { type: "string" },
                        fromId: { type: "string" },
                        toId: { type: "string" },
                        metadata: { type: ["object", "null"] },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: "Delete a resource relation",
        description:
          "Removes a directed relation using the target id and relation type query parameters.",
        tags: ["Resources"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "toId",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "type",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Relation deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/resources/{resourceId}/tags": {
      get: {
        summary: "Fetch tags for a resource",
        description: "Returns the tag list attached to a resource.",
        tags: ["Resources", "Tags"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Resource tags fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    count: { type: "number" },
                    data: {
                      type: "array",
                      items: safeTagSchema,
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Attach tags to a resource",
        description: "Links one or more tags to a resource.",
        tags: ["Resources", "Tags"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tagIds"],
                properties: {
                  tagIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Tags attached successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: "Detach tags from a resource",
        description: "Removes one or more tag links from a resource.",
        tags: ["Resources", "Tags"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["tagIds"],
                properties: {
                  tagIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Tags detached successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/resources/{resourceId}/usage": {
      post: {
        summary: "Track a resource usage event",
        description:
          "Appends a usage event and increments analytical counters when applicable.",
        tags: ["Resources"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["event"],
                properties: {
                  event: { type: "string" },
                  sessionId: { type: ["string", "null"] },
                  metadata: { type: ["object", "null"] },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Usage event recorded successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/resources/{resourceId}/versions": {
      get: {
        summary: "Fetch resource versions",
        description: "Returns the historical version list for a resource.",
        tags: ["Resources"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Versions fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    count: { type: "number" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          versionNumber: { type: "number" },
                          title: { type: ["string", "null"] },
                          content: { type: ["string", "null"] },
                          contentJson: { type: ["object", "null"] },
                          changeSummary: { type: "string" },
                          createdAt: { type: "string", format: "date-time" },
                          author: {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              username: { type: "string" },
                              displayName: { type: ["string", "null"] },
                              avatarUrl: { type: ["string", "null"] },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a resource version snapshot",
        description:
          "Captures the current draft state as an immutable historical version.",
        tags: ["Resources"],
        parameters: [
          {
            name: "resourceId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["changeSummary"],
                properties: {
                  changeSummary: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Version created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        versionNumber: { type: "number" },
                        title: { type: ["string", "null"] },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/resources/{resourceId}/reactions": {
      get: {
        summary: "List reactions on a resource",
        description:
          "Returns the LIKE reactions on a resource the caller may read (404 otherwise), newest first, in the standard paginated envelope.",
        tags: ["Engagements"],
        parameters: [
          { name: "resourceId", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "number" } },
          { name: "limit", in: "query", schema: { type: "number" } },
        ],
        responses: {
          200: {
            description: "Reactions fetched successfully",
            content: { "application/json": { schema: envelope(paginated(reactionSchema)) } },
          },
        },
      },
      post: {
        summary: "React to a resource",
        description:
          "Adds the caller's LIKE. Idempotent: 201 when the reaction is new, 200 when it already existed. 404s for a resource the caller may not read.",
        tags: ["Engagements"],
        parameters: [
          { name: "resourceId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          201: {
            description: "Reaction added",
            content: {
              "application/json": {
                schema: envelope({
                  type: "object",
                  properties: {
                    added: { type: "boolean" },
                    reactionId: { type: "string" },
                  },
                }),
              },
            },
          },
          200: { description: "Reaction already present" },
          404: { description: "Resource not visible" },
        },
      },
      delete: {
        summary: "Remove the caller's reaction",
        description:
          "Removes the caller's LIKE from the resource. 404s when they had not reacted.",
        tags: ["Engagements"],
        parameters: [
          { name: "resourceId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Reaction removed" },
          404: { description: "No reaction to remove" },
        },
      },
    },

    // collections
    "/api/collections": {
      get: {
        summary: "List the current user's collections",
        description: "Returns all collections owned by the authenticated user.",
        tags: ["Collections"],
        responses: {
          200: {
            description: "Collections fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: paginated(collectionSchema),
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a collection",
        description: "Creates a new collection for the authenticated user.",
        tags: ["Collections"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string" },
                  description: { type: ["string", "null"] },
                  visibility: { type: "string" },
                  metadata: { type: ["object", "null"] },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Collection created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: collectionSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/collections/{collectionId}": {
      get: {
        summary: "Fetch a collection",
        description: "Returns the collection details and nested resources.",
        tags: ["Collections"],
        parameters: [
          {
            name: "collectionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Collection fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: collectionSchema,
                  },
                },
              },
            },
          },
        },
      },
      patch: {
        summary: "Update a collection",
        description:
          "Updates the title, description, or visibility of a collection owned by the caller.",
        tags: ["Collections"],
        parameters: [
          {
            name: "collectionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: ["string", "null"] },
                  visibility: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Collection updated successfully",
            content: {
              "application/json": { schema: envelope(collectionSchema) },
            },
          },
        },
      },
      delete: {
        summary: "Delete a collection",
        description: "Soft-deletes a collection owned by the current user.",
        tags: ["Collections"],
        parameters: [
          {
            name: "collectionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Collection deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/collections/{collectionId}/reorder": {
      post: {
        summary: "Reorder collection items",
        description:
          "Rewrites collection item ordering using an ordered list of item ids.",
        tags: ["Collections"],
        parameters: [
          {
            name: "collectionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["orderedItemIds"],
                properties: {
                  orderedItemIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Collection reordered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/collections/{collectionId}/resources": {
      post: {
        summary: "Attach a resource to a collection",
        description: "Adds a resource to the collection sequence.",
        tags: ["Collections", "Resources"],
        parameters: [
          {
            name: "collectionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["resourceId"],
                properties: {
                  resourceId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Resource added to collection successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        summary: "Detach a resource from a collection",
        description:
          "Removes a collection-resource linkage by resourceId query parameter.",
        tags: ["Collections", "Resources"],
        parameters: [
          {
            name: "collectionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "resourceId",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Resource removed from collection successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },

    // comments
    "/api/comments/{commentId}": {
      get: {
        summary: "Fetch a comment",
        description: "Returns a single comment by id.",
        tags: ["Comments"],
        parameters: [
          { name: "commentId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Comment fetched successfully",
            content: { "application/json": { schema: envelope(commentSchema) } },
          },
        },
      },
      post: {
        summary: "Reply to a comment",
        description: "Creates a reply beneath this comment.",
        tags: ["Comments"],
        parameters: [
          { name: "commentId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["content"],
                properties: { content: { type: "string" } },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Reply created successfully",
            content: { "application/json": { schema: envelope(commentSchema) } },
          },
        },
      },
      patch: {
        summary: "Moderate a comment",
        description:
          "Sets a comment's status (author or admin only). DELETED also soft-deletes it.",
        tags: ["Comments"],
        parameters: [
          {
            name: "commentId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["ACTIVE", "HIDDEN", "DELETED", "ARCHIVED", "SPAM"],
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Comment updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: commentSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/comments/{commentId}/replies": {
      get: {
        summary: "Fetch replies for a comment",
        description: "Returns all active replies under a comment thread.",
        tags: ["Comments"],
        parameters: [
          {
            name: "commentId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: {
            description: "Replies fetched successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    count: { type: "number" },
                    data: {
                      type: "array",
                      items: commentSchema,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // search
    "/api/search": {
      get: {
        summary: "Unified search",
        description:
          "Searches resources, collections, and users in one call. Every section carries the same pagination envelope ({ items, total, page, limit }).",
        tags: ["Search"],
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" } },
          {
            name: "type",
            in: "query",
            schema: {
              type: "string",
              enum: ["all", "resources", "collections", "users"],
              default: "all",
            },
          },
          { name: "limit", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Search completed successfully",
            content: {
              "application/json": {
                schema: envelope({
                  type: "object",
                  properties: {
                    resources: paginated(resourceSchema),
                    collections: paginated(collectionSchema),
                    users: paginated(publicUserSchema),
                    query: { type: "string" },
                  },
                }),
              },
            },
          },
        },
      },
    },

    // tags
    "/api/tags": {
      get: {
        summary: "List tags",
        description:
          "Returns the tenant's tags in the standard paginated envelope, each with a resourceCount.",
        tags: ["Tags"],
        parameters: [
          { name: "page", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Tags fetched successfully",
            content: {
              "application/json": {
                schema: envelope(paginated(tagListItemSchema)),
              },
            },
          },
        },
      },
      post: {
        summary: "Create a tag",
        description: "Creates a new taxonomy tag.",
        tags: ["Tags"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Tag created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: safeTagSchema,
                  },
                },
              },
            },
          },
        },
      },
    },

    // graph
    "/api/graph": {
      get: {
        summary: "Fetch the signed-in user's knowledge graph",
        description:
          "The user's published resources as nodes plus the typed relations between them. Edges never dangle - a relation is only returned when both endpoints resolve to a visible node.",
        tags: ["Resources"],
        responses: {
          200: {
            description: "Graph fetched successfully",
            content: {
              "application/json": {
                schema: envelope({
                  type: "object",
                  properties: {
                    nodes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          title: { type: ["string", "null"] },
                          type: { type: "string" },
                        },
                      },
                    },
                    edges: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          fromId: { type: "string" },
                          toId: { type: "string" },
                          type: { type: "string" },
                        },
                      },
                    },
                  },
                }),
              },
            },
          },
        },
      },
    },

    // saved resources
    "/api/resources/saved": {
      get: {
        summary: "List the signed-in user's saved resources",
        description:
          "Resources bookmarked by the authenticated user, most recently saved first.",
        tags: ["Resources"],
        responses: {
          200: {
            description: "Saved resources fetched successfully",
            content: {
              "application/json": {
                schema: envelope({ type: "array", items: resourceSchema }),
              },
            },
          },
        },
      },
    },
    "/api/resources/{resourceId}/save": {
      post: {
        summary: "Save (bookmark) a resource",
        description:
          "Bookmarks a resource the caller is allowed to read; 404s otherwise.",
        tags: ["Resources"],
        parameters: [
          { name: "resourceId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          201: { description: "Resource saved" },
        },
      },
      delete: {
        summary: "Remove a saved resource",
        description: "Removes the bookmark for the authenticated user.",
        tags: ["Resources"],
        parameters: [
          { name: "resourceId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: { description: "Bookmark removed" },
        },
      },
    },

    // search (per-entity endpoints)
    "/api/search/resources": {
      get: {
        summary: "Search published resources",
        description: "Resource-only search. Public; surfaces PUBLISHED + PUBLIC resources only.",
        tags: ["Search"],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Search completed successfully",
            content: {
              "application/json": { schema: envelope(paginated(resourceSchema)) },
            },
          },
        },
      },
    },
    "/api/search/collections": {
      get: {
        summary: "Search public collections",
        description: "Collection-only search. Public; surfaces PUBLIC collections only.",
        tags: ["Search"],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Search completed successfully",
            content: {
              "application/json": { schema: envelope(paginated(collectionSchema)) },
            },
          },
        },
      },
    },
    "/api/search/users": {
      get: {
        summary: "Search the user directory",
        description: "User-only search over username and display name.",
        tags: ["Search"],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Search completed successfully",
            content: {
              "application/json": { schema: envelope(paginated(publicUserSchema)) },
            },
          },
        },
      },
    },
    "/api/search/tags": {
      get: {
        summary: "Tag autocomplete",
        description:
          "Tags whose name or slug contains the query. Public reference data; returns a bare array (not paginated).",
        tags: ["Search"],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Tags fetched successfully",
            content: {
              "application/json": {
                schema: envelope({ type: "array", items: safeTagSchema }),
              },
            },
          },
        },
      },
    },

    // webhooks
    "/api/webhooks/sg": {
      post: {
        summary: "SovGrant identity lifecycle webhook",
        description:
          "HMAC-SHA256 signed (`x-sg-signature`). Idempotent via a webhook-event ledger; keeps the local User in sync with SovGrant identity events (suspend/delete/register).",
        tags: ["Webhooks"],
        responses: {
          200: { description: "Event received (or a duplicate, ignored)" },
          401: { description: "Invalid signature" },
          400: { description: "Invalid JSON body" },
        },
      },
    },

    // uploads
    "/api/uploads/presign": {
      post: {
        summary: "Create a presigned upload target",
        description:
          "Returns a signed upload URL, file URL, and storage key for a supported file upload.",
        tags: ["Uploads"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["filename", "contentType", "sizeInBytes"],
                properties: {
                  filename: { type: "string" },
                  contentType: { type: "string" },
                  sizeInBytes: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Presigned upload target generated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                    data: {
                      type: "object",
                      properties: {
                        uploadUrl: { type: "string" },
                        fileUrl: { type: "string" },
                        fileKey: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: userSchema,
      PublicUser: publicUserSchema,
      DirectoryUser: directoryUserSchema,
      Tag: tagSchema,
      Comment: commentSchema,
      Reaction: reactionSchema,
      Resource: resourceSchema,
      Collection: collectionSchema,
      SafeTag: safeTagSchema,
      SearchResultItem: searchItemSchema,
    },
  },
} as const;
