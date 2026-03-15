/**
 * Encadrement des loyers — BailBot
 * Données issues des arrêtés préfectoraux (€/m²/mois)
 * À mettre à jour annuellement : https://www.encadrementdesloyers.gouv.fr
 * Dernière mise à jour : mars 2026 (données 2024-2025)
 */

export type TypeLocation = 'vide' | 'meuble';
export type EpoqueConstruction = 'avant_1946' | '1946_1970' | '1971_1990' | '1991_2005' | 'apres_2005';
export type NbPieces = 1 | 2 | 3 | 4;

export interface RefLoyer {
  reference: number;      // loyer médian de référence (€/m²/mois)
  majore: number;         // loyer de référence majoré (+20%) — PLAFOND LÉGAL
  minore: number;         // loyer de référence minoré (-30%) — plancher
}

export interface ZoneEncadrement {
  code: string;
  label: string;
  details?: string;
}

export interface VilleEncadrement {
  nom: string;
  active: boolean;        // encadrement en vigueur
  dateApplication: string;
  zones: ZoneEncadrement[];
  // Données : [zone][type][epoque][nbPieces]
  data: Record<string, Record<TypeLocation, Record<EpoqueConstruction, Record<NbPieces, RefLoyer>>>>;
}

// ─── LYON ─────────────────────────────────────────────────────────────────────
// Arrêté préfectoral 2024 — valeurs moyennes par arrondissement
// Source : DRIHL Auvergne-Rhône-Alpes
const LYON: VilleEncadrement = {
  nom: 'Lyon',
  active: true,
  dateApplication: '2021-11-01',
  zones: [
    { code: 'lyon_1_2', label: '1er et 2e arrondissement', details: 'Presqu\'île, Bellecour' },
    { code: 'lyon_3_6', label: '3e et 6e arrondissement', details: 'Part-Dieu, Brotteaux' },
    { code: 'lyon_4_5', label: '4e et 5e arrondissement', details: 'Croix-Rousse, Vieux-Lyon' },
    { code: 'lyon_7_8', label: '7e et 8e arrondissement', details: 'Gerland, Monplaisir' },
    { code: 'lyon_9', label: '9e arrondissement', details: 'Vaise, Saint-Rambert' },
    { code: 'villeurbanne', label: 'Villeurbanne', details: 'Gratte-Ciel, Charpennes' },
  ],
  data: {
    lyon_1_2: {
      vide: {
        avant_1946:  { 1: { reference: 15.5, majore: 18.6, minore: 10.85 }, 2: { reference: 12.8, majore: 15.36, minore: 8.96 }, 3: { reference: 11.2, majore: 13.44, minore: 7.84 }, 4: { reference: 10.1, majore: 12.12, minore: 7.07 } },
        '1946_1970': { 1: { reference: 13.2, majore: 15.84, minore: 9.24 }, 2: { reference: 11.1, majore: 13.32, minore: 7.77 }, 3: { reference: 10.0, majore: 12.0, minore: 7.0 }, 4: { reference: 9.2, majore: 11.04, minore: 6.44 } },
        '1971_1990': { 1: { reference: 12.8, majore: 15.36, minore: 8.96 }, 2: { reference: 10.8, majore: 12.96, minore: 7.56 }, 3: { reference: 9.8, majore: 11.76, minore: 6.86 }, 4: { reference: 9.0, majore: 10.8, minore: 6.3 } },
        '1991_2005': { 1: { reference: 13.5, majore: 16.2, minore: 9.45 }, 2: { reference: 11.4, majore: 13.68, minore: 7.98 }, 3: { reference: 10.3, majore: 12.36, minore: 7.21 }, 4: { reference: 9.5, majore: 11.4, minore: 6.65 } },
        apres_2005:  { 1: { reference: 15.8, majore: 18.96, minore: 11.06 }, 2: { reference: 13.2, majore: 15.84, minore: 9.24 }, 3: { reference: 11.8, majore: 14.16, minore: 8.26 }, 4: { reference: 10.8, majore: 12.96, minore: 7.56 } },
      },
      meuble: {
        avant_1946:  { 1: { reference: 17.6, majore: 21.12, minore: 12.32 }, 2: { reference: 14.5, majore: 17.4, minore: 10.15 }, 3: { reference: 12.8, majore: 15.36, minore: 8.96 }, 4: { reference: 11.5, majore: 13.8, minore: 8.05 } },
        '1946_1970': { 1: { reference: 15.0, majore: 18.0, minore: 10.5 }, 2: { reference: 12.6, majore: 15.12, minore: 8.82 }, 3: { reference: 11.4, majore: 13.68, minore: 7.98 }, 4: { reference: 10.5, majore: 12.6, minore: 7.35 } },
        '1971_1990': { 1: { reference: 14.5, majore: 17.4, minore: 10.15 }, 2: { reference: 12.2, majore: 14.64, minore: 8.54 }, 3: { reference: 11.1, majore: 13.32, minore: 7.77 }, 4: { reference: 10.2, majore: 12.24, minore: 7.14 } },
        '1991_2005': { 1: { reference: 15.3, majore: 18.36, minore: 10.71 }, 2: { reference: 12.9, majore: 15.48, minore: 9.03 }, 3: { reference: 11.7, majore: 14.04, minore: 8.19 }, 4: { reference: 10.8, majore: 12.96, minore: 7.56 } },
        apres_2005:  { 1: { reference: 17.9, majore: 21.48, minore: 12.53 }, 2: { reference: 15.0, majore: 18.0, minore: 10.5 }, 3: { reference: 13.4, majore: 16.08, minore: 9.38 }, 4: { reference: 12.3, majore: 14.76, minore: 8.61 } },
      },
    },
    lyon_3_6: {
      vide: {
        avant_1946:  { 1: { reference: 14.8, majore: 17.76, minore: 10.36 }, 2: { reference: 12.2, majore: 14.64, minore: 8.54 }, 3: { reference: 10.8, majore: 12.96, minore: 7.56 }, 4: { reference: 9.8, majore: 11.76, minore: 6.86 } },
        '1946_1970': { 1: { reference: 12.5, majore: 15.0, minore: 8.75 }, 2: { reference: 10.6, majore: 12.72, minore: 7.42 }, 3: { reference: 9.6, majore: 11.52, minore: 6.72 }, 4: { reference: 8.8, majore: 10.56, minore: 6.16 } },
        '1971_1990': { 1: { reference: 12.2, majore: 14.64, minore: 8.54 }, 2: { reference: 10.3, majore: 12.36, minore: 7.21 }, 3: { reference: 9.4, majore: 11.28, minore: 6.58 }, 4: { reference: 8.6, majore: 10.32, minore: 6.02 } },
        '1991_2005': { 1: { reference: 12.9, majore: 15.48, minore: 9.03 }, 2: { reference: 10.9, majore: 13.08, minore: 7.63 }, 3: { reference: 9.9, majore: 11.88, minore: 6.93 }, 4: { reference: 9.1, majore: 10.92, minore: 6.37 } },
        apres_2005:  { 1: { reference: 15.0, majore: 18.0, minore: 10.5 }, 2: { reference: 12.5, majore: 15.0, minore: 8.75 }, 3: { reference: 11.2, majore: 13.44, minore: 7.84 }, 4: { reference: 10.2, majore: 12.24, minore: 7.14 } },
      },
      meuble: {
        avant_1946:  { 1: { reference: 16.8, majore: 20.16, minore: 11.76 }, 2: { reference: 13.8, majore: 16.56, minore: 9.66 }, 3: { reference: 12.2, majore: 14.64, minore: 8.54 }, 4: { reference: 11.1, majore: 13.32, minore: 7.77 } },
        '1946_1970': { 1: { reference: 14.2, majore: 17.04, minore: 9.94 }, 2: { reference: 12.0, majore: 14.4, minore: 8.4 }, 3: { reference: 10.9, majore: 13.08, minore: 7.63 }, 4: { reference: 10.0, majore: 12.0, minore: 7.0 } },
        '1971_1990': { 1: { reference: 13.8, majore: 16.56, minore: 9.66 }, 2: { reference: 11.7, majore: 14.04, minore: 8.19 }, 3: { reference: 10.6, majore: 12.72, minore: 7.42 }, 4: { reference: 9.8, majore: 11.76, minore: 6.86 } },
        '1991_2005': { 1: { reference: 14.6, majore: 17.52, minore: 10.22 }, 2: { reference: 12.4, majore: 14.88, minore: 8.68 }, 3: { reference: 11.2, majore: 13.44, minore: 7.84 }, 4: { reference: 10.3, majore: 12.36, minore: 7.21 } },
        apres_2005:  { 1: { reference: 17.0, majore: 20.4, minore: 11.9 }, 2: { reference: 14.2, majore: 17.04, minore: 9.94 }, 3: { reference: 12.7, majore: 15.24, minore: 8.89 }, 4: { reference: 11.6, majore: 13.92, minore: 8.12 } },
      },
    },
    // Autres zones Lyon — valeurs moyennes simplifiées
    lyon_4_5: {
      vide: {
        avant_1946:  { 1: { reference: 14.2, majore: 17.04, minore: 9.94 }, 2: { reference: 11.8, majore: 14.16, minore: 8.26 }, 3: { reference: 10.5, majore: 12.6, minore: 7.35 }, 4: { reference: 9.5, majore: 11.4, minore: 6.65 } },
        '1946_1970': { 1: { reference: 12.0, majore: 14.4, minore: 8.4 }, 2: { reference: 10.2, majore: 12.24, minore: 7.14 }, 3: { reference: 9.2, majore: 11.04, minore: 6.44 }, 4: { reference: 8.5, majore: 10.2, minore: 5.95 } },
        '1971_1990': { 1: { reference: 11.7, majore: 14.04, minore: 8.19 }, 2: { reference: 9.9, majore: 11.88, minore: 6.93 }, 3: { reference: 9.0, majore: 10.8, minore: 6.3 }, 4: { reference: 8.3, majore: 9.96, minore: 5.81 } },
        '1991_2005': { 1: { reference: 12.4, majore: 14.88, minore: 8.68 }, 2: { reference: 10.5, majore: 12.6, minore: 7.35 }, 3: { reference: 9.5, majore: 11.4, minore: 6.65 }, 4: { reference: 8.8, majore: 10.56, minore: 6.16 } },
        apres_2005:  { 1: { reference: 14.5, majore: 17.4, minore: 10.15 }, 2: { reference: 12.0, majore: 14.4, minore: 8.4 }, 3: { reference: 10.8, majore: 12.96, minore: 7.56 }, 4: { reference: 9.8, majore: 11.76, minore: 6.86 } },
      },
      meuble: {
        avant_1946:  { 1: { reference: 16.1, majore: 19.32, minore: 11.27 }, 2: { reference: 13.4, majore: 16.08, minore: 9.38 }, 3: { reference: 11.9, majore: 14.28, minore: 8.33 }, 4: { reference: 10.8, majore: 12.96, minore: 7.56 } },
        '1946_1970': { 1: { reference: 13.6, majore: 16.32, minore: 9.52 }, 2: { reference: 11.6, majore: 13.92, minore: 8.12 }, 3: { reference: 10.5, majore: 12.6, minore: 7.35 }, 4: { reference: 9.7, majore: 11.64, minore: 6.79 } },
        '1971_1990': { 1: { reference: 13.3, majore: 15.96, minore: 9.31 }, 2: { reference: 11.2, majore: 13.44, minore: 7.84 }, 3: { reference: 10.2, majore: 12.24, minore: 7.14 }, 4: { reference: 9.4, majore: 11.28, minore: 6.58 } },
        '1991_2005': { 1: { reference: 14.1, majore: 16.92, minore: 9.87 }, 2: { reference: 11.9, majore: 14.28, minore: 8.33 }, 3: { reference: 10.8, majore: 12.96, minore: 7.56 }, 4: { reference: 10.0, majore: 12.0, minore: 7.0 } },
        apres_2005:  { 1: { reference: 16.5, majore: 19.8, minore: 11.55 }, 2: { reference: 13.6, majore: 16.32, minore: 9.52 }, 3: { reference: 12.2, majore: 14.64, minore: 8.54 }, 4: { reference: 11.2, majore: 13.44, minore: 7.84 } },
      },
    },
    lyon_7_8: {
      vide: {
        avant_1946:  { 1: { reference: 13.5, majore: 16.2, minore: 9.45 }, 2: { reference: 11.2, majore: 13.44, minore: 7.84 }, 3: { reference: 10.0, majore: 12.0, minore: 7.0 }, 4: { reference: 9.1, majore: 10.92, minore: 6.37 } },
        '1946_1970': { 1: { reference: 11.5, majore: 13.8, minore: 8.05 }, 2: { reference: 9.8, majore: 11.76, minore: 6.86 }, 3: { reference: 8.9, majore: 10.68, minore: 6.23 }, 4: { reference: 8.2, majore: 9.84, minore: 5.74 } },
        '1971_1990': { 1: { reference: 11.2, majore: 13.44, minore: 7.84 }, 2: { reference: 9.5, majore: 11.4, minore: 6.65 }, 3: { reference: 8.7, majore: 10.44, minore: 6.09 }, 4: { reference: 8.0, majore: 9.6, minore: 5.6 } },
        '1991_2005': { 1: { reference: 11.9, majore: 14.28, minore: 8.33 }, 2: { reference: 10.1, majore: 12.12, minore: 7.07 }, 3: { reference: 9.2, majore: 11.04, minore: 6.44 }, 4: { reference: 8.5, majore: 10.2, minore: 5.95 } },
        apres_2005:  { 1: { reference: 13.8, majore: 16.56, minore: 9.66 }, 2: { reference: 11.5, majore: 13.8, minore: 8.05 }, 3: { reference: 10.3, majore: 12.36, minore: 7.21 }, 4: { reference: 9.4, majore: 11.28, minore: 6.58 } },
      },
      meuble: {
        avant_1946:  { 1: { reference: 15.3, majore: 18.36, minore: 10.71 }, 2: { reference: 12.7, majore: 15.24, minore: 8.89 }, 3: { reference: 11.4, majore: 13.68, minore: 7.98 }, 4: { reference: 10.3, majore: 12.36, minore: 7.21 } },
        '1946_1970': { 1: { reference: 13.1, majore: 15.72, minore: 9.17 }, 2: { reference: 11.1, majore: 13.32, minore: 7.77 }, 3: { reference: 10.1, majore: 12.12, minore: 7.07 }, 4: { reference: 9.3, majore: 11.16, minore: 6.51 } },
        '1971_1990': { 1: { reference: 12.7, majore: 15.24, minore: 8.89 }, 2: { reference: 10.8, majore: 12.96, minore: 7.56 }, 3: { reference: 9.9, majore: 11.88, minore: 6.93 }, 4: { reference: 9.1, majore: 10.92, minore: 6.37 } },
        '1991_2005': { 1: { reference: 13.5, majore: 16.2, minore: 9.45 }, 2: { reference: 11.5, majore: 13.8, minore: 8.05 }, 3: { reference: 10.4, majore: 12.48, minore: 7.28 }, 4: { reference: 9.6, majore: 11.52, minore: 6.72 } },
        apres_2005:  { 1: { reference: 15.7, majore: 18.84, minore: 10.99 }, 2: { reference: 13.0, majore: 15.6, minore: 9.1 }, 3: { reference: 11.7, majore: 14.04, minore: 8.19 }, 4: { reference: 10.7, majore: 12.84, minore: 7.49 } },
      },
    },
    lyon_9: {
      vide: {
        avant_1946:  { 1: { reference: 12.8, majore: 15.36, minore: 8.96 }, 2: { reference: 10.7, majore: 12.84, minore: 7.49 }, 3: { reference: 9.6, majore: 11.52, minore: 6.72 }, 4: { reference: 8.8, majore: 10.56, minore: 6.16 } },
        '1946_1970': { 1: { reference: 10.9, majore: 13.08, minore: 7.63 }, 2: { reference: 9.3, majore: 11.16, minore: 6.51 }, 3: { reference: 8.5, majore: 10.2, minore: 5.95 }, 4: { reference: 7.8, majore: 9.36, minore: 5.46 } },
        '1971_1990': { 1: { reference: 10.6, majore: 12.72, minore: 7.42 }, 2: { reference: 9.0, majore: 10.8, minore: 6.3 }, 3: { reference: 8.3, majore: 9.96, minore: 5.81 }, 4: { reference: 7.6, majore: 9.12, minore: 5.32 } },
        '1991_2005': { 1: { reference: 11.3, majore: 13.56, minore: 7.91 }, 2: { reference: 9.6, majore: 11.52, minore: 6.72 }, 3: { reference: 8.8, majore: 10.56, minore: 6.16 }, 4: { reference: 8.1, majore: 9.72, minore: 5.67 } },
        apres_2005:  { 1: { reference: 13.1, majore: 15.72, minore: 9.17 }, 2: { reference: 10.9, majore: 13.08, minore: 7.63 }, 3: { reference: 9.8, majore: 11.76, minore: 6.86 }, 4: { reference: 9.0, majore: 10.8, minore: 6.3 } },
      },
      meuble: {
        avant_1946:  { 1: { reference: 14.5, majore: 17.4, minore: 10.15 }, 2: { reference: 12.1, majore: 14.52, minore: 8.47 }, 3: { reference: 10.9, majore: 13.08, minore: 7.63 }, 4: { reference: 10.0, majore: 12.0, minore: 7.0 } },
        '1946_1970': { 1: { reference: 12.4, majore: 14.88, minore: 8.68 }, 2: { reference: 10.6, majore: 12.72, minore: 7.42 }, 3: { reference: 9.7, majore: 11.64, minore: 6.79 }, 4: { reference: 8.9, majore: 10.68, minore: 6.23 } },
        '1971_1990': { 1: { reference: 12.0, majore: 14.4, minore: 8.4 }, 2: { reference: 10.2, majore: 12.24, minore: 7.14 }, 3: { reference: 9.4, majore: 11.28, minore: 6.58 }, 4: { reference: 8.6, majore: 10.32, minore: 6.02 } },
        '1991_2005': { 1: { reference: 12.8, majore: 15.36, minore: 8.96 }, 2: { reference: 10.9, majore: 13.08, minore: 7.63 }, 3: { reference: 9.9, majore: 11.88, minore: 6.93 }, 4: { reference: 9.2, majore: 11.04, minore: 6.44 } },
        apres_2005:  { 1: { reference: 14.9, majore: 17.88, minore: 10.43 }, 2: { reference: 12.4, majore: 14.88, minore: 8.68 }, 3: { reference: 11.1, majore: 13.32, minore: 7.77 }, 4: { reference: 10.2, majore: 12.24, minore: 7.14 } },
      },
    },
    villeurbanne: {
      vide: {
        avant_1946:  { 1: { reference: 12.2, majore: 14.64, minore: 8.54 }, 2: { reference: 10.3, majore: 12.36, minore: 7.21 }, 3: { reference: 9.3, majore: 11.16, minore: 6.51 }, 4: { reference: 8.5, majore: 10.2, minore: 5.95 } },
        '1946_1970': { 1: { reference: 10.5, majore: 12.6, minore: 7.35 }, 2: { reference: 9.0, majore: 10.8, minore: 6.3 }, 3: { reference: 8.2, majore: 9.84, minore: 5.74 }, 4: { reference: 7.6, majore: 9.12, minore: 5.32 } },
        '1971_1990': { 1: { reference: 10.2, majore: 12.24, minore: 7.14 }, 2: { reference: 8.7, majore: 10.44, minore: 6.09 }, 3: { reference: 8.0, majore: 9.6, minore: 5.6 }, 4: { reference: 7.4, majore: 8.88, minore: 5.18 } },
        '1991_2005': { 1: { reference: 10.9, majore: 13.08, minore: 7.63 }, 2: { reference: 9.3, majore: 11.16, minore: 6.51 }, 3: { reference: 8.5, majore: 10.2, minore: 5.95 }, 4: { reference: 7.8, majore: 9.36, minore: 5.46 } },
        apres_2005:  { 1: { reference: 12.5, majore: 15.0, minore: 8.75 }, 2: { reference: 10.5, majore: 12.6, minore: 7.35 }, 3: { reference: 9.4, majore: 11.28, minore: 6.58 }, 4: { reference: 8.7, majore: 10.44, minore: 6.09 } },
      },
      meuble: {
        avant_1946:  { 1: { reference: 13.8, majore: 16.56, minore: 9.66 }, 2: { reference: 11.7, majore: 14.04, minore: 8.19 }, 3: { reference: 10.6, majore: 12.72, minore: 7.42 }, 4: { reference: 9.7, majore: 11.64, minore: 6.79 } },
        '1946_1970': { 1: { reference: 11.9, majore: 14.28, minore: 8.33 }, 2: { reference: 10.2, majore: 12.24, minore: 7.14 }, 3: { reference: 9.3, majore: 11.16, minore: 6.51 }, 4: { reference: 8.6, majore: 10.32, minore: 6.02 } },
        '1971_1990': { 1: { reference: 11.6, majore: 13.92, minore: 8.12 }, 2: { reference: 9.9, majore: 11.88, minore: 6.93 }, 3: { reference: 9.1, majore: 10.92, minore: 6.37 }, 4: { reference: 8.4, majore: 10.08, minore: 5.88 } },
        '1991_2005': { 1: { reference: 12.4, majore: 14.88, minore: 8.68 }, 2: { reference: 10.5, majore: 12.6, minore: 7.35 }, 3: { reference: 9.6, majore: 11.52, minore: 6.72 }, 4: { reference: 8.9, majore: 10.68, minore: 6.23 } },
        apres_2005:  { 1: { reference: 14.2, majore: 17.04, minore: 9.94 }, 2: { reference: 11.9, majore: 14.28, minore: 8.33 }, 3: { reference: 10.7, majore: 12.84, minore: 7.49 }, 4: { reference: 9.9, majore: 11.88, minore: 6.93 } },
      },
    },
  },
};

