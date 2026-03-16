// ─── Clauses interdites par la loi ALUR (art. 4 loi 89-462) ────────────────
// Liste exhaustive des clauses abusives dans les baux d'habitation

export interface ClauseInterdite {
  id: string;
  pattern: RegExp;
  description: string;
  reference: string;
}

export const CLAUSES_INTERDITES: ClauseInterdite[] = [
  /* 1 */ {
    id: "resiliation_automatique",
    pattern: /r[eé]siliation.{0,50}automatique/gi,
    description: "Clause de résiliation automatique sans intervention judiciaire",
    reference: "Art. 4 a) Loi n°89-462",
  },
  /* 2 */ {
    id: "interdiction_animaux",
    pattern: /(interdi[ts]|interdiction|ne peut pas|ne pourra pas|ne devra pas).{0,30}(animaux|animal|chien|chat|b[eê]te)/gi,
    description: "Interdiction générale de détenir des animaux de compagnie",
    reference: "Art. 10-I Loi n°70-598",
  },
  /* 3 */ {
    id: "visite_sans_accord",
    pattern: /propri[eé]taire.{0,40}visit(er|e).{0,40}(sans.{0,15}(accord|pr[eé]avis|autorisation)|[àa] tout moment|librement)/gi,
    description: "Droit de visite du propriétaire sans accord du locataire",
    reference: "Art. 4 b) Loi n°89-462",
  },
  /* 4 */ {
    id: "frais_remise_cles",
    pattern: /frais.{0,30}(remise|restitution).{0,15}(cl[eé]s|clefs)/gi,
    description: "Facturation de frais de remise des clés",
    reference: "Art. 4 o) Loi n°89-462",
  },
  /* 5 */ {
    id: "caution_depot_double",
    pattern: /(caution|d[eé]p[oô]t\s*(de\s*)?garantie).{0,40}(2|deux|double).{0,20}mois/gi,
    description: "Dépôt de garantie supérieur à 1 mois de loyer HC (location nue)",
    reference: "Art. 22 Loi n°89-462 (modifié ALUR)",
  },
  /* 6 */ {
    id: "charges_forfait",
    pattern: /charges.{0,30}(forfait|forfaitaire)/gi,
    description: "Charges au forfait non régularisables en habitation",
    reference: "Art. 23 Loi n°89-462",
  },
  /* 7 */ {
    id: "penalite_retard",
    pattern: /p[eé]nalit[eé].{0,30}(retard|paiement).{0,30}(loyer|charges)/gi,
    description: "Pénalité de retard pour paiement du loyer",
    reference: "Art. 4 g) Loi n°89-462",
  },
  /* 8 */ {
    id: "interdiction_hebergement",
    pattern: /(interdi[ts]|interdiction|ne peut pas|ne pourra pas).{0,30}(h[eé]berg|accueillir|recevoir).{0,30}(personne|tiers|proche|famille)/gi,
    description: "Interdiction d'héberger des proches",
    reference: "Art. 4 c) Loi n°89-462",
  },
  /* 9 */ {
    id: "interdiction_activite_politique",
    pattern: /(interdi[ts]|interdiction).{0,30}(activit[eé].{0,15}(politique|syndicale|associative|religieuse))/gi,
    description: "Interdiction d'exercer une activité politique, syndicale ou associative",
    reference: "Art. 4 d) Loi n°89-462",
  },
  /* 10 */ {
    id: "responsabilite_incendie_absolue",
    pattern: /responsab(le|ilit[eé]).{0,30}(incendie|d[eé]g[aâ]t).{0,30}(absolu|totale|sans recours)/gi,
    description: "Responsabilité absolue du locataire en cas d'incendie ou dégât des eaux",
    reference: "Art. 4 Loi n°89-462",
  },
  /* 11 */ {
    id: "mode_paiement_impose",
    pattern: /(impos|oblig).{0,20}(pr[eé]l[eè]vement|virement).{0,15}(automatique|seul moyen|unique)/gi,
    description: "Obligation d'un mode de paiement unique (prélèvement automatique imposé)",
    reference: "Art. 4 h) Loi n°89-462",
  },
  /* 12 */ {
    id: "resiliation_mariage_concubinage",
    pattern: /r[eé]sili(er|ation).{0,40}(mariage|concubinage|pacs|union|divorce|s[eé]paration)/gi,
    description: "Clause de résiliation en cas de changement de situation familiale",
    reference: "Art. 4 Loi n°89-462",
  },
  /* 13 */ {
    id: "frais_etat_des_lieux",
    pattern: /frais.{0,20}[eé]tat\s*des\s*lieux.{0,20}(sup[eé]rieur|exc[eè]d|au[- ]?del[àa]|plus de)/gi,
    description: "Frais d'état des lieux excessifs (plafonné à 3 €/m²)",
    reference: "Art. 5-I Loi ALUR, Décret 2014-890",
  },
  /* 14 */ {
    id: "solidarite_depart",
    pattern: /solidar(it[eé]|e).{0,40}(apr[eè]s|au[- ]?del[àa]|post[eé]rieurement).{0,20}(d[eé]part|cong[eé])/gi,
    description: "Solidarité maintenue au-delà de 6 mois après le départ du colocataire",
    reference: "Art. 8-1 Loi n°89-462 (modifié ALUR)",
  },
  /* 15 */ {
    id: "interdiction_sous_location",
    pattern: /(interdi[ts]|interdiction).{0,20}(totale|absolue|formelle).{0,15}sous[- ]?location/gi,
    description: "Interdiction totale de sous-location (seul l'accord du bailleur est requis)",
    reference: "Art. 8 Loi n°89-462",
  },
  /* 16 */ {
    id: "frais_quittance",
    pattern: /frais.{0,20}(quittance|envoi|d[eé]livrance).{0,15}(loyer|quittance)/gi,
    description: "Facturation de frais pour la délivrance de quittances",
    reference: "Art. 21 Loi n°89-462",
  },
  /* 17 */ {
    id: "clause_travaux_locataire",
    pattern: /locataire.{0,30}(prendre en charge|supporter|assumer).{0,30}(gros|travaux.{0,10}(art\.?\s*606|structure|toiture))/gi,
    description: "Mise à la charge du locataire des grosses réparations (art. 606 CC)",
    reference: "Art. 6 Loi n°89-462, Art. 606 Code Civil",
  },
  /* 18 */ {
    id: "resiliation_automatique_charges",
    pattern: /r[eé]sili(ation|er).{0,30}(plein droit|automatique).{0,30}(non[- ]?paiement|d[eé]faut).{0,15}charges/gi,
    description: "Clause résolutoire automatique pour non-paiement de charges",
    reference: "Art. 4 a) Loi n°89-462",
  },
  /* 19 */ {
    id: "renonciation_recours",
    pattern: /(renonc|d[eé]sist).{0,20}(tout|droit|action|recours).{0,20}(justice|judiciaire|tribunal)/gi,
    description: "Renonciation du locataire à tout recours judiciaire",
    reference: "Art. 4 Loi n°89-462",
  },
  /* 20 */ {
    id: "conge_forme_libre",
    pattern: /cong[eé].{0,30}(simple|forme libre|lettre simple|oral)/gi,
    description: "Congé pouvant être donné sous forme libre (LRAR ou acte d'huissier obligatoire)",
    reference: "Art. 15 Loi n°89-462",
  },
];

/**
 * Scanne un texte de bail pour détecter les clauses interdites
 */
export function scannerClausesInterdites(texteBail: string): {
  id: string;
  description: string;
  reference: string;
  extrait: string;
}[] {
  if (!texteBail || texteBail.trim().length === 0) return [];

  const resultats: { id: string; description: string; reference: string; extrait: string }[] = [];
  const normalise = texteBail.replace(/\s+/g, ' ');

  for (const clause of CLAUSES_INTERDITES) {
    /* Recréer le regex pour réinitialiser lastIndex */
    const re = new RegExp(clause.pattern.source, clause.pattern.flags);
    const match = re.exec(normalise);
    if (match) {
      const start = Math.max(0, match.index - 40);
      const end = Math.min(normalise.length, match.index + match[0].length + 40);
      const extrait = '…' + normalise.slice(start, end).trim() + '…';
      resultats.push({
        id: clause.id,
        description: clause.description,
        reference: clause.reference,
        extrait,
      });
    }
  }

  return resultats;
}
