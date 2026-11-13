// ── DTOs & Validators ──────────────────────────────────────────────────
export {
  CreateCollectionDto,
  UpdateCollectionDto,
  createCollectionSchema,
  updateCollectionSchema,
  addResourceToCollectionSchema,
  reorderCollectionSchema,
} from "./collection.dto";
export type { CreateCollectionInput, UpdateCollectionInput } from "./collection.dto";

// ── Presenters ─────────────────────────────────────────────────────────
export { toSafeCollectionDTO, presentCollectionListItem, type CollectionDTO, type CollectionListItem } from "./collections.presenter";

// ── Services & Repositories ────────────────────────────────────────────
export { CollectionService } from "./collection.service";
export { CollectionRepository } from "./collection.repository";

// ── Read-access rule ───────────────────────────────────────────────────
export { canViewCollection, visibleCollectionWhere } from "./collection.visibility";
export type { CollectionVisibilitySubject } from "./collection.visibility";

// ── Flows ──────────────────────────────────────────────────────────────
// Membership and creation are handled directly in the routes via
// CollectionService; only the update/delete lifecycles are flows.
export { updateCollectionFlow } from "./flows/update-collection.flow";
export { deleteCollectionFlow } from "./flows/delete-collection.flow";