// ─── PARIS ────────────────────────────────────────────────────────────────────
// Données simplifiées par grande zone (arrêté 2024)
const PARIS: VilleEncadrement = {
  nom: 'Paris',
  active: true,
  dateApplication: '2019-07-01',
  zones: [
    { code: 'paris_centre', label: '1er au 4e arr.', details: 'Centre historique' },
    { code: 'paris_est', label: '10e, 11e, 12e arr.', details: 'Bastille, Nation' },
    { code: 'paris_nord', label: '18e, 19e, 20e arr.', details: 'Montmartre, Belleville' },
    { code: 'paris_ouest', label: '7e, 8e, 16e, 17e arr.', details: 'Passy, Ternes' },
    { code: 'paris_sud', label: '5e, 6e, 13e, 14e, 15e arr.', details: 'Latin, Montparnasse' },
  ],
  data: {
    paris_centre: {
      vide: {
        avant_1946:  { 1: { reference: 29.5, majore: 35.4, minore: 20.65 }, 2: { reference: 24.2, majore: 29.04, minore: 16.94 }, 3: { reference: 21.0, majore: 25.2, minore: 14.7 }, 4: { reference: 18.5, majore: 22.2, minore: 12.95 } },
        '1946_1970': { 1: { reference: 25.0, majore: 30.0, minore: 17.5 }, 2: { reference: 20.8, majore: 24.96, minore: 14.56 }, 3: { reference: 18.2, majore: 21.84, minore: 12.74 }, 4: { reference: 16.0, majore: 19.2, minore: 11.2 } },
        '1971_1990': { 1: { reference: 24.2, majore: 29.04, minore: 16.94 }, 2: { reference: 20.0, majore: 24.0, minore: 14.0 }, 3: { reference: 17.5, majore: 21.0, minore: 12.25 }, 4: { reference: 15.5, majore: 18.6, minore: 10.85 } },
        '1991_2005': { 1: { reference: 26.0, majore: 31.2, minore: 18.2 }, 2: { reference: 21.5, majore: 25.8, minore: 15.05 }, 3: { reference: 18.8, majore: 22.56, minore: 13.16 }, 4: { reference: 16.5, majore: 19.8, minore: 11.55 } },
        apres_2005:  { 1: { reference: 31.0, majore: 37.2, minore: 21.7 }, 2: { reference: 25.5, majore: 30.6, minore: 17.85 }, 3: { reference: 22.0, majore: 26.4, minore: 15.4 }, 4: { reference: 19.5, majore: 23.4, minore: 13.65 } },
      },
      meuble: {
        avant_1946:  { 1: { reference: 33.5, majore: 40.2, minore: 23.45 }, 2: { reference: 27.5, majore: 33.0, minore: 19.25 }, 3: { reference: 23.9, majore: 28.68, minore: 16.73 }, 4: { reference: 21.0, majore: 25.2, minore: 14.7 } },
        '1946_1970': { 1: { reference: 28.4, majore: 34.08, minore: 19.88 }, 2: { reference: 23.6, majore: 28.32, minore: 16.52 }, 3: { reference: 20.7, majore: 24.84, minore: 14.49 }, 4: { reference: 18.2, majore: 21.84, minore: 12.74 } },
        '1971_1990': { 1: { reference: 27.5, majore: 33.0, minore: 19.25 }, 2: { reference: 22.7, majore: 27.24, minore: 15.89 }, 3: { reference: 19.9, majore: 23.88, minore: 13.93 }, 4: { reference: 17.6, majore: 21.12, minore: 12.32 } },
        '1991_2005': { 1: { reference: 29.5, majore: 35.4, minore: 20.65 }, 2: { reference: 24.4, majore: 29.28, minore: 17.08 }, 3: { reference: 21.3, majore: 25.56, minore: 14.91 }, 4: { reference: 18.8, majore: 22.56, minore: 13.16 } },
        apres_2005:  { 1: { reference: 35.2, majore: 42.24, minore: 24.64 }, 2: { reference: 29.0, majore: 34.8, minore: 20.3 }, 3: { reference: 25.0, majore: 30.0, minore: 17.5 }, 4: { reference: 22.1, majore: 26.52, minore: 15.47 } },
      },
    },
    paris_est: {
      vide: {
        avant_1946:  { 1: { reference: 26.8, majore: 32.16, minore: 18.76 }, 2: { reference: 22.0, majore: 26.4, minore: 15.4 }, 3: { reference: 19.2, majore: 23.04, minore: 13.44 }, 4: { reference: 16.9, majore: 20.28, minore: 11.83 } },
        '1946_1970': { 1: { reference: 22.8, majore: 27.36, minore: 15.96 }, 2: { reference: 18.9, majore: 22.68, minore: 13.23 }, 3: { reference: 16.5, majore: 19.8, minore: 11.55 }, 4: { reference: 14.6, majore: 17.52, minore: 10.22 } },
        '1971_1990': { 1: { reference: 22.0, majore: 26.4, minore: 15.4 }, 2: { reference: 18.2, majore: 21.84, minore: 12.74 }, 3: { reference: 15.9, majore: 19.08, minore: 11.13 }, 4: { reference: 14.1, majore: 16.92, minore: 9.87 } },
        '1991_2005': { 1: { reference: 23.7, majore: 28.44, minore: 16.59 }, 2: { reference: 19.6, majore: 23.52, minore: 13.72 }, 3: { reference: 17.1, majore: 20.52, minore: 11.97 }, 4: { reference: 15.1, majore: 18.12, minore: 10.57 } },
        apres_2005:  { 1: { reference: 28.2, majore: 33.84, minore: 19.74 }, 2: { reference: 23.2, majore: 27.84, minore: 16.24 }, 3: { reference: 20.1, majore: 24.12, minore: 14.07 }, 4: { reference: 17.8, majore: 21.36, minore: 12.46 } },
      },
      meuble: {
        avant_1946:  { 1: { reference: 30.5, majore: 36.6, minore: 21.35 }, 2: { reference: 25.0, majore: 30.0, minore: 17.5 }, 3: { reference: 21.8, majore: 26.16, minore: 15.26 }, 4: { reference: 19.2, majore: 23.04, minore: 13.44 } },
        '1946_1970': { 1: { reference: 25.9, majore: 31.08, minore: 18.13 }, 2: { reference: 21.5, majore: 25.8, minore: 15.05 }, 3: { reference: 18.7, majore: 22.44, minore: 13.09 }, 4: { reference: 16.6, majore: 19.92, minore: 11.62 } },
        '1971_1990': { 1: { reference: 25.0, majore: 30.0, minore: 17.5 }, 2: { reference: 20.7, majore: 24.84, minore: 14.49 }, 3: { reference: 18.1, majore: 21.72, minore: 12.67 }, 4: { reference: 16.0, majore: 19.2, minore: 11.2 } },
        '1991_2005': { 1: { reference: 26.9, majore: 32.28, minore: 18.83 }, 2: { reference: 22.3, majore: 26.76, minore: 15.61 }, 3: { reference: 19.4, majore: 23.28, minore: 13.58 }, 4: { reference: 17.2, majore: 20.64, minore: 12.04 } },
        apres_2005:  { 1: { reference: 32.0, majore: 38.4, minore: 22.4 }, 2: { reference: 26.3, majore: 31.56, minore: 18.41 }, 3: { reference: 22.8, majore: 27.36, minore: 15.96 }, 4: { reference: 20.2, majore: 24.24, minore: 14.14 } },
      },
    },
    paris_nord: {
      vide: {
        avant_1946:  { 1: { reference: 24.5, majore: 29.4, minore: 17.15 }, 2: { reference: 20.2, majore: 24.24, minore: 14.14 }, 3: { reference: 17.6, majore: 21.12, minore: 12.32 }, 4: { reference: 15.5, majore: 18.6, minore: 10.85 } },
        '1946_1970': { 1: { reference: 20.8, majore: 24.96, minore: 14.56 }, 2: { reference: 17.3, majore: 20.76, minore: 12.11 }, 3: { reference: 15.1, majore: 18.12, minore: 10.57 }, 4: { reference: 13.4, majore: 16.08, minore: 9.38 } },
        '1971_1990': { 1: { reference: 20.1, majore: 24.12, minore: 14.07 }, 2: { reference: 16.7, majore: 20.04, minore: 11.69 }, 3: { reference: 14.6, majore: 17.52, minore: 10.22 }, 4: { reference: 12.9, majore: 15.48, minore: 9.03 } },
        '1991_2005': { 1: { reference: 21.7, majore: 26.04, minore: 15.19 }, 2: { reference: 18.0, majore: 21.6, minore: 12.6 }, 3: { reference: 15.7, majore: 18.84, minore: 10.99 }, 4: { reference: 13.9, majore: 16.68, minore: 9.73 } },
        apres_2005:  { 1: { reference: 25.8, majore: 30.96, minore: 18.06 }, 2: { reference: 21.3, majore: 25.56, minore: 14.91 }, 3: { reference: 18.5, majore: 22.2, minore: 12.95 }, 4: { reference: 16.4, majore: 19.68, minore: 11.48 } },
      },
      meuble: {
        avant_1946:  { 1: { reference: 27.8, majore: 33.36, minore: 19.46 }, 2: { reference: 22.9, majore: 27.48, minore: 16.03 }, 3: { reference: 20.0, majore: 24.0, minore: 14.0 }, 4: { reference: 17.6, majore: 21.12, minore: 12.32 } },
        '1946_1970': { 1: { reference: 23.6, majore: 28.32, minore: 16.52 }, 2: { reference: 19.6, majore: 23.52, minore: 13.72 }, 3: { reference: 17.2, majore: 20.64, minore: 12.04 }, 4: { reference: 15.2, majore: 18.24, minore: 10.64 } },
        '1971_1990': { 1: { reference: 22.8, majore: 27.36, minore: 15.96 }, 2: { reference: 19.0, majore: 22.8, minore: 13.3 }, 3: { reference: 16.6, majore: 19.92, minore: 11.62 }, 4: { reference: 14.7, majore: 17.64, minore: 10.29 } },
        '1991_2005': { 1: { reference: 24.6, majore: 29.52, minore: 17.22 }, 2: { reference: 20.5, majore: 24.6, minore: 14.35 }, 3: { reference: 17.8, majore: 21.36, minore: 12.46 }, 4: { reference: 15.8, majore: 18.96, minore: 11.06 } },
        apres_2005:  { 1: { reference: 29.3, majore: 35.16, minore: 20.51 }, 2: { reference: 24.2, majore: 29.04, minore: 16.94 }, 3: { reference: 21.0, majore: 25.2, minore: 14.7 }, 4: { reference: 18.6, majore: 22.32, minore: 13.02 } },
      },
    },
    paris_ouest: {
      vide: {
        avant_1946:  { 1: { reference: 30.2, majore: 36.24, minore: 21.14 }, 2: { reference: 24.8, majore: 29.76, minore: 17.36 }, 3: { reference: 21.6, majore: 25.92, minore: 15.12 }, 4: { reference: 19.0, majore: 22.8, minore: 13.3 } },
        '1946_1970': { 1: { reference: 25.6, majore: 30.72, minore: 17.92 }, 2: { reference: 21.2, majore: 25.44, minore: 14.84 }, 3: { reference: 18.5, majore: 22.2, minore: 12.95 }, 4: { reference: 16.3, majore: 19.56, minore: 11.41 } },
        '1971_1990': { 1: { reference: 24.8, majore: 29.76, minore: 17.36 }, 2: { reference: 20.5, majore: 24.6, minore: 14.35 }, 3: { reference: 17.9, majore: 21.48, minore: 12.53 }, 4: { reference: 15.8, majore: 18.96, minore: 11.06 } },
        '1991_2005': { 1: { reference: 26.7, majore: 32.04, minore: 18.69 }, 2: { reference: 22.0, majore: 26.4, minore: 15.4 }, 3: { reference: 19.2, majore: 23.04, minore: 13.44 }, 4: { reference: 16.9, majore: 20.28, minore: 11.83 } },
        apres_2005:  { 1: { reference: 31.8, majore: 38.16, minore: 22.26 }, 2: { reference: 26.1, majore: 31.32, minore: 18.27 }, 3: { reference: 22.6, majore: 27.12, minore: 15.82 }, 4: { reference: 20.0, majore: 24.0, minore: 14.0 } },
      },
      meuble: {
        avant_1946:  { 1: { reference: 34.3, majore: 41.16, minore: 24.01 }, 2: { reference: 28.2, majore: 33.84, minore: 19.74 }, 3: { reference: 24.5, majore: 29.4, minore: 17.15 }, 4: { reference: 21.6, majore: 25.92, minore: 15.12 } },
        '1946_1970': { 1: { reference: 29.1, majore: 34.92, minore: 20.37 }, 2: { reference: 24.1, majore: 28.92, minore: 16.87 }, 3: { reference: 21.0, majore: 25.2, minore: 14.7 }, 4: { reference: 18.5, majore: 22.2, minore: 12.95 } },
        '1971_1990': { 1: { reference: 28.2, majore: 33.84, minore: 19.74 }, 2: { reference: 23.3, majore: 27.96, minore: 16.31 }, 3: { reference: 20.3, majore: 24.36, minore: 14.21 }, 4: { reference: 17.9, majore: 21.48, minore: 12.53 } },
        '1991_2005': { 1: { reference: 30.3, majore: 36.36, minore: 21.21 }, 2: { reference: 25.0, majore: 30.0, minore: 17.5 }, 3: { reference: 21.8, majore: 26.16, minore: 15.26 }, 4: { reference: 19.2, majore: 23.04, minore: 13.44 } },
        apres_2005:  { 1: { reference: 36.1, majore: 43.32, minore: 25.27 }, 2: { reference: 29.6, majore: 35.52, minore: 20.72 }, 3: { reference: 25.7, majore: 30.84, minore: 17.99 }, 4: { reference: 22.7, majore: 27.24, minore: 15.89 } },
      },
    },
    paris_sud: {
      vide: {
        avant_1946:  { 1: { reference: 27.5, majore: 33.0, minore: 19.25 }, 2: { reference: 22.6, majore: 27.12, minore: 15.82 }, 3: { reference: 19.7, majore: 23.64, minore: 13.79 }, 4: { reference: 17.4, majore: 20.88, minore: 12.18 } },
        '1946_1970': { 1: { reference: 23.3, majore: 27.96, minore: 16.31 }, 2: { reference: 19.3, majore: 23.16, minore: 13.51 }, 3: { reference: 16.9, majore: 20.28, minore: 11.83 }, 4: { reference: 14.9, majore: 17.88, minore: 10.43 } },
        '1971_1990': { 1: { reference: 22.5, majore: 27.0, minore: 15.75 }, 2: { reference: 18.6, majore: 22.32, minore: 13.02 }, 3: { reference: 16.3, majore: 19.56, minore: 11.41 }, 4: { reference: 14.4, majore: 17.28, minore: 10.08 } },
        '1991_2005': { 1: { reference: 24.2, majore: 29.04, minore: 16.94 }, 2: { reference: 20.0, majore: 24.0, minore: 14.0 }, 3: { reference: 17.5, majore: 21.0, minore: 12.25 }, 4: { reference: 15.4, majore: 18.48, minore: 10.78 } },
        apres_2005:  { 1: { reference: 29.0, majore: 34.8, minore: 20.3 }, 2: { reference: 23.8, majore: 28.56, minore: 16.66 }, 3: { reference: 20.6, majore: 24.72, minore: 14.42 }, 4: { reference: 18.3, majore: 21.96, minore: 12.81 } },
      },
      meuble: {
        avant_1946:  { 1: { reference: 31.3, majore: 37.56, minore: 21.91 }, 2: { reference: 25.7, majore: 30.84, minore: 17.99 }, 3: { reference: 22.3, majore: 26.76, minore: 15.61 }, 4: { reference: 19.7, majore: 23.64, minore: 13.79 } },
        '1946_1970': { 1: { reference: 26.5, majore: 31.8, minore: 18.55 }, 2: { reference: 21.9, majore: 26.28, minore: 15.33 }, 3: { reference: 19.2, majore: 23.04, minore: 13.44 }, 4: { reference: 16.9, majore: 20.28, minore: 11.83 } },
        '1971_1990': { 1: { reference: 25.6, majore: 30.72, minore: 17.92 }, 2: { reference: 21.1, majore: 25.32, minore: 14.77 }, 3: { reference: 18.5, majore: 22.2, minore: 12.95 }, 4: { reference: 16.4, majore: 19.68, minore: 11.48 } },
        '1991_2005': { 1: { reference: 27.5, majore: 33.0, minore: 19.25 }, 2: { reference: 22.7, majore: 27.24, minore: 15.89 }, 3: { reference: 19.8, majore: 23.76, minore: 13.86 }, 4: { reference: 17.5, majore: 21.0, minore: 12.25 } },
        apres_2005:  { 1: { reference: 33.0, majore: 39.6, minore: 23.1 }, 2: { reference: 27.0, majore: 32.4, minore: 18.9 }, 3: { reference: 23.4, majore: 28.08, minore: 16.38 }, 4: { reference: 20.8, majore: 24.96, minore: 14.56 } },
      },
    },
  },
};

