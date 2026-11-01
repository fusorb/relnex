import { z }             from "zod";
import { randomUUID }    from "crypto";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { CreateResourceDto } from "../resource.dto";
import { ResourceRepository } from "../resource.repository";
import { ApiError } from "@/lib/errors";
import { resolveTenantId } from "@/core/tenancy";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const createResourceFlow: Flow<z.infer<typeof CreateResourceDto>, { resource: unknown }> = {
  name:        "resource:create",
  inputSchema: CreateResourceDto,

  async execute(input, ctx: FlowContext) {
    const repo = new ResourceRepository(ctx.db);
    const tenantId = resolveTenantId(ctx.tenantId);

    // Resolve a unique slug. A client-provided slug is checked for conflicts;
    // an absent one is generated from the title plus a short random suffix so
    // the (tenantId, authorId, slug) unique constraint never trips on create.
    let slug = input.slug;
    if (slug) {
      const existing = await repo.findBySlug(slug, ctx.userId!, tenantId);
      if (existing) throw ApiError.conflict("A resource with this slug already exists");
    } else {
      const base = slugify(input.title ?? "resource") || "resource";
      slug = `${base}-${randomUUID().slice(0, 6)}`;
    }

    const resource = await repo.create({
      title:            input.title,
      description:      input.description,
      excerpt:          input.excerpt,
      type:             input.type,
      visibility:       input.visibility,
      category:         input.category,
      language:         input.language,
      slug,
      draftContentJson: input.draftContentJson,
      metadata:         input.metadata,
      thumbnailUrl:     input.thumbnailUrl,
      coverImageUrl:    input.coverImageUrl,
      fileUrl:          input.fileUrl,
      tenantId,
      author:           { connect: { id: ctx.userId! } },
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
      ...(input.tags?.length ? {
        resourceTags: {
          create: input.tags.map((name) => ({
            tag: {
              connectOrCreate: {
                where:  { tenantId_slug: { tenantId, slug: name.toLowerCase().replace(/\s+/g, "-") } },
                create: { tenantId, name, slug: name.toLowerCase().replace(/\s+/g, "-") },
              },
            },
          })),
        },
      } : {}),
    });

    return { resource };
  },
};
