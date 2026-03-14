"use client";

import Link from "next/link";
import { ArrowLeft, Landmark } from "lucide-react";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-6 md:p-20">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold mb-10 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>
        <div className="flex items-center gap-4 mb-8 text-blue-600">
           <Landmark className="w-12 h-12" />
           <h1 className="text-4xl font-black">Mentions Légales</h1>
        </div>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">1. Éditeur du site</h2>
            <p className="text-slate-600">
              Le site <strong>BailBot.fr</strong> est édité par : <br />
              <span className="font-bold">BailBot SAS</span> (en cours de création)<br />
              Siège social : [Votre Adresse], Lyon, France<br />
              Directeur de la publication : Vincent VORREITER
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">2. Hébergement</h2>
            <p className="text-slate-600">
              Le site est hébergé par : <br />
              <strong>Vercel Inc.</strong><br />
              440 N Barranca Ave #4133<br />
              Covina, CA 91723, USA
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">3. Contact</h2>
            <p className="text-slate-600">
              Pour toute question, vous pouvez nous contacter à l'adresse suivante : <br />
              <strong>contact@bailbot.fr</strong>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
