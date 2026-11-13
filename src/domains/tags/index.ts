// ── DTOs & Validators ──────────────────────────────────────────────────
export {
  CreateTagDto,
  createTagSchema,
  UpdateTagDto,
  updateTagSchema,
  mergeTagSchema,
  associateTagsSchema,
  toSafeTagDTO,
  slugify,
} from "./tag.dto";
export type {
  CreateTagInput,
  UpdateTagInput,
  MergeTagInput,
  AssociateTagsInput,
} from "./tag.dto";

// ── Services & Repositories ────────────────────────────────────────────
export { TagService } from "./tag.service";
export { TagRepository } from "./tag.repository";
