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

// ── Flows ──────────────────────────────────────────────────────────────
// Note: createCollectionFlow is handled directly in the route via CollectionService
export { updateCollectionFlow } from "./flows/update-collection.flow";
export { deleteCollectionFlow } from "./flows/delete-collection.flow";
export { addResourceToCollectionFlow } from "./flows/add-resource-to-collection.flow";
export { removeResourceFromCollectionFlow } from "./flows/remove-resource-from-collection.flow";