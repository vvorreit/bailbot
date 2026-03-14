import { getTeamDetails } from "@/app/actions/team";
import TeamSettings from "@/components/TeamSettings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  const team = await getTeamDetails();

  return <TeamSettings initialTeam={team as any} />;
}
