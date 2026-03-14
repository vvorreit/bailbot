export const dynamic = "force-dynamic";

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { acceptInvite } from "@/app/actions/team";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function JoinPage({ params }: Props) {
  const { token } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    // Redirect to login with callbackUrl
    redirect(`/auth/signin?callbackUrl=/join/${token}`);
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { team: true }
  });

  if (!invitation || invitation.expires < new Date()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Invitation invalide</h1>
          <p className="text-gray-500">Ce lien a expiré ou n'existe pas.</p>
        </div>
      </div>
    );
  }

  // Server Action call within a client component wrapper or form?
  // Since this is a server component, I can use a form action directly.
  
  async function handleJoin() {
    "use server";
    try {
      await acceptInvite(token);
    } catch (e) {
      // Error handling via redirect or throw
      console.error(e);
      // In a real app, we'd handle errors better.
    }
    redirect("/dashboard/team");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
          {invitation.team.name.substring(0, 2).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitation d'équipe</h1>
        <p className="text-gray-500 mb-8">
          Vous avez été invité à rejoindre <strong>{invitation.team.name}</strong> en tant que {invitation.role}.
        </p>

        <form action={handleJoin}>
          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-blue-200 shadow-lg"
          >
            Rejoindre l'équipe
          </button>
        </form>
        
        <p className="mt-6 text-xs text-gray-400">
          En rejoignant cette équipe, l'administrateur aura accès à votre activité liée à l'équipe.
        </p>
      </div>
    </div>
  );
}
