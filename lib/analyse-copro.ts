export interface PosteCharge {
  poste: string;
  montant: number;
}

export interface AnalyseCopro {
  postes: PosteCharge[];
  total: number;
  quotePartLot: number | null;
  periode: string | null;
}

const POSTES_CONNUS: Record<string, RegExp> = {
  'Eau froide / chaude': /eau\s*(froide|chaude|collective)?/i,
  'Ascenseur': /ascenseur/i,
  'Gardiennage': /gardienn?|concierge/i,
  'Entretien parties communes': /entretien\s*(parties?\s*communes?|commun)/i,
  'Assurance immeuble': /assurance\s*(immeuble|copro|multirisque)/i,
  'Chauffage collectif': /chauffage\s*(collectif)?/i,
  'Électricité communes': /[eé]lectricit[eé]\s*(parties?\s*communes?|commun)/i,
  'Ordures ménagères': /ordures|teom|t\.e\.o\.m/i,
  'Ravalement': /ravalement/i,
  'Espaces verts': /espaces?\s*verts?|jardin/i,
  'Honoraires syndic': /syndic|honoraires?\s*syndic/i,
  'Nettoyage': /nettoyage|m[eé]nage/i,
  'Interphone / digicode': /interphone|digicode|vidéophone/i,
  'Fond de travaux': /fond\s*de\s*travaux|cotisation.*alur/i,
};

/**
 * Analyse le contenu textuel d'un document de copropriété.
 * Le contenu est soit du texte brut, soit un base64 dont on décode le texte.
 */
export function analyserDocumentCopro(contenu: string, _type: string): AnalyseCopro {
  let texte = contenu;

  /* Tenter de décoder le base64 en texte lisible */
  try {
    const decoded = Buffer.from(contenu, 'base64').toString('utf-8');
    if (/[a-zàâéèêëïîôùûüç]{3,}/i.test(decoded)) {
      texte = decoded;
    }
  } catch {
    /* contenu déjà en texte, on continue */
  }

  const postes: PosteCharge[] = [];
  const lignes = texte.split(/\n/);

  for (const ligne of lignes) {
    /* Chercher les montants dans la ligne (format: 1 234,56 ou 1234.56) */
    const montantMatch = ligne.match(/([\d\s]+[.,]\d{2})\s*€?\s*$/);
    if (!montantMatch) continue;

    const montantStr = montantMatch[1].replace(/\s/g, '').replace(',', '.');
    const montant = parseFloat(montantStr);
    if (isNaN(montant) || montant <= 0) continue;

    /* Chercher quel poste connu correspond */
    for (const [label, regex] of Object.entries(POSTES_CONNUS)) {
      if (regex.test(ligne)) {
        const existing = postes.find((p) => p.poste === label);
        if (existing) {
          existing.montant += montant;
        } else {
          postes.push({ poste: label, montant });
        }
        break;
      }
    }
  }

  /* Si aucun poste trouvé via regex, tenter un parsing générique lignes avec montant */
  if (postes.length === 0) {
    for (const ligne of lignes) {
      const match = ligne.match(/^(.{3,50}?)\s+([\d\s]+[.,]\d{2})\s*€?\s*$/);
      if (match) {
        const label = match[1].trim();
        const montant = parseFloat(match[2].replace(/\s/g, '').replace(',', '.'));
        if (!isNaN(montant) && montant > 0 && !/total|sous.total/i.test(label)) {
          postes.push({ poste: label, montant });
        }
      }
    }
  }

  const total = postes.reduce((s, p) => s + p.montant, 0);

  /* Recherche quote-part */
  let quotePartLot: number | null = null;
  const qpMatch = texte.match(/quote[- ]?part.*?([\d\s]+[.,]\d{2})/i);
  if (qpMatch) {
    quotePartLot = parseFloat(qpMatch[1].replace(/\s/g, '').replace(',', '.'));
  }

  /* Recherche période */
  let periode: string | null = null;
  const periodeMatch = texte.match(/p[eé]riode\s*:?\s*(.+)/i);
  if (periodeMatch) {
    periode = periodeMatch[1].trim().slice(0, 80);
  }

  return { postes, total: Math.round(total * 100) / 100, quotePartLot, periode };
}
