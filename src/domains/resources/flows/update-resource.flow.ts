import { z }             from "zod";
import type { Flow }     from "@/core/flows/flow";
import type { FlowContext } from "@/core/flows/flow-context";
import { UpdateResourceDto } from "../resource.dto";
import { ResourceService }   from "../resource.service";
import { ResourceRepository } from "../resource.repository";

const Input = UpdateResourceDto.extend({ resourceId: z.string() });

export const updateResourceFlow: Flow<z.infer<typeof Input>, { resource: unknown }> = {
  name:        "resource:update",
  inputSchema: Input,

  async execute(input, ctx: FlowContext) {
    const { resourceId, ...data } = input;
    const service = new ResourceService(ctx.db);
    await service.assertOwnership(resourceId, ctx.userId!, ctx.tenantId);

    const repo     = new ResourceRepository(ctx.db);
    const resource = await repo.update(resourceId, {
      ...(data.title            !== undefined ? { title: data.title }                         : {}),
      ...(data.description      !== undefined ? { description: data.description }             : {}),
      ...(data.excerpt          !== undefined ? { excerpt: data.excerpt }                     : {}),
      ...(data.draftContentJson !== undefined ? { draftContentJson: data.draftContentJson }   : {}),
      ...(data.metadata         !== undefined ? { metadata: data.metadata }                   : {}),
      ...(data.visibility       !== undefined ? { visibility: data.visibility }               : {}),
      ...(data.category         !== undefined ? { category: data.category }                   : {}),
      ...(data.thumbnailUrl     !== undefined ? { thumbnailUrl: data.thumbnailUrl }           : {}),
      ...(data.coverImageUrl    !== undefined ? { coverImageUrl: data.coverImageUrl }         : {}),
    });

    return { resource };
  },
};
