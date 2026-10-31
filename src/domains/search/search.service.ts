import { prisma } from "@/core/db";
import type { DbClient } from "@/core/flows/flow-context";
import { SearchRepository } from "./search.repository";
import type { SearchInput } from "./search.dto";

export class SearchService {
  repo: SearchRepository;

  constructor(db: DbClient = prisma) {
    this.repo = new SearchRepository(db);
  }

  async search(input: SearchInput) {
    const q = input.q.trim();
    const [resourcesRes, usersRes, collectionsRes] = await Promise.all([
      input.type === "all" || input.type === "resources"
        ? this.repo.searchResources(q, input)
        : null,
      input.type === "all" || input.type === "users"
        ? this.repo.searchUsers(q, input)
        : null,
      input.type === "all" || input.type === "collections"
        ? this.repo.searchCollections(q, input)
        : null,
    ]);

    return {
      resources:  resourcesRes?.items ?? [],
      users:      usersRes?.items ?? [],
      collections: collectionsRes?.items ?? [],
      query:      q,
    };
  }

  async executeUnifiedQuery(
    query: { q: string; page: number; limit: number; tenantId?: string | null },
    tenantId: string | null
  ) {
    return this.search({
      q:        query.q,
      type:     "all",
      page:     query.page,
      limit:    query.limit,
      tenantId: query.tenantId ?? tenantId ?? null,
    });
  }

  async executeResourceQuery(
    query: { q?: string; page: number; limit: number; tenantId?: string | null },
    tenantId: string | null
  ) {
    const result = await this.search({
      q:        query.q ?? "",
      type:     "resources",
      page:     query.page,
      limit:    query.limit,
      tenantId: query.tenantId ?? tenantId ?? null,
    });
    return result.resources;
  }
}
