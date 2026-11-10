// Import the leaf module, not the `@/lib/errors` barrel: the barrel also
// re-exports handleError/handleApiRoute, which pull @/core/flows -> prisma -> pg
// into the client bundle and break the browser build.
import { ApiError } from "@/lib/errors/api-error";

export interface FetchOptions extends Omit<RequestInit, "credentials"> {
  bodyData?: Record<string, unknown>;
}

/**
 * Maps an HTTP status to the matching ApiError so callers can distinguish
 * 401/403/404/409/422 from a real 5xx (previously every error became a 500).
 */
function toApiError(status: number, message: string): ApiError {
  switch (status) {
    case 400: return ApiError.badRequest(message);
    case 401: return ApiError.unauthorized(message);
    case 403: return ApiError.forbidden(message);
    case 404: return ApiError.notFound(message);
    case 409: return ApiError.conflict(message);
    case 422: return ApiError.unprocessable(message);
    default:  return status >= 500 ? ApiError.internal(message) : new ApiError(message, status);
  }
}

/**
 * Custom fetch client that automatically configures JSON headers
 * and ensures credential tokens pass along cleanly.
 */
export async function apiClient<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { bodyData, ...customConfig } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customConfig.headers as Record<string, string> | undefined),
  };

  const config: RequestInit = {
    ...customConfig,
    method: customConfig.method ?? "GET",
    headers,
    credentials: "same-origin", // Crucial: send along the token cookie container
  };

  if (bodyData) {
    config.body = JSON.stringify(bodyData);
  }

  const response = await fetch(endpoint, config);
  const data = (await response.json().catch(() => null)) as
    | { message?: string; error?: string }
    | null;

  if (!response.ok) {
    const message =
      data?.message ?? data?.error ?? response.statusText ?? "Request failed";
    throw toApiError(response.status, message);
  }

  return data as T;
}
