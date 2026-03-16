// ─── BailBot Parsers ──────────────────────────────────────────────────────────
// Parsers OCR pour dossiers locataires immobiliers

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Garant {
  nom: string;
  prenom: string;
  dateNaissance: string;
  lienParente: string; // parent, ami, employeur...
  salaireNetMensuel: number;
  typeContrat: string;
  revenusN1: number;
  iban: string;
  adresse: string;
}

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
  bulletinsCount: number; // nombre de bulletins fournis (1, 2 ou 3)

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

  // Garant (optionnel)
  garant?: Garant;
}

// ─── Types Mutuelle / Ordonnance ─────────────────────────────────────────────

export interface Personne {
  nom: string;
  prenom: string;
  numeroSecuriteSociale: string;
  dateNaissance: string;
}

export interface MutuelleData {
  organisme: string;
  numeroAMC: string;
  numeroAdherent: string;
  numeroTeletransmission: string;
  typeConv: string;
  dateDebutValidite: string;
  dateFinValidite: string;
  nom: string;
  prenom: string;
  numeroSecuriteSociale: string;
  dateNaissance: string;
  personnes: Personne[];
}

export interface CorrectionOeil {
  sphere: string;
  cylindre: string;
  axe: string;
  addition: string;
}

export interface CorrectionLentille {
  sphere: string;
  cylindre: string;
  axe: string;
  addition: string;
  rayonCourbure: string;
  diametre: string;
}

