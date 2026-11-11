import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/db";
import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * Sg -> Relnex webhook handler.
 * Mounted at: POST /api/webhooks/sg
 *
 * Sg sends lifecycle events (IDENTITY_SUSPENDED, IDENTITY_DELETED etc.)
 * via its WebhookEvent outbox. This handler keeps the Relnex User in sync.
 *
 * Secured by HMAC-SHA256 signature verification and made idempotent by an
 * event ledger, so redelivered or out-of-order events are processed at most once.
 */

const WEBHOOK_SECRET = process.env.SG_WEBHOOK_SECRET!;

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

interface SgWebhookBody {
  id?: string;
  eventType: string;
  identityId?: string;
  payload: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-sg-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: SgWebhookBody;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Idempotency: claim the event id (or a body hash when the sender omits one).
  // skipDuplicates makes this a no-op for a replay; count === 0 means we've seen it.
  const eventId = event.id ?? createHash("sha256").update(rawBody).digest("hex");
  const claim = await prisma.webhookEvent.createMany({
    data: [{ id: eventId, source: "sg" }],
    skipDuplicates: true,
  });
  if (claim.count === 0) {
    return NextResponse.json({ received: true, duplicate: true });
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
      // Sg notifies us of new registrations so we can pre-provision User.
      // Optional: requireOnboarded also lazily provisions on first login.
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
      // Unknown event - ignore, return 200 so Sg does not retry
      break;
  }

  return NextResponse.json({ received: true });
}
