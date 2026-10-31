/**
 * Membership repository - data access for User ↔ Sg Tenant membership.
 */

import type { DbClient } from "@/core/flows/flow-context";
import type { Prisma } from "@prisma-client";

export class MembershipRepository {
  constructor(private db: DbClient) {}

  async findById(id: string) {
    return this.db.membership.findFirst({
      where: { id },
      include: { user: true },
    });
  }

  async findByUserAndTenant(userId: string, tenantId: string) {
    return this.db.membership.findFirst({
      where: { userId, tenantId },
      include: { user: true },
    });
  }

  async findByUser(userId: string) {
    return this.db.membership.findMany({
      where: { userId },
      orderBy: { joinedAt: "desc" },
    });
  }

  async findByTenant(tenantId: string, params?: { page?: number; limit?: number }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;

    const where = { tenantId };
    const [items, total] = await Promise.all([
      this.db.membership.findMany({
        where,
        include: { user: true },
        orderBy: { joinedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.membership.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async create(data: Prisma.MembershipCreateInput) {
    return this.db.membership.create({ data });
  }

  async update(id: string, data: Prisma.MembershipUpdateInput) {
    return this.db.membership.update({ where: { id }, data });
  }

  async upsert(
    userId: string,
    tenantId: string,
    data: Partial<Pick<Prisma.MembershipUncheckedCreateInput, "role" | "status" | "metadata">>,
  ) {
    return this.db.membership.upsert({
      where: { userId_tenantId: { userId, tenantId } },
      create: { userId, tenantId, ...data },
      update: data,
    });
  }

  async delete(id: string) {
    return this.db.membership.delete({ where: { id } });
  }

  async deleteByUserAndTenant(userId: string, tenantId: string) {
    return this.db.membership.deleteMany({
      where: { userId, tenantId },
    });
  }
}