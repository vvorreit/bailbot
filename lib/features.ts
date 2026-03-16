export type Feature =
  | 'RECHERCHE_MASQUEE_PROPRIO'
  | 'DEPOT_DOSSIER'
  | 'OCR_AUTO'
  | 'BAIL_SCORE'
  | 'ELIGIBILITE_VISALE'
  | 'EXPORT_ZIP'
  | 'GENERATEUR_BAIL_ALUR'
  | 'GENERATEUR_BAIL_PRO'
  | 'CHECKLIST_ALUR'
  | 'QUITTANCES'
  | 'QUITTANCES_TRIAL'
  | 'REVISION_IRL'
  | 'REVISION_ILC_ILAT'
  | 'SUIVI_PAIEMENTS'
  | 'DASHBOARD_IMPAYES'
  | 'RELANCES_CANDIDAT'
  | 'KANBAN_CANDIDATS'
  | 'VIE_DU_BAIL'
  | 'ALERTES_ECHEANCES'
  | 'ETAT_DES_LIEUX'
  | 'EDL_MOBILE'
  | 'EDL_COMPARAISON'
  | 'MES_LOGEMENTS'
  | 'COMPTABILITE_FISCALE'
  | 'DIAGNOSTICS'
  | 'ANALYSE_COPRO'
  | 'ESPACE_LOCATAIRE'
  | 'RENDEMENT_CALCUL'
  | 'ENCADREMENT_LOYERS'
  | 'SIGNATURE_EIDAS'
  | 'EXPORT_FEC'
  | 'FINANCES_AVANCEES'
  | 'EDL_COMPLETS'
  | 'GARANTS_CAUTIONNAIRES'
  | 'MODELES_BAUX'
  | 'SUPPORT_PRIORITAIRE'

export type Plan = 'FREE' | 'ESSENTIEL' | 'SERENITE'

/**
 * Features accessibles par plan.
 */
export const PLAN_FEATURES: Record<Plan, Feature[]> = {
  FREE: [
    'OCR_AUTO',
    'BAIL_SCORE',
    'RENDEMENT_CALCUL',
    'ENCADREMENT_LOYERS',
    'DEPOT_DOSSIER',
    'QUITTANCES_TRIAL',
    'ELIGIBILITE_VISALE',
    'RECHERCHE_MASQUEE_PROPRIO',
  ],
  ESSENTIEL: [
    'OCR_AUTO',
    'BAIL_SCORE',
    'RENDEMENT_CALCUL',
    'ENCADREMENT_LOYERS',
    'DEPOT_DOSSIER',
    'ELIGIBILITE_VISALE',
    'RECHERCHE_MASQUEE_PROPRIO',
    'GENERATEUR_BAIL_ALUR',
    'QUITTANCES',
    'ESPACE_LOCATAIRE',
    'REVISION_IRL',
    'ETAT_DES_LIEUX',
    'DIAGNOSTICS',
    'CHECKLIST_ALUR',
    'SUIVI_PAIEMENTS',
    'DASHBOARD_IMPAYES',
    'RELANCES_CANDIDAT',
    'KANBAN_CANDIDATS',
    'VIE_DU_BAIL',
    'ALERTES_ECHEANCES',
    'MES_LOGEMENTS',
    'EXPORT_ZIP',
  ],
  SERENITE: [
    'OCR_AUTO',
    'BAIL_SCORE',
    'RENDEMENT_CALCUL',
    'ENCADREMENT_LOYERS',
    'DEPOT_DOSSIER',
    'ELIGIBILITE_VISALE',
    'RECHERCHE_MASQUEE_PROPRIO',
    'GENERATEUR_BAIL_ALUR',
    'GENERATEUR_BAIL_PRO',
    'QUITTANCES',
    'ESPACE_LOCATAIRE',
    'REVISION_IRL',
    'REVISION_ILC_ILAT',
    'ETAT_DES_LIEUX',
    'EDL_MOBILE',
    'EDL_COMPLETS',
    'EDL_COMPARAISON',
    'DIAGNOSTICS',
    'CHECKLIST_ALUR',
    'SUIVI_PAIEMENTS',
    'DASHBOARD_IMPAYES',
    'RELANCES_CANDIDAT',
    'KANBAN_CANDIDATS',
    'VIE_DU_BAIL',
    'ALERTES_ECHEANCES',
    'MES_LOGEMENTS',
    'EXPORT_ZIP',
    'SIGNATURE_EIDAS',
    'EXPORT_FEC',
    'COMPTABILITE_FISCALE',
    'FINANCES_AVANCEES',
    'GARANTS_CAUTIONNAIRES',
    'MODELES_BAUX',
    'SUPPORT_PRIORITAIRE',
    'ANALYSE_COPRO',
  ],
}

/** Nombre maximum de biens par plan */
export const PLAN_BIENS_MAX: Record<Plan, number | null> = {
  FREE: 1,
  ESSENTIEL: 3,
  SERENITE: null,
}

/** Prix mensuels */
export const PLAN_PRIX: Record<Plan, number> = {
  FREE: 0,
  ESSENTIEL: 9.90,
  SERENITE: 17.90,
}

/** Labels d'affichage */
export const PLAN_LABELS: Record<Plan, string> = {
  FREE: 'Gratuit',
  ESSENTIEL: 'Essentiel',
  SERENITE: 'Sérénité',
}

/**
 * Vérifie si un plan a accès à une feature.
 */
export function hasAccess(plan: string | null | undefined, feature: Feature): boolean {
  const userPlan = (plan?.toUpperCase() || 'FREE') as Plan
  const validPlan = PLAN_FEATURES[userPlan] ? userPlan : 'FREE'
  return PLAN_FEATURES[validPlan].includes(feature)
}

/**
 * Vérifie si l'utilisateur gratuit a droit à sa quittance trial.
 * Retourne true si le mois en cours n'a pas encore été utilisé
 * et que le user est dans son premier mois.
 */
export function hasQuittanceTrial(
  plan: string | null | undefined,
  createdAt: Date | string | null | undefined,
  quittancesTrialUsed?: boolean
): boolean {
  const userPlan = (plan?.toUpperCase() || 'FREE')
  if (userPlan !== 'FREE') return true
  if (quittancesTrialUsed) return false
  if (!createdAt) return true
  const created = new Date(createdAt)
  const daysSinceCreation = Math.floor((Date.now() - created.getTime()) / 86_400_000)
  return daysSinceCreation <= 30
}

/**
 * Retourne le plan minimum requis pour une feature.
 */
export function minimumPlanFor(feature: Feature): Plan {
  if (PLAN_FEATURES.FREE.includes(feature)) return 'FREE'
  if (PLAN_FEATURES.ESSENTIEL.includes(feature)) return 'ESSENTIEL'
  return 'SERENITE'
}
