// lib/templates-relance-candidat.ts
// Templates email pour les relances candidat automatiques (J+1 / J+3 / J+7)

export interface TemplateRelance {
  sujet: string;
  corps: string;
}

export interface ParamsTemplate {
  prenomNom?: string;
  bienAdresse: string;
  lienDepot: string;
  docsManquants?: string[];
  nomGestionnaire?: string;
}

function listeManquants(docs?: string[]): string {
  if (!docs || docs.length === 0) return '<li>Documents en attente de vérification</li>';
  return docs.map((d) => `<li>${d}</li>`).join('');
}

// ─── J+1 : Rappel doux ────────────────────────────────────────────────────────

export function templateRelance1(p: ParamsTemplate): TemplateRelance {
  const prenom = p.prenomNom ? `<strong>${p.prenomNom}</strong>` : 'Bonjour';
  return {
    sujet: `[Rappel] Votre dossier pour ${p.bienAdresse} est incomplet`,
    corps: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #f8fafc; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #0f172a; margin-top: 0;">📄 Votre dossier attend quelques documents</h2>
    <p>Bonjour ${prenom},</p>
    <p>Vous avez commencé à déposer votre dossier pour le bien situé au
      <strong>${p.bienAdresse}</strong>. Il manque encore quelques pièces pour le finaliser.</p>

    <p><strong>Documents à ajouter :</strong></p>
    <ul style="line-height: 1.8;">${listeManquants(p.docsManquants)}</ul>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${p.lienDepot}"
         style="background: #10b981; color: white; padding: 14px 28px; border-radius: 8px;
                text-decoration: none; font-weight: bold; font-size: 16px;">
        Compléter mon dossier →
      </a>
    </div>

    <p style="font-size: 13px; color: #64748b;">
      Ce lien est sécurisé et personnel. Si vous avez des questions, répondez simplement à cet email.
    </p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    ${p.nomGestionnaire ?? 'Votre gestionnaire'} — BailBot · contact@optibot.fr
  </p>
</div>`,
  };
}

// ─── J+3 : Relance urgente ────────────────────────────────────────────────────

export function templateRelance2(p: ParamsTemplate): TemplateRelance {
  const prenom = p.prenomNom ? `<strong>${p.prenomNom}</strong>` : 'Bonjour';
  return {
    sujet: `⚠️ Urgent — Votre dossier pour ${p.bienAdresse} expire bientôt`,
    corps: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #92400e; margin-top: 0;">⏰ Votre dossier n'est pas encore complet</h2>
    <p>Bonjour ${prenom},</p>
    <p>Nous vous rappelons que votre dossier pour le bien au <strong>${p.bienAdresse}</strong>
      est toujours incomplet. D'autres candidats ont déjà déposé les leurs.</p>

    <p><strong>Il vous manque encore :</strong></p>
    <ul style="line-height: 1.8;">${listeManquants(p.docsManquants)}</ul>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${p.lienDepot}"
         style="background: #f59e0b; color: white; padding: 14px 28px; border-radius: 8px;
                text-decoration: none; font-weight: bold; font-size: 16px;">
        Finaliser mon dossier maintenant →
      </a>
    </div>

    <p style="font-size: 13px; color: #78350f;">
      Ne tardez pas — le propriétaire prendra sa décision très prochainement.
    </p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    ${p.nomGestionnaire ?? 'Votre gestionnaire'} — BailBot · contact@optibot.fr
  </p>
</div>`,
  };
}

// ─── J+7 : Dernière relance ───────────────────────────────────────────────────

export function templateRelance3(p: ParamsTemplate): TemplateRelance {
  const prenom = p.prenomNom ? `<strong>${p.prenomNom}</strong>` : 'Bonjour';
  return {
    sujet: `Dernière relance — Dossier ${p.bienAdresse}`,
    corps: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
  <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 32px 24px;">
    <h2 style="color: #991b1b; margin-top: 0;">🔔 Dernière chance — Dossier incomplet depuis 7 jours</h2>
    <p>Bonjour ${prenom},</p>
    <p>Malgré nos relances, votre dossier pour le bien situé au
      <strong>${p.bienAdresse}</strong> n'est toujours pas complet.</p>

    <p>C'est notre <strong>dernière relance automatique</strong>. Sans réponse de votre part,
      votre dossier sera classé et le bien sera proposé à d'autres candidats.</p>

    <p><strong>Documents toujours manquants :</strong></p>
    <ul style="line-height: 1.8;">${listeManquants(p.docsManquants)}</ul>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${p.lienDepot}"
         style="background: #dc2626; color: white; padding: 14px 28px; border-radius: 8px;
                text-decoration: none; font-weight: bold; font-size: 16px;">
        Compléter maintenant — Dernière chance →
      </a>
    </div>

    <p style="font-size: 13px; color: #7f1d1d;">
      Si vous souhaitez vous désister, répondez simplement à cet email.
    </p>
  </div>
  <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 16px;">
    ${p.nomGestionnaire ?? 'Votre gestionnaire'} — BailBot · contact@optibot.fr
  </p>
</div>`,
  };
}

// ─── Sélecteur de template par séquence ───────────────────────────────────────

export function getTemplate(sequence: 1 | 2 | 3, p: ParamsTemplate): TemplateRelance {
  if (sequence === 1) return templateRelance1(p);
  if (sequence === 2) return templateRelance2(p);
  return templateRelance3(p);
}