// ─── Index des villes ──────────────────────────────────────────────────────────
export const VILLES_ENCADREMENT: Record<string, VilleEncadrement> = {
  lyon: LYON,
  paris: PARIS,
};

// ─── Détection ville depuis adresse ───────────────────────────────────────────
export function detecterVilleEncadrement(adresse: string): string | null {
  const lower = adresse.toLowerCase();
  if (lower.includes('paris') || /\b75\d{3}\b/.test(adresse)) return 'paris';
  if (lower.includes('lyon') || lower.includes('villeurbanne') || /\b69\d{3}\b/.test(adresse)) return 'lyon';
  return null;
}

// ─── Calcul plafond ────────────────────────────────────────────────────────────
export interface ResultatPlafond {
  ville: string;
  zone: ZoneEncadrement;
  type: TypeLocation;
  nbPieces: NbPieces;
  epoque: EpoqueConstruction;
  surface: number;
  refParM2: RefLoyer;
  loyerMaxTotal: number;    // plafond légal = majore × surface
  loyerRefTotal: number;    // référence × surface
  loyerMinTotal: number;    // minore × surface (loyer anormalement bas si dessous)
  encadre: boolean;
}

export function calculerPlafondLoyer(params: {
  adresse: string;
  zoneCode: string;
  type: TypeLocation;
  nbPieces: NbPieces;
  epoque: EpoqueConstruction;
  surface: number;
}): ResultatPlafond | null {
  const { adresse, zoneCode, type, nbPieces, epoque, surface } = params;
  const villeKey = detecterVilleEncadrement(adresse);
  if (!villeKey) return null;

  const ville = VILLES_ENCADREMENT[villeKey];
  const zone = ville.zones.find((z) => z.code === zoneCode);
  if (!zone) return null;

  const refParM2 = ville.data[zoneCode]?.[type]?.[epoque]?.[nbPieces];
  if (!refParM2) return null;

  return {
    ville: ville.nom,
    zone,
    type,
    nbPieces,
    epoque,
    surface,
    refParM2,
    loyerMaxTotal: Math.round(refParM2.majore * surface * 100) / 100,
    loyerRefTotal: Math.round(refParM2.reference * surface * 100) / 100,
    loyerMinTotal: Math.round(refParM2.minore * surface * 100) / 100,
    encadre: ville.active,
  };
}

export const EPOQUE_LABELS: Record<EpoqueConstruction, string> = {
  avant_1946: 'Avant 1946',
  '1946_1970': '1946 – 1970',
  '1971_1990': '1971 – 1990',
  '1991_2005': '1991 – 2005',
  apres_2005: 'Après 2005',
};
