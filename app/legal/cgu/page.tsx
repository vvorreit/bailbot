"use client";

import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans p-6 md:p-20">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 font-bold mb-10 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
        </Link>
        <div className="flex items-center gap-4 mb-2 text-blue-600">
          <Scale className="w-12 h-12" />
          <h1 className="text-4xl font-black">Conditions Générales d'Utilisation</h1>
        </div>
        <p className="text-slate-400 text-sm mb-10">Dernière mise à jour : mars 2026</p>

        <div className="prose prose-slate max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">1. Objet du service</h2>
            <p className="text-slate-600">
              BailBot est un outil d'assistance à la gestion locative destiné aux propriétaires bailleurs particuliers. Il repose sur une
              technologie de reconnaissance de caractères (OCR) afin de faciliter le pré-remplissage de
              formulaires à partir de documents tels que des dossiers locataires.
              BailBot ne se substitue en aucun cas au jugement du propriétaire bailleur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">2. Acceptation des conditions</h2>
            <p className="text-slate-600">
              L'utilisation du service BailBot vaut acceptation pleine et entière des présentes Conditions Générales
              d'Utilisation (CGU). Si l'utilisateur n'accepte pas ces conditions, il doit cesser immédiatement
              d'utiliser le service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">3. Responsabilité de l'utilisateur</h2>
            <p className="text-slate-600 font-bold bg-amber-50 p-4 border-l-4 border-amber-400">
              L'utilisateur est seul responsable de l'exactitude des données injectées dans son logiciel métier.
              La technologie OCR peut commettre des erreurs de lecture (ex : confusion entre 0 et O, inversion
              de chiffres, lecture partielle). L'utilisateur DOIT systématiquement vérifier l'intégralité des champs
              avant toute validation de fiche client ou acte professionnel.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">4. Limitation de responsabilité d'BailBot</h2>
            <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl space-y-3">
              <p className="text-slate-700 font-bold text-sm uppercase tracking-wide">Clause essentielle — à lire attentivement</p>
              <p className="text-slate-700">
                <strong>BailBot est un outil d'aide à la saisie, non un logiciel certifié.</strong> Dans les limites
                permises par la loi applicable, BailBot, ses dirigeants, employés, partenaires et prestataires
                déclinent expressément toute responsabilité pour :
              </p>
              <ul className="list-disc list-inside text-slate-700 space-y-1.5 pl-2">
                <li>toute erreur, omission ou inexactitude dans les données extraites par l'OCR ;</li>
                <li>tout préjudice direct ou indirect résultant de l'utilisation ou de l'impossibilité d'utiliser le service ;</li>
                <li>toute perte financière, commerciale, de données ou de clientèle liée à une erreur de saisie ;</li>
                <li>toute réclamation ou litige entre l'utilisateur et ses propres clients ;</li>
                <li>toute interruption, suspension ou indisponibilité temporaire du service ;</li>
                <li>tout dommage résultant d'une intrusion informatique, d'un virus ou d'une défaillance technique ;</li>
                <li>tout préjudice lié à la perte ou à la corruption de données.</li>
              </ul>
              <p className="text-slate-700">
                La responsabilité d'BailBot, si elle venait à être retenue par une décision judiciaire définitive,
                serait en tout état de cause <strong>strictement limitée au montant des sommes effectivement
                versées par l'utilisateur au titre de son abonnement au cours des trois (3) derniers mois
                précédant le fait générateur du dommage.</strong>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">5. Exclusion de garantie</h2>
            <p className="text-slate-600">
              Le service BailBot est fourni <strong>« en l'état »</strong> et <strong>« tel que disponible »</strong>,
              sans garantie d'aucune sorte, expresse ou implicite. BailBot ne garantit pas que le service sera
              ininterrompu, exempt d'erreurs, sécurisé ou que les résultats obtenus seront exacts ou fiables.
              Aucune garantie n'est donnée quant à l'adéquation du service à un usage particulier.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">6. Données personnelles et RGPD</h2>
            <p className="text-slate-600">
              L'utilisateur est responsable de traitement au sens du RGPD pour les données de ses propres clients
              qu'il traite via BailBot. BailBot agit en qualité de sous-traitant et s'engage à ne pas utiliser ces
              données à d'autres fins que la fourniture du service. L'utilisateur s'engage à respecter la réglementation
              applicable en matière de protection des données personnelles, notamment à informer ses clients du
              traitement effectué. Pour plus de détails, consulter notre{" "}
              <Link href="/legal/confidentialite" className="text-blue-600 underline">politique de confidentialité</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">7. Propriété intellectuelle</h2>
            <p className="text-slate-600">
              Le logiciel BailBot, l'extension navigateur, l'interface utilisateur, les algorithmes, marques et logos
              sont la propriété exclusive d'BailBot. Toute reproduction, représentation, modification, adaptation,
              traduction, extraction, réutilisation totale ou partielle, par quelque procédé que ce soit, est
              strictement interdite sans autorisation écrite préalable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">8. Tarifs et abonnements</h2>
            <p className="text-slate-600">
              L'accès au service est proposé selon des formules d'abonnement détaillées sur la page tarifaire.
              Tout mois entamé est dû intégralement. La résiliation est possible à tout moment depuis l'espace
              client, sans frais, avec effet à la fin de la période en cours. BailBot se réserve le droit de modifier
              ses tarifs avec un préavis de 30 jours par email.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">9. Suspension et résiliation</h2>
            <p className="text-slate-600">
              BailBot se réserve le droit de suspendre ou résilier l'accès au service, sans préavis ni indemnité,
              en cas de violation des présentes CGU, d'utilisation frauduleuse, abusive ou contraire à l'ordre
              public, ou de non-paiement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">10. Modification des CGU</h2>
            <p className="text-slate-600">
              BailBot se réserve le droit de modifier les présentes CGU à tout moment. L'utilisateur sera informé
              par email ou via le service. La poursuite de l'utilisation du service après notification vaut acceptation
              des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">11. Droit applicable et juridiction</h2>
            <p className="text-slate-600">
              Les présentes CGU sont soumises au droit français. En cas de litige, et à défaut de résolution amiable,
              les tribunaux compétents du ressort du siège social d'BailBot seront seuls compétents.
              Pour tout contact : <a href="mailto:contact@bailbot.fr" className="text-blue-600 underline">contact@bailbot.fr</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
