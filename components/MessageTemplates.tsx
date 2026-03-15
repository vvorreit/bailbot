"use client";

import { useState, useEffect } from "react";
import { X, Copy, Mail, Check, Edit3, RotateCcw } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  nom: string;
  objet: string;
  corps: string;
}

interface DossierActif {
  prenom?: string;
  adresse_bien?: string;
  loyer_cc?: string;
  montant_depot?: string;
  date_rdv?: string;
  pieces_manquantes?: string;
}

// ─── Templates par défaut ─────────────────────────────────────────────────────

const TEMPLATES_DEFAUT: Template[] = [
  {
    id: "dossier-incomplet",
    nom: "Dossier incomplet",
    objet: "Votre dossier de location — pièces manquantes",
    corps: `Bonjour {prenom},

Nous avons bien reçu votre dossier de candidature pour le logement situé au {adresse_bien}.

Cependant, il nous manque les pièces suivantes pour compléter votre dossier :

{pieces_manquantes}

Merci de nous les faire parvenir dans les plus brefs délais afin que nous puissions étudier votre candidature.

Cordialement,
L'équipe BailBot`,
  },
  {
    id: "dossier-valide",
    nom: "Dossier validé",
    objet: "Votre dossier a été validé — {adresse_bien}",
    corps: `Bonjour {prenom},

Nous avons le plaisir de vous informer que votre dossier de candidature pour le logement situé au {adresse_bien} a été validé.

Le loyer mensuel charges comprises est de {loyer_cc} €.
Le dépôt de garantie s'élève à {montant_depot} €.

Nous reviendrons vers vous très prochainement pour la suite du processus.

Cordialement,
L'équipe BailBot`,
  },
  {
    id: "candidature-non-retenue",
    nom: "Candidature non retenue",
    objet: "Suite à votre candidature — {adresse_bien}",
    corps: `Bonjour {prenom},

Nous vous remercions pour l'intérêt que vous avez porté au logement situé au {adresse_bien} et pour le temps consacré à la constitution de votre dossier.

Après examen de l'ensemble des candidatures reçues, nous sommes au regret de vous informer que votre candidature n'a pas été retenue.

Nous vous souhaitons bonne chance dans vos recherches.

Cordialement,
L'équipe BailBot`,
  },
  {
    id: "relance-documents",
    nom: "Relance documents (48h)",
    objet: "Relance — documents manquants pour {adresse_bien}",
    corps: `Bonjour {prenom},

Nous revenons vers vous concernant votre dossier de candidature pour le logement au {adresse_bien}.

Sans retour de votre part sous 48 heures avec les pièces manquantes, nous serons dans l'obligation de passer à la candidature suivante.

N'hésitez pas à nous contacter pour toute question.

Cordialement,
L'équipe BailBot`,
  },
  {
    id: "rdv-signature",
    nom: "RDV signature bail",
    objet: "Rendez-vous signature du bail — {adresse_bien}",
    corps: `Bonjour {prenom},

Félicitations ! Votre candidature pour le logement situé au {adresse_bien} a été acceptée.

Nous vous proposons un rendez-vous pour la signature du bail le {date_rdv}.

Merci de venir muni(e) :
- D'une pièce d'identité en cours de validité
- Du dépôt de garantie de {montant_depot} € (chèque ou virement)
- Des deux premiers mois de loyer ({loyer_cc} € chacun)

Cordialement,
L'équipe BailBot`,
  },
  {
    id: "demande-garant",
    nom: "Demande de garant",
    objet: "Demande de garant — {adresse_bien}",
    corps: `Bonjour {prenom},

Après étude de votre dossier pour le logement situé au {adresse_bien} (loyer CC : {loyer_cc} €), nous vous demandons de présenter un garant.

Le garant devra fournir :
- Sa pièce d'identité
- Ses 3 derniers bulletins de salaire
- Son dernier avis d'imposition
- Son contrat de travail

Merci de nous faire parvenir ce dossier garant rapidement.

Cordialement,
L'équipe BailBot`,
  },
  {
    id: "remise-cles",
    nom: "Remise des clés",
    objet: "Remise des clés — {adresse_bien}",
    corps: `Bonjour {prenom},

Nous sommes ravis de vous accueillir dans votre nouveau logement au {adresse_bien}.

La remise des clés est prévue le {date_rdv}.

Merci de vous présenter muni(e) de votre pièce d'identité. Un état des lieux d'entrée sera réalisé à cette occasion.

Bienvenue chez vous !

Cordialement,
L'équipe BailBot`,
  },
  {
    id: "quittance-loyer",
    nom: "Quittance de loyer",
    objet: "Quittance de loyer — {adresse_bien}",
    corps: `Bonjour {prenom},

Veuillez trouver ci-joint votre quittance de loyer pour le logement situé au {adresse_bien}.

Montant du loyer charges comprises : {loyer_cc} €

Ce règlement a bien été enregistré. Merci.

Cordialement,
L'équipe BailBot`,
  },
];

