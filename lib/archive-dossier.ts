// ─── BailBot — Archive ZIP dossier locataire ─────────────────────────────────
// Génère un ZIP téléchargeable avec toutes les infos du dossier (ZÉRO serveur)

import type { Candidature } from './db-local';
import type { Bien } from './db-local';
import { calculerBailScore } from './bailscore';
import { calculerEligibiliteVisale } from './eligibilite-visale';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR');
}

function buildReadme(candidature: Candidature, bien?: Bien): string {
  const { dossier, bailScore, scoreGrade, eligibleVisale, alertesFraude, aGarant, dossierGarant, completude } = candidature;
  const nom = `${dossier?.prenom ?? ''} ${dossier?.nom ?? ''}`.trim() || 'Locataire inconnu';

  const lines = [
    `DOSSIER LOCATAIRE — BAILBOT`,
    `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
    ``,
    `═══════════════════════════════════════`,
    `BIEN CONCERNÉ`,
    `═══════════════════════════════════════`,
    bien ? `Adresse : ${bien.adresse}` : '',
    bien ? `Loyer : ${bien.loyer}€ CC (charges : ${bien.charges}€)` : '',
    ``,
    `═══════════════════════════════════════`,
    `LOCATAIRE`,
    `═══════════════════════════════════════`,
    `Nom : ${nom}`,
    `Date de naissance : ${dossier?.dateNaissance ?? 'N/A'}`,
    `N° CNI : ${dossier?.numeroCNI ?? 'N/A'}`,
    `Adresse actuelle : ${dossier?.adresseActuelle ?? 'N/A'}`,
    ``,
    `═══════════════════════════════════════`,
    `SITUATION PROFESSIONNELLE`,
    `═══════════════════════════════════════`,
    `Employeur : ${dossier?.employeur ?? 'N/A'}`,
    `Type contrat : ${dossier?.typeContrat ?? 'N/A'}`,
    `Salaire net mensuel : ${dossier?.salaireNetMensuel ?? 0}€`,
    `Ancienneté : ${dossier?.anciennete ?? 'N/A'}`,
    `Revenus N-1 : ${dossier?.revenusN1 ?? 0}€`,
    `Revenus N-2 : ${dossier?.revenusN2 ?? 0}€`,
    ``,
    `═══════════════════════════════════════`,
    `COORDONNÉES BANCAIRES`,
    `═══════════════════════════════════════`,
    `IBAN : ${dossier?.iban ?? 'N/A'}`,
    `BIC : ${dossier?.bic ?? 'N/A'}`,
    `Banque : ${dossier?.banque ?? 'N/A'}`,
    ``,
    `═══════════════════════════════════════`,
    `ANALYSE BAILBOT`,
    `═══════════════════════════════════════`,
    `BailScore : ${bailScore ?? 'N/A'}/100 (${scoreGrade ?? 'N/A'})`,
    `Éligibilité Visale : ${eligibleVisale === true ? 'OUI' : eligibleVisale === false ? 'NON' : 'N/A'}`,
    `Alertes fraude : ${alertesFraude ?? 0}`,
    ``,
    `Complétude dossier : ${completude?.pourcentage ?? 0}%`,
    completude?.manquants?.length ? `Documents manquants : ${completude.manquants.join(', ')}` : `Documents : complet`,
    ``,
  ];

  if (aGarant && dossierGarant) {
    lines.push(
      `═══════════════════════════════════════`,
      `GARANT`,
      `═══════════════════════════════════════`,
      `Nom : ${dossierGarant.prenom ?? ''} ${dossierGarant.nom ?? ''}`.trim(),
      `Lien : ${dossierGarant.lienParente ?? 'N/A'}`,
      `Type contrat : ${dossierGarant.typeContrat ?? 'N/A'}`,
      `Salaire net mensuel : ${dossierGarant.salaireNetMensuel ?? 0}€`,
      `Revenus N-1 : ${dossierGarant.revenusN1 ?? 0}€`,
      `IBAN : ${dossierGarant.iban ?? 'N/A'}`,
      ``,
    );
  }

  lines.push(
    `═══════════════════════════════════════`,
    `MENTIONS LÉGALES`,
    `═══════════════════════════════════════`,
    `Ce dossier a été traité localement dans votre navigateur.`,
    `Aucune donnée personnelle n'a été transmise à BailBot.`,
    `Conformité RGPD : les données sont stockées dans IndexedDB`,
    `et purgeables à tout moment depuis le dashboard.`,
  );

  return lines.filter(Boolean).join('\n');
}

export async function genererArchiveDossier(
  candidature: Candidature,
  bien?: Bien
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const nom = `${candidature.dossier?.prenom ?? ''}_${candidature.dossier?.nom ?? 'locataire'}`
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();

  const readme = buildReadme(candidature, bien);
  zip.file('README.txt', readme);

  // JSON technique (dossier complet)
  zip.file('dossier.json', JSON.stringify(candidature, null, 2));

  // Fiche résumé CSV pour tableur
  const csvLines = [
    'Champ,Valeur',
    `Nom,${candidature.dossier?.nom ?? ''}`,
    `Prénom,${candidature.dossier?.prenom ?? ''}`,
    `BailScore,${candidature.bailScore ?? ''}`,
    `Grade,${candidature.scoreGrade ?? ''}`,
    `Visale,${candidature.eligibleVisale ?? ''}`,
    `Alertes fraude,${candidature.alertesFraude ?? 0}`,
    `Salaire net,${candidature.dossier?.salaireNetMensuel ?? 0}`,
    `Type contrat,${candidature.dossier?.typeContrat ?? ''}`,
    `Complétude,${candidature.completude?.pourcentage ?? 0}%`,
  ];
  zip.file('resume.csv', csvLines.join('\n'));

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BailBot_${nom}_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
