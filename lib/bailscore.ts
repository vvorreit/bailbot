// ─── BailBot — BailScore ──────────────────────────────────────────────────────
// Calcule un score 0-100 pour un dossier locataire basé sur données OCR

import { DossierLocataire } from "./parsers";
import type { DossierKbis, DossierBilan, Dossier2035 } from "./parsers";

export interface BailScore {
  total: number; // 0-100
  grade: "EXCELLENT" | "BON" | "ACCEPTABLE" | "FAIBLE" | "INSUFFISANT";
  dimensions: {
    solvabilite: { score: number; max: 40; detail: string };
    stabilite: { score: number; max: 30; detail: string };
    completude: { score: number; max: 20; detail: string };
    profil: { score: number; max: 10; detail: string };
  };
  recommandation: string;
  pointsForts: string[];
  pointsAttention: string[];
}

function getGrade(
  total: number
): "EXCELLENT" | "BON" | "ACCEPTABLE" | "FAIBLE" | "INSUFFISANT" {
  if (total >= 80) return "EXCELLENT";
  if (total >= 65) return "BON";
  if (total >= 50) return "ACCEPTABLE";
  if (total >= 35) return "FAIBLE";
  return "INSUFFISANT";
}

function calcAge(dateNaissance: string): number | null {
  if (!dateNaissance) return null;
  // Format JJ/MM/AAAA
  const parts = dateNaissance.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  const dob = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function calculerBailScore(
  dossier: Partial<DossierLocataire>,
  loyerMensuelCC: number
): BailScore {
  // Si garant présent, on calcule aussi avec revenus combinés
  const garantSalaire = dossier.garant?.salaireNetMensuel ?? 0;
  const pointsForts: string[] = [];
  const pointsAttention: string[] = [];

  // ─── Solvabilité (40 pts) ─────────────────────────────────────────────────
  let solvabiliteScore = 0;
  let solvabiliteDetail = "";

  const salaire = dossier.salaireNetMensuel ?? 0;
  if (salaire > 0 && loyerMensuelCC > 0) {
    const ratio = loyerMensuelCC / salaire;
    // Si le ratio locataire seul est > 50% mais qu'avec garant ça passe sous 33%
    const ratioAvecGarant = garantSalaire > 0 ? loyerMensuelCC / (salaire + garantSalaire) : ratio;
    const ratioEffectif = (ratio > 0.50 && garantSalaire > 0) ? ratioAvecGarant : ratio;
    const avecGarant = ratio > 0.50 && garantSalaire > 0 && ratioAvecGarant < ratio;

    if (ratioEffectif <= 0.33) {
      solvabiliteScore = 40;
      solvabiliteDetail = `Ratio loyer/salaire excellent (${(ratioEffectif * 100).toFixed(0)}%)${avecGarant ? " avec garant" : ""}`;
      pointsForts.push(`Ratio loyer/salaire excellent : ${(ratioEffectif * 100).toFixed(0)}% (≤33%)${avecGarant ? " — garant pris en compte" : ""}`);
    } else if (ratioEffectif <= 0.40) {
      solvabiliteScore = 28;
      solvabiliteDetail = `Ratio loyer/salaire correct (${(ratioEffectif * 100).toFixed(0)}%)${avecGarant ? " avec garant" : ""}`;
      if (avecGarant) pointsForts.push("Garant améliore significativement la solvabilité");
    } else if (ratioEffectif <= 0.50) {
      solvabiliteScore = 15;
      solvabiliteDetail = `Ratio loyer/salaire élevé (${(ratioEffectif * 100).toFixed(0)}%)`;
      pointsAttention.push(`Ratio loyer/salaire élevé : ${(ratioEffectif * 100).toFixed(0)}% (taux d'effort supérieur à 40%)`);
    } else {
      solvabiliteScore = 0;
      solvabiliteDetail = `Ratio loyer/salaire trop élevé (${(ratio * 100).toFixed(0)}%)`;
      pointsAttention.push(`Ratio loyer/salaire critique : ${(ratio * 100).toFixed(0)}% (> 50%)`);
    }

    // Bonus stabilité revenus
    const revenusN1 = dossier.revenusN1 ?? 0;
    const revenusN2 = dossier.revenusN2 ?? 0;
    if (revenusN1 > 0 && revenusN2 > 0) {
      const variation = Math.abs(revenusN1 - revenusN2) / revenusN2;
      if (variation < 0.20) {
        solvabiliteScore = clamp(solvabiliteScore + 5, 0, 40);
        solvabiliteDetail += " + bonus stabilité revenus N1/N2";
        pointsForts.push("Revenus fiscaux stables sur 2 ans (variation < 20%)");
      }
    }
  } else if (salaire <= 0) {
    solvabiliteDetail = "Salaire non renseigné";
    pointsAttention.push("Salaire net mensuel non renseigné");
  } else {
    solvabiliteDetail = "Loyer non renseigné";
  }

  // ─── Stabilité professionnelle (30 pts) ───────────────────────────────────
  let stabiliteScore = 0;
  let stabiliteDetail = "";

  const contrat = (dossier.typeContrat ?? "").trim().toUpperCase();
  const anciennete = (dossier.anciennete ?? "").toLowerCase();

  if (contrat.includes("CDI")) {
    stabiliteScore = 30;
    stabiliteDetail = "CDI — stabilité maximale";
    pointsForts.push("Contrat CDI");
  } else if (contrat.includes("CDD") || contrat.includes("CDD")) {
    // Détection durée CDD via ancienneté ou champ contrat
    const moisMatch = anciennete.match(/(\d+)\s*mois/);
    const mois = moisMatch ? parseInt(moisMatch[1]) : 0;
    if (mois > 6 || anciennete.includes("an")) {
      stabiliteScore = 20;
      stabiliteDetail = "CDD > 6 mois";
    } else {
      stabiliteScore = 10;
      stabiliteDetail = "CDD court ou durée inconnue";
      pointsAttention.push("Contrat CDD de courte durée");
    }
  } else if (contrat.includes("INTÉRIM") || contrat.includes("INTERIM") || contrat.includes("INTÉRIMAIRE")) {
    stabiliteScore = 10;
    stabiliteDetail = "Intérim";
    pointsAttention.push("Contrat intérimaire — stabilité limitée");
  } else if (contrat === "" || contrat === "INCONNU") {
    stabiliteScore = 0;
    stabiliteDetail = "Type de contrat non renseigné";
    pointsAttention.push("Type de contrat non renseigné");
  } else {
    stabiliteScore = 0;
    stabiliteDetail = `Type de contrat atypique : ${dossier.typeContrat}`;
    pointsAttention.push(`Type de contrat non reconnu : ${dossier.typeContrat}`);
  }

  // Bonus très solvable
  if (salaire > 0 && loyerMensuelCC > 0 && salaire > loyerMensuelCC * 4) {
    stabiliteScore = clamp(stabiliteScore + 5, 0, 30);
    stabiliteDetail += " + bonus très solvable";
    pointsForts.push("Très solvable : salaire > 4× le loyer");
  }

  // ─── Complétude dossier (20 pts) ──────────────────────────────────────────
  let completudeScore = 20;
  let completudeDetail = "";
  const manquants: string[] = [];

  if (!dossier.nom || dossier.nom.trim() === "") {
    completudeScore -= 5;
    manquants.push("nom");
  }
  if (!dossier.dateNaissance || dossier.dateNaissance.trim() === "") {
    completudeScore -= 5;
    manquants.push("date de naissance");
  }
  if (!dossier.salaireNetMensuel || dossier.salaireNetMensuel === 0) {
    completudeScore -= 5;
    manquants.push("salaire");
  }
  if (!dossier.iban || dossier.iban.trim() === "") {
    completudeScore -= 5;
    manquants.push("IBAN");
  }

  const revenusN1 = dossier.revenusN1 ?? 0;
  const revenusN2 = dossier.revenusN2 ?? 0;
  if (revenusN1 > 0 && revenusN2 > 0) {
    completudeScore = clamp(completudeScore + 3, 0, 20);
    completudeDetail = "Dossier complet avec revenus N1 et N2";
    pointsForts.push("Avis d'imposition N et N-1 fournis");
  }

  completudeScore = clamp(completudeScore, 0, 20);

  if (manquants.length > 0) {
    completudeDetail = `Champs manquants : ${manquants.join(", ")}`;
    manquants.forEach((m) => pointsAttention.push(`Champ critique manquant : ${m}`));
  } else if (!completudeDetail) {
    completudeDetail = "Dossier complet";
  }

  // ─── Profil (10 pts) ──────────────────────────────────────────────────────
  let profilScore = 5; // défaut
  let profilDetail = "";

  const age = calcAge(dossier.dateNaissance ?? "");
  if (age !== null) {
    if (age >= 25 && age <= 45) {
      profilScore = 10;
      profilDetail = `Âge optimal : ${age} ans`;
    } else if ((age >= 18 && age < 25) || (age > 45 && age <= 60)) {
      profilScore = 7;
      profilDetail = `Âge standard : ${age} ans`;
    } else {
      profilScore = 5;
      profilDetail = `Âge hors plage standard : ${age} ans`;
      if (age < 18) pointsAttention.push("Locataire mineur — dossier à vérifier");
      if (age > 60) pointsAttention.push("Profil senior — vérification recommandée");
    }
  } else {
    profilDetail = "Date de naissance non renseignée ou format invalide";
  }

  // ─── Total & grade ────────────────────────────────────────────────────────
  const total = clamp(
    solvabiliteScore + stabiliteScore + completudeScore + profilScore,
    0,
    100
  );
  const grade = getGrade(total);

  // ─── Recommandation ───────────────────────────────────────────────────────
  let recommandation = "";
  switch (grade) {
    case "EXCELLENT":
      recommandation = "Dossier solide — locataire fiable, loyer bien dans les normes.";
      break;
    case "BON":
      recommandation = "Dossier satisfaisant — quelques points mineurs à vérifier.";
      break;
    case "ACCEPTABLE":
      recommandation = "Dossier acceptable — garant ou caution solide recommandé.";
      break;
    case "FAIBLE":
      recommandation = "Dossier fragile — garant obligatoire ou refus conseillé.";
      break;
    case "INSUFFISANT":
      recommandation = "Dossier insuffisant — risque locatif élevé, refus recommandé.";
      break;
  }

  return {
    total,
    grade,
    dimensions: {
      solvabilite: { score: solvabiliteScore, max: 40, detail: solvabiliteDetail },
      stabilite: { score: stabiliteScore, max: 30, detail: stabiliteDetail },
      completude: { score: completudeScore, max: 20, detail: completudeDetail },
      profil: { score: profilScore, max: 10, detail: profilDetail },
    },
    recommandation,
    pointsForts,
    pointsAttention,
  };
}

// ─── BailScore Pro ────────────────────────────────────────────────────────────

export interface DossierProInput {
  kbis?: DossierKbis;
  bilans?: DossierBilan[];   // 2 derniers bilans (N et N-1)
  declaration2035?: Dossier2035[];
  ribFourni?: boolean;
  rcProFournie?: boolean;
  cniDirigeant?: boolean;
}

export interface BailScorePro {
  total: number;
  grade: "EXCELLENT" | "BON" | "ACCEPTABLE" | "FAIBLE" | "INSUFFISANT";
  dimensions: {
    solvabilitePro: { score: number; max: 35; detail: string };
    stabilitePro: { score: number; max: 30; detail: string };
    completudePro: { score: number; max: 20; detail: string };
    profilRisque: { score: number; max: 15; detail: string };
  };
  recommandation: string;
  pointsForts: string[];
  pointsAttention: string[];
}

export function computeBailScorePro(
  dossier: DossierProInput,
  loyerHT: number
): BailScorePro {
  const pointsForts: string[] = [];
  const pointsAttention: string[] = [];

  /* ─── Solvabilité pro (35 pts) ────────────────────────────────────────── */
  let solvabiliteScore = 0;
  let solvabiliteDetail = "";

  const bilans = dossier.bilans ?? [];
  const decl2035 = dossier.declaration2035 ?? [];

  /* CA annuel — priorité bilan, sinon 2035 */
  const caAnnuel = bilans[0]?.chiffreAffaires ?? (decl2035[0]?.recettes ?? 0);
  const resultatNet = bilans[0]?.resultatNet ?? (decl2035[0]?.benefice ?? 0);
  const loyerAnnuelHT = loyerHT * 12;

  if (caAnnuel > 0 && loyerAnnuelHT > 0) {
    const ratioCA = caAnnuel / loyerAnnuelHT;
    if (ratioCA >= 5) {
      solvabiliteScore = 35;
      solvabiliteDetail = `CA/loyer excellent : ×${ratioCA.toFixed(1)} (≥5×)`;
      pointsForts.push(`CA annuel ${ratioCA.toFixed(1)}× le loyer annuel HT`);
    } else if (ratioCA >= 3) {
      solvabiliteScore = 25;
      solvabiliteDetail = `CA/loyer correct : ×${ratioCA.toFixed(1)} (≥3×)`;
    } else if (ratioCA >= 2) {
      solvabiliteScore = 12;
      solvabiliteDetail = `CA/loyer insuffisant : ×${ratioCA.toFixed(1)} (<3×)`;
      pointsAttention.push(`Ratio CA/loyer faible : ${ratioCA.toFixed(1)}× (recommandé ≥ 3×)`);
    } else {
      solvabiliteScore = 0;
      solvabiliteDetail = `CA/loyer critique : ×${ratioCA.toFixed(1)}`;
      pointsAttention.push(`Ratio CA/loyer très faible : ${ratioCA.toFixed(1)}× (min 3×)`);
    }

    /* Bonus résultat net positif */
    if (resultatNet > 0) {
      solvabiliteScore = clamp(solvabiliteScore + 5, 0, 35);
      solvabiliteDetail += " + résultat net positif";
      pointsForts.push("Résultat net positif");
    } else if (resultatNet < 0) {
      pointsAttention.push("Résultat net négatif");
    }
  } else if (caAnnuel <= 0) {
    solvabiliteDetail = "CA non renseigné";
    pointsAttention.push("Chiffre d'affaires non renseigné");
  } else {
    solvabiliteDetail = "Loyer HT non renseigné";
  }

  /* ─── Stabilité activité (30 pts) ────────────────────────────────────── */
  let stabilitePro = 0;
  let stabiliteDetail = "";

  const kbis = dossier.kbis;
  if (kbis?.dateImmat) {
    const parts = kbis.dateImmat.split("/");
    if (parts.length === 3) {
      const anneeImmat = parseInt(parts[2]);
      const anciennete = new Date().getFullYear() - anneeImmat;
      if (anciennete >= 5) {
        stabilitePro = 20;
        stabiliteDetail = `Entreprise établie : ${anciennete} ans`;
        pointsForts.push(`SIRET actif depuis ${anciennete} ans`);
      } else if (anciennete >= 2) {
        stabilitePro = 12;
        stabiliteDetail = `Entreprise jeune : ${anciennete} ans`;
      } else {
        stabilitePro = 5;
        stabiliteDetail = `Entreprise très récente : ${anciennete} an(s)`;
        pointsAttention.push(`Entreprise créée il y a moins de 2 ans`);
      }
    }
  } else if (!kbis?.siret) {
    stabilitePro = 0;
    stabiliteDetail = "SIRET non renseigné";
    pointsAttention.push("SIRET non fourni");
  }

  /* Évolution CA sur 2 ans */
  if (bilans.length >= 2 || decl2035.length >= 2) {
    const ca0 = bilans[0]?.chiffreAffaires ?? decl2035[0]?.recettes ?? 0;
    const ca1 = bilans[1]?.chiffreAffaires ?? decl2035[1]?.recettes ?? 0;
    if (ca1 > 0 && ca0 > 0) {
      const evolution = (ca0 - ca1) / ca1;
      if (evolution >= 0.05) {
        stabilitePro = clamp(stabilitePro + 10, 0, 30);
        stabiliteDetail += ` + CA en hausse ${(evolution * 100).toFixed(0)}%`;
        pointsForts.push(`CA en progression de ${(evolution * 100).toFixed(0)}% sur 2 ans`);
      } else if (evolution < -0.20) {
        pointsAttention.push(`CA en baisse de ${Math.abs(evolution * 100).toFixed(0)}% sur 2 ans`);
      }
    } else {
      stabilitePro = clamp(stabilitePro + 5, 0, 30);
      stabiliteDetail += " + 2 exercices fournis";
    }
  }

  stabilitePro = clamp(stabilitePro, 0, 30);

  /* ─── Complétude dossier (20 pts) ────────────────────────────────────── */
  let completudeScore = 0;
  let completudeDetail = "";

  const pieces = [
    { label: "Kbis/SIRET", ok: !!(kbis?.siret), pts: 4 },
    { label: "Bilan N", ok: !!(bilans[0]?.chiffreAffaires || decl2035[0]?.recettes), pts: 4 },
    { label: "Bilan N-1", ok: !!(bilans[1]?.chiffreAffaires || decl2035[1]?.recettes), pts: 4 },
    { label: "RIB professionnel", ok: !!dossier.ribFourni, pts: 4 },
    { label: "RC Pro", ok: !!dossier.rcProFournie, pts: 2 },
    { label: "CNI dirigeant", ok: !!dossier.cniDirigeant, pts: 2 },
  ];

  const manquants: string[] = [];
  for (const p of pieces) {
    if (p.ok) {
      completudeScore += p.pts;
    } else {
      manquants.push(p.label);
    }
  }
  completudeScore = clamp(completudeScore, 0, 20);

  if (manquants.length === 0) {
    completudeDetail = "Dossier complet (toutes pièces fournies)";
    pointsForts.push("Dossier professionnel complet");
  } else {
    completudeDetail = `Pièces manquantes : ${manquants.join(", ")}`;
    manquants.forEach((m) => pointsAttention.push(`Pièce manquante : ${m}`));
  }

  /* ─── Profil risque (15 pts) ─────────────────────────────────────────── */
  let profilScore = 8;
  let profilDetail = "";

  const forme = (kbis?.formeJuridique ?? "").toUpperCase();
  if (["SARL", "SAS", "SASU", "SA", "EURL"].includes(forme)) {
    profilScore = 15;
    profilDetail = `Forme juridique stable : ${forme}`;
    pointsForts.push(`Structure juridique reconnue : ${forme}`);
  } else if (["SELARL", "SELAS", "SELAR"].includes(forme)) {
    profilScore = 12;
    profilDetail = `Société d'exercice libéral : ${forme}`;
  } else if (["EI", "EIRL", "MICRO-ENTREPRISE", "AUTO-ENTREPRENEUR"].includes(forme)) {
    profilScore = 8;
    profilDetail = `Entreprise individuelle : ${forme}`;
    pointsAttention.push("Entreprise individuelle — responsabilité patrimoniale");
  } else if (forme === "") {
    profilScore = 5;
    profilDetail = "Forme juridique non renseignée";
  }

  /* ─── Total & grade ──────────────────────────────────────────────────── */
  const total = clamp(solvabiliteScore + stabilitePro + completudeScore + profilScore, 0, 100);
  const grade = getGrade(total);

  let recommandation = "";
  switch (grade) {
    case "EXCELLENT":
      recommandation = "Dossier professionnel solide — activité pérenne, solvabilité excellente.";
      break;
    case "BON":
      recommandation = "Dossier satisfaisant — quelques éléments à vérifier.";
      break;
    case "ACCEPTABLE":
      recommandation = "Dossier acceptable — caution bancaire ou garantie complémentaire conseillée.";
      break;
    case "FAIBLE":
      recommandation = "Dossier fragile — garanties renforcées obligatoires ou refus conseillé.";
      break;
    case "INSUFFISANT":
      recommandation = "Dossier insuffisant — risque locatif élevé, refus recommandé.";
      break;
  }

  return {
    total,
    grade,
    dimensions: {
      solvabilitePro: { score: solvabiliteScore, max: 35, detail: solvabiliteDetail },
      stabilitePro: { score: stabilitePro, max: 30, detail: stabiliteDetail },
      completudePro: { score: completudeScore, max: 20, detail: completudeDetail },
      profilRisque: { score: profilScore, max: 15, detail: profilDetail },
    },
    recommandation,
    pointsForts,
    pointsAttention,
  };
}
