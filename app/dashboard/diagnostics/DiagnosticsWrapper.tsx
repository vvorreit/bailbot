"use client";

import { useEffect, useState } from "react";
import DiagnosticsOverviewClient from "./DiagnosticsOverviewClient";

export default function DiagnosticsWrapper() {
  const [data, setData] = useState<any[] | null>(null);

  useEffect(() => {
    import("@/app/actions/diagnostics-gestion").then(({ getAllDiagnosticsForUser }) => {
      getAllDiagnosticsForUser().then(setData).catch(() => setData([]));
    });
  }, []);

  if (!data) return <div className="p-8 text-center text-slate-400">Chargement des diagnostics…</div>;

  return <DiagnosticsOverviewClient data={data} />;
}
