// ── DTOs & Validators ──────────────────────────────────────────────────
export {
  CreateResourceDto,
  UpdateResourceDto,
  ConnectResourcesDto,
  ListResourcesDto,
  listResourcesSchema,
  toSafeResourceDTO,
} from "./resource.dto";
export type {
  CreateResourceInput,
  UpdateResourceInput,
  ListResourcesInput,
} from "./resource.dto";

// ── Presenters ─────────────────────────────────────────────────────────
export { presentResource } from "./resources.presenter";

// ── Read-access rule ───────────────────────────────────────────────────
export { canViewResource, visibleResourceWhere } from "./resource.visibility";
export type { VisibilitySubject } from "./resource.visibility";

// ── Services & Repositories ────────────────────────────────────────────
export { ResourceService } from "./resource.service";
export { ResourceRepository } from "./resource.repository";

// ── Flows ──────────────────────────────────────────────────────────────
export { createResourceFlow } from "./flows/create-resource.flow";
export { updateResourceFlow } from "./flows/update-resource.flow";
export { deleteResourceFlow } from "./flows/delete-resource.flow";
export { publishResourceFlow } from "./flows/publish-resource.flow";
export { connectResourcesFlow } from "./flows/connect-resources.flow";
export { disconnectResourcesFlow } from "./flows/disconnect-resources.flow";
export { saveResourceFlow } from "./flows/save-resource.flow";
export { unsaveResourceFlow } from "./flows/unsave-resource.flow";
export { getChildrenFlow } from "./flows/get-children.flow";
export { createVersionFlow } from "./flows/create-version.flow";
export { trackUsageFlow } from "./flows/track-usage.flow";
export { addCommentFlow } from "./flows/add-comment.flow";
// Comment moderation. Live via PATCH /api/comments/[commentId].
export { updateCommentStatusFlow } from "./flows/update-comment-status.flow";