export const dynamic = "force-dynamic";

import { getAllDiagnosticsForUser } from "@/app/actions/diagnostics-gestion";
import DiagnosticsOverviewClient from "./DiagnosticsOverviewClient";

export default async function DiagnosticsPage() {
  const data = await getAllDiagnosticsForUser();
  return <DiagnosticsOverviewClient data={data} />;
}
