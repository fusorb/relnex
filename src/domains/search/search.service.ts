import { prisma } from "@/core/db";
import type { DbClient } from "@/core/flows/flow-context";
import { paginate } from "@/lib/pagination";
import { SearchRepository } from "./search.repository";
import type { SearchInput } from "./search.dto";

function emptySection<T>(page: number, limit: number) {
  return paginate<T>([], 0, page, limit);
}

export class SearchService {
  repo: SearchRepository;

  constructor(db: DbClient = prisma) {
    this.repo = new SearchRepository(db);
  }

  /**
   * Returns one `{ items, total, page, limit }` envelope per entity type, so
   * every section carries the same pagination shape (see @/lib/pagination).
   * Sections that were not requested come back empty rather than missing.
   */
  async search(input: SearchInput) {
    const q = input.q.trim();
    const { page, limit } = input;

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
      resources: resourcesRes
        ? paginate(resourcesRes.items, resourcesRes.total, page, limit)
        : emptySection(page, limit),
      users: usersRes
        ? paginate(usersRes.items, usersRes.total, page, limit)
        : emptySection(page, limit),
      collections: collectionsRes
        ? paginate(collectionsRes.items, collectionsRes.total, page, limit)
        : emptySection(page, limit),
      query: q,
    };
  }

  async executeUnifiedQuery(
    query: {
      q: string;
      type?: SearchInput["type"];
      page: number;
      limit: number;
      tenantId?: string | null;
    },
    tenantId: string | null
  ) {
    return this.search({
      q:        query.q,
      type:     query.type ?? "all",
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
