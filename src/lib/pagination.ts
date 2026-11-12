// The one paginated-list envelope for the whole API:
//
//   { success: true, data: { items, total, page, limit } }
//
// Every list endpoint (resources, collections, tags, search) returns this shape,
// so a client never has to special-case `{ items, pagination }`, `{ count, data }`
// or a bare `{ items, total }` again.
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return { items, total, page, limit };
}