const LS_TEMPLATES_KEY = "bailbot_message_templates";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadTemplates(): Template[] {
  if (typeof window === "undefined") return TEMPLATES_DEFAUT;
  try {
    const raw = localStorage.getItem(LS_TEMPLATES_KEY);
    if (!raw) return TEMPLATES_DEFAUT;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 8) return parsed;
  } catch {}
  return TEMPLATES_DEFAUT;
}

function saveTemplates(templates: Template[]) {
  try {
    localStorage.setItem(LS_TEMPLATES_KEY, JSON.stringify(templates));
  } catch {}
}

function getDossierActif(): DossierActif {
  try {
    const raw = localStorage.getItem("bailbot_dossier_actif");
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function applyVariables(text: string, dossier: DossierActif): string {
  const vars: Record<string, string> = {
    prenom: dossier.prenom || "le/la candidat(e)",
    adresse_bien: dossier.adresse_bien || "[adresse du bien]",
    loyer_cc: dossier.loyer_cc || "[loyer CC]",
    montant_depot: dossier.montant_depot || "[dépôt de garantie]",
    date_rdv: dossier.date_rdv || "[date et heure]",
    pieces_manquantes: dossier.pieces_manquantes || "- Pièces à préciser",
  };
  return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

// ─── Composant ────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export default function MessageTemplates({ onClose }: Props) {
  const focusTrapRef = useFocusTrap(true);
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES_DEFAUT);
  const [selected, setSelected] = useState<Template | null>(null);
  const [dossier, setDossier] = useState<DossierActif>({});
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");

  useEffect(() => {
    setTemplates(loadTemplates());
    setDossier(getDossierActif());
  }, []);

  const preview = selected
    ? applyVariables(selected.corps, dossier)
    : "";

  const handleCopy = async () => {
    if (!preview) return;
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMailto = () => {
    if (!selected) return;
    const objet = encodeURIComponent(applyVariables(selected.objet, dossier));
    const corps = encodeURIComponent(preview);
    window.open(`mailto:?subject=${objet}&body=${corps}`, "_blank");
  };

  const handleSaveEdit = () => {
    if (!selected) return;
    const updated = templates.map((t) =>
      t.id === selected.id ? { ...t, corps: editDraft } : t
    );
    setTemplates(updated);
    saveTemplates(updated);
    setSelected({ ...selected, corps: editDraft });
    setEditing(false);
  };

  const handleReset = () => {
    const def = TEMPLATES_DEFAUT.find((t) => t.id === selected?.id);
    if (!def || !selected) return;
    const updated = templates.map((t) => (t.id === selected.id ? def : t));
    setTemplates(updated);
    saveTemplates(updated);
    setSelected(def);
    setEditing(false);
  };

  return (
    <div
      ref={focusTrapRef}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Templates de messages"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            <h2 className="text-lg font-black text-slate-900">Templates de messages</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer les templates de messages"
            className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Liste des templates */}
          <div className="w-56 border-r border-slate-100 overflow-y-auto shrink-0">
            <div className="p-3 space-y-1">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelected(t);
                    setEditing(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    selected?.id === t.id
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t.nom}
                </button>
              ))}
            </div>
          </div>

          {/* Aperçu / édition */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                Sélectionnez un template
              </div>
            ) : (
              <>
                {/* Objet */}
                <div className="px-5 pt-4 pb-2 border-b border-slate-50">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Objet</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {applyVariables(selected.objet, dossier)}
                  </p>
                </div>

                {/* Corps */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {editing ? (
                    <textarea
                      className="w-full h-full min-h-[200px] text-sm text-slate-700 font-mono border border-slate-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                    />
                  ) : (
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {preview}
                    </pre>
                  )}
                </div>

                {/* Variables info */}
                {!editing && (
                  <div className="px-5 pb-2">
                    <p className="text-[11px] text-slate-400">
                      Variables : données du dossier actif (localStorage)
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="border-t border-slate-100 px-5 py-3 flex items-center gap-2 flex-wrap">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        aria-label="Sauvegarder les modifications du template"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
                      >
                        <Check className="w-4 h-4" aria-hidden="true" />
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleReset}
                        aria-label="Réinitialiser le template par défaut"
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-50 rounded-xl transition-colors ml-auto"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        Réinitialiser
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleCopy}
                        aria-label="Copier le message dans le presse-papier"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                        {copied ? "Copié !" : "📋 Copier"}
                      </button>
                      <button
                        onClick={handleMailto}
                        aria-label="Ouvrir le message dans le client mail"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
                      >
                        <Mail className="w-4 h-4" aria-hidden="true" />
                        📧 Ouvrir dans Mail
                      </button>
                      <button
                        onClick={() => {
                          setEditDraft(selected.corps);
                          setEditing(true);
                        }}
                        aria-label="Modifier le template"
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-sm font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors ml-auto"
                      >
                        <Edit3 className="w-4 h-4" aria-hidden="true" />
                        Modifier
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
