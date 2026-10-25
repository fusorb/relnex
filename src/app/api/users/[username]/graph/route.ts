// src/app/api/users/[username]/graph/route.ts
// Returns the user's public resource nodes and their directed relations.
// Only PUBLIC resources appear as nodes; relations are edges between those nodes.
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { UserService } from "@/domains/users";

interface RouteParams { params: { username: string } }

const userService = new UserService();

export const GET = handleApiRoute(async (req: NextRequest, { params }: RouteParams) => {
  const graph = await userService.getUserKnowledgeGraph(params.username);
  return NextResponse.json({ success: true, data: graph });
});