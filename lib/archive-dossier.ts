// ─── BailBot — Archive ZIP dossier locataire ─────────────────────────────────
// Génère un ZIP côté client (ZÉRO serveur).
// Deux usages :
//   1. Dashboard principal : genererArchiveDossier(dossier, fichiers, meta) → Blob
//   2. Dashboard multi    : genererArchiveMulti(candidature, bien?) → déclenche téléchargement

import type { DossierLocataire } from './parsers';
import type { Candidature, Bien } from './db-local';
import type { BailScore } from './bailscore';
import type { EligibiliteVisale } from './eligibilite-visale';
import type { CompletudeDossier } from './completude-dossier';

// ─── Types communs ─────────────────────────────────────────────────────────────

export interface FichierDossier {
  nom: string;       // Nom du fichier (ex: "CNI_recto.jpg")
  type: string;      // MIME type
  data: Blob | File; // Contenu
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTexteResume(
  dossier: Partial<DossierLocataire>,
  meta?: { score?: BailScore | null; visale?: EligibiliteVisale | null; completude?: CompletudeDossier | null }
): string {
  const nom = [dossier.prenom, dossier.nom].filter(Boolean).join(' ') || 'Locataire inconnu';
  const lines = [
    `DOSSIER LOCATAIRE — BAILBOT`,
    `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
    ``,
    `══════════════════════════════`,
    `LOCATAIRE : ${nom}`,
    `══════════════════════════════`,
    `Date de naissance : ${dossier.dateNaissance ?? 'N/A'}`,
    `N° CNI            : ${dossier.numeroCNI ?? 'N/A'}`,
    `Nationalité       : ${dossier.nationalite ?? 'N/A'}`,
    `Adresse actuelle  : ${dossier.adresseActuelle ?? 'N/A'}`,
    ``,
    `══════════════════════════════`,
    `SITUATION PROFESSIONNELLE`,
    `══════════════════════════════`,
    `Employeur         : ${dossier.employeur ?? 'N/A'}`,
    `Type contrat      : ${dossier.typeContrat ?? 'N/A'}`,
    `Ancienneté        : ${dossier.anciennete ?? 'N/A'}`,
    `Salaire net       : ${dossier.salaireNetMensuel ?? 0} €`,
    `Revenus N-1       : ${dossier.revenusN1 ?? 0} €`,
    `Revenus N-2       : ${dossier.revenusN2 ?? 0} €`,
    ``,
    `══════════════════════════════`,
    `COORDONNÉES BANCAIRES`,
    `══════════════════════════════`,
    `IBAN  : ${dossier.iban ?? 'N/A'}`,
    `BIC   : ${dossier.bic ?? 'N/A'}`,
    `Banque: ${dossier.banque ?? 'N/A'}`,
    ``,
  ];

  if (meta?.score) {
    lines.push(
      `══════════════════════════════`,
      `BAILSCORE`,
      `══════════════════════════════`,
      `Score : ${meta.score.total}/100 (${meta.score.grade})`,
      `Recommandation : ${meta.score.recommandation}`,
      ...(meta.score.pointsForts.map((p) => `✅ ${p}`)),
      ...(meta.score.pointsAttention.map((p) => `⚠️ ${p}`)),
      ``,
    );
  }

  if (meta?.visale) {
    lines.push(
      `══════════════════════════════`,
      `ÉLIGIBILITÉ VISALE`,
      `══════════════════════════════`,
      `Éligible : ${meta.visale.eligible ? 'OUI' : 'NON'}`,
      ...(meta.visale.motifs_refus?.map((m) => `❌ ${m}`) ?? []),
      ``,
    );
  }

  if (meta?.completude) {
    lines.push(
      `══════════════════════════════`,
      `COMPLÉTUDE DOSSIER`,
      `══════════════════════════════`,
      `Complétude : ${meta.completude.pourcentage}%`,
      ...(meta.completude.manquants.map((m) => `• Manquant : ${m}`)),
      ``,
    );
  }

  lines.push(
    `══════════════════════════════`,
    `MENTIONS LÉGALES RGPD`,
    `══════════════════════════════`,
    `Ce dossier a été traité localement dans votre navigateur.`,
    `Aucune donnée personnelle n'a été transmise à BailBot.`,
  );

  return lines.join('\n');
}

// ─── Usage 1 — Dashboard principal ───────────────────────────────────────────
// genererArchiveDossier(dossier, fichiers, meta) → Promise<Blob>

export async function genererArchiveDossier(
  dossier: Partial<DossierLocataire>,
  fichiers: FichierDossier[],
  meta?: { score?: BailScore | null; visale?: EligibiliteVisale | null; completude?: CompletudeDossier | null }
): Promise<Blob>;

// ─── Usage 2 — Dashboard multi (interne) ─────────────────────────────────────
// genererArchiveDossier(candidature, bien?) → Promise<void> (déclenche téléchargement)

export async function genererArchiveDossier(
  candidatureOrDossier: Candidature | Partial<DossierLocataire>,
  bienOrFichiers?: Bien | FichierDossier[],
  meta?: { score?: BailScore | null; visale?: EligibiliteVisale | null; completude?: CompletudeDossier | null }
): Promise<Blob | void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Détection du mode
  const isCandidature = 'bienId' in (candidatureOrDossier as any);

