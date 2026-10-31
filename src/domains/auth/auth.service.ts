import { prisma } from "@/core/db/prisma";
import { ApiError } from "@/lib/errors";
import { AuthSdk, createServerSgClient, unwrap } from "@/lib/sg";
import type { DbClient } from "@/core/flows/flow-context";
import type { RegisterInput, LoginInput } from "./auth.dto";

export const authService = {
  async register(input: RegisterInput, db: DbClient = prisma) {
    // 1. Create Identity in Sg
    const sdk = new AuthSdk(createServerSgClient());
    const { identity } = await unwrap(
      sdk.register(input.displayName ?? input.username, input.email, input.password)
    );

    // 2. Check username availability in Relnex
    const existing = await db.user.findUnique({ where: { username: input.username } });
    if (existing) {
      throw ApiError.conflict("Username is already taken");
    }

    // 3. Provision Relnex User
    const user = await db.user.create({
      data: {
        identityId:  identity.id,
        username:    input.username,
        displayName: input.displayName,
      },
    });

    return { identity, user };
  },

  async login(input: LoginInput) {
    const sdk = new AuthSdk(createServerSgClient());
    return unwrap(sdk.login(input.email, input.password));
  },

  async getProfile(db: DbClient = prisma, userId: string) {
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");
    return {
      id:          user.id,
      identityId:  user.identityId,
      username:    user.username,
      displayName: user.displayName,
      avatarUrl:   user.avatarUrl,
      role:        user.role,
      email:       null, // Populated from Sg identity
      identity:    null, // Populated from Sg
      onboardingStep: user.onboardingStep,
      preferences:   user.preferences,
      metadata:      user.metadata,
      createdAt:     user.createdAt.toISOString(),
      updatedAt:     user.updatedAt.toISOString(),
    };
  },
};
