// ─── BailBot — Stockage IndexedDB local ──────────────────────────────────────
// ZÉRO donnée locataire sur le serveur — tout reste dans le navigateur.

import type { DossierLocataire, Garant } from './parsers';

const DB_NAME = 'bailbot-local';
const DB_VERSION = 1;

export interface Bien {
  id: string;
  adresse: string;
  loyer: number;
  charges: number;
  createdAt: number;
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
  const record: Bien = { ...bien, id: uuid(), createdAt: Date.now() };
  await db.put('biens', record);
  return record;
}

export async function listerBiens(): Promise<Bien[]> {
  const db = await getDB();
  const all = await db.getAll('biens');
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function supprimerBien(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('biens', id);
  const tx = db.transaction('candidatures', 'readwrite');
  const index = tx.store.index('bienId');
  const keys = await index.getAllKeys(id);
  await Promise.all(keys.map((k) => tx.store.delete(k)));
  await tx.done;
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

export async function purgerAnciensDossiers(joursMax: number = 90): Promise<number> {
  const db = await getDB();
  const all = await db.getAll('candidatures');
  const cutoff = Date.now() - joursMax * 24 * 60 * 60 * 1000;
  const anciens = all.filter((c) => c.createdAt < cutoff);
  await Promise.all(anciens.map((c) => db.delete('candidatures', c.id)));
  return anciens.length;
}
