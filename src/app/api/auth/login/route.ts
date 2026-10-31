// src/app/api/auth/login/route.ts
//
// Sg issues the tokens. Relnex just passes them through to the client.
// Auth is delegated to Sg via flows (matching Sg's module pattern).

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { flowExecutor } from "@/core/flows";
import { loginFlow } from "@/domains/auth";
import { LoginDto } from "@/domains/auth/auth.dto";
import { setAuthCookies } from "@/core/auth";

export const POST = handleApiRoute(async (req: NextRequest) => {
  const body = await req.json();

  // Auth flows make external HTTP calls to Sg - no DB transaction needed
  const result = await flowExecutor.run(loginFlow, body, {
    userId: null,
    identityId: null,
    tenantId: null,
    ip: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  }, { transaction: false });

  if (result.requiresMfa) {
    return NextResponse.json({
      success: true,
      data: {
        requiresMfa: true,
        sessionId: result.sessionId,
        mfaTypes: result.mfaTypes,
      },
    });
  }

  await setAuthCookies({
    accessToken: result.accessToken!,
    refreshToken: result.refreshToken!,
    sessionId: result.sessionId!,
    expiresIn: result.expiresIn!,
  });

  return NextResponse.json({
    success: true,
    data: {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      sessionId: result.sessionId,
      expiresIn: result.expiresIn,
    },
  });
});
