// src/app/api/resources/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { ResourceService } from "@/domains/resources";
import { ApiError } from "@/lib/errors";
import { z } from "zod";

const bulkOperationSchema = z
  .object({
    ids: z
      .array(z.string().uuid("Each resource ID must be a valid UUID"))
      .min(1, "Provide at least one resource ID"),
    action: z.enum(["DELETE", "ARCHIVE"]),
  })
  .strict();

const resourceService = new ResourceService();

export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const tenantId = req.headers.get("x-tenant-id") ?? null;

  const body = await req.json();
  const parsed = bulkOperationSchema.safeParse(body);

  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0].message);
  }

  const { ids, action } = parsed.data;

  const results = {
    successful: [] as string[],
    failed: [] as { id: string; error: string }[],
  };

  // Sequential execution to respect per-resource ownership and lifecycle guards
  for (const id of ids) {
    try {
      if (action === "DELETE") {
        await resourceService.deleteResource(id, session.userId, tenantId);
      } else if (action === "ARCHIVE") {
        await resourceService.archiveResource(id, session.userId, tenantId);
      }
      results.successful.push(id);
    } catch (err: unknown) {
      results.failed.push({
        id,
        error: err instanceof Error ? err.message : "Operation failed",
      });
    }
  }

  const successCount = results.successful.length;
  const failCount = results.failed.length;

  return NextResponse.json(
    {
      success: failCount === 0,
      message: `Bulk processing complete. ${successCount} succeeded, ${failCount} failed.`,
      data: results,
    },
    { status: failCount > 0 ? 207 : 200 },
  );
});
