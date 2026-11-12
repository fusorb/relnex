// src/app/api/graph/route.ts
// The signed-in user's knowledge graph (nodes + typed edges). Scoped to the
// verified tenant; edges never dangle (see UserService.assembleGraph).
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { UserService } from "@/domains/users";

const userService = new UserService();

export const GET = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);
  const tenantId = req.headers.get("x-tenant-id") ?? null;
  const graph = await userService.getKnowledgeGraph(session.userId, tenantId);
  return NextResponse.json({ success: true, data: graph });
});
