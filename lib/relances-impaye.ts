// ─── BailBot — Logique de relance graduée ─────────────────────────────────────

import type { Paiement } from './db-local';

export interface EtapeRelance {
  numero: 1 | 2 | 3 | 4;
  nom: string;
  declenchementJours: number;
  description: string;
  ton: 'amiable' | 'ferme' | 'officiel' | 'legal';
  action: string;
}

export const ETAPES_RELANCE: EtapeRelance[] = [
  {
    numero: 1,
    nom: 'Rappel amiable',
    declenchementJours: 3,
    description: 'Premier contact doux, supposer un oubli',
    ton: 'amiable',
    action: 'Email de rappel',
  },
  {
    numero: 2,
    nom: 'Relance ferme',
    declenchementJours: 8,
    description: 'Relance avec mention des conséquences',
    ton: 'ferme',
    action: 'Email + courrier PDF',
  },
  {
    numero: 3,
    nom: 'Mise en demeure',
    declenchementJours: 15,
    description: 'Document légal à valeur probante',
    ton: 'officiel',
    action: 'Lettre LRAR PDF à imprimer',
  },
  {
    numero: 4,
    nom: 'Information garant/assureur',
    declenchementJours: 20,
    description: 'Notification du garant et de la GLI',
    ton: 'legal',
    action: 'Email garant + démarche GLI',
  },
];

export function calculerJoursRetard(paiement: Paiement): number {
  const now = Date.now();
  if (paiement.statut === 'paye' && paiement.dateReelle) {
    return Math.floor((paiement.dateReelle - paiement.dateAttendue) / (1000 * 60 * 60 * 24));
  }
  return Math.max(0, Math.floor((now - paiement.dateAttendue) / (1000 * 60 * 60 * 24)));
}

export function calculerEtapesDues(paiement: Paiement): EtapeRelance[] {
  if (paiement.statut === 'paye') return [];
  const joursRetard = calculerJoursRetard(paiement);
  const etapesDejaEnvoyees = new Set(paiement.relances.map((r) => r.etape));

  return ETAPES_RELANCE.filter(
    (e) => joursRetard >= e.declenchementJours && !etapesDejaEnvoyees.has(e.numero)
  );
}

export function getProchainEtape(paiement: Paiement): EtapeRelance | null {
  const dues = calculerEtapesDues(paiement);
  if (dues.length === 0) return null;
  // Retourner l'étape la plus haute due
  return dues.reduce((max, e) => (e.numero > max.numero ? e : max), dues[0]);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMois(mois: string): string {
  const [year, month] = mois.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

export function genererTextRelance(
  etape: EtapeRelance,
  paiement: Paiement,
  infoBailleur: { nom: string; adresse: string; iban?: string; ville?: string }
): { objet: string; corps: string } {
  const prenom = paiement.locatairePrenom;
  const nom = paiement.locataireNom;
  const moisFormate = formatMois(paiement.mois);
  const loyer = paiement.loyerCC.toLocaleString('fr-FR');
  const dateAttendue = formatDate(paiement.dateAttendue);
  const adresseBien = infoBailleur.adresse;
  const nomBailleur = infoBailleur.nom;

  switch (etape.numero) {
    case 1: {
      return {
        objet: `Rappel loyer ${moisFormate} — ${adresseBien}`,
        corps: `Bonjour ${prenom} ${nom},

Sauf erreur de notre part, nous n'avons pas encore reçu le règlement de votre loyer du mois de ${moisFormate} d'un montant de ${loyer}€, attendu le ${dateAttendue}.

S'il s'agit d'un simple oubli, merci de procéder au virement dans les meilleurs délais.

${infoBailleur.iban ? `IBAN : ${infoBailleur.iban}\n\n` : ''}Cordialement,
${nomBailleur}`,
      };
    }

    case 2: {
      const relance1 = paiement.relances.find((r) => r.etape === 1);
      const dateRelance1 = relance1 ? formatDate(relance1.envoyeeAt) : 'précédemment';
      return {
        objet: `RELANCE — Loyer impayé ${moisFormate} — ${adresseBien}`,
        corps: `Bonjour ${prenom} ${nom},

Malgré notre premier rappel du ${dateRelance1}, nous n'avons toujours pas reçu le règlement de votre loyer de ${moisFormate} (${loyer}€).

Nous vous demandons de régulariser cette situation dans les 48 heures.

À défaut, nous serons contraints d'engager les procédures prévues par votre bail.

${nomBailleur}`,
      };
    }

    case 3: {
      const ville = infoBailleur.ville || '[Ville]';
      const today = formatDate(Date.now());
      return {
        objet: `MISE EN DEMEURE — Loyer impayé ${moisFormate} — ${adresseBien}`,
        corps: `MISE EN DEMEURE DE PAYER

${ville}, le ${today}

${nomBailleur}, bailleur,
à
${prenom} ${nom}, locataire du logement situé ${adresseBien}

Monsieur/Madame,

Par la présente, je vous mets en demeure de me régler, dans un délai de 8 jours à compter de la réception de ce courrier, la somme de ${loyer}€ correspondant aux loyers et charges impayés depuis le ${dateAttendue}.

Détail des sommes dues :
- Loyer ${moisFormate} : ${loyer}€

À défaut de règlement dans ce délai, je me verrai contraint(e) d'engager une procédure judiciaire d'expulsion conformément aux dispositions légales, notamment la clause résolutoire prévue à votre contrat de bail.

Fait à ${ville}, le ${today}
${nomBailleur}`,
      };
    }

    case 4: {
      const nbMois = 1; // par défaut, à affiner si plusieurs mois impayés
      return {
        objet: `Notification impayé locataire — Action requise`,
        corps: `Bonjour,

Vous vous êtes porté(e) garant(e) pour ${prenom} ${nom}, locataire du bien situé ${adresseBien}.

Celui-ci/celle-ci n'a pas réglé son loyer depuis ${nbMois} mois, soit un total de ${loyer}€.

Conformément à l'acte de cautionnement, nous vous demandons de régler cette somme dans un délai de 8 jours.

${nomBailleur}`,
      };
    }

    default:
      return { objet: '', corps: '' };
  }
}
