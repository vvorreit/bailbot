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

/**
 * Toutes les features sont accessibles — version particulier uniquement.
 */
export function hasAccess(_metier: string | null | undefined, _feature: Feature): boolean {
  return true
}
