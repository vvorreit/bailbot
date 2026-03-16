import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    signatureRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/mailer", () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/yousign", () => ({
  createSignatureRequest: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { createSignatureRequest as yousignCreate } from "@/lib/yousign";
import { createSignatureRequest, getSignatureRequest, submitSignature } from "@/app/actions/signature";

describe("signature actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "user@test.com" },
    });

    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });
  });

  describe("createSignatureRequest", () => {
    it("should call Yousign when YOUSIGN_API_KEY is set", async () => {
      const origKey = process.env.YOUSIGN_API_KEY;
      process.env.YOUSIGN_API_KEY = "test-key";

      (yousignCreate as ReturnType<typeof vi.fn>).mockResolvedValue({
        signatureRequestId: "ys-123",
        signerUrl: "https://yousign.com/sign/ys-123",
      });

      (prisma.signatureRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "sr-1",
        token: "tok-abc",
      });

      const result = await createSignatureRequest("bail", "doc-1", "Jean Dupont", "jean@test.com");

      expect(yousignCreate).toHaveBeenCalledOnce();
      expect(result.success).toBe(true);

      process.env.YOUSIGN_API_KEY = origKey;
    });

    it("should fallback when YOUSIGN_API_KEY is absent", async () => {
      const origKey = process.env.YOUSIGN_API_KEY;
      delete process.env.YOUSIGN_API_KEY;

      (prisma.signatureRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "sr-2",
        token: "tok-def",
      });

      const result = await createSignatureRequest("bail", "doc-2", "Marie Martin", "marie@test.com");

      expect(yousignCreate).not.toHaveBeenCalled();
      expect(result.success).toBe(true);

      process.env.YOUSIGN_API_KEY = origKey;
    });

    it("should fallback when Yousign throws", async () => {
      const origKey = process.env.YOUSIGN_API_KEY;
      process.env.YOUSIGN_API_KEY = "test-key";

      (yousignCreate as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Yousign timeout"));

      (prisma.signatureRequest.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "sr-3",
        token: "tok-ghi",
      });

      const result = await createSignatureRequest("bail", "doc-3", "Pierre Leroy", "pierre@test.com");

      expect(result.success).toBe(true);
      // Should have been created with null yousignRequestId due to fallback
      const createCall = (prisma.signatureRequest.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(createCall.data.yousignRequestId).toBeNull();

      process.env.YOUSIGN_API_KEY = origKey;
    });
  });

  describe("getSignatureRequest", () => {
    it("should return null for expired token", async () => {
      (prisma.signatureRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "sr-1",
        token: "expired-tok",
        expiresAt: new Date(Date.now() - 1000), // expired
        documentType: "bail",
        documentId: "doc-1",
        signataire: "Test",
        email: "test@test.com",
        signedAt: null,
        signatureData: null,
        yousignStatus: null,
        certificatUrl: null,
      });

      const result = await getSignatureRequest("expired-tok");
      expect(result).toBeNull();
    });

    it("should return data for valid token", async () => {
      (prisma.signatureRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "sr-1",
        token: "valid-tok",
        expiresAt: new Date(Date.now() + 86400000),
        documentType: "bail",
        documentId: "doc-1",
        signataire: "Jean Dupont",
        email: "jean@test.com",
        signedAt: null,
        signatureData: null,
        yousignStatus: "ongoing",
        certificatUrl: null,
      });

      const result = await getSignatureRequest("valid-tok");
      expect(result).not.toBeNull();
      expect(result!.signataire).toBe("Jean Dupont");
      expect(result!.yousignStatus).toBe("ongoing");
    });
  });

  describe("submitSignature", () => {
    it("should throw for expired link", async () => {
      (prisma.signatureRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        token: "tok",
        expiresAt: new Date(Date.now() - 1000),
        signedAt: null,
      });

      await expect(submitSignature("tok", "sig-data")).rejects.toThrow("Lien expire");
    });

    it("should throw if already signed", async () => {
      (prisma.signatureRequest.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
        token: "tok",
        expiresAt: new Date(Date.now() + 86400000),
        signedAt: new Date(),
      });

      await expect(submitSignature("tok", "sig-data")).rejects.toThrow("Deja signe");
    });
  });
});

describe("Yousign webhook /api/webhooks/yousign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update status to done on signature_request.done", async () => {
    (prisma.signatureRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sr-1",
      yousignRequestId: "ys-123",
    });
    (prisma.signatureRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    // Import the webhook handler
    const { POST } = await import("@/app/api/webhooks/yousign/route");

    const req = new Request("http://localhost/api/webhooks/yousign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "signature_request.done",
        data: { signature_request: { id: "ys-123" } },
      }),
    });

    const res = await POST(req as any);
    const data = await res.json();

    expect(data.ok).toBe(true);
    expect(prisma.signatureRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ yousignStatus: "done" }),
      })
    );
  });

  it("should update status to refused on signature_request.declined", async () => {
    (prisma.signatureRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sr-1",
      yousignRequestId: "ys-456",
    });
    (prisma.signatureRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const { POST } = await import("@/app/api/webhooks/yousign/route");

    const req = new Request("http://localhost/api/webhooks/yousign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "signature_request.declined",
        data: { signature_request: { id: "ys-456" } },
      }),
    });

    const res = await POST(req as any);
    expect(prisma.signatureRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ yousignStatus: "refused" }),
      })
    );
  });

  it("should update status to expired on signature_request.expired", async () => {
    (prisma.signatureRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "sr-1",
      yousignRequestId: "ys-789",
    });
    (prisma.signatureRequest.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const { POST } = await import("@/app/api/webhooks/yousign/route");

    const req = new Request("http://localhost/api/webhooks/yousign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "signature_request.expired",
        data: { signature_request: { id: "ys-789" } },
      }),
    });

    const res = await POST(req as any);
    expect(prisma.signatureRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ yousignStatus: "expired" }),
      })
    );
  });

  it("should return 400 when signature_request id is missing", async () => {
    const { POST } = await import("@/app/api/webhooks/yousign/route");

    const req = new Request("http://localhost/api/webhooks/yousign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_name: "test", data: {} }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it("should skip unknown signature request gracefully", async () => {
    (prisma.signatureRequest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { POST } = await import("@/app/api/webhooks/yousign/route");

    const req = new Request("http://localhost/api/webhooks/yousign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_name: "signature_request.done",
        data: { signature_request: { id: "unknown-id" } },
      }),
    });

    const res = await POST(req as any);
    const data = await res.json();
    expect(data.skipped).toBe("unknown_request");
  });
});
