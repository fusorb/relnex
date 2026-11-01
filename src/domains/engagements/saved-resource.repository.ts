import type { DbClient } from "@/core/flows/flow-context";
import { resolveTenantId } from "@/core/tenancy";

export class SavedResourceRepository {
  constructor(private db: DbClient) {}

  async findByUserAndResource(userId: string, resourceId: string) {
    return this.db.savedResource.findUnique({
      where: { userId_resourceId: { userId, resourceId } },
    });
  }

  async findByUser(userId: string, tenantId?: string | null) {
    return this.db.savedResource.findMany({
      where: { userId, ...(tenantId ? { tenantId } : {}) },
      include: { resource: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: { userId: string; resourceId: string; tenantId?: string | null }) {
    return this.db.savedResource.create({
      data: { ...data, tenantId: resolveTenantId(data.tenantId) },
    });
  }

  async delete(id: string) {
    return this.db.savedResource.delete({ where: { id } });
  }
}