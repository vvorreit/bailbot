import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

/**
 * Verify Yousign webhook HMAC signature (X-Yousign-Signature-256)
 */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
  const secret = process.env.YOUSIGN_WEBHOOK_SECRET;
  if (!secret) return false; /* no secret configured → fail secure */
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Yousign Webhook — receives signature events (signed, refused, expired)
 * Configure this URL in the Yousign dashboard: /api/webhooks/yousign
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  /* HMAC verification */
  const signature = req.headers.get("x-yousign-signature-256");
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);

  const eventType: string = body.event_name || body.event || "";
  const signatureRequestId: string =
    body.data?.signature_request?.id ||
    body.data?.id ||
    "";

  if (!signatureRequestId) {
    return NextResponse.json({ error: "Missing signature_request id" }, { status: 400 });
  }

  const signatureRequest = await prisma.signatureRequest.findFirst({
    where: { yousignRequestId: signatureRequestId },
  });

  if (!signatureRequest) {
    return NextResponse.json({ ok: true, skipped: "unknown_request" });
  }

  if (
    eventType === "signature_request.done" ||
    eventType === "signer.done"
  ) {
    await prisma.signatureRequest.update({
      where: { id: signatureRequest.id },
      data: {
        yousignStatus: "done",
        signedAt: new Date(),
        certificatUrl: `https://api.yousign.app/v3/signature_requests/${signatureRequestId}/documents/download`,
      },
    });
  } else if (
    eventType === "signature_request.declined" ||
    eventType === "signer.declined"
  ) {
    await prisma.signatureRequest.update({
      where: { id: signatureRequest.id },
      data: { yousignStatus: "refused" },
    });
  } else if (eventType === "signature_request.expired") {
    await prisma.signatureRequest.update({
      where: { id: signatureRequest.id },
      data: { yousignStatus: "expired" },
    });
  }

  /* Audit log */
  try {
    await prisma.auditLog.create({
      data: {
        userId: signatureRequest.userId,
        action: "YOUSIGN_WEBHOOK",
        details: `event=${eventType} signatureRequestId=${signatureRequestId}`,
      },
    });
  } catch {
    /* non-blocking */
  }

  return NextResponse.json({ ok: true, event: eventType });
}
