import { ApiError } from "@/lib/errors";

export interface FetchOptions extends Omit<RequestInit, 'credentials'> {
  bodyData?: Record<string, unknown>;
}

/**
 * Custom fetch client that automatically configures JSON headers
 * and ensures credential tokens pass along cleanly.
 */
export async function apiClient<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { bodyData, ...customConfig } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customConfig.headers as Record<string, string> | undefined,
  };

  const config: RequestInit = {
    ...customConfig,
    method: customConfig.method ?? "GET",
    headers,
    credentials: "same-origin", // Crucial: Commands the browser to send along the token cookie container
  };

  if (bodyData) {
    config.body = JSON.stringify(bodyData);
  }

  const response = await fetch(endpoint, config);
  const data = await response.json();

  if (!response.ok) {
    throw ApiError.internal(
      data.error ?? "An unexpected error occurred",
    );
  }

  return data as T;
}
