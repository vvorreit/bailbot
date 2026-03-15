export const dynamic = "force-dynamic";

import { getBienDetails } from "@/app/actions/bien-details";
import { redirect } from "next/navigation";
import FicheBienClient from "./FicheBienClient";

export default async function FicheBienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getBienDetails(id);

  if (!data) redirect("/dashboard");

  return <FicheBienClient data={data} />;
}
