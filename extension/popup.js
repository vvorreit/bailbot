document.addEventListener('DOMContentLoaded', () => {
  const dataContainer = document.getElementById('data-container');
  let editingKey = null;

  // Helper pour lire une valeur imbriquée (ex: "ordonnance.lunettesOD.sphere")
  function getValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || '';
  }

  // Helper pour écrire une valeur imbriquée
  function setValue(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) current[part] = {};
      current = current[part];
    }
    current[parts[parts.length - 1]] = value;
  }

  function renderData() {
    chrome.storage.local.get(['optibot_cache'], (result) => {
      const cache = result.optibot_cache || {};
      const keys = Object.keys(cache);

      if (keys.length === 0) {
        dataContainer.innerHTML = '<div class="card no-data">Aucune donnée en cache.</div>';
        return;
      }

      dataContainer.innerHTML = '';
      keys.sort((a, b) => (cache[b].updatedAt || 0) - (cache[a].updatedAt || 0));

      keys.forEach(key => {
        const data = cache[key];
        const isEditing = editingKey === key;
        const card = document.createElement('div');
        card.className = 'card';
        
        const updatedAt = data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : 'Inconnue';

        // Définition des champs avec support des sections
        const sections = [
          {
            title: "État Civil",
            fields: [
              { id: 'nom', label: 'Nom' },
              { id: 'prenom', label: 'Prénom' },
              { id: 'dob', label: 'Né(e) le' },
              { id: 'nss', label: 'NSS' },
              { id: 'phone', label: 'Tél' },
              { id: 'email', label: 'Email' },
              { id: 'address', label: 'Adresse' },
              { id: 'zipCode', label: 'CP' },
              { id: 'city', label: 'Ville' }
            ]
          },
          {
            title: "Ordonnance",
            fields: [
              { id: 'ordonnance.typePrescription', label: 'Type' },
              { id: 'ordonnance.nomOphtalmologue', label: 'Ophtalmo' },
              { id: 'ordonnance.dateOrdonnance', label: 'Date Ord.' },
              { id: 'ordonnance.distancePupillaire', label: 'DP' },
              // OD
              { id: 'ordonnance.lunettesOD.sphere', label: 'OD Sph' },
              { id: 'ordonnance.lunettesOD.cylindre', label: 'OD Cyl' },
              { id: 'ordonnance.lunettesOD.axe', label: 'OD Axe' },
              { id: 'ordonnance.lunettesOD.addition', label: 'OD Add' },
              // OG
              { id: 'ordonnance.lunettesOG.sphere', label: 'OG Sph' },
              { id: 'ordonnance.lunettesOG.cylindre', label: 'OG Cyl' },
              { id: 'ordonnance.lunettesOG.axe', label: 'OG Axe' },
              { id: 'ordonnance.lunettesOG.addition', label: 'OG Add' },
              // Lentilles (si présent)
              { id: 'ordonnance.lentillesOD.rayonCourbure', label: 'OD RC' },
              { id: 'ordonnance.lentillesOD.diametre', label: 'OD Dia' },
              { id: 'ordonnance.lentillesOG.rayonCourbure', label: 'OG RC' },
              { id: 'ordonnance.lentillesOG.diametre', label: 'OG Dia' },
              // Autre
              { id: 'ordonnance.remarques', label: 'Remarques' }
            ]
          }
        ];

        let html = `
          <div class="section-title">
            <span>${isEditing ? 'Modification' : `Données de ${data.prenom || ''} ${data.nom || 'Client'}`}</span>
            <div class="actions-group">
              ${isEditing ? `
                <button class="save-btn" data-key="${key}">Sauver</button>
                <button class="cancel-btn">Annuler</button>
              ` : `
                <button class="edit-btn" data-key="${key}">Modifier</button>
                <button class="clear-btn" data-key="${key}">Effacer</button>
              `}
            </div>
          </div>
          <div class="tag">Mise à jour : ${updatedAt}</div>
          <div class="data-list">
        `;

        sections.forEach(section => {
          // Vérifier s'il y a des données dans cette section pour l'affichage (hors mode édition)
          const hasData = section.fields.some(f => getValue(data, f.id));
          
          if (isEditing || hasData) {
            html += `<div style="margin: 8px 0 4px 0; font-weight: bold; font-size: 11px; color: #2563eb; border-bottom: 1px solid #e5e7eb; padding-bottom: 2px;">${section.title}</div>`;
            
            section.fields.forEach(field => {
              const val = getValue(data, field.id);
              if (isEditing) {
                html += `
                  <div class="data-item editing">
                    <span class="data-label">${field.label}</span>
                    <input type="text" class="edit-input" data-field="${field.id}" value="${val}">
                  </div>
                `;
              } else if (val) {
                html += `
                  <div class="data-item">
                    <span class="data-label">${field.label}</span>
                    <span class="data-value">${val}</span>
                  </div>
                `;
              }
            });
          }
        });

        html += `</div>`;
        card.innerHTML = html;
        dataContainer.appendChild(card);
      });

      // Event Listeners
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          editingKey = e.target.getAttribute('data-key');
          renderData();
        });
      });

      document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          editingKey = null;
          renderData();
        });
      });

      document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const keyToSave = e.target.getAttribute('data-key');
          saveChanges(keyToSave);
        });
      });

      document.querySelectorAll('.clear-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const keyToDelete = e.target.getAttribute('data-key');
          deleteEntry(keyToDelete);
        });
      });
    });
  }

  function saveChanges(key) {
    const inputs = document.querySelectorAll(`.edit-input`);
    
    chrome.storage.local.get(['optibot_cache'], (result) => {
      const cache = result.optibot_cache || {};
      if (cache[key]) {
        // On clone l'objet existant pour ne pas perdre les propriétés non éditées
        const updatedData = JSON.parse(JSON.stringify(cache[key]));
        
        inputs.forEach(input => {
          const path = input.getAttribute('data-field');
          setValue(updatedData, path, input.value);
        });

        updatedData.updatedAt = Date.now();
        cache[key] = updatedData;

        chrome.storage.local.set({ optibot_cache: cache }, () => {
          editingKey = null;
          renderData();
        });
      }
    });
  }

  function deleteEntry(key) {
    chrome.storage.local.get(['optibot_cache'], (result) => {
      const cache = result.optibot_cache || {};
      delete cache[key];
      chrome.storage.local.set({ optibot_cache: cache }, () => {
        if (editingKey === key) editingKey = null;
        renderData();
      });
    });
  }

  renderData();
});
