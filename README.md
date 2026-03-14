# 🏠 BailBot — Automatisation des dossiers locataires

> Traitez un dossier locataire en 5 minutes, pas en 2 heures.

BailBot est un outil SaaS pour les gestionnaires locatifs qui automatise la saisie des dossiers de candidature. Drop PDF → OCR extrait tout → Formulaire rempli.

## Contexte métier

**Avant BailBot :** 45-90 minutes de saisie manuelle par dossier (CNI + bulletins + avis impo + RIB → 3 systèmes différents)  
**Avec BailBot :** Drop PDF → OCR extrait tout → 5 minutes

## Documents traités

| Document | Données extraites |
|----------|-------------------|
| CNI (recto/verso) | Nom, prénom, DDN, adresse, numéro CNI |
| Bulletins de paie (3 derniers) | Employeur, salaire net, type contrat, ancienneté |
| Avis d'imposition 2042 | Revenus N-1, N-2, nombre de parts, situation fiscale |
| RIB | IBAN, BIC, titulaire, banque |
| Justificatif de domicile | Adresse actuelle |

## Outils cibles (extension Chrome — à venir)

- [Visale](https://visale.fr) — garantie locative Action Logement
- [GarantMe](https://garantme.fr) — garantie locative privée
- [Unkle](https://unkle.fr) — assurance loyers impayés
- [Periimmo](https://periimmo.com) — logiciel de gestion locative
- [DossierFacile](https://dossierfacile.logement.gouv.fr) — API officielle disponible

## Stack technique

- **Framework :** Next.js 16 (App Router)
- **UI :** Tailwind CSS v4, Lucide React
- **OCR :** Tesseract.js (local, RGPD natif)
- **Auth :** NextAuth.js v4
- **BDD :** PostgreSQL + Prisma
- **Paiement :** Stripe
- **Email :** Resend

## Installation

```bash
git clone https://github.com/vvorreit/bailbot.git
cd bailbot
npm install

cp .env.example .env.local
# Remplissez .env.local avec vos variables

npx prisma migrate dev
npm run dev
```

L'app tourne sur [http://localhost:3011](http://localhost:3011).

## Tarifs

| Plan | Prix | Utilisateurs |
|------|------|-------------|
| Solo Gestionnaire | 59€/mois | 1 |
| Agence Multi-postes | 49€/user/mois (min. 3) | ≥3 |
| Teams Trio | 149€/mois | 3 |
| Teams Pro | 249€/mois | 5 |

## Architecture OCR

L'analyse OCR se fait **100% localement dans le navigateur** via Tesseract.js. Aucune donnée personnelle des locataires ne transite par nos serveurs. RGPD natif.

## Licence

Propriétaire — © 2026 BailBot
