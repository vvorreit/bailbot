// ─── BailBot — Stockage IndexedDB local ──────────────────────────────────────
// ZÉRO donnée locataire sur le serveur — tout reste dans le navigateur.

import type { DossierLocataire, Garant } from './parsers';

const DB_NAME = 'bailbot-local';
const DB_VERSION = 3;

// ─── PAIEMENTS & RELANCES ─────────────────────────────────────────────────────

export interface Relance {
  id: string;
  etape: 1 | 2 | 3 | 4;
  envoyeeAt: number;
  methode: 'email' | 'sms' | 'courrier' | 'lrar';
  statut: 'envoyee' | 'confirmee';
}

export interface Paiement {
  id: string;
  bienId: string;
  locataireNom: string;
  locatairePrenom: string;
  locataireEmail?: string;
  loyerCC: number;
  dateAttendue: number;
  dateReelle?: number;
  statut: 'attendu' | 'paye' | 'retard' | 'impaye' | 'partiel';
  montantRecu?: number;
  mois: string; // "2026-03"
  notes?: string;
  relances: Relance[];
  createdAt: number;
  updatedAt: number;
}

export type TypeBail = 'HABITATION_VIDE' | 'HABITATION_MEUBLE' | 'PROFESSIONNEL';

export interface Diagnostic {
  type: 'DPE' | 'electricite' | 'gaz' | 'plomb' | 'amiante';
  dateExpiration?: number;
}

export interface Bien {
  id: string;
  adresse: string;
  loyer: number;
  charges: number;
  typeBail: TypeBail;
  createdAt: number;
  // Bail actif
  locataireNom?: string;
  locatairePrenom?: string;
  dateEntree?: number;
  dateFin?: number;
  preavisMois?: number;
  dateRevision?: number;
  indiceReference?: string;
  // Diagnostics
  diagnostics?: Diagnostic[];
  // Statut
  statut?: 'loue' | 'selection' | 'vacant';
}

export interface Completude {
  pourcentage: number;
  manquants: string[];
}

export interface Candidature {
  id: string;
  bienId: string;
  statut: 'en_attente' | 'en_analyse' | 'complet' | 'selectionne' | 'refuse';
  dossier: Partial<DossierLocataire>;
  bailScore?: number;
  scoreGrade?: string;
  eligibleVisale?: boolean;
  alertesFraude?: number;
  // Garant
  aGarant: boolean;
  dossierGarant?: Garant;
  // Complétude dossier
  completude?: Completude;
  createdAt: number;
  updatedAt: number;
}

// ─── Calcul de complétude ─────────────────────────────────────────────────────

const DOCS_REQUIS: Array<{ label: string; check: (d: Partial<DossierLocataire>) => boolean }> = [
  { label: 'CNI / Identité', check: (d) => !!(d.nom && d.dateNaissance && d.numeroCNI) },
  { label: 'Bulletin de paie', check: (d) => !!(d.salaireNetMensuel && d.salaireNetMensuel > 0) },
  { label: 'Contrat de travail', check: (d) => !!(d.typeContrat && d.typeContrat.trim()) },
  { label: 'Avis d\'imposition', check: (d) => !!(d.revenusN1 && d.revenusN1 > 0) },
  { label: 'RIB', check: (d) => !!(d.iban && d.iban.trim()) },
  { label: 'Justificatif de domicile', check: (d) => !!(d.adresseDomicile && d.adresseDomicile.trim()) },
];

export function calculerCompletude(dossier: Partial<DossierLocataire>): Completude {
  const manquants: string[] = [];
  let ok = 0;
  for (const doc of DOCS_REQUIS) {
    if (doc.check(dossier)) {
      ok++;
    } else {
      manquants.push(doc.label);
    }
  }
  return {
    pourcentage: Math.round((ok / DOCS_REQUIS.length) * 100),
    manquants,
  };
}

// ─── Guard SSR ────────────────────────────────────────────────────────────────

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

