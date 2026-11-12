import { z }        from "zod";
import type { Flow } from "@/core/flows/flow";
import { UpdateProfileDto } from "../user.dto";
import { UserRepository }   from "../user.repository";

export const updateProfileFlow: Flow<z.infer<typeof UpdateProfileDto>, { user: unknown }> = {
  name: "user:update-profile", inputSchema: UpdateProfileDto,
  async execute(input, ctx) {
    const repo = new UserRepository(ctx.db);
    const user = await repo.update(ctx.userId!, {
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.bio         !== undefined ? { bio: input.bio }                 : {}),
      ...(input.avatarUrl   !== undefined ? { avatarUrl: input.avatarUrl }     : {}),
      ...(input.archetype   !== undefined ? { archetype: input.archetype }     : {}),
      ...(input.preferences !== undefined ? { preferences: input.preferences } : {}),
    });
    return { user };
  },
};
