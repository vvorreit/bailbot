"use client";

import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-6 md:p-20">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold mb-10 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>
        <div className="flex items-center gap-4 mb-8 text-blue-600">
           <Shield className="w-12 h-12" />
           <h1 className="text-4xl font-black">Politique de Confidentialité</h1>
        </div>
        
        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">1. Principe de "Privacy-by-Design"</h2>
            <p className="text-slate-600 leading-relaxed">
              BailBot a été conçu pour respecter scrupuleusement le secret médical et la vie privée de vos patients. 
              <strong> Contrairement à d'autres solutions, BailBot ne stocke, ne voit et ne transmet aucune donnée de santé identifiable sur ses serveurs.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">2. Traitement local des données (OCR)</h2>
            <p className="text-slate-600 leading-relaxed">
              L'analyse des documents (ordonnances, cartes mutuelles) est effectuée localement dans le navigateur de l'utilisateur via la technologie Tesseract.js. 
              Les images déposées ne quittent jamais votre ordinateur. Elles sont transformées en texte instantanément et les fichiers originaux ne sont jamais enregistrés.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">3. Données collectées</h2>
            <p className="text-slate-600 leading-relaxed">
              Nous collectons uniquement les données strictement nécessaires au fonctionnement du service :
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Compte utilisateur</strong> : Email et mot de passe (si création de compte).</li>
              <li><strong>Paiement</strong> : Les informations de facturation sont gérées exclusivement par Stripe.</li>
              <li><strong>Compteur d'usage</strong> : Le nombre de clients traités pour le respect des quotas de l'offre gratuite.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">4. Droits des utilisateurs</h2>
            <p className="text-slate-600 leading-relaxed">
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données de compte. Pour toute demande, contactez-nous à : <span className="font-bold">contact@bailbot.fr</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
