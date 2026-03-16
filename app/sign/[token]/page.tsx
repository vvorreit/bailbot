export const dynamic = "force-dynamic";

import SignPageClient from "./SignPageClient";

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SignPageClient token={token} />;
}
