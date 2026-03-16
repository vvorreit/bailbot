/**
 * Page d'instruction partenaire DossierFacile Connect
 *
 * Affichée quand :
 * - Les env vars DOSSIERFACILE_* ne sont pas encore configurées
 * - L'agent souhaite activer DossierFacile Connect sur sa plateforme
 *
 * En attendant les credentials officiels, l'OCR local fonctionne normalement.
 */

import Link from "next/link";

export const metadata = {
  title: "DossierFacile Connect — BailBot",
  description: "Activez l'intégration DossierFacile Connect sur BailBot",
};

export default function DossierFacileConnectPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          {/* Logo République Française simplifié */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#003189] shadow-lg mb-2">
            <span className="text-3xl">🇫🇷</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            DossierFacile Connect
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            En attente de validation partenaire DossierFacile
          </p>
        </div>

        {/* Status card */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-bold text-amber-900 text-sm">En attente de credentials</p>
              <p className="text-amber-700 text-xs">
                L'intégration DossierFacile Connect est prête techniquement,
                mais nécessite des credentials partenaire officiels.
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="font-black text-slate-800 text-sm uppercase tracking-widest">
            Comment obtenir les credentials
          </h2>

          <ol className="space-y-4 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-[#003189] text-white rounded-full flex items-center justify-center text-xs font-black">
                1
              </span>
              <div>
                <p className="font-semibold text-slate-800">Contacter l'équipe DossierFacile</p>
                <p className="text-xs mt-0.5">
                  Envoyez un email à{" "}
                  <a
                    href="mailto:contact@dossierfacile.logement.gouv.fr"
                    className="text-[#003189] font-semibold hover:underline"
                  >
                    contact@dossierfacile.logement.gouv.fr
                  </a>{" "}
                  en précisant que vous souhaitez devenir partenaire DossierFacile Connect.
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-[#003189] text-white rounded-full flex items-center justify-center text-xs font-black">
                2
              </span>
              <div>
                <p className="font-semibold text-slate-800">Informations à fournir</p>
                <ul className="text-xs mt-1 space-y-1 list-disc list-inside text-slate-500">
                  <li>Nom de l'organisation : BailBot</li>
                  <li>URL de la plateforme : https://bailbot.fr</li>
                  <li>
                    Redirect URI :{" "}
                    <code className="bg-slate-100 px-1 rounded text-[10px]">
                      https://bailbot.fr/api/auth/dossierfacile/callback
                    </code>
                  </li>
                  <li>Usage prévu : pré-remplissage dossier locataire</li>
                </ul>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="shrink-0 w-6 h-6 bg-[#003189] text-white rounded-full flex items-center justify-center text-xs font-black">
                3
              </span>
              <div>
                <p className="font-semibold text-slate-800">Configurer les variables d'environnement</p>
                <p className="text-xs mt-0.5 text-slate-500">
                  Une fois les credentials reçus, ajoutez-les dans votre <code className="bg-slate-100 px-1 rounded text-[10px]">.env.local</code> :
                </p>
                <pre className="mt-2 bg-slate-900 text-green-400 text-[10px] p-3 rounded-xl overflow-x-auto font-mono">
{`DOSSIERFACILE_CLIENT_ID=votre_client_id
DOSSIERFACILE_CLIENT_SECRET=votre_secret
NEXT_PUBLIC_DOSSIERFACILE_ENABLED=true`}
                </pre>
              </div>
            </li>
          </ol>
        </div>

        {/* OCR fallback info */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">✅</span>
          <div>
            <p className="font-bold text-emerald-900 text-sm">L'OCR local fonctionne normalement</p>
            <p className="text-emerald-700 text-xs mt-0.5">
              En attendant les credentials DossierFacile, déposez les documents directement
              sur le dashboard — BailBot les analyse avec son moteur OCR intégré.
            </p>
          </div>
        </div>

        {/* Back to dashboard */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors"
          >
            ← Retour au dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
