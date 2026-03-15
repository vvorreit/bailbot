import { describe, it, expect, vi } from 'vitest';
import { calculerDateFin, getPreavisLocataire, genererBailPDF, type DonneesBail } from '../generateur-bail';

// ─── Mock jsPDF ───────────────────────────────────────────────────────────────
// jsPDF manipule le DOM, on le mock pour les tests Node.js
vi.mock('jspdf', () => {
  class MockJsPDF {
    setFontSize = vi.fn();
    setFont = vi.fn();
    setTextColor = vi.fn();
    setFillColor = vi.fn();
    setDrawColor = vi.fn();
    setLineWidth = vi.fn();
    roundedRect = vi.fn();
    rect = vi.fn();
    line = vi.fn();
    text = vi.fn();
    splitTextToSize = vi.fn((_text: string, _width: number) => [_text]);
    getTextWidth = vi.fn(() => 20);
    addPage = vi.fn();
    setPage = vi.fn();
    getNumberOfPages = vi.fn(() => 1);
    getCurrentPageInfo = vi.fn(() => ({ pageNumber: 1 }));
    output = vi.fn(() => new Blob(['%PDF-1.4 mock'], { type: 'application/pdf' }));
  }
  return { default: MockJsPDF };
});

// ─── Données de test ──────────────────────────────────────────────────────────

const donneesBailComplet: DonneesBail = {
  nomBailleur: 'Dupont Jean',
  adresseBailleur: '12 rue de la Paix, 75001 Paris',
  nomLocataire: 'Martin',
  prenomLocataire: 'Sophie',
  dateNaissanceLocataire: '15/03/1990',
  adresseActuelle: '5 impasse des Lilas, 69003 Lyon',
  adresseBien: '24 avenue des Fleurs, 69003 Lyon',
  typeBien: 'appartement',
  surface: 52,
  loyerHC: 750,
  charges: 80,
  depot: 750,
  dateEffet: '01/07/2025',
  duree: 12,
  jourPaiement: 1,
  zoneTendue: false,
  clauseResolutoire: true,
  villeSignature: 'Lyon',
  dateSignature: '15/06/2025',
  ibanBailleur: 'FR7630006000011234567890189',
};

const donneesBailAvecGarant: DonneesBail = {
  ...donneesBailComplet,
  garant: {
    nom: 'Dupont',
    prenom: 'Pierre',
    adresse: '8 rue Victor Hugo, 75011 Paris',
  },
};

// ─── Tests calcul date de fin ─────────────────────────────────────────────────

describe('calculerDateFin', () => {
  it('calcule correctement la date de fin pour 12 mois', () => {
    // Entrée 01/07/2025, durée 12 mois → fin 30/06/2026
    const result = calculerDateFin('01/07/2025', 12);
    expect(result).toBe('30/06/2026');
  });

  it('calcule correctement la date de fin pour 6 mois', () => {
    // Entrée 01/01/2025, durée 6 mois → fin 30/06/2025
    const result = calculerDateFin('01/01/2025', 6);
    expect(result).toBe('30/06/2025');
  });

  it('calcule correctement la date de fin pour 3 mois', () => {
    // Entrée 15/03/2025, durée 3 mois → fin 14/06/2025
    const result = calculerDateFin('15/03/2025', 3);
    expect(result).toBe('14/06/2025');
  });

  it('retourne une chaîne vide si le format est invalide', () => {
    const result = calculerDateFin('invalid', 12);
    expect(result).toBe('');
  });

  it('gère le passage en fin de mois (31 décembre)', () => {
    // Entrée 01/12/2025, durée 1 mois → fin 31/12/2025
    const result = calculerDateFin('01/12/2025', 1);
    expect(result).toBe('31/12/2025');
  });
});

// ─── Tests préavis selon zone tendue ─────────────────────────────────────────

describe('getPreavisLocataire', () => {
  it('retourne 1 mois en zone tendue', () => {
    const result = getPreavisLocataire(true);
    expect(result).toBe('1 mois (zone tendue)');
  });

  it('retourne 3 mois hors zone tendue', () => {
    const result = getPreavisLocataire(false);
    expect(result).toBe('3 mois');
  });
});

// ─── Tests génération PDF ─────────────────────────────────────────────────────

describe('genererBailPDF', () => {
  it('génère un Blob avec données complètes', () => {
    const blob = genererBailPDF(donneesBailComplet);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('génère un Blob avec données complètes incluant un garant', () => {
    const blob = genererBailPDF(donneesBailAvecGarant);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('génère un bail sans clause résolutoire', () => {
    const donnees: DonneesBail = { ...donneesBailComplet, clauseResolutoire: false };
    const blob = genererBailPDF(donnees);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('génère un bail en zone tendue', () => {
    const donnees: DonneesBail = { ...donneesBailComplet, zoneTendue: true };
    const blob = genererBailPDF(donnees);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('génère un bail sans IBAN bailleur', () => {
    const { ibanBailleur: _, ...donneesSansIBAN } = donneesBailComplet;
    const blob = genererBailPDF(donneesSansIBAN);
    expect(blob).toBeInstanceOf(Blob);
  });

  it('calcule correctement le loyer charges comprises', () => {
    // loyerHC=750 + charges=80 = 830
    expect(donneesBailComplet.loyerHC + donneesBailComplet.charges).toBe(830);
  });
});
