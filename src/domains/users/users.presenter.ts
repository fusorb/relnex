/**
 * User presenter - transforms User model to API-safe response shapes.
 */

import type { User, Membership } from "@prisma-client";

// ── Public user profile (what others see) ───────────────────────────────

export interface PublicUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  archetype: string;
  createdAt: string;
}

type PublicUserInput = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  archetype: string;
  createdAt: Date;
};

export function presentPublicUser(user: PublicUserInput): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    archetype: user.archetype,
    createdAt: user.createdAt.toISOString(),
  };
}

// ── Private user profile (what the user sees about themselves) ──────────

export interface PrivateUser extends PublicUser {
  email: string | null; // From Sg, shown if verified
  identityId: string;
  role: string;
  onboardingStep: number;
  preferences: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function presentPrivateUser(user: User): PrivateUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    archetype: user.archetype,
    email: null, // Populated from Sg, not stored here
    identityId: user.identityId,
    role: user.role,
    onboardingStep: user.onboardingStep,
    preferences: user.preferences as Record<string, unknown> | null,
    metadata: user.metadata as Record<string, unknown> | null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// ── Paginated list ──────────────────────────────────────────────────────

export interface UserListResponse {
  items: PublicUser[];
  total: number;
  page: number;
  limit: number;
}

export function presentUserList(
  users: User[],
  total: number,
  page: number,
  limit: number
): UserListResponse {
  return {
    items: users.map(presentPublicUser),
    total,
    page,
    limit,
  };
}

// ── Membership presenter ────────────────────────────────────────────────

export interface MembershipResponse {
  id: string;
  role: string;
  status: string;
  tenantId: string;
  joinedAt: string;
}

export function presentMembership(membership: Membership): MembershipResponse {
  return {
    id: membership.id,
    role: membership.role,
    status: membership.status,
    tenantId: membership.tenantId,
    joinedAt: membership.joinedAt.toISOString(),
  };
}