// ─── BailBot — Comparateur GLI (Garantie Loyer Impayé) ───────────────────────
// 100% local, zéro API externe

import { DossierLocataire } from "./parsers";
import { calculerEligibiliteVisale } from "./eligibilite-visale";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OffreGLI {
  nom: string;
  logo: string;
  tauxMensuel: number; // % du loyer CC
  prixMensuel: number; // calculé depuis loyerCC
  prixAnnuel: number;
  couverture: string[];
  nbEtoiles: number; // 1–5 pour affichage
  conditions: string;
  url: string;
  gratuit: boolean;
  eligible: boolean;
  raisonNonEligible?: string;
}

// ─── Grilles GLI ──────────────────────────────────────────────────────────────

interface GrilleGLI {
  nom: string;
  logo: string;
  tauxMensuel: number;
  couverture: string[];
  nbEtoiles: number;
  conditions: string;
  url: string;
  gratuit: boolean;
  eligibiliteCheck: (
    dossier: Partial<DossierLocataire>,
    loyer: number,
    villeEstParis?: boolean
  ) => { eligible: boolean; raison?: string };
}

const GRILLES_GLI: GrilleGLI[] = [
  {
    nom: "Visale (Action Logement)",
    logo: "🏛️",
    tauxMensuel: 0,
    couverture: ["Loyers impayés", "Charges", "Dégradations locatives"],
    nbEtoiles: 3,
    conditions: "Locataire 18–30 ans OU salarié CDI/CDD",
    url: "https://www.visale.fr",
    gratuit: true,
    eligibiliteCheck: (dossier, loyer, villeEstParis = false) => {
      const result = calculerEligibiliteVisale(dossier, loyer, villeEstParis);
      return {
        eligible: result.eligible,
        raison: result.eligible ? undefined : result.motifs_refus[0],
      };
    },
  },
  {
    nom: "GarantMe",
    logo: "🛡️",
    tauxMensuel: 2.5,
    couverture: ["Loyers impayés", "Charges", "Dégradations", "Frais de justice"],
    nbEtoiles: 4,
    conditions: "Revenus ≥ 2× le loyer",
    url: "https://www.garantme.fr",
    gratuit: false,
    eligibiliteCheck: (dossier, loyer) => {
      const salaire = dossier.salaireNetMensuel ?? 0;
      if (salaire <= 0) return { eligible: false, raison: "Revenus non renseignés" };
      if (salaire >= loyer * 2) return { eligible: true };
      return {
        eligible: false,
        raison: `Revenus insuffisants (${salaire}€ < ${loyer * 2}€ requis)`,
      };
    },
  },
  {
    nom: "Cautioneo",
    logo: "🔐",
    tauxMensuel: 3.2,
    couverture: ["Loyers impayés", "Charges"],
    nbEtoiles: 2,
    conditions: "CDI ou CDD en cours",
    url: "https://www.cautioneo.com",
    gratuit: false,
    eligibiliteCheck: (dossier) => {
      const contrat = (dossier.typeContrat ?? "").toUpperCase();
      if (contrat.includes("CDI") || contrat.includes("CDD")) return { eligible: true };
      return {
        eligible: false,
        raison: contrat ? `Contrat ${dossier.typeContrat} non éligible` : "Type de contrat non renseigné",
      };
    },
  },
  {
    nom: "Axa Garantie Loyer",
    logo: "🔵",
    tauxMensuel: 2.8,
    couverture: ["Loyers impayés", "Charges", "Détériorations"],
    nbEtoiles: 3,
    conditions: "Taux effort < 40%",
    url: "https://www.axa.fr/particuliers/habitation/garantie-loyers-impayes.html",
    gratuit: false,
    eligibiliteCheck: (dossier, loyer) => {
      const salaire = dossier.salaireNetMensuel ?? 0;
      if (salaire <= 0) return { eligible: false, raison: "Revenus non renseignés" };
      const ratio = loyer / salaire;
      if (ratio < 0.4) return { eligible: true };
      return {
        eligible: false,
        raison: `Taux d'effort trop élevé (${Math.round(ratio * 100)}% ≥ 40%)`,
      };
    },
  },
  {
    nom: "Allianz GLI",
    logo: "🔷",
    tauxMensuel: 2.6,
    couverture: ["Loyers impayés", "Charges", "Dégradations", "Vacance locative"],
    nbEtoiles: 4,
    conditions: "CDI confirmé",
    url: "https://www.allianz.fr/assurance-habitation/garantie-loyers-impayes.html",
    gratuit: false,
    eligibiliteCheck: (dossier) => {
      const contrat = (dossier.typeContrat ?? "").toUpperCase();
      if (contrat.includes("CDI")) return { eligible: true };
      return {
        eligible: false,
        raison: contrat ? `CDI requis (contrat actuel : ${dossier.typeContrat})` : "Type de contrat non renseigné",
      };
    },
  },
];

// ─── Fonction principale ──────────────────────────────────────────────────────

export function calculerOffresGLI(
  dossier: Partial<DossierLocataire>,
  loyerCC: number,
  villeEstParis: boolean = false
): OffreGLI[] {
  return GRILLES_GLI.map((grille) => {
    const prixMensuel = grille.gratuit
      ? 0
      : Math.round(loyerCC * (grille.tauxMensuel / 100) * 100) / 100;
    const { eligible, raison } = grille.eligibiliteCheck(dossier, loyerCC, villeEstParis);

    return {
      nom: grille.nom,
      logo: grille.logo,
      tauxMensuel: grille.tauxMensuel,
      prixMensuel,
      prixAnnuel: Math.round(prixMensuel * 12 * 100) / 100,
      couverture: grille.couverture,
      nbEtoiles: grille.nbEtoiles,
      conditions: grille.conditions,
      url: grille.url,
      gratuit: grille.gratuit,
      eligible,
      raisonNonEligible: eligible ? undefined : raison,
    };
  }).sort((a, b) => {
    // Éligibles en premier
    if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
    // Gratuit en premier parmi les éligibles
    if (a.eligible && b.eligible) {
      if (a.gratuit !== b.gratuit) return a.gratuit ? -1 : 1;
      return a.prixMensuel - b.prixMensuel;
    }
    return 0;
  });
}
