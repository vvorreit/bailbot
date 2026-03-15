"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ElementEDL {
  nom: string;
  etat: string;
  commentaire: string;
  photos: string[];
}

interface PieceEDL {
  nom: string;
  elements: ElementEDL[];
}

const ETAT_SCORES: Record<string, number> = {
  'Très bon': 4,
  'Bon': 3,
  'Usure normale': 2,
  'Mauvais état': 1,
  'À remplacer': 0,
};

function etatScore(etat: string): number {
  return ETAT_SCORES[etat] ?? 2;
}

/* ─── Comparaison element par element ────────────────────────────────────── */

export interface ComparaisonElement {
  nom: string;
  etatEntree: string;
  etatSortie: string;
  scoreEntree: number;
  scoreSortie: number;
  delta: number;
  imputable: boolean;
  estimationRetenue: number;
  commentaireEntree: string;
  commentaireSortie: string;
  photosEntree: string[];
  photosSortie: string[];
}

export interface ComparaisonPiece {
  nom: string;
  elements: ComparaisonElement[];
  totalRetenue: number;
  hasDegradation: boolean;
}

export interface ResultatComparaison {
  bienId: string;
  adresse: string;
  edlEntreeId: string;
  edlSortieId: string;
  dateEntree: string;
  dateSortie: string;
  nomLocataire: string;
  pieces: ComparaisonPiece[];
  totalRetenue: number;
  depotGarantie: number | null;
  verdict: 'restitution_integrale' | 'retenue_partielle' | 'retenue_totale';
  verdictLabel: string;
}

/* Estimation forfaitaire par type de dégradation */
const COUT_PAR_ELEMENT: Record<string, number> = {
  'Murs': 150,
  'Sol': 200,
  'Plafond': 120,
  'Fenêtres': 250,
  'Volets / stores': 180,
  'Prises électriques': 80,
  'Interrupteurs': 50,
  'Éclairage': 60,
  'Radiateur / chauffage': 200,
  'Évier': 150,
  'Robinetterie': 100,
  'Plaques de cuisson': 200,
  'Hotte': 150,
  'Placards': 120,
  'Placard / rangement': 120,
  'Baignoire / douche': 300,
  'Lavabo': 150,
  'WC': 200,
  'Cuvette': 200,
  'Chasse d\'eau': 80,
  'Lave-mains': 100,
  'Miroir': 60,
  'VMC': 100,
};

function estimerRetenue(nomElement: string, delta: number): number {
  if (delta <= 1) return 0;
  const coutBase = COUT_PAR_ELEMENT[nomElement] || 100;
  const facteur = Math.min(delta - 1, 3) / 3;
  return Math.round(coutBase * facteur);
}

/* ─── Fonction principale ────────────────────────────────────────────────── */

export async function compareEDL(
  edlEntreeId: string,
  edlSortieId: string,
): Promise<ResultatComparaison | { error: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Non autorisé" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return { error: "Utilisateur introuvable" };

  const [edlEntree, edlSortie] = await Promise.all([
    prisma.etatDesLieux.findFirst({ where: { id: edlEntreeId, userId: user.id } }),
    prisma.etatDesLieux.findFirst({ where: { id: edlSortieId, userId: user.id } }),
  ]);

  if (!edlEntree || !edlSortie) return { error: "EDL introuvable" };
  if (edlEntree.type !== 'ENTREE') return { error: "Le premier EDL doit être un EDL d'entrée" };
  if (edlSortie.type !== 'SORTIE') return { error: "Le second EDL doit être un EDL de sortie" };

  const bien = await prisma.bien.findFirst({
    where: { id: edlEntree.bienId, userId: user.id },
  });

  const bail = edlEntree.bailId
    ? await prisma.bailActif.findFirst({ where: { id: edlEntree.bailId } })
    : null;

  const piecesEntree = (edlEntree.pieces as unknown as PieceEDL[]) || [];
  const piecesSortie = (edlSortie.pieces as unknown as PieceEDL[]) || [];

  const comparaisons: ComparaisonPiece[] = [];

  /* Comparer piece par piece */
  for (const pe of piecesEntree) {
    const ps = piecesSortie.find((p) => p.nom === pe.nom);
    if (!ps) continue;

    const elements: ComparaisonElement[] = [];

    for (const ee of pe.elements) {
      const es = ps.elements.find((e) => e.nom === ee.nom);
      if (!es) continue;

      const scoreEntree = etatScore(ee.etat);
      const scoreSortie = etatScore(es.etat);
      const delta = scoreEntree - scoreSortie;
      const imputable = delta > 1;

      elements.push({
        nom: ee.nom,
        etatEntree: ee.etat,
        etatSortie: es.etat,
        scoreEntree,
        scoreSortie,
        delta,
        imputable,
        estimationRetenue: imputable ? estimerRetenue(ee.nom, delta) : 0,
        commentaireEntree: ee.commentaire || '',
        commentaireSortie: es.commentaire || '',
        photosEntree: ee.photos || [],
        photosSortie: es.photos || [],
      });
    }

    const totalRetenue = elements.reduce((sum, e) => sum + e.estimationRetenue, 0);
    const hasDegradation = elements.some((e) => e.imputable);

    comparaisons.push({
      nom: pe.nom,
      elements,
      totalRetenue,
      hasDegradation,
    });
  }

  const totalRetenue = comparaisons.reduce((sum, p) => sum + p.totalRetenue, 0);
  const depotGarantie = bail?.depotGarantie || null;

  let verdict: ResultatComparaison['verdict'];
  let verdictLabel: string;

  if (totalRetenue === 0) {
    verdict = 'restitution_integrale';
    verdictLabel = 'Restitution intégrale du dépôt de garantie';
  } else if (depotGarantie && totalRetenue >= depotGarantie) {
    verdict = 'retenue_totale';
    verdictLabel = `Retenue totale : ${totalRetenue.toLocaleString('fr-FR')} €`;
  } else {
    verdict = 'retenue_partielle';
    verdictLabel = `Retenue partielle : ${totalRetenue.toLocaleString('fr-FR')} €`;
  }

  return {
    bienId: edlEntree.bienId,
    adresse: bien?.adresse || '',
    edlEntreeId,
    edlSortieId,
    dateEntree: new Date(edlEntree.date).toISOString(),
    dateSortie: new Date(edlSortie.date).toISOString(),
    nomLocataire: '',
    pieces: comparaisons,
    totalRetenue,
    depotGarantie,
    verdict,
    verdictLabel,
  };
}

export async function getEdlPairForBien(bienId: string): Promise<{
  entree: { id: string; date: string } | null;
  sortie: { id: string; date: string } | null;
}> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { entree: null, sortie: null };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) return { entree: null, sortie: null };

  const edls = await prisma.etatDesLieux.findMany({
    where: { userId: user.id, bienId },
    orderBy: { date: 'desc' },
    select: { id: true, type: true, date: true },
  });

  const entree = edls.find((e) => e.type === 'ENTREE');
  const sortie = edls.find((e) => e.type === 'SORTIE');

  return {
    entree: entree ? { id: entree.id, date: new Date(entree.date).toISOString() } : null,
    sortie: sortie ? { id: sortie.id, date: new Date(sortie.date).toISOString() } : null,
  };
}
