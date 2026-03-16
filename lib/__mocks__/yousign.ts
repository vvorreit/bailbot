/**
 * Mock Yousign API for testing — replaces @/lib/yousign
 */

import type { CreateSignatureResult, SignatureRequestStatus } from "@/lib/yousign";

export async function createSignatureRequest(
  _document: Buffer,
  _signerEmail: string,
  _signerName: string,
  _signerPhone?: string
): Promise<CreateSignatureResult> {
  return {
    signatureRequestId: "test-id-123",
    signerUrl: "https://yousign.com/sign/test",
  };
}

export async function getSignatureRequestStatus(
  _id: string
): Promise<SignatureRequestStatus> {
  return {
    status: "done",
    signedAt: new Date().toISOString(),
    downloadUrl: "https://api.yousign.app/v3/signature_requests/test-id-123/documents/download",
  };
}
