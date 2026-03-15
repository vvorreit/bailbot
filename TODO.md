# BailBot — TODO Fonctionnalités

## ✅ FAIT

- [x] OCR universel (CNI, bulletin, avis impo, RIB, domicile)
- [x] Drag & drop universel avec détection auto du type de document
- [x] BailScore 0-100 (4 dimensions)
- [x] Détection fraude documentaire
- [x] Vérification complétude dossier + email relance
- [x] Support garant extérieur
- [x] Éligibilité Visale automatique
- [x] Archive ZIP renommée proprement (100% client)
- [x] Générateur bail loi ALUR PDF
- [x] Extension Chrome GarantMe autofill
- [x] Dashboard multi-dossiers Kanban (IndexedDB, zéro serveur)
- [x] Recherche adresse autocomplete (api-adresse.data.gouv.fr)
- [x] Templates messages (8 modèles pré-rédigés)
- [x] PWA mobile (installable iPhone/Android)
- [x] Stats locales (dossiers, BailScore moyen, % Visale)
- [x] Portail locataire (lien sécurisé + chiffrement AES-256)
- [x] DossierFacile Connect OAuth2 (attend credentials)

---

## 🔴 PRIORITÉ HAUTE

- [ ] **Quittance de loyer PDF** — génération mensuelle automatique depuis données du bail. 1 clic = PDF prêt. Utilisé TOUS les mois par chaque gestionnaire.
- [ ] **Autofill Visale** (extension Chrome) — même pattern GarantMe, formulaire bailleur connecté. Porter le plus grand portail GLI.
- [ ] **Révision loyer IRL** — calcul automatique via API INSEE (gratuite). Saisit loyer actuel + date signature → nouveau loyer + courrier PDF de révision.
- [ ] **Export Excel candidatures** — CSV/XLSX de tous les dossiers d'un bien. Pour le compte-rendu au propriétaire.

---

## 🟠 PRIORITÉ MOYENNE

- [ ] **Checklist conformité ALUR** — vérifie que le bail est complet (annexes obligatoires : DDT, ERNMT, état des risques, notice info, diagnostic ERP). Cases à cocher interactives.
- [ ] **Moteur de recherche dossiers** — full-text search dans IndexedDB : retrouve un candidat par nom/adresse/bien en une seconde.
- [ ] **Comparateur GLI automatique** — calcule le prix estimé Visale (gratuit) vs GarantMe vs Cautioneo vs Axa GLI depuis les données du dossier. Affiche le moins cher.
- [ ] **Historique des révisions de loyer** — tableau des révisions passées + prochaine révision estimée avec rappel.
- [ ] **Autofill Periimmo** (extension Chrome) — le logiciel #1 des gestionnaires indépendants. Nécessite un compte pro pour mapper les champs.
- [ ] **Numérotation automatique des documents** — le ZIP est déjà renommé, mais afficher un index visuel dans l'UI (01_CNI, 02_Bulletin...).

---

## 🟡 PRIORITÉ BASSE

- [ ] **Mode sombre** — toggle dark/light. Les gestionnaires travaillent tôt le matin.
- [ ] **Impression dossier** — window.print() avec CSS @media print optimisé. Dossier complet imprimable en 2 clics.
- [ ] **Partage par QR code** — QR code du dossier (données locales uniquement, pas d'upload) pour montrer sur mobile.
- [ ] **Raccourcis clavier** — Ctrl+D pour drop zone, Ctrl+G pour générer le bail, Ctrl+E pour exporter ZIP.
- [ ] **Onboarding guidé** — tour interactif pour les nouveaux gestionnaires (coach marks / tooltips en séquence).
- [ ] **Notification navigateur** — alerte quand un locataire dépose ses docs via le portail.
- [ ] **Multi-langue** — EN / FR (pour les agences avec des locataires étrangers).

---

## 💡 IDEAS FUTURES (hors scope V1)

- [ ] Autofill Adaptimmo, ICS Immobilier (logiciels gestion)
- [ ] Import automatique depuis email (IMAP watcher)
- [ ] Signature électronique bail (YouSign API)
- [ ] API BailBot pour logiciels tiers (B2B2B)
- [ ] Mode multi-agence temps réel (WebSocket Kanban partagé)

---

*Dernière mise à jour : 15 mars 2026*
