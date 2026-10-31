// src/app/api/uploads/presign/route.ts
// FIX: UploadService was instantiated inside the handler on every request.
// Moved to module scope - constructor validates env vars once at startup,
// failing fast rather than on the first upload attempt.
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { UploadService } from "@/domains/uploads/upload.service";
import { requestUploadSchema } from "@/domains/uploads/upload.dto";
import { ApiError } from "@/lib/errors";

const uploadService = new UploadService();

export const POST = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const body = await req.json();

  const parsed = requestUploadSchema.safeParse(body);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0].message);
  }

  const payload = await uploadService.generatePresignedUploadTarget(
    session.userId,
    parsed.data,
  );

  return NextResponse.json(
    {
      success: true,
      message: "Presigned upload URL generated. Valid for 15 minutes.",
      data: payload,
    },
    { status: 200 },
  );
});