  if (isCandidature) {
    // Mode multi-dossiers
    const candidature = candidatureOrDossier as Candidature;
    const bien = bienOrFichiers as Bien | undefined;
    const dossier = candidature.dossier;
    const nomFichier = `${dossier?.prenom ?? ''}_${dossier?.nom ?? 'locataire'}`
      .trim().replace(/\s+/g, '_').toUpperCase();

    zip.file('README.txt', buildTexteResume(dossier ?? {}, {
      score: candidature.bailScore !== undefined
        ? { total: candidature.bailScore, grade: candidature.scoreGrade as any } as any
        : null,
    }));
    zip.file('dossier.json', JSON.stringify(candidature, null, 2));

    const csvLines = [
      'Champ,Valeur',
      `Nom,${dossier?.nom ?? ''}`,
      `Prénom,${dossier?.prenom ?? ''}`,
      `BailScore,${candidature.bailScore ?? ''}`,
      `Grade,${candidature.scoreGrade ?? ''}`,
      `Visale,${candidature.eligibleVisale ?? ''}`,
      `Alertes fraude,${candidature.alertesFraude ?? 0}`,
      `Salaire net,${dossier?.salaireNetMensuel ?? 0}`,
      `Type contrat,${dossier?.typeContrat ?? ''}`,
      `Complétude,${candidature.completude?.pourcentage ?? 0}%`,
      bien ? `Bien,${bien.adresse}` : '',
      bien ? `Loyer CC,${(bien.loyer + bien.charges).toLocaleString('fr-FR')} €` : '',
    ].filter(Boolean);
    zip.file('resume.csv', csvLines.join('\n'));

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BailBot_${nomFichier}_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return;
  }

  // Mode dashboard principal — retourne un Blob
  const dossier = candidatureOrDossier as Partial<DossierLocataire>;
  const fichiers = (Array.isArray(bienOrFichiers) ? bienOrFichiers : []) as FichierDossier[];

  zip.file('README.txt', buildTexteResume(dossier, meta));
  zip.file('dossier.json', JSON.stringify(dossier, null, 2));

  if (fichiers.length > 0) {
    const docs = zip.folder('documents');
    for (const fichier of fichiers) {
      docs!.file(fichier.nom, fichier.data);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

// ─── Raccourci téléchargement (dashboard principal) ───────────────────────────

export function telechargerArchive(blob: Blob, nom: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BailBot_${nom}_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ─── Raccourci pour DossierModal (usage 2 simplifié) ─────────────────────────

export async function genererArchiveMulti(candidature: Candidature, bien?: Bien): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const dossier = candidature.dossier;
  const nomFichier = `${dossier?.prenom ?? ''}_${dossier?.nom ?? 'locataire'}`
    .trim().replace(/\s+/g, '_').toUpperCase();

  zip.file('README.txt', buildTexteResume(dossier ?? {}, {
    score: candidature.bailScore !== undefined
      ? { total: candidature.bailScore, grade: candidature.scoreGrade as any } as any
      : null,
  }));
  zip.file('dossier.json', JSON.stringify(candidature, null, 2));

  const csvLines = [
    'Champ,Valeur',
    `Nom,${dossier?.nom ?? ''}`,
    `Prénom,${dossier?.prenom ?? ''}`,
    `BailScore,${candidature.bailScore ?? ''}`,
    `Grade,${candidature.scoreGrade ?? ''}`,
    `Visale,${candidature.eligibleVisale ?? ''}`,
    `Alertes fraude,${candidature.alertesFraude ?? 0}`,
    `Salaire net,${dossier?.salaireNetMensuel ?? 0}`,
    `Type contrat,${dossier?.typeContrat ?? ''}`,
    `Complétude,${candidature.completude?.pourcentage ?? 0}%`,
    bien ? `Bien,${bien.adresse}` : '',
    bien ? `Loyer CC,${(bien.loyer + bien.charges).toLocaleString('fr-FR')} €` : '',
  ].filter(Boolean);
  zip.file('resume.csv', csvLines.join('\n'));

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BailBot_${nomFichier}_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
