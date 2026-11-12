import { z } from "zod";
import type { Tag } from "@prisma-client";

export const CreateTagDto = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
});

export const createTagSchema = CreateTagDto;
export type CreateTagInput = z.infer<typeof CreateTagDto>;

export const associateTagsSchema = z.object({
  tagIds: z.array(z.string()).min(1, "At least one tag ID is required"),
});

export type AssociateTagsInput = z.infer<typeof associateTagsSchema>;

export function toSafeTagDTO(tag: Tag & { _count?: { resources: number } }) {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    resourceCount: tag._count?.resources ?? 0,
  };
}