export interface OrdonnanceData {
  nomOphtalmologue: string;
  nomPatient: string;
  prenomPatient: string;
  dateNaissancePatient: string;
  dateOrdonnance: string;
  dateValidite: string;
  distancePupillaire?: string;
  typePrescription: "lunettes" | "lentilles" | "les deux";
  lunettesOD: CorrectionOeil;
  lunettesOG: CorrectionOeil;
  lentillesOD: CorrectionLentille;
  lentillesOG: CorrectionLentille;
  remarques: string;
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

// ─── Parser DossierFacile Connect (profil JSON) ───────────────────────────────

/**
 * Mappe le profil JSON retourné par l'API DossierFacile
 * (GET /dfc/tenant/profile) vers DossierLocataire.
 *
 * Champs DossierFacile → BailBot :
 *   profile.firstName          → prenom
 *   profile.lastName           → nom
 *   profile.email              → (non stocké dans DossierLocataire, ignoré)
 *   profile.documents[]        → documents par type (IDENTITY, FINANCIAL, etc.)
 *   profile.apartmentSharing   → (partenaires, ignoré pour l'instant)
 *
 * Référence API : https://dossierfacile.logement.gouv.fr/partenaires
 *
 * @param profile - Objet JSON brut de l'API DossierFacile
 * @returns Partial<DossierLocataire> pré-rempli (champs manquants = "")
 */
export function parseDossierFacileProfile(profile: any): Partial<DossierLocataire> {
  if (!profile || typeof profile !== "object") return {};

  // ─── Identité ─────────────────────────────────────────────────────────────
  const nom: string = profile.lastName ?? profile.last_name ?? "";
  const prenom: string = profile.firstName ?? profile.first_name ?? "";

  // ─── Documents indexés par type ──────────────────────────────────────────
  const docs: any[] = Array.isArray(profile.documents) ? profile.documents : [];

  // Identité (CNI, passeport) — peut contenir une adresse
  const identityDoc = docs.find((d: any) =>
    d.documentCategory === "IDENTITY" || d.documentSubCategory === "FRENCH_IDENTITY_CARD"
  );
  const adresseActuelle: string = identityDoc?.address ?? "";
  const numeroCNI: string = identityDoc?.documentNumber ?? identityDoc?.idDocumentNumber ?? "";
  const nationalite: string = identityDoc?.nationality ?? "Française";
  const dateNaissance: string = identityDoc?.birthDate ?? identityDoc?.birth_date ?? "";

  // Financier (bulletin de paie, avis d'imposition)
  const financialDoc = docs.find((d: any) => d.documentCategory === "FINANCIAL");
  const salaireNetMensuelRaw: number =
    financialDoc?.monthlySum ?? financialDoc?.monthly_sum ?? 0;
  const salaireNetMensuel: number = Number(salaireNetMensuelRaw) || 0;

  // Professionnel (contrat de travail, attestation employeur)
  const professionalDoc = docs.find((d: any) => d.documentCategory === "PROFESSIONAL");
  const employeur: string = professionalDoc?.employerName ?? professionalDoc?.employer_name ?? "";
  const typeContrat: string =
    professionalDoc?.typeEmployment ??
    professionalDoc?.type_employment ??
    professionalDoc?.contractType ??
    "";

  // Résidence (justificatif de domicile)
  const residencyDoc = docs.find((d: any) => d.documentCategory === "RESIDENCY");
  const adresseDomicile: string = residencyDoc?.address ?? adresseActuelle;

  // Situation fiscale via apartmentSharing (info sur le dossier global)
  const sharing = profile.apartmentSharing ?? {};
  const situationFiscale: string = sharing.applicationType ?? "";

  return {
    nom: clean(nom),
    prenom: clean(prenom),
    dateNaissance,
    adresseActuelle: clean(adresseActuelle),
    numeroCNI,
    nationalite: clean(nationalite) || "Française",
    employeur: clean(employeur),
    salaireNetMensuel,
    typeContrat: typeContrat.toUpperCase(),
    anciennete: "",       // Non fourni par l'API DossierFacile
    revenusN1: 0,         // Calcul à partir de monthlySum * 12 si besoin
    revenusN2: 0,
    nombreParts: 1,
    situationFiscale: clean(situationFiscale),
    iban: "",             // Non fourni par l'API DossierFacile
    bic: "",
    titulaireCompte: "",
    banque: "",
    adresseDomicile: clean(adresseDomicile),
  };
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

// ─── Types Dossier Professionnel ──────────────────────────────────────────────

export interface DossierKbis {
  siret: string;
  denomination: string;
  formeJuridique: string;
  dateImmat: string;
}

export interface DossierBilan {
  exercice: string;
  chiffreAffaires: number;
  resultatNet: number;
  capitauxPropres: number;
}

export interface Dossier2035 {
  annee: string;
  recettes: number;
  benefice: number;
}

// ─── Parser Kbis / extrait URSSAF / SIRET ────────────────────────────────────

export function parseKbis(text: string): DossierKbis {
  const t = text;

  /* SIRET — 14 chiffres (espaces autorisés) */
  const siretMatch = t.match(/\b(\d{3}\s?\d{3}\s?\d{3}\s?\d{5})\b/)
    || t.match(/(?:siret|siren)[^0-9]*(\d[\d\s]{13,16})/i);
  const siret = siretMatch ? siretMatch[1].replace(/\s/g, "") : "";

  /* Dénomination sociale */
  const denomMatch = t.match(/(?:d[eé]nomination\s+sociale?|raison\s+sociale?|nom\s+de\s+l.entreprise)\s*[:\s]+([^\n]+)/i)
    || t.match(/(?:soci[eé]t[eé])\s+([A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇ][A-ZÀÂÄÉÈÊËÎÏÔÙÛÜÇa-zàâäéèêëîïôùûüç0-9\s&\-\.]+)/i);
  const denomination = denomMatch ? clean(denomMatch[1]) : "";

  /* Forme juridique */
  const formeMatch = t.match(/\b(SARL|SAS|SASU|SA|EURL|SCI|SNC|SELARL|SELAS|SELAR|EIRL|EI|micro[- ]?entreprise|auto[- ]?entrepreneur)\b/i);
  const formeJuridique = formeMatch ? formeMatch[1].toUpperCase() : "";

  /* Date d'immatriculation */
  const dateMatch = t.match(/(?:immatricul[eé][e]?\s+le|date\s+d.immatriculation)\s*[:\s]*(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/i)
    || t.match(/(\d{2}[\/\.]\d{2}[\/\.]\d{4})/);
  const dateImmat = dateMatch ? dateMatch[1].replace(/[\-\.]/g, "/") : "";

  return { siret, denomination, formeJuridique, dateImmat };
}

// ─── Parser Bilan comptable ───────────────────────────────────────────────────

export function parseBilan(text: string): DossierBilan {
  const t = text;

  /* Exercice — "exercice 2024" ou "au 31/12/2024" */
  const exerciceMatch = t.match(/(?:exercice|bilan|ann[eé]e\s+fiscale)[^0-9]*(\d{4})/i)
    || t.match(/au\s+31[\/\.]12[\/\.](\d{4})/i)
    || t.match(/(\d{4})/);
  const exercice = exerciceMatch ? exerciceMatch[1] : "";

  /* Chiffre d'affaires */
  const caMatch = t.match(/(?:chiffre\s+d.affaires|produits\s+d.exploitation|CA\s+net)[^\d]*(\d[\d\s]*[,\.]\d{2})/i)
    || t.match(/(?:chiffre\s+d.affaires)[^\d]*(\d[\d\s]{4,})/i);
  const chiffreAffaires = caMatch ? parseAmount(caMatch[1]) : 0;

  /* Résultat net */
  const resultMatch = t.match(/(?:r[eé]sultat\s+net|b[eé]n[eé]fice\s+net|perte\s+nette)[^\d\-]*(-?\s*\d[\d\s]*[,\.]\d{2})/i);
  const resultatNet = resultMatch ? parseAmount(resultMatch[1]) : 0;

  /* Capitaux propres */
  const capitauxMatch = t.match(/(?:capitaux\s+propres|fonds\s+propres)[^\d]*(\d[\d\s]*[,\.]\d{2})/i);
  const capitauxPropres = capitauxMatch ? parseAmount(capitauxMatch[1]) : 0;

  return { exercice, chiffreAffaires, resultatNet, capitauxPropres };
}

// ─── Parser Déclaration 2035 (BNC — professions libérales) ───────────────────

export function parse2035(text: string): Dossier2035 {
  const t = text;

  /* Année */
  const anneeMatch = t.match(/(?:2035|d[eé]claration)[^0-9]*(\d{4})/i)
    || t.match(/ann[eé]e[^\d]*(\d{4})/i)
    || t.match(/(\d{4})/);
  const annee = anneeMatch ? anneeMatch[1] : "";

  /* Recettes totales — ligne "Recettes" ou "Total des recettes" */
  const recettesMatch = t.match(/(?:recettes\s+totales?|total\s+des\s+recettes|recettes\s+professionnelles?)[^\d]*(\d[\d\s]*[,\.]\d{2})/i)
    || t.match(/(?:recettes)[^\d]*(\d[\d\s]{4,})/i);
  const recettes = recettesMatch ? parseAmount(recettesMatch[1]) : 0;

  /* Bénéfice / déficit */
  const beneficeMatch = t.match(/(?:b[eé]n[eé]fice\s+imposable|b[eé]n[eé]fice\s+net|r[eé]sultat)[^\d\-]*(-?\s*\d[\d\s]*[,\.]\d{2})/i);
  const benefice = beneficeMatch ? parseAmount(beneficeMatch[1]) : 0;

  return { annee, recettes, benefice };
}
