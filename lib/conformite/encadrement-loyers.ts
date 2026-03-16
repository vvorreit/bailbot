// ─── Encadrement des loyers — zones tendues ────────────────────────────────
// Référence : Décret n°2019-315, Arrêtés préfectoraux annuels

export interface ZoneEncadree {
  commune: string;
  /** Loyer de référence €/m² par type */
  references: {
    /** HABITATION_VIDE */
    nu: { ref: number; majore: number };
    /** HABITATION_MEUBLE */
    meuble: { ref: number; majore: number };
  };
}

/**
 * Données statiques des loyers de référence médians (€/m²/mois).
 * Moyennes simplifiées tous quartiers confondus — les arrêtés préfectoraux
 * définissent des valeurs par quartier/époque/nombre de pièces.
 * Ces valeurs servent de première alerte ; l'utilisateur est invité à vérifier
 * les plafonds exacts sur le site de la préfecture.
 */
const ZONES_ENCADREES: ZoneEncadree[] = [
  {
    commune: "Paris",
    references: {
      nu: { ref: 28.0, majore: 33.6 },
      meuble: { ref: 33.5, majore: 40.2 },
    },
  },
  {
    commune: "Lille",
    references: {
      nu: { ref: 12.5, majore: 15.0 },
      meuble: { ref: 15.0, majore: 18.0 },
    },
  },
  {
    commune: "Lyon",
    references: {
      nu: { ref: 14.0, majore: 16.8 },
      meuble: { ref: 17.0, majore: 20.4 },
    },
  },
  {
    commune: "Bordeaux",
    references: {
      nu: { ref: 12.0, majore: 14.4 },
      meuble: { ref: 14.5, majore: 17.4 },
    },
  },
  {
    commune: "Montpellier",
    references: {
      nu: { ref: 13.0, majore: 15.6 },
      meuble: { ref: 15.5, majore: 18.6 },
    },
  },
  {
    commune: "Marseille",
    references: {
      nu: { ref: 11.5, majore: 13.8 },
      meuble: { ref: 14.0, majore: 16.8 },
    },
  },
  {
    commune: "Villeurbanne",
    references: {
      nu: { ref: 12.5, majore: 15.0 },
      meuble: { ref: 15.0, majore: 18.0 },
    },
  },
  {
    commune: "Hellemmes",
    references: {
      nu: { ref: 11.0, majore: 13.2 },
      meuble: { ref: 13.5, majore: 16.2 },
    },
  },
  {
    commune: "Lomme",
    references: {
      nu: { ref: 10.5, majore: 12.6 },
      meuble: { ref: 13.0, majore: 15.6 },
    },
  },
  {
    commune: "Plaine Commune",
    references: {
      nu: { ref: 17.0, majore: 20.4 },
      meuble: { ref: 20.0, majore: 24.0 },
    },
  },
  {
    commune: "Est Ensemble",
    references: {
      nu: { ref: 16.0, majore: 19.2 },
      meuble: { ref: 19.0, majore: 22.8 },
    },
  },
  {
    commune: "Grand-Orly Seine Bièvre",
    references: {
      nu: { ref: 14.5, majore: 17.4 },
      meuble: { ref: 17.5, majore: 21.0 },
    },
  },
];

/**
 * Identifie si une adresse est dans une zone soumise à l'encadrement.
 * Recherche par inclusion de nom de commune dans l'adresse.
 */
function trouverZone(adresse: string): ZoneEncadree | null {
  if (!adresse) return null;
  const adresseNorm = adresse.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const zone of ZONES_ENCADREES) {
    const communeNorm = zone.commune.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (adresseNorm.includes(communeNorm)) {
      return zone;
    }
  }
  return null;
}

export interface ResultatEncadrement {
  encadre: boolean;
  commune: string | null;
  loyerRef: number | null;
  loyerRefMajore: number | null;
  loyerActuelM2: number | null;
  depassement: number | null;
}

/**
 * Vérifie si le loyer respecte l'encadrement des loyers.
 * @param adresse - Adresse complète du bien
 * @param surface - Surface habitable en m²
 * @param loyerHC - Loyer hors charges mensuel
 * @param typeBail - Type de bail (HABITATION_VIDE, HABITATION_MEUBLE, PROFESSIONNEL)
 */
export function verifierEncadrementLoyers(
  adresse: string,
  surface: number | null,
  loyerHC: number,
  typeBail: string,
): ResultatEncadrement {
  if (typeBail === "PROFESSIONNEL") {
    return { encadre: false, commune: null, loyerRef: null, loyerRefMajore: null, loyerActuelM2: null, depassement: null };
  }

  const zone = trouverZone(adresse);
  if (!zone) {
    return { encadre: false, commune: null, loyerRef: null, loyerRefMajore: null, loyerActuelM2: null, depassement: null };
  }

  if (!surface || surface <= 0) {
    return {
      encadre: true,
      commune: zone.commune,
      loyerRef: null,
      loyerRefMajore: null,
      loyerActuelM2: null,
      depassement: null,
    };
  }

  const refs = typeBail === "HABITATION_MEUBLE" ? zone.references.meuble : zone.references.nu;
  const loyerActuelM2 = Math.round((loyerHC / surface) * 100) / 100;
  const depassement = loyerActuelM2 > refs.majore
    ? Math.round((loyerActuelM2 - refs.majore) * surface * 100) / 100
    : null;

  return {
    encadre: true,
    commune: zone.commune,
    loyerRef: refs.ref,
    loyerRefMajore: refs.majore,
    loyerActuelM2,
    depassement,
  };
}
