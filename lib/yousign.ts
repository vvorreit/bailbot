/**
 * Yousign API v3 integration — Signature électronique avancée eIDAS
 * https://developers.yousign.com/
 */

const YOUSIGN_BASE_URLS = {
  sandbox: "https://api-sandbox.yousign.app/v3",
  production: "https://api.yousign.app/v3",
} as const;

function getBaseUrl(): string {
  const env = (process.env.YOUSIGN_ENV || "sandbox") as keyof typeof YOUSIGN_BASE_URLS;
  return YOUSIGN_BASE_URLS[env] || YOUSIGN_BASE_URLS.sandbox;
}

function getApiKey(): string {
  const key = process.env.YOUSIGN_API_KEY;
  if (!key) throw new Error("YOUSIGN_API_KEY manquant");
  return key;
}

async function yousignFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Yousign API ${res.status}: ${body}`);
  }
  return res;
}

export interface CreateSignatureResult {
  signatureRequestId: string;
  signerUrl: string;
}

/**
 * Create a Yousign signature request with a document and a signer.
 */
export async function createSignatureRequest(
  document: Buffer,
  signerEmail: string,
  signerName: string,
  signerPhone?: string
): Promise<CreateSignatureResult> {
  /* Step 1: Create the signature request */
  const srRes = await yousignFetch("/signature_requests", {
    method: "POST",
    body: JSON.stringify({
      name: `Signature — ${signerName}`,
      delivery_mode: "email",
      timezone: "Europe/Paris",
    }),
  });
  const sr = await srRes.json();
  const signatureRequestId: string = sr.id;

  /* Step 2: Upload the document */
  const formData = new FormData();
  formData.append("file", new Blob([new Uint8Array(document)], { type: "application/pdf" }), "document.pdf");
  formData.append("nature", "signable_document");

  const docRes = await fetch(
    `${getBaseUrl()}/signature_requests/${signatureRequestId}/documents`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${getApiKey()}` },
      body: formData,
    }
  );
  if (!docRes.ok) {
    const body = await docRes.text();
    throw new Error(`Yousign upload document ${docRes.status}: ${body}`);
  }
  const doc = await docRes.json();

  /* Step 3: Add signer */
  const signerBody: Record<string, unknown> = {
    info: {
      first_name: signerName.split(" ")[0] || signerName,
      last_name: signerName.split(" ").slice(1).join(" ") || signerName,
      email: signerEmail,
      locale: "fr",
    },
    signature_level: "electronic_signature",
    fields: [
      {
        document_id: doc.id,
        type: "signature",
        page: 1,
        x: 77,
        y: 581,
        width: 222,
        height: 104,
      },
    ],
  };

  if (signerPhone) {
    (signerBody.info as Record<string, unknown>).phone_number = {
      country_code: "+33",
      number: signerPhone,
    };
  }

  const signerRes = await yousignFetch(
    `/signature_requests/${signatureRequestId}/signers`,
    {
      method: "POST",
      body: JSON.stringify(signerBody),
    }
  );
  const signer = await signerRes.json();

  /* Step 4: Activate the signature request */
  await yousignFetch(`/signature_requests/${signatureRequestId}/activate`, {
    method: "POST",
  });

  return {
    signatureRequestId,
    signerUrl: signer.signature_link || "",
  };
}

export interface SignatureRequestStatus {
  status: string;
  signedAt?: string;
  downloadUrl?: string;
}

/**
 * Retrieve the status of an existing Yousign signature request.
 */
export async function getSignatureRequestStatus(
  id: string
): Promise<SignatureRequestStatus> {
  const res = await yousignFetch(`/signature_requests/${id}`);
  const data = await res.json();

  let downloadUrl: string | undefined;
  if (data.status === "done") {
    downloadUrl = `${getBaseUrl()}/signature_requests/${id}/documents/download`;
  }

  return {
    status: data.status,
    signedAt: data.completed_at || undefined,
    downloadUrl,
  };
}
