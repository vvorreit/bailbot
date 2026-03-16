// ─── Mentions obligatoires du bail d'habitation ────────────────────────────
// Loi n°89-462 art. 3, Décret n°2015-587, Loi ALUR

import type { ConformiteAlerte } from './types';

interface BailData {
  adresse: string | null;
  surface: number | null;
  dateDebut: Date | null;
  dateFin: Date | null;
  loyerMensuel: number | null;
  chargesMensuelles: number | null;
  depotGarantie: number | null;
  indiceRevision: string | null;
  typeBail: string;
  classeDPE: string | null;
  dateDPE: Date | null;
  dateElectricite: Date | null;
  dateGaz: Date | null;
  datePlomb: Date | null;
  dateAmiante: Date | null;
}

interface MentionCheck {
  id: string;
  label: string;
  check: (data: BailData) => boolean;
  description: string;
  actionRequise: string;
  reference: string;
  type: 'BLOQUANT' | 'AVERTISSEMENT';
}

const MENTIONS: MentionCheck[] = [
  {
    id: "surface_habitable",
    label: "Surface habitable (loi Boutin)",
    check: (d) => d.surface != null && d.surface > 0,
    description: "La surface habitable (loi Boutin) n'est pas renseignée",
    actionRequise: "Mesurer et indiquer la surface habitable selon la loi Boutin dans le bail",
    reference: "Art. 3 al. 1 Loi n°89-462, Art. R111-2 CCH",
    type: "BLOQUANT",
  },
  {
    id: "adresse_complete",
    label: "Adresse complète du bien",
    check: (d) => !!d.adresse && d.adresse.trim().length >= 10,
    description: "L'adresse complète du bien n'est pas renseignée",
    actionRequise: "Indiquer l'adresse complète du logement (numéro, rue, code postal, ville)",
    reference: "Art. 3 al. 1 Loi n°89-462",
    type: "BLOQUANT",
  },
  {
    id: "date_prise_effet",
    label: "Date de prise d'effet",
    check: (d) => d.dateDebut != null,
    description: "La date de prise d'effet du bail n'est pas renseignée",
    actionRequise: "Indiquer la date de prise d'effet du bail",
    reference: "Art. 3 al. 2 Loi n°89-462",
    type: "BLOQUANT",
  },
  {
    id: "duree_bail",
    label: "Durée du bail",
    check: (d) => {
      if (!d.dateDebut) return false;
      /* Un bail sans date de fin est considéré comme tacitement reconduit — OK */
      return true;
    },
    description: "La durée du bail n'est pas conforme (3 ans nu, 1 an meublé)",
    actionRequise: "Vérifier que la durée du bail respecte les minimums légaux",
    reference: "Art. 10 Loi n°89-462",
    type: "AVERTISSEMENT",
  },
  {
    id: "montant_loyer",
    label: "Montant du loyer",
    check: (d) => d.loyerMensuel != null && d.loyerMensuel > 0,
    description: "Le montant du loyer mensuel n'est pas renseigné",
    actionRequise: "Indiquer le montant du loyer hors charges dans le bail",
    reference: "Art. 3 al. 3 Loi n°89-462",
    type: "BLOQUANT",
  },
  {
    id: "montant_charges",
    label: "Montant des charges",
    check: (d) => d.chargesMensuelles != null,
    description: "Le montant des provisions sur charges n'est pas renseigné",
    actionRequise: "Indiquer le montant des provisions sur charges ou la mention « néant »",
    reference: "Art. 3 Loi n°89-462",
    type: "AVERTISSEMENT",
  },
  {
    id: "depot_garantie",
    label: "Dépôt de garantie",
    check: (d) => d.depotGarantie != null,
    description: "Le montant du dépôt de garantie n'est pas renseigné",
    actionRequise: "Indiquer le montant du dépôt de garantie dans le bail",
    reference: "Art. 22 Loi n°89-462",
    type: "AVERTISSEMENT",
  },
  {
    id: "depot_garantie_plafond",
    label: "Plafond dépôt de garantie",
    check: (d) => {
      if (!d.depotGarantie || !d.loyerMensuel) return true;
      if (d.typeBail === "PROFESSIONNEL") return true;
      const plafond = d.typeBail === "HABITATION_MEUBLE" ? d.loyerMensuel * 2 : d.loyerMensuel;
      return d.depotGarantie <= plafond + 0.01;
    },
    description: "Le dépôt de garantie dépasse le plafond légal (1 mois HC en nu, 2 mois en meublé)",
    actionRequise: "Réduire le dépôt de garantie au plafond légal",
    reference: "Art. 22 Loi n°89-462 (modifié ALUR)",
    type: "BLOQUANT",
  },
  {
    id: "modalites_revision",
    label: "Modalités de révision du loyer",
    check: (d) => !!d.indiceRevision,
    description: "Les modalités de révision du loyer (indice IRL) ne sont pas renseignées",
    actionRequise: "Indiquer l'indice de référence pour la révision du loyer (IRL)",
    reference: "Art. 17-1 Loi n°89-462",
    type: "AVERTISSEMENT",
  },
  {
    id: "diagnostic_dpe",
    label: "DPE (Diagnostic de Performance Énergétique)",
    check: (d) => d.dateDPE != null || d.classeDPE != null,
    description: "Le diagnostic DPE n'est pas annexé au bail",
    actionRequise: "Annexer le DPE en cours de validité au contrat de bail",
    reference: "Art. 3-3 Loi n°89-462, Art. L134-1 CCH",
    type: "BLOQUANT",
  },
  {
    id: "diagnostic_electricite",
    label: "Diagnostic électricité",
    check: (d) => d.dateElectricite != null,
    description: "Le diagnostic électricité n'est pas annexé (obligatoire si installation > 15 ans)",
    actionRequise: "Faire réaliser un diagnostic électricité et l'annexer au bail",
    reference: "Décret n°2016-1105",
    type: "AVERTISSEMENT",
  },
  {
    id: "diagnostic_gaz",
    label: "Diagnostic gaz",
    check: (d) => d.dateGaz != null,
    description: "Le diagnostic gaz n'est pas annexé (obligatoire si installation > 15 ans)",
    actionRequise: "Faire réaliser un diagnostic gaz et l'annexer au bail",
    reference: "Décret n°2016-1104",
    type: "AVERTISSEMENT",
  },
  {
    id: "diagnostic_plomb",
    label: "CREP (Constat de Risque d'Exposition au Plomb)",
    check: (d) => d.datePlomb != null,
    description: "Le CREP n'est pas annexé (obligatoire si construction avant 1949)",
    actionRequise: "Faire réaliser un CREP et l'annexer au bail si le bâtiment date d'avant 1949",
    reference: "Art. L1334-5 CSP",
    type: "AVERTISSEMENT",
  },
  {
    id: "diagnostic_amiante",
    label: "Diagnostic amiante",
    check: (d) => d.dateAmiante != null,
    description: "Le diagnostic amiante n'est pas disponible (obligatoire si permis avant 1997)",
    actionRequise: "Fournir le diagnostic amiante si le permis de construire date d'avant le 1er juillet 1997",
    reference: "Art. R1334-14 CSP",
    type: "AVERTISSEMENT",
  },
  {
    id: "duree_minimum",
    label: "Durée minimale du bail",
    check: (d) => {
      if (!d.dateDebut || !d.dateFin) return true;
      if (d.typeBail === "PROFESSIONNEL") return true;
      const debut = new Date(d.dateDebut);
      const fin = new Date(d.dateFin);
      const diffMs = fin.getTime() - debut.getTime();
      const diffAnnees = diffMs / (365.25 * 24 * 60 * 60 * 1000);
      if (d.typeBail === "HABITATION_MEUBLE") return diffAnnees >= 0.99;
      return diffAnnees >= 2.99;
    },
    description: "La durée du bail est inférieure au minimum légal (3 ans nu, 1 an meublé)",
    actionRequise: "Corriger la durée du bail pour respecter le minimum légal",
    reference: "Art. 10 Loi n°89-462",
    type: "BLOQUANT",
  },
];

/**
 * Vérifie les mentions obligatoires d'un bail.
 */
export function verifierMentionsObligatoires(data: BailData): {
  presentes: string[];
  manquantes: ConformiteAlerte[];
} {
  const presentes: string[] = [];
  const manquantes: ConformiteAlerte[] = [];

  for (const mention of MENTIONS) {
    if (mention.check(data)) {
      presentes.push(mention.label);
    } else {
      manquantes.push({
        type: mention.type,
        categorie: "MENTION_MANQUANTE",
        description: mention.description,
        actionRequise: mention.actionRequise,
        reference: mention.reference,
      });
    }
  }

  return { presentes, manquantes };
}
