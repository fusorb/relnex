import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/db";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Arc-id → Arcbase webhook handler.
 * Mounted at: POST /api/webhooks/arcid
 *
 * Arc-id sends lifecycle events (IDENTITY_SUSPENDED, IDENTITY_DELETED etc.)
 * via its WebhookEvent outbox. This handler keeps arcbase User in sync.
 *
 * Secured by HMAC-SHA256 signature verification.
 */

const WEBHOOK_SECRET = process.env.ARCID_WEBHOOK_SECRET!;

function verifySignature(body: string, signature: string): boolean {
  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expected}`)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-arcid-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { eventType: string; identityId?: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  switch (event.eventType) {
    case "IDENTITY_SUSPENDED":
    case "IDENTITY_DELETED": {
      if (event.identityId) {
        await prisma.user.updateMany({
          where: { identityId: event.identityId },
          data: { deletedAt: new Date() },
        });
      }
      break;
    }

    case "USER_REGISTERED": {
      // arc-id notifies us of new registrations so we can pre-provision User
      // This is optional — withUser() above also handles lazy provisioning
      if (event.identityId) {
        const existing = await prisma.user.findUnique({
          where: { identityId: event.identityId },
        });
        if (!existing) {
          await prisma.user.create({
            data: {
              identityId: event.identityId,
              username: `user_${event.identityId.slice(0, 8)}`,
            },
          });
        }
      }
      break;
    }

    default:
      // Unknown event — ignore, return 200 so arc-id doesn't retry
      break;
  }

  return NextResponse.json({ received: true });
}