async function getDB() {
  if (!isClient()) throw new Error('IndexedDB non disponible (SSR)');
  const { openDB } = await import('idb');
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('biens')) {
        const bienStore = db.createObjectStore('biens', { keyPath: 'id' });
        bienStore.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('candidatures')) {
        const candStore = db.createObjectStore('candidatures', { keyPath: 'id' });
        candStore.createIndex('bienId', 'bienId');
        candStore.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('paiements')) {
        const paiStore = db.createObjectStore('paiements', { keyPath: 'id' });
        paiStore.createIndex('bienId', 'bienId');
        paiStore.createIndex('mois', 'mois');
        paiStore.createIndex('statut', 'statut');
        paiStore.createIndex('createdAt', 'createdAt');
      }
    },
  });
}

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── BIENS ────────────────────────────────────────────────────────────────────

export async function creerBien(bien: Omit<Bien, 'id' | 'createdAt'>): Promise<Bien> {
  const db = await getDB();
  const record: Bien = { typeBail: 'HABITATION_VIDE', ...bien, id: uuid(), createdAt: Date.now() };
  await db.put('biens', record);
  return record;
}

export async function listerBiens(): Promise<Bien[]> {
  const db = await getDB();
  const all = await db.getAll('biens');
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function mettreAJourBien(id: string, patch: Partial<Omit<Bien, 'id' | 'createdAt'>>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('biens', id);
  if (!existing) throw new Error(`Bien ${id} introuvable`);
  await db.put('biens', { ...existing, ...patch });
}

export async function supprimerBien(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('biens', id);

  // Cascade → candidatures
  const txCand = db.transaction('candidatures', 'readwrite');
  const candKeys = await txCand.store.index('bienId').getAllKeys(id);
  await Promise.all(candKeys.map((k) => txCand.store.delete(k)));
  await txCand.done;

  // Cascade → paiements
  const txPai = db.transaction('paiements', 'readwrite');
  const paiKeys = await txPai.store.index('bienId').getAllKeys(id);
  await Promise.all(paiKeys.map((k) => txPai.store.delete(k)));
  await txPai.done;
}

// ─── CANDIDATURES ────────────────────────────────────────────────────────────

export async function creerCandidature(
  candidature: Omit<Candidature, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Candidature> {
  const db = await getDB();
  const now = Date.now();
  const completude = calculerCompletude(candidature.dossier);
  const record: Candidature = { ...candidature, completude, id: uuid(), createdAt: now, updatedAt: now };
  await db.put('candidatures', record);
  return record;
}

export async function listerCandidatures(bienId: string): Promise<Candidature[]> {
  const db = await getDB();
  const index = db.transaction('candidatures').store.index('bienId');
  const all = await index.getAll(bienId);
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getCandidature(id: string): Promise<Candidature | undefined> {
  const db = await getDB();
  return db.get('candidatures', id);
}

export async function mettreAJourCandidature(
  id: string,
  patch: Partial<Omit<Candidature, 'id' | 'createdAt'>>
): Promise<void> {
  const db = await getDB();
  const existing = await db.get('candidatures', id);
  if (!existing) throw new Error(`Candidature ${id} introuvable`);
  // Recalcule la complétude si le dossier change
  const dossier = patch.dossier ?? existing.dossier;
  const completude = calculerCompletude(dossier);
  await db.put('candidatures', { ...existing, ...patch, completude, updatedAt: Date.now() });
}

export async function supprimerCandidature(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('candidatures', id);
}

export async function toutesLesCandidatures(): Promise<Candidature[]> {
  const db = await getDB();
  return db.getAll('candidatures');
}

// ─── RGPD — Purge automatique ────────────────────────────────────────────────

// ─── RECHERCHE FULL-TEXT ──────────────────────────────────────────────────────

/**
 * Normalise une chaîne pour la recherche (minuscules, sans accents)
 */
function normaliser(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Recherche full-text dans toutes les candidatures
 * Cherche dans : nom, prénom, employeur, adresse bien, adresse actuelle
 * Minimum 2 caractères
 */
export async function rechercherCandidatures(query: string): Promise<Candidature[]> {
  if (query.length < 2) return [];
  const q = normaliser(query);
  const all = await toutesLesCandidatures();
  // Récupérer tous les biens pour l'adresse
  const biens = await listerBiensMap();
  
  return all.filter((c) => {
    const d = c.dossier;
    const bien = biens[c.bienId];
    const champs = [
      d.nom || '',
      d.prenom || '',
      d.employeur || '',
      d.adresseDomicile || '',
      d.adresseActuelle || '',
      bien?.adresse || '',
    ];
    return champs.some((champ) => normaliser(champ).includes(q));
  });
}

async function listerBiensMap(): Promise<Record<string, Bien>> {
  const biens = await listerBiens();
  return Object.fromEntries(biens.map((b) => [b.id, b]));
}

// ─── PAIEMENTS ────────────────────────────────────────────────────────────────

export async function creerPaiement(
  p: Omit<Paiement, 'id' | 'createdAt' | 'updatedAt' | 'relances'>
): Promise<Paiement> {
  const db = await getDB();
  const now = Date.now();
  const record: Paiement = { ...p, id: uuid(), relances: [], createdAt: now, updatedAt: now };
  await db.put('paiements', record);
  return record;
}

export async function listerPaiements(bienId?: string, mois?: string): Promise<Paiement[]> {
  const db = await getDB();
  let all: Paiement[];
  if (bienId) {
    const index = db.transaction('paiements').store.index('bienId');
    all = await index.getAll(bienId);
  } else {
    all = await db.getAll('paiements');
  }
  if (mois) {
    all = all.filter((p) => p.mois === mois);
  }
  return all.sort((a, b) => b.dateAttendue - a.dateAttendue);
}

export async function mettreAJourPaiement(id: string, patch: Partial<Paiement>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('paiements', id);
  if (!existing) throw new Error(`Paiement ${id} introuvable`);
  await db.put('paiements', { ...existing, ...patch, updatedAt: Date.now() });
}

export async function ajouterRelance(
  paiementId: string,
  relance: Omit<Relance, 'id'>
): Promise<void> {
  const db = await getDB();
  const existing = await db.get('paiements', paiementId);
  if (!existing) throw new Error(`Paiement ${paiementId} introuvable`);
  const newRelance: Relance = { ...relance, id: uuid() };
  await db.put('paiements', {
    ...existing,
    relances: [...(existing.relances || []), newRelance],
    updatedAt: Date.now(),
  });
}

export async function listerImpayes(): Promise<Paiement[]> {
  const db = await getDB();
  const all = await db.getAll('paiements');
  return all
    .filter((p) => p.statut === 'retard' || p.statut === 'impaye')
    .sort((a, b) => a.dateAttendue - b.dateAttendue);
}

export async function mettreAJourStatutsRetard(): Promise<void> {
  const db = await getDB();
  const all = await db.getAll('paiements');
  const now = Date.now();
  const updates: Promise<void>[] = [];
  for (const p of all) {
    if (p.statut === 'attendu' && p.dateAttendue < now) {
      const joursRetard = Math.floor((now - p.dateAttendue) / (1000 * 60 * 60 * 24));
      const newStatut = joursRetard >= 15 ? 'impaye' : 'retard';
      updates.push(
        db.put('paiements', { ...p, statut: newStatut, updatedAt: now }).then(() => {})
      );
    }
  }
  await Promise.all(updates);
}

export async function supprimerPaiement(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('paiements', id);
}

export async function purgerAnciensDossiers(joursMax: number = 90): Promise<number> {
  const db = await getDB();
  const all = await db.getAll('candidatures');
  const cutoff = Date.now() - joursMax * 24 * 60 * 60 * 1000;
  const anciens = all.filter((c) => c.createdAt < cutoff);
  await Promise.all(anciens.map((c) => db.delete('candidatures', c.id)));
  return anciens.length;
}
