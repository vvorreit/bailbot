import type { MutuelleData, OrdonnanceData } from "./parsers";

export interface AutofillPayload {
  mutuelle?: MutuelleData;
  ordonnance?: OrdonnanceData;
  syncToken?: string;
}

export function generatePayloadString(payload: AutofillPayload): string {
  const m = payload.mutuelle ?? {};
  const o = payload.ordonnance ?? {};
  const syncToken = payload.syncToken || "";
  return JSON.stringify({ m, o, syncToken });
}

/*
 * BOOKMARKLET OPTIBOT
 *
 * Formulaire 1 — Fiche client LBO (infos_client[nom], etc.)
 *   Remplit civilité, nom, prénom, DDN, NSS, clé SS, myopie/hypermétropie
 *
 * Formulaire 2 — Ordonnance / Prescription
 *   Stratégie A : lignes de tableau dont la 1ère cellule contient le label
 *                 optique (Sphère, Cylindre, Axe, Addition).
 *                 → 1er input de la ligne = OD, 2e input = OG.
 *   Stratégie B (fallback) : attribut [name*=] couvrant les conventions
 *                 courantes des ERP opticiens (od_sph, sph_od, sphere_od, …)
 *
 * Notes de minification :
 *   - Pas de commentaires // dans le template (ils survivraient à la suppression
 *     des sauts de ligne et commenteraient le reste du script).
 *   - Utiliser uniquement des commentaires /* * / si nécessaire à l'intérieur.
 */
