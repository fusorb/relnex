import { z } from "zod";
import type { Tag } from "@prisma-client";

export const CreateTagDto = z.object({
  name: z.string().min(1).max(50),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).optional(),
});

export const createTagSchema = CreateTagDto;
export type CreateTagInput = z.infer<typeof CreateTagDto>;

// Renaming re-derives the slug, so only the name is accepted.
export const UpdateTagDto = z.object({
  name: z.string().min(1).max(50),
});

export const updateTagSchema = UpdateTagDto;
export type UpdateTagInput = z.infer<typeof UpdateTagDto>;

export const mergeTagSchema = z.object({
  intoTagId: z.string().min(1, "A target tag is required"),
});

export type MergeTagInput = z.infer<typeof mergeTagSchema>;

export const associateTagsSchema = z.object({
  tagIds: z.array(z.string()).min(1, "At least one tag ID is required"),
});

export type AssociateTagsInput = z.infer<typeof associateTagsSchema>;

/** The one place a name becomes a slug (tag create, rename, merge). */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

export function toSafeTagDTO(tag: Tag & { _count?: { resources: number } }) {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    resourceCount: tag._count?.resources ?? 0,
  };
}
