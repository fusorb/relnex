// src/app/api/auth/register/route.ts
//
// Auth is delegated to Sg. Relnex provisions the User record after identity creation.

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { flowExecutor } from "@/core/flows";
import { registerFlow } from "@/domains/auth";

export const POST = handleApiRoute(async (req: NextRequest) => {
  const body = await req.json();

  const result = await flowExecutor.run(registerFlow, body, {
    userId: null,
    identityId: null,
    tenantId: null,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  }, { transaction: false });

  return NextResponse.json(
    { success: true, data: { userId: result.userId } },
    { status: 201 },
  );
});
