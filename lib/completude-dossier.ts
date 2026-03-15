// ─── BailBot — Vérification Complétude Dossier ───────────────────────────────

import { DossierLocataire } from "./parsers";

export interface DocumentRequis {
  id: string;
  nom: string;
  obligatoire: boolean;
  present: boolean;
  source?: string; // clé du DossierLocataire prouvant la présence
}

export interface CompletudeDossier {
  complet: boolean;
  pourcentage: number; // 0-100
  documents: DocumentRequis[];
  manquants: string[]; // noms des docs obligatoires manquants
  messageEmail: string; // email pré-rédigé à envoyer au locataire
}

export function verifierCompletude(
  dossier: Partial<DossierLocataire>,
  aGarant: boolean = false
): CompletudeDossier {
  const prenom = dossier.prenom ?? "locataire";
  const nom = dossier.nom ?? "";

  const documents: DocumentRequis[] = [
    {
      id: "cni",
      nom: "Pièce d'identité (CNI / Passeport)",
      obligatoire: true,
      present: Boolean(dossier.nom && dossier.prenom && dossier.dateNaissance),
      source: "nom + prenom + dateNaissance",
    },
    {
      id: "domicile",
      nom: "Justificatif de domicile",
      obligatoire: true,
      present: Boolean(dossier.adresseActuelle || dossier.adresseDomicile),
      source: "adresseActuelle ou adresseDomicile",
    },
    {
      id: "bulletin_m1",
      nom: "Bulletin de paie M-1",
      obligatoire: true,
      present: Boolean(dossier.salaireNetMensuel && dossier.salaireNetMensuel > 0),
      source: "salaireNetMensuel",
    },
    {
      id: "bulletins_m2_m3",
      nom: "Bulletins de paie M-2 et M-3",
      obligatoire: false,
      present: Boolean(dossier.bulletinsCount && dossier.bulletinsCount >= 3),
      source: "bulletinsCount >= 3",
    },
    {
      id: "avis_imposition",
      nom: "Avis d'imposition N-1",
      obligatoire: true,
      present: Boolean(dossier.revenusN1 && dossier.revenusN1 > 0),
      source: "revenusN1",
    },
    {
      id: "rib",
      nom: "RIB (Relevé d'identité bancaire)",
      obligatoire: true,
      present: Boolean(dossier.iban && dossier.iban.trim() !== ""),
      source: "iban",
    },
  ];

  // Documents garant (si demandé)
  if (aGarant) {
    const g = dossier.garant;
    documents.push(
      {
        id: "garant_cni",
        nom: "Garant — Pièce d'identité",
        obligatoire: true,
        present: Boolean(g?.nom && g?.prenom && g?.dateNaissance),
        source: "garant.nom + garant.prenom + garant.dateNaissance",
      },
      {
        id: "garant_bulletin",
        nom: "Garant — Bulletin de paie",
        obligatoire: true,
        present: Boolean(g?.salaireNetMensuel && g.salaireNetMensuel > 0),
        source: "garant.salaireNetMensuel",
      },
      {
        id: "garant_avis",
        nom: "Garant — Avis d'imposition N-1",
        obligatoire: true,
        present: Boolean(g?.revenusN1 && g.revenusN1 > 0),
        source: "garant.revenusN1",
      },
      {
        id: "garant_rib",
        nom: "Garant — RIB",
        obligatoire: false,
        present: Boolean(g?.iban && g.iban.trim() !== ""),
        source: "garant.iban",
      }
    );
  }

  const obligatoires = documents.filter((d) => d.obligatoire);
  const presentObligatoires = obligatoires.filter((d) => d.present);
  const tous = documents;
  const presentsTous = tous.filter((d) => d.present);

  const manquants = obligatoires
    .filter((d) => !d.present)
    .map((d) => d.nom);

  const complet = manquants.length === 0;
  const pourcentage = Math.round((presentsTous.length / tous.length) * 100);

  // ─── Email de relance ─────────────────────────────────────────────────────
  const messageEmail = manquants.length > 0
    ? `Bonjour ${prenom}${nom ? " " + nom : ""},\n\nNous avons bien reçu votre dossier de candidature. Cependant, il nous manque les documents suivants pour pouvoir le traiter :\n\n${manquants.map((m) => `  • ${m}`).join("\n")}\n\nMerci de nous transmettre ces documents dès que possible afin de compléter votre dossier.\n\nCordialement,\nL'agence`
    : `Bonjour ${prenom}${nom ? " " + nom : ""},\n\nVotre dossier est complet. Merci pour les documents transmis.\n\nCordialement,\nL'agence`;

  return {
    complet,
    pourcentage,
    documents,
    manquants,
    messageEmail,
  };
}
