// ─── BailBot Parsers ──────────────────────────────────────────────────────────
// Parsers OCR pour dossiers locataires immobiliers

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DossierLocataire {
  // CNI
  nom: string;
  prenom: string;
  dateNaissance: string;
  adresseActuelle: string;
  numeroCNI: string;
  nationalite: string;

  // Bulletins de paie
  employeur: string;
  salaireNetMensuel: number;
  typeContrat: string; // CDI, CDD, interim
  anciennete: string;

  // Avis d'imposition
  revenusN1: number;
  revenusN2: number;
  nombreParts: number;
  situationFiscale: string;

  // RIB
  iban: string;
  bic: string;
  titulaireCompte: string;
  banque: string;

  // Justificatif de domicile
  adresseDomicile: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clean(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function parseAmount(s: string): number {
  if (!s) return 0;
  return parseFloat(s.replace(/\s/g, "").replace(",", ".")) || 0;
}

// ─── Parser CNI ───────────────────────────────────────────────────────────────

export function parseCNI(text: string): Partial<DossierLocataire> {
  const t = text;

  // Numéro CNI — 12 chiffres
  const cniMatch = t.match(/\b(\d{12})\b/);
  const numeroCNI = cniMatch ? cniMatch[1] : "";

  // Nom et prénom — lignes en majuscules
  const nomMatch = t.match(/(?:NOM\s*[:\s]+)?([A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ\-]{2,})\s+([A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ][a-zàâäéèêëîïôùûüç\-]+(?:\s+[A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ][a-zàâäéèêëîïôùûüç\-]+)*)/);
  let nom = "";
  let prenom = "";
  if (nomMatch) {
    nom = nomMatch[1];
    prenom = nomMatch[2];
  } else {
    // Fallback — cherche 2 tokens majuscules consécutifs
    const upperMatch = t.match(/([A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ\-]{2,})\s+([A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ\-]{2,})/);
    if (upperMatch) {
      nom = upperMatch[1];
      prenom = upperMatch[2];
    }
  }

  // Date de naissance — JJ/MM/AAAA ou JJ MM AAAA
  const dobMatch = t.match(/(?:n[eé][e]?\s+le|date\s+de\s+naissance|D\.?N\.?|né[e]?\s*:?\s*)[\s]*(\d{2}[\/\-\s\.]\d{2}[\/\-\s\.]\d{4})/i)
    || t.match(/(\d{2}[\/\.]\d{2}[\/\.]\d{4})/);
  const dateNaissance = dobMatch ? dobMatch[1].replace(/[\s\-\.]/g, "/") : "";

  // Adresse
  const adresseMatch = t.match(/(?:adresse\s*:?\s*|demeurant\s+à\s*)([^\n]+)/i);
  const adresseActuelle = adresseMatch ? clean(adresseMatch[1]) : "";

  // Nationalité
  const natMatch = t.match(/(?:nationalit[eé]\s*:?\s*)([^\n]+)/i);
  const nationalite = natMatch ? clean(natMatch[1]) : "Française";

  return { nom, prenom, dateNaissance, adresseActuelle, numeroCNI, nationalite };
}

// ─── Parser Bulletin de paie ──────────────────────────────────────────────────

export function parseBulletinPaie(text: string): Partial<DossierLocataire> {
  const t = text;

  // Employeur — généralement en haut du bulletin
  const employeurMatch = t.match(/(?:employeur|entreprise|soci[eé]t[eé]|raison sociale)\s*[:\s]+([^\n]+)/i)
    || t.match(/^([A-Z][A-Za-zÀ-ÖØ-öø-ÿ\s&\-\.]{5,50})\n/m);
  const employeur = employeurMatch ? clean(employeurMatch[1]) : "";

  // Salaire net — "NET À PAYER", "SALAIRE NET", "NET PAYÉ"
  const salaireMatch = t.match(/(?:net\s+[àa]\s+payer|salaire\s+net|net\s+pay[eé])[^\d]*(\d[\d\s]*[,\.]\d{2})/i)
    || t.match(/(?:montant\s+net)[^\d]*(\d[\d\s]*[,\.]\d{2})/i);
  const salaireNetMensuel = salaireMatch ? parseAmount(salaireMatch[1]) : 0;

  // Type de contrat — CDI, CDD, intérim, etc.
  const contratMatch = t.match(/\b(CDI|CDD|int[eé]rim(?:aire)?|CIP|apprentissage|professionnalisation|stage)\b/i);
  const typeContrat = contratMatch ? contratMatch[1].toUpperCase() : "";

  // Ancienneté
  const ancienneteMatch = t.match(/(?:anciennet[eé]|date\s+d.entr[eé]e)\s*[:\s]+([^\n]+)/i);
  const anciennete = ancienneteMatch ? clean(ancienneteMatch[1]) : "";

  return { employeur, salaireNetMensuel, typeContrat, anciennete };
}

// ─── Parser Avis d'imposition 2042 ───────────────────────────────────────────

export function parseAvisImposition(text: string): Partial<DossierLocataire> {
  const t = text;

  // Revenu fiscal de référence (N-1 = année la plus récente sur le doc)
  const rfrMatch = t.match(/(?:revenu\s+fiscal\s+de\s+r[eé]f[eé]rence)[^\d]*(\d[\d\s]*)/i);
  const revenusN1 = rfrMatch ? parseAmount(rfrMatch[1]) : 0;

  // Revenu N-2 — cherche un second montant ou année précédente
  const rfr2Match = t.match(/(?:revenu\s+fiscal\s+de\s+r[eé]f[eé]rence)[^\d]*\d[\d\s]*[^\d]+(\d[\d\s]{4,})/i);
  const revenusN2 = rfr2Match ? parseAmount(rfr2Match[1]) : 0;

  // Nombre de parts
  const partsMatch = t.match(/(?:nombre\s+de\s+parts?)[^\d]*(\d+[,\.]\d*|\d+)/i);
  const nombreParts = partsMatch ? parseFloat(partsMatch[1].replace(",", ".")) : 1;

  // Situation fiscale — célibataire, marié, pacsé, etc.
  const situationMatch = t.match(/\b(c[eé]libataire|mari[eé][e]?|pacse[e]?[e]?|divorc[eé][e]?|s[eé]par[eé][e]?|veuf|veuve)\b/i);
  const situationFiscale = situationMatch ? situationMatch[1].toLowerCase() : "";

  return { revenusN1, revenusN2, nombreParts, situationFiscale };
}

// ─── Parser RIB ───────────────────────────────────────────────────────────────

export function parseRIB(text: string): Partial<DossierLocataire> {
  const t = text;

  // IBAN — FR suivi de 25 chiffres/lettres (avec espaces possibles)
  const ibanMatch = t.match(/\b(FR\d{2}(?:\s?\d{4}){5}\s?\d{3})\b/i)
    || t.match(/\b(FR[0-9A-Z\s]{20,29})\b/i);
  const iban = ibanMatch ? ibanMatch[1].replace(/\s/g, "") : "";

  // BIC — 8 à 11 caractères alphanumériques
  const bicMatch = t.match(/\b(?:BIC|SWIFT|code\s+bic)[^A-Z]*([A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/i)
    || t.match(/\b([A-Z]{4}[A-Z]{2}[A-Z0-9]{2}(?:[A-Z0-9]{3})?)\b/);
  const bic = bicMatch ? bicMatch[1] : "";

  // Titulaire du compte
  const titulaireMatch = t.match(/(?:titulaire|au\s+nom\s+de|nom\s+du\s+titulaire)\s*[:\s]+([^\n]+)/i);
  const titulaireCompte = titulaireMatch ? clean(titulaireMatch[1]) : "";

  // Banque
  const banqueMatch = t.match(/(?:banque|[eé]tablissement|domiciliation)\s*[:\s]+([^\n]+)/i)
    || t.match(/^([A-Z][A-Za-zÀ-ÖØ-öø-ÿ\s&\-\.]{3,40})\n/m);
  const banque = banqueMatch ? clean(banqueMatch[1]) : "";

  return { iban, bic, titulaireCompte, banque };
}

// ─── Parser Justificatif de domicile ─────────────────────────────────────────

export function parseJustificatifDomicile(text: string): Partial<DossierLocataire> {
  const t = text;

  // Adresse — cherche un numéro + nom de voie + code postal + ville
  const adresseMatch = t.match(/(\d{1,4}\s+(?:rue|avenue|boulevard|impasse|allée|chemin|place|cité|résidence|voie)[^\n,]{5,60},?\s*\d{5}\s+[A-Z][A-Za-zÀ-ÖØ-öø-ÿ\s\-]+)/i);
  const adresseDomicile = adresseMatch ? clean(adresseMatch[1]) : "";

  return { adresseDomicile };
}

// ─── Parser universel ─────────────────────────────────────────────────────────

export type DocumentType = "cni" | "bulletin_paie" | "avis_imposition" | "rib" | "domicile" | "inconnu";

export function detectDocumentType(text: string): DocumentType {
  const t = text.toLowerCase();
  if (/carte\s+nationale\s+d.identit|r[eé]publique\s+fran[cç]aise|cni/i.test(t)) return "cni";
  if (/bulletin\s+de\s+(?:paie|salaire)|net\s+[àa]\s+payer|salaire\s+net/i.test(t)) return "bulletin_paie";
  if (/avis\s+d.imposition|revenu\s+fiscal|direction\s+g[eé]n[eé]rale\s+des\s+finances/i.test(t)) return "avis_imposition";
  if (/relev[eé]\s+d.identit[eé]\s+bancaire|iban|bic|swift/i.test(t)) return "rib";
  if (/facture|[eé]lectricit[eé]|gaz|eau|internet|loyer|quittance/i.test(t)) return "domicile";
  return "inconnu";
}

export function parseDossier(text: string, forceType?: DocumentType): Partial<DossierLocataire> {
  const type = forceType || detectDocumentType(text);
  switch (type) {
    case "cni": return parseCNI(text);
    case "bulletin_paie": return parseBulletinPaie(text);
    case "avis_imposition": return parseAvisImposition(text);
    case "rib": return parseRIB(text);
    case "domicile": return parseJustificatifDomicile(text);
    default: return {};
  }
}
