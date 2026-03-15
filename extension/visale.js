// BailBot — Autofill Visale
// URL: https://www.visale.fr/*
// Portail bailleur pour la garantie loyer impayé Action Logement
// Le gestionnaire doit être connecté à son compte bailleur sur visale.fr

(function () {
  'use strict';

  const BAILBOT_KEY = 'bailbot_dossier_actif';

  // ── Écoute les messages postMessage depuis le dashboard BailBot ──────────
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'BAILBOT_DOSSIER') {
      try {
        localStorage.setItem(BAILBOT_KEY, JSON.stringify(event.data.payload));
        console.log('[BailBot] Dossier synchronisé depuis le dashboard');
      } catch (e) {
        console.warn('[BailBot] Erreur sync dossier:', e);
      }
    }
  });

  // ── Récupère les données depuis le localStorage ──────────────────────────
  function getDossier() {
    try {
      return JSON.parse(localStorage.getItem(BAILBOT_KEY) || '{}');
    } catch {
      return {};
    }
  }

  // ── Trouve un input par le texte de son label ────────────────────────────
  function getInputByLabel(labelText) {
    const allEls = document.querySelectorAll('div, label, p, span, li, th, td');
    for (const el of allEls) {
      const text = el.textContent?.trim() || '';
      if (text.toLowerCase().includes(labelText.toLowerCase()) && el.children.length < 5) {
        let container = el;
        for (let i = 0; i < 4; i++) {
          const input = container.querySelector(
            'input:not([type="radio"]):not([type="checkbox"]):not([type="hidden"]), textarea, select'
          );
          if (input) return input;
          container = container.parentElement;
          if (!container) break;
        }
      }
    }
    return null;
  }

  // ── Remplit un input (compatible React/Vue/Angular) ──────────────────────
  function fillInput(input, value) {
    if (!input || value === undefined || value === null || value === '') return;
    const strValue = String(value);

    const nativeInputSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;
    const nativeTextareaSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value'
    )?.set;

    const setter =
      input.tagName === 'TEXTAREA' ? nativeTextareaSetter : nativeInputSetter;

    if (setter) {
      setter.call(input, strValue);
    } else {
      input.value = strValue;
    }

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // ── Remplit un select ────────────────────────────────────────────────────
  function fillSelect(select, value) {
    if (!select || !value) return;
    // Cherche par value ou par texte de l'option
    const options = Array.from(select.options);
    const match = options.find(
      (o) =>
        o.value === value ||
        o.textContent?.trim().toLowerCase().includes(value.toLowerCase())
    );
    if (match) {
      select.value = match.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  }

  // ── Sélectionne un radio button par le texte de son label ───────────────
  function selectRadio(labelContains) {
    const radios = document.querySelectorAll('input[type="radio"]');
    for (const radio of radios) {
      const container =
        radio.closest('label') || radio.closest('div') || radio.parentElement;
      const text = container?.textContent?.trim()?.toLowerCase() || '';
      if (text.includes(labelContains.toLowerCase())) {
        radio.click();
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  // ── Formate une date JJ/MM/AAAA depuis ISO ou format libre ──────────────
  function formatDateFR(dateStr) {
    if (!dateStr) return '';
    // Si déjà au format JJ/MM/AAAA
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    // Si format AAAA-MM-JJ (ISO)
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [y, m, d] = dateStr.split('T')[0].split('-');
      return `${d}/${m}/${y}`;
    }
    return dateStr;
  }

  // ── Sélecteurs Visale ────────────────────────────────────────────────────
  // TODO: Confirmer avec les vrais sélecteurs après inspection du formulaire réel
  // URL de référence : https://www.visale.fr/demande-visa/ ou pages similaires
  const VISALE_SELECTORS = {
    // Civilité locataire
    // TODO: inspecter le DOM réel — probablement un select ou des radio buttons
    civilite: [
      'select[name*="civilite"]',
      'select[name*="civility"]',
      'select[id*="civilite"]',
      'input[name*="civilite"]',
    ],

    // Nom locataire
    // TODO: vérifier name/id réel sur le formulaire Visale
    nom: [
      'input[name="nom"]',
      'input[name="locataire_nom"]',
      'input[name="lastName"]',
      'input[name="last_name"]',
      'input[id*="nom"]',
      'input[placeholder*="Nom"]',
      'input[placeholder*="nom de famille"]',
    ],

    // Prénom locataire
    prenom: [
      'input[name="prenom"]',
      'input[name="locataire_prenom"]',
      'input[name="firstName"]',
      'input[name="first_name"]',
      'input[id*="prenom"]',
      'input[placeholder*="Prénom"]',
    ],

    // Date de naissance locataire (JJ/MM/AAAA)
    dateNaissance: [
      'input[name="dateNaissance"]',
      'input[name="date_naissance"]',
      'input[name="locataire_ddn"]',
      'input[name="birthDate"]',
      'input[name="birth_date"]',
      'input[id*="naissance"]',
      'input[placeholder*="naissance"]',
      'input[placeholder*="JJ/MM"]',
    ],

    // Adresse du bien loué
    adresseBien: [
      'input[name="adresseBien"]',
      'input[name="bien_adresse"]',
      'input[name="adresse_bien"]',
      'input[name="adresseLogement"]',
      'input[id*="adresse"]',
      'input[placeholder*="adresse du bien"]',
      'input[placeholder*="logement"]',
    ],

    // Loyer mensuel hors charges (€)
    loyerHC: [
      'input[name="loyerHC"]',
      'input[name="loyer_hc"]',
      'input[name="loyer_hors_charges"]',
      'input[name="montantLoyer"]',
      'input[id*="loyer"]',
      'input[placeholder*="loyer hors"]',
      'input[placeholder*="hors charges"]',
    ],

    // Charges mensuelles (€)
    charges: [
      'input[name="charges"]',
      'input[name="chargesMensuelles"]',
      'input[name="charges_mensuelles"]',
      'input[id*="charges"]',
      'input[placeholder*="charges"]',
    ],

    // Date d'entrée dans les lieux
    dateEntree: [
      'input[name="dateEntree"]',
      'input[name="date_entree"]',
      'input[name="dateDebail"]',
      'input[name="date_effet"]',
      'input[type="date"][id*="entree"]',
      'input[placeholder*="entrée"]',
      'input[placeholder*="début du bail"]',
    ],

    // Durée du bail (12 / 24 / 36 mois)
    dureeBail: [
      'select[name="dureeBail"]',
      'select[name="duree_bail"]',
      'select[name="duree"]',
      'select[id*="duree"]',
    ],

    // Type de bail (vide / meublé)
    typeBail: [
      'select[name="typeBail"]',
      'select[name="type_bail"]',
      'select[name="typeBien"]',
      'select[id*="type"]',
    ],

    // Email locataire (si disponible dans le formulaire)
    emailLocataire: [
      'input[name="emailLocataire"]',
      'input[name="email_locataire"]',
      'input[name="locataire_email"]',
      'input[type="email"]',
      'input[placeholder*="email"]',
      'input[placeholder*="mail"]',
    ],
  };

  // ── Trouve un input via une liste de sélecteurs CSS (ordre de priorité) ──
  function findInput(selectors) {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // ── Autofill principal Visale ────────────────────────────────────────────
  function autofillVisale(dossier) {
    const locataire = dossier?.locataire || {};
    const bail = dossier?.bail || {};

    let filled = 0;

    // ── Civilité (M / Mme) ─────────────────────────────────────────────────
    // TODO: adapter selon le DOM réel (select ou radio)
    const civiliteEl = findInput(VISALE_SELECTORS.civilite);
    if (civiliteEl) {
      if (civiliteEl.tagName === 'SELECT') {
        // Essaie "M" ou "Monsieur" / "Mme" ou "Madame"
        fillSelect(civiliteEl, 'M');
        filled++;
      } else {
        // Fallback radio
        selectRadio('monsieur') || selectRadio('M.');
        filled++;
      }
    } else {
      // Essaie via label text
      selectRadio('monsieur') || selectRadio('M.');
    }

    // ── Nom locataire ──────────────────────────────────────────────────────
    const nomEl = findInput(VISALE_SELECTORS.nom) || getInputByLabel('Nom');
    if (nomEl && locataire.nom) {
      fillInput(nomEl, locataire.nom.toUpperCase());
      filled++;
    }

    // ── Prénom locataire ───────────────────────────────────────────────────
    const prenomEl = findInput(VISALE_SELECTORS.prenom) || getInputByLabel('Prénom');
    if (prenomEl && locataire.prenom) {
      fillInput(prenomEl, locataire.prenom);
      filled++;
    }

    // ── Date de naissance ──────────────────────────────────────────────────
    const dnEl =
      findInput(VISALE_SELECTORS.dateNaissance) ||
      getInputByLabel('naissance') ||
      getInputByLabel('DDN');
    if (dnEl && locataire.dateNaissance) {
      fillInput(dnEl, formatDateFR(locataire.dateNaissance));
      filled++;
    }

    // ── Email locataire ────────────────────────────────────────────────────
    const emailEl =
      findInput(VISALE_SELECTORS.emailLocataire) ||
      getInputByLabel('email locataire') ||
      getInputByLabel('mail du locataire');
    if (emailEl && locataire.email) {
      fillInput(emailEl, locataire.email);
      filled++;
    }

    // ── Adresse du bien ────────────────────────────────────────────────────
    const adresseEl =
      findInput(VISALE_SELECTORS.adresseBien) ||
      getInputByLabel('adresse du bien') ||
      getInputByLabel('adresse logement');
    if (adresseEl && bail.adresseBien) {
      fillInput(adresseEl, bail.adresseBien);
      filled++;
    }

    // ── Loyer HC ───────────────────────────────────────────────────────────
    const loyerHCEl =
      findInput(VISALE_SELECTORS.loyerHC) ||
      getInputByLabel('loyer hors charges') ||
      getInputByLabel('loyer mensuel');
    if (loyerHCEl) {
      const loyerHC = bail.loyerHC
        || (bail.loyerCC && bail.charges
          ? Number(bail.loyerCC) - Number(bail.charges)
          : undefined);
      if (loyerHC) {
        fillInput(loyerHCEl, loyerHC);
        filled++;
      }
    }

    // ── Charges mensuelles ─────────────────────────────────────────────────
    const chargesEl =
      findInput(VISALE_SELECTORS.charges) ||
      getInputByLabel('charges mensuelles') ||
      getInputByLabel('charges locatives');
    if (chargesEl && bail.charges) {
      fillInput(chargesEl, bail.charges);
      filled++;
    }

    // ── Date d'entrée ──────────────────────────────────────────────────────
    const dateEntreeEl =
      findInput(VISALE_SELECTORS.dateEntree) ||
      getInputByLabel("date d'entrée") ||
      getInputByLabel('entrée dans les lieux');
    if (dateEntreeEl && bail.dateEffet) {
      // Adapte le format selon le type d'input
      if (dateEntreeEl.type === 'date') {
        // Format AAAA-MM-JJ pour input[type=date]
        const d = formatDateFR(bail.dateEffet);
        const [jour, mois, annee] = d.split('/');
        if (jour && mois && annee) {
          fillInput(dateEntreeEl, `${annee}-${mois}-${jour}`);
        }
      } else {
        fillInput(dateEntreeEl, formatDateFR(bail.dateEffet));
      }
      filled++;
    }

    // ── Durée du bail ──────────────────────────────────────────────────────
    const dureeEl =
      findInput(VISALE_SELECTORS.dureeBail) ||
      getInputByLabel('durée du bail');
    if (dureeEl && bail.duree) {
      // Essaie "12", "24" ou "36" selon la durée
      const dureeNum = String(bail.duree).replace(/\D/g, '');
      fillSelect(dureeEl, dureeNum) || fillSelect(dureeEl, bail.duree);
      filled++;
    }

    // ── Type de bail (vide / meublé) ───────────────────────────────────────
    const typeBailEl =
      findInput(VISALE_SELECTORS.typeBail) ||
      getInputByLabel('type de bail') ||
      getInputByLabel('type de logement');
    if (typeBailEl && bail.type) {
      fillSelect(typeBailEl, bail.type) ||
        selectRadio(bail.type === 'meublé' ? 'meublé' : 'vide');
      filled++;
    } else {
      // Défaut : bail vide
      selectRadio('vide');
    }

    console.log(`[BailBot] Formulaire Visale rempli — ${filled} champ(s) complété(s)`);
    return filled;
  }

  // ── Panneau flottant BailBot ─────────────────────────────────────────────
  function showBailBotPanel(dossier) {
    const existing = document.getElementById('bailbot-visale-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'bailbot-visale-panel';
    panel.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 999999;
      background: #fff; border: 2px solid #059669; border-radius: 12px;
      padding: 16px; width: 290px; box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
      transition: all 0.2s;
    `;

    const locataire = dossier?.locataire || {};
    const bail = dossier?.bail || {};
    const hasLocataire = locataire?.nom || locataire?.prenom;

    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:20px">🏠</span>
          <strong style="color:#059669;font-size:16px">BailBot</strong>
        </div>
        <span style="font-size:10px;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:12px;font-weight:700">Visale</span>
      </div>

      ${hasLocataire ? `
        <div style="background:#f0fdf4;border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;line-height:1.6">
          <div><strong>Locataire :</strong> ${locataire.prenom || ''} ${locataire.nom || ''}</div>
          ${locataire.dateNaissance ? `<div><strong>DDN :</strong> ${formatDateFR(locataire.dateNaissance)}</div>` : ''}
          ${bail.adresseBien ? `<div><strong>Bien :</strong> ${bail.adresseBien}</div>` : ''}
          ${bail.loyerHC ? `<div><strong>Loyer HC :</strong> ${bail.loyerHC}€/mois</div>` : ''}
        </div>
      ` : `
        <div style="color:#6b7280;font-size:12px;margin-bottom:12px;padding:10px;background:#f9fafb;border-radius:8px">
          Aucun dossier chargé dans BailBot.<br>
          <span style="font-size:11px">Ouvrez le dashboard BailBot pour charger un dossier.</span>
        </div>
      `}

      <div style="background:#fef9c3;border-radius:8px;padding:10px;margin-bottom:12px;font-size:11px;color:#713f12;line-height:1.5">
        ⚠️ <strong>Sélecteurs provisoires.</strong><br>
        Si les champs ne se remplissent pas, inspecter le formulaire Visale pour mettre à jour les sélecteurs CSS.
        <!-- TODO: mettre à jour VISALE_SELECTORS après inspection du formulaire réel -->
      </div>

      <button id="bailbot-visale-fill" style="
        width:100%;padding:10px 0;background:${hasLocataire ? '#059669' : '#9ca3af'};color:white;
        border:none;border-radius:8px;cursor:${hasLocataire ? 'pointer' : 'not-allowed'};
        font-weight:700;font-size:14px;margin-bottom:6px;transition:background 0.2s;
      ">✨ Remplir le formulaire</button>

      <button id="bailbot-visale-close" style="
        width:100%;padding:6px 0;background:transparent;color:#6b7280;
        border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;font-size:12px;
      ">Fermer</button>
    `;

    document.body.appendChild(panel);

    document.getElementById('bailbot-visale-close')?.addEventListener('click', () => {
      panel.style.opacity = '0';
      setTimeout(() => panel.remove(), 200);
    });

    document.getElementById('bailbot-visale-fill')?.addEventListener('click', () => {
      if (!hasLocataire) return;
      const count = autofillVisale(dossier);
      const btn = document.getElementById('bailbot-visale-fill');
      if (btn) {
        btn.textContent = `✅ ${count} champ(s) rempli(s)`;
        btn.style.background = '#065f46';
      }
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    if (!window.location.href.includes('visale.fr')) return;

    const dossier = getDossier();
    showBailBotPanel(dossier);
    console.log('[BailBot] Panneau Visale initialisé');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1200));
  } else {
    setTimeout(init, 1200);
  }
})();
