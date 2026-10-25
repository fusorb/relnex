import type { PrismaClient, Prisma } from "@prisma-client";

export type DbClient = Prisma.TransactionClient | PrismaClient;

export interface FlowContext {
  requestId:  string;
  userId:     string | null; // Relnex User.id (uuid7) — null for public routes
  identityId: string | null; // Sg Identity.id (cuid) — from JWT sub, null for public routes
  tenantId:   string | null; // from JWT tid claim
  ip?:        string;
  userAgent?: string;
  db:         DbClient;
}
