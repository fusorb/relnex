import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { CreateResourceDto } from "../resource.dto";
import { ResourceRepository } from "../resource.repository";
import { ApiError } from "@/lib/errors";

export const createResourceFlow: Flow<z.infer<typeof CreateResourceDto>, { resource: unknown }> = {
  name:        "resource:create",
  inputSchema: CreateResourceDto,

  async execute(input, ctx: FlowContext) {
    const repo = new ResourceRepository(ctx.db);

    // Check slug uniqueness if provided
    if (input.slug) {
      const existing = await repo.findBySlug(input.slug, ctx.userId!, ctx.tenantId);
      if (existing) throw ApiError.conflict("A resource with this slug already exists");
    }

    const resource = await repo.create({
      title:            input.title,
      description:      input.description,
      excerpt:          input.excerpt,
      type:             input.type,
      visibility:       input.visibility,
      category:         input.category,
      language:         input.language,
      slug:             input.slug,
      draftContentJson: input.draftContentJson,
      metadata:         input.metadata,
      thumbnailUrl:     input.thumbnailUrl,
      coverImageUrl:    input.coverImageUrl,
      fileUrl:          input.fileUrl,
      tenantId:         ctx.tenantId,
      author:           { connect: { id: ctx.userId! } },
      ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
      ...(input.tags?.length ? {
        resourceTags: {
          create: input.tags.map((name) => ({
            tag: {
              connectOrCreate: {
                where:  { "tenantId_slug": { tenantId: ctx.tenantId, slug: name.toLowerCase().replace(/\s+/g, "-") } },
                create: { tenantId: ctx.tenantId, name, slug: name.toLowerCase().replace(/\s+/g, "-") },
              },
            },
          })),
        },
      } : {}),
    });

    return { resource };
  },
};
