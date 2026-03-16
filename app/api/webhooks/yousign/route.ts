import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Yousign Webhook — receives signature events (signed, refused, expired)
 * Configure this URL in the Yousign dashboard: /api/webhooks/yousign
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

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

  return NextResponse.json({ ok: true, event: eventType });
}
