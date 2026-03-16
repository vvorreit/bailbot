export const dynamic = "force-dynamic";

import PortailLocataireClient from "./PortailLocataireClient";

export default async function PortailLocatairePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PortailLocataireClient token={token} />;
}
