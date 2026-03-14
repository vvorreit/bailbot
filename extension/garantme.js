// BailBot — Autofill GarantMe
// URL: https://certificate.garantme.fr/demande-garantie-definitive

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
    const allDivs = document.querySelectorAll('div, label, p, span, li');
    for (const el of allDivs) {
      const text = el.textContent?.trim() || '';
      if (text.includes(labelText) && el.children.length < 5) {
        // Cherche un input dans le même élément ou un parent proche
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

  // ── Remplit un input (compatible React/Vue) ──────────────────────────────
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
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // ── Sélectionne un radio button par le texte de son label ───────────────
  function selectRadio(labelContains) {
    const radios = document.querySelectorAll('input[type="radio"]');
    for (const radio of radios) {
      const container = radio.closest('label') || radio.closest('div') || radio.parentElement;
      const text = container?.textContent?.trim()?.toLowerCase() || '';
      if (text.includes(labelContains.toLowerCase())) {
        radio.click();
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  // ── Autofill principal ───────────────────────────────────────────────────
  function autofillGarantMe(dossier) {
    const { agence, bail, bailleur, certificatGarantMe } = dossier;

    // Email gestionnaire
    fillInput(getInputByLabel('Votre e-mail'), agence?.email);

    // Téléphone
    fillInput(getInputByLabel('numéro de téléphone'), agence?.telephone);

    // Numéro de certificat locataire
    fillInput(getInputByLabel('Numéro de certificat'), certificatGarantMe);

    // Mandataire (agence)
    fillInput(getInputByLabel('Nom du mandataire'), agence?.nom);
    fillInput(getInputByLabel('Adresse du mandataire'), agence?.adresse);

    // Bailleur
    fillInput(getInputByLabel('e-mail du bailleur'), bailleur?.email);
    fillInput(getInputByLabel('prénom du bailleur'), bailleur?.nom);
    fillInput(getInputByLabel('Adresse du bailleur'), bailleur?.adresse);

    // Bien loué
    fillInput(getInputByLabel('bien loué'), bail?.adresseBien);

    // Loyer HC (calculé si nécessaire)
    if (bail?.loyerHC) {
      fillInput(getInputByLabel('loyer hors charges'), bail.loyerHC);
    } else if (bail?.loyerCC && bail?.charges) {
      const loyerHC = Number(bail.loyerCC) - Number(bail.charges);
      fillInput(getInputByLabel('loyer hors charges'), loyerHC);
    }

    // Charges et dépôt
    fillInput(getInputByLabel('charges mensuelles'), bail?.charges);
    fillInput(getInputByLabel('dépôt de garantie'), bail?.depot || bail?.loyerHC || bail?.loyerCC);

    // Date d'effet et durée
    fillInput(getInputByLabel("Date d'effet"), bail?.dateEffet);
    fillInput(getInputByLabel('Durée du bail'), bail?.duree || '12 mois');

    // Radios
    selectRadio('principale');
    selectRadio('tacitement');

    // Clause résolutoire (premier select de la page)
    const clauseSelect = document.querySelector('select');
    if (clauseSelect) fillSelect(clauseSelect, 'Oui');

    console.log('[BailBot] Formulaire GarantMe rempli ✓');
  }

  // ── Panneau flottant BailBot ─────────────────────────────────────────────
  function showBailBotPanel(dossier) {
    const existing = document.getElementById('bailbot-garantme-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'bailbot-garantme-panel';
    panel.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 999999;
      background: #fff; border: 2px solid #059669; border-radius: 12px;
      padding: 16px; width: 290px; box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      font-family: system-ui, -apple-system, sans-serif; font-size: 14px;
      transition: all 0.2s;
    `;

    const hasLocataire = dossier?.locataire?.nom || dossier?.agence?.email;
    const hasCertificat = dossier?.certificatGarantMe;

    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:20px">🏠</span>
          <strong style="color:#059669;font-size:16px">BailBot</strong>
        </div>
        <span style="font-size:10px;background:#dcfce7;color:#166534;padding:2px 8px;border-radius:12px;font-weight:700">GarantMe</span>
      </div>

      ${hasLocataire ? `
        <div style="background:#f0fdf4;border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;line-height:1.6">
          ${dossier.locataire?.nom ? `<div><strong>Locataire :</strong> ${dossier.locataire.prenom || ''} ${dossier.locataire.nom}</div>` : ''}
          ${dossier.agence?.nom ? `<div><strong>Agence :</strong> ${dossier.agence.nom}</div>` : ''}
          ${dossier.bail?.adresseBien ? `<div><strong>Bien :</strong> ${dossier.bail.adresseBien}</div>` : ''}
          ${dossier.bail?.loyerCC ? `<div><strong>Loyer CC :</strong> ${dossier.bail.loyerCC}€/mois</div>` : ''}
        </div>
      ` : `
        <div style="color:#6b7280;font-size:12px;margin-bottom:12px;padding:10px;background:#f9fafb;border-radius:8px">
          Aucun dossier chargé dans BailBot.<br>
          <span style="font-size:11px">Ouvrez le dashboard BailBot pour charger un dossier.</span>
        </div>
      `}

      ${!hasCertificat ? `
        <div style="background:#fef3c7;border-radius:8px;padding:10px;margin-bottom:12px;font-size:12px;color:#92400e;line-height:1.5">
          ⚠️ Numéro de certificat GarantMe manquant.<br>
          <a href="https://help.garantme.fr/" target="_blank" style="color:#059669;text-decoration:underline">
            Comment le trouver ?
          </a>
        </div>
      ` : `
        <div style="background:#f0fdf4;border-radius:8px;padding:8px 10px;margin-bottom:12px;font-size:12px;color:#166534">
          ✅ Certificat : <strong>${dossier.certificatGarantMe}</strong>
        </div>
      `}

      <button id="bailbot-gm-fill" style="
        width:100%;padding:10px 0;background:${hasLocataire ? '#059669' : '#9ca3af'};color:white;
        border:none;border-radius:8px;cursor:${hasLocataire ? 'pointer' : 'not-allowed'};
        font-weight:700;font-size:14px;margin-bottom:6px;transition:background 0.2s;
      ">✨ Remplir le formulaire</button>

      <button id="bailbot-gm-close" style="
        width:100%;padding:6px 0;background:transparent;color:#6b7280;
        border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;font-size:12px;
      ">Fermer</button>
    `;

    document.body.appendChild(panel);

    document.getElementById('bailbot-gm-close')?.addEventListener('click', () => {
      panel.style.opacity = '0';
      setTimeout(() => panel.remove(), 200);
    });

    document.getElementById('bailbot-gm-fill')?.addEventListener('click', () => {
      if (!hasLocataire) return;
      autofillGarantMe(dossier);
      const btn = document.getElementById('bailbot-gm-fill');
      if (btn) {
        btn.textContent = '✅ Formulaire rempli !';
        btn.style.background = '#065f46';
      }
    });
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  function init() {
    // Vérifie qu'on est bien sur la bonne page
    if (!window.location.href.includes('garantme.fr')) return;

    const dossier = getDossier();
    showBailBotPanel(dossier);
    console.log('[BailBot] Panneau GarantMe initialisé');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1200));
  } else {
    setTimeout(init, 1200);
  }
})();
