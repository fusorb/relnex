/**
 * Membership presenter - transforms Membership model to API-safe response shapes.
 */

import type { Membership, User } from "@prisma-client";
import { presentPublicUser, type PublicUser } from "./users.presenter";

// ── Full membership response ────────────────────────────────────────────

export interface MembershipResponse {
  id: string;
  role: string;
  status: string;
  tenantId: string;
  metadata: Record<string, unknown> | null;
  joinedAt: string;
  user: PublicUser;
}

export function presentMembership(
  membership: Membership & { user: User }
): MembershipResponse {
  return {
    id: membership.id,
    role: membership.role,
    status: membership.status,
    tenantId: membership.tenantId,
    metadata: membership.metadata as Record<string, unknown> | null,
    joinedAt: membership.joinedAt.toISOString(),
    user: presentPublicUser(membership.user),
  };
}

// ── User's membership list ──────────────────────────────────────────────

export interface UserMembershipListResponse {
  items: MembershipResponse[];
  total: number;
}

export function presentUserMembershipList(
  memberships: Array<Membership & { user: User }>
): UserMembershipListResponse {
  return {
    items: memberships.map(presentMembership),
    total: memberships.length,
  };
}

// ── Tenant's member list ────────────────────────────────────────────────

export interface TenantMemberListResponse {
  items: MembershipResponse[];
  total: number;
  page: number;
  limit: number;
}

export function presentTenantMemberList(
  memberships: Array<Membership & { user: User }>,
  total: number,
  page: number,
  limit: number
): TenantMemberListResponse {
  return {
    items: memberships.map(presentMembership),
    total,
    page,
    limit,
  };
}