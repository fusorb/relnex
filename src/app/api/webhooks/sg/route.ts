import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/core/db";
import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * SovGrant -> Relnex webhook handler.
 * Mounted at: POST /api/webhooks/sg
 *
 * SovGrant sends lifecycle events via its WebhookEvent outbox/worker. This
 * handler keeps the Relnex User in sync.
 *
 * Secured by HMAC-SHA256 signature verification and made idempotent by an
 * event ledger, so redelivered or out-of-order events are processed at most once.
 *
 * Accepts two signature schemes for compatibility:
 *  - Worker scheme (current): X-SovGrant-Signature = sha256=HMAC(secret, `${ts}.${body}`)
 *    with X-SovGrant-Timestamp (replay-resistant).
 *  - Legacy scheme: x-sg-signature = sha256=HMAC(secret, body).
 */

const WEBHOOK_SECRET =
  process.env.SG_WEBHOOK_SECRET ?? process.env.WEBHOOK_SIGNING_SECRET;

function safeEqual(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function verifySignature(
  body: string,
  signature: string,
  timestamp?: string | null,
): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;

  // Current SovGrant worker: sha256=HMAC(secret, `${timestamp}.${body}`)
  if (timestamp) {
    const expected =
      "sha256=" +
      createHmac("sha256", WEBHOOK_SECRET)
        .update(`${timestamp}.${body}`)
        .digest("hex");
    if (safeEqual(signature, expected)) return true;
  }

  // Legacy/internal: sha256=HMAC(secret, body)
  const legacy =
    "sha256=" +
    createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
  return safeEqual(signature, legacy);
}

interface SgWebhookBody {
  id?: string;
  eventType: string;
  identityId?: string;
  payload: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature =
    req.headers.get("x-sovgrant-signature") ??
    req.headers.get("x-sg-signature") ??
    "";
  const timestamp = req.headers.get("x-sovgrant-timestamp");

  if (!verifySignature(rawBody, signature, timestamp)) {
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
