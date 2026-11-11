// Client: api-client maps HTTP status to the correct ApiError (was always 500).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./api-client";
import { ApiError } from "@/lib/errors/api-error";

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("apiClient", () => {
  it("returns the parsed JSON body on success", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await expect(apiClient("/x")).resolves.toEqual({ ok: true });
  });

  it("sends a JSON body and defaults to credentials: same-origin", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await apiClient("/x", { method: "POST", bodyData: { a: 1 } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
    expect(init.credentials).toBe("same-origin");
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json"
    );
  });

  it.each([
    [400, "BAD_REQUEST"],
    [401, "UNAUTHORIZED"],
    [403, "FORBIDDEN"],
    [404, "NOT_FOUND"],
    [409, "CONFLICT"],
    [422, "UNPROCESSABLE"],
    [500, "INTERNAL_SERVER_ERROR"],
  ])("maps HTTP %i to ApiError %s", async (status, code) => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "nope" }, status));

    const err = await apiClient("/x").catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).statusCode).toBe(status);
    expect((err as ApiError).code).toBe(code);
    expect((err as ApiError).message).toBe("nope");
  });

  it("collapses any 5xx to ApiError.internal (500)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "gateway" }, 502));

    const err = (await apiClient("/x").catch((e: unknown) => e)) as ApiError;

    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("preserves an unrecognized non-5xx status", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ message: "teapot" }, 418));

    const err = (await apiClient("/x").catch((e: unknown) => e)) as ApiError;

    expect(err.statusCode).toBe(418);
  });

  it("survives an empty/non-JSON error body", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 503 }));

    const err = (await apiClient("/x").catch((e: unknown) => e)) as ApiError;

    expect(err).toBeInstanceOf(ApiError);
  });
});