export const STATIC_BOOKMARKLET = `javascript:(async function(){
  try {
    const text = await navigator.clipboard.readText();
    const d = JSON.parse(text);
    const m = d.m || {};
    const o = d.o || {};
    const nom = (m.nom || o.nomPatient || '').toUpperCase();
    const prenom = m.prenom || o.prenomPatient || '';

    function ultraFill(el, val) {
      if (!el || val === undefined || val === null || val === '') return;
      el.focus();
      el.value = val;
      const evts = ['focus','input','change','keydown','keypress','keyup','blur'];
      for (let i = 0; i < evts.length; i++) {
        el.dispatchEvent(new Event(evts[i], { bubbles: true, cancelable: true }));
      }
      if (window.$ && window.$(el).trigger) {
        window.$(el).val(val).trigger('input').trigger('change').trigger('keyup');
      }
    }

    function findElement(selector) {
      let el = document.querySelector(selector);
      if (el) return el;
      const iframes = document.querySelectorAll('iframe');
      for (let i = 0; i < iframes.length; i++) {
        try {
          el = iframes[i].contentDocument.querySelector(selector);
          if (el) return el;
        } catch(e) {}
      }
      return null;
    }

    function getOrdoInputs(labelRe) {
      const rows = document.querySelectorAll('tr');
      for (let i = 0; i < rows.length; i++) {
        const first = rows[i].querySelector('td:first-child, th:first-child');
        if (first && labelRe.test(first.textContent || '')) {
          return Array.from(rows[i].querySelectorAll(
            'input[type="text"], input:not([type]), input[type="number"]'
          ));
        }
      }
      const labels = document.querySelectorAll('label');
      for (let i = 0; i < labels.length; i++) {
        if (labelRe.test(labels[i].textContent || '')) {
          const id = labels[i].getAttribute('for');
          const el = id && document.getElementById(id);
          if (el) return [el];
        }
      }
      return [];
    }

    const formCheck = findElement('[name="infos_client[nom]"]') || findElement('#infos_client_nom');

    if (formCheck) {
      const ddn = m.dateNaissance || o.dateNaissancePatient || '';
      const nss = m.numeroSecuriteSociale || '';
      const civ = nss.startsWith('1') ? '1' : (nss.startsWith('2') ? '2' : '0');

      const dataMap = {
        'infos_client[civilite_type_id]': civ,
        'infos_client[nom]': nom,
        'infos_client[prenom]': prenom.charAt(0).toUpperCase() + prenom.slice(1).toLowerCase(),
        'infos_client[date_naissance]': ddn,
        'infos_client[num_ss]': nss.slice(0, 13),
        'infos_client[cle_ss]': nss.slice(13, 15)
      };

      for (const name in dataMap) {
        ultraFill(findElement('[name="' + name + '"]'), dataMap[name]);
      }

      const sph = o.lunettesOD && o.lunettesOD.sphere || o.lentillesOD && o.lentillesOD.sphere;
      if (sph) {
        const v = parseFloat(sph);
        const mEl = findElement('[name="infos_client[is_myope]"]');
        if (mEl && mEl.checked !== (v < 0)) mEl.click();
        const hEl = findElement('[name="infos_client[is_hypermetrope]"]');
        if (hEl && hEl.checked !== (v > 0)) hEl.click();
      }

      alert('OptiBot \u2713 Fiche client remplie');

    } else {
      const od = o.lunettesOD || {};
      const og = o.lunettesOG || {};

      const params = [
        [/sph[e\xE8]/i, od.sphere, og.sphere],
        [/cyl(?:indre)?/i, od.cylindre, og.cylindre],
        [/ax[e]?(?:\s|$)/i, od.axe, og.axe],
        [/add(?:ition)?/i, od.addition, og.addition]
      ];

      let filled = 0;

      for (let i = 0; i < params.length; i++) {
        const inputs = getOrdoInputs(params[i][0]);
        if (inputs[0] && params[i][1]) { ultraFill(inputs[0], params[i][1]); filled++; }
        if (inputs[1] && params[i][2]) { ultraFill(inputs[1], params[i][2]); filled++; }
      }

      if (!filled) {
        const named = [
          ['[name*="od"][name*="sph"],[name*="sph_od"],[name*="sphere_od"],[name*="od_sphere"]', od.sphere],
          ['[name*="og"][name*="sph"],[name*="sph_og"],[name*="sphere_og"],[name*="og_sphere"]', og.sphere],
          ['[name*="od"][name*="cyl"],[name*="cyl_od"],[name*="cylindre_od"]', od.cylindre],
          ['[name*="og"][name*="cyl"],[name*="cyl_og"],[name*="cylindre_og"]', og.cylindre],
          ['[name*="od"][name*="axe"],[name*="axe_od"]', od.axe],
          ['[name*="og"][name*="axe"],[name*="axe_og"]', og.axe],
          ['[name*="od"][name*="add"],[name*="add_od"]', od.addition],
          ['[name*="og"][name*="add"],[name*="add_og"]', og.addition]
        ];
        for (let i = 0; i < named.length; i++) {
          const el = findElement(named[i][0]);
          if (el && named[i][1]) { ultraFill(el, named[i][1]); filled++; }
        }
      }

      if (o.distancePupillaire) {
        const dpInputs = getOrdoInputs(/(?:^dp$|pupillaire|\xE9cart)/i);
        const dpEl = dpInputs[0]
          || findElement('[name*="_dp"],[name*="dp_"],[name="dp"]')
          || findElement('[name*="pupillaire"]');
        if (dpEl) { ultraFill(dpEl, o.distancePupillaire); filled++; }
      }

      if (filled > 0) {
        alert('OptiBot \u2713 Ordonnance remplie (' + filled + ' champs)');
      } else {
        var domain = window.location.hostname;
        var forms = document.querySelectorAll('form');
        var formHtml = '';
        if (forms.length > 0) {
          forms.forEach(function(f, i) { formHtml += '--- Formulaire ' + (i+1) + ' ---\n' + f.outerHTML + '\n\n'; });
        } else {
          formHtml = '(Aucun élément <form> détecté — page : ' + window.location.href + ')';
        }
        var clipText = 'URL : ' + window.location.href + '\n\n' + formHtml;
        try { navigator.clipboard.writeText(clipText); } catch(e) { /* ignore */ }
        if (confirm('OptiBot : Aucun formulaire reconnu sur ' + domain + '.\n\nLe code HTML du formulaire a été copié dans votre presse-papier.\nVoulez-vous ouvrir votre messagerie pour envoyer une demande d\'intégration ?\n\n➜ Collez simplement le contenu copié dans le mail.')) {
          window.open('mailto:contact@optibot.fr?subject=Demande%20d\'int%C3%A9gration%20%3A%20' + encodeURIComponent(domain) + '&body=Bonjour%2C%0A%0AOptiBot%20ne%20reconna%C3%AEt%20pas%20le%20formulaire%20sur%20%3A%20' + encodeURIComponent(window.location.href) + '%0A%0ALe%20code%20HTML%20du%20formulaire%20est%20coll%C3%A9%20ci-dessous%20%3A%0A%0A(Collez%20ici%20le%20contenu%20copi%C3%A9)', '_blank');
        }
      }
    }
  } catch (e) {
    alert('Erreur OptiBot : Copiez les donn\u00E9es d\'abord.');
  }
})();`.replace(/\n/g, '').replace(/\s\s+/g, ' ');
