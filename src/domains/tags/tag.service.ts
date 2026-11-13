import { prisma } from "@/core/db";
import type { DbClient } from "@/core/flows/flow-context";
import { TagRepository } from "./tag.repository";
import { slugify } from "./tag.dto";
import type { CreateTagInput, UpdateTagInput } from "./tag.dto";
import { ApiError } from "@/lib/errors";

export class TagService {
  repo: TagRepository;
  constructor(db: DbClient = prisma) { this.repo = new TagRepository(db); }

  async getAllTags(tenantId?: string | null, page = 1, limit = 100) {
    const { items, total } = await this.repo.findAll(tenantId, page, limit);
    return { items, total, page, limit };
  }

  async createTag(input: CreateTagInput, tenantId?: string | null) {
    return this.repo.upsert(input.name, tenantId ?? undefined);
  }

  /** Renames a tag and re-derives its slug. 409s if the tenant already has it. */
  async renameTag(id: string, input: UpdateTagInput, tenantId?: string | null) {
    await this.getTagOrThrow(id, tenantId);

    const slug = slugify(input.name);
    const clash = await this.repo.findByNameOrSlug(input.name, slug, tenantId);
    if (clash && clash.id !== id) {
      throw ApiError.conflict("A tag with that name already exists");
    }

    return this.repo.update(id, { name: input.name, slug });
  }

  /** Deletes a tag; its resource links cascade away with it. */
  async deleteTag(id: string, tenantId?: string | null) {
    await this.getTagOrThrow(id, tenantId);
    return this.repo.delete(id);
  }

  /** Merges a tag into another: every linked resource moves, then the source goes. */
  async mergeTags(id: string, intoTagId: string, tenantId?: string | null) {
    if (id === intoTagId) throw ApiError.badRequest("Cannot merge a tag into itself");

    await this.getTagOrThrow(id, tenantId);
    const target = await this.getTagOrThrow(intoTagId, tenantId);

    await this.repo.moveLinks(id, intoTagId);
    await this.repo.delete(id);

    return target;
  }

  private async getTagOrThrow(id: string, tenantId?: string | null) {
    const tag = await this.repo.findById(id, tenantId);
    if (!tag) throw ApiError.notFound("Tag not found");
    return tag;
  }
}
