/**
 * DVF (Demandes de Valeurs Foncières) — Estimation loyer de marché
 *
 * Utilise l'API adresse.data.gouv.fr pour le géocodage
 * puis l'API DVF (api.cquest.org) pour les transactions immobilières.
 * Les prix de vente sont convertis en loyers estimés via un taux de rendement locatif.
 */

export interface LoyerMarcheResult {
  loyerMedianM2: number;
  loyerQ1M2: number;
  loyerQ3M2: number;
  nbTransactions: number;
  source: string;
  dateCalcul: string;
  prixMedianVenteM2: number;
  tauxRendement: number;
}

interface GeocodageResult {
  lat: number;
  lon: number;
  citycode: string;
  city: string;
  postcode: string;
}

interface MutationDVF {
  valeur_fonciere: number;
  surface_reelle_bati: number;
  type_local: string;
  date_mutation: string;
  nombre_pieces_principales: number;
}

/* ─── Taux de rendement locatif par zone (annuel brut) ──────────────────── */

const TAUX_RENDEMENT: Record<string, number> = {
  "75": 0.035,  /* Paris */
  "92": 0.038,  /* Hauts-de-Seine */
  "93": 0.045,  /* Seine-Saint-Denis */
  "94": 0.042,  /* Val-de-Marne */
  "69": 0.045,  /* Rhône (Lyon) */
  "13": 0.050,  /* Bouches-du-Rhône (Marseille) */
  "31": 0.048,  /* Haute-Garonne (Toulouse) */
  "33": 0.048,  /* Gironde (Bordeaux) */
  "06": 0.040,  /* Alpes-Maritimes (Nice) */
  "34": 0.050,  /* Hérault (Montpellier) */
  "44": 0.048,  /* Loire-Atlantique (Nantes) */
  "67": 0.050,  /* Bas-Rhin (Strasbourg) */
  "59": 0.060,  /* Nord (Lille) */
  "35": 0.048,  /* Ille-et-Vilaine (Rennes) */
};

const TAUX_RENDEMENT_DEFAUT = 0.055;

function getTauxRendement(departement: string): number {
  return TAUX_RENDEMENT[departement] ?? TAUX_RENDEMENT_DEFAUT;
}

/* ─── Correspondance type bien → type DVF ────────────────────────────────── */

function mapTypeBienToDVF(typeBien: string): string {
  if (typeBien.toLowerCase().includes("maison")) return "Maison";
  return "Appartement";
}

/* ─── Géocodage via api-adresse.data.gouv.fr ─────────────────────────────── */

async function geocoder(adresse: string): Promise<GeocodageResult | null> {
  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(adresse)}&limit=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;

  const [lon, lat] = feature.geometry.coordinates;
  return {
    lat,
    lon,
    citycode: feature.properties.citycode ?? "",
    city: feature.properties.city ?? "",
    postcode: feature.properties.postcode ?? "",
  };
}

/* ─── Requête DVF via api.cquest.org ─────────────────────────────────────── */

async function fetchMutationsDVF(
  lat: number,
  lon: number,
  typeDVF: string,
  distMetres: number = 500
): Promise<MutationDVF[]> {
  const url =
    `https://api.cquest.org/dvf?lat=${lat}&lon=${lon}&dist=${distMetres}` +
    `&nature_mutation=Vente&type_local=${encodeURIComponent(typeDVF)}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];

  const data = await res.json();

  const features = data.features ?? data.resultats ?? [];
  const mutations: MutationDVF[] = [];

  for (const f of features) {
    const props = f.properties ?? f;
    const valeur = parseFloat(props.valeur_fonciere);
    const surface = parseFloat(props.surface_reelle_bati);
    if (!valeur || !surface || surface < 5) continue;

    mutations.push({
      valeur_fonciere: valeur,
      surface_reelle_bati: surface,
      type_local: props.type_local ?? typeDVF,
      date_mutation: props.date_mutation ?? "",
      nombre_pieces_principales: parseInt(props.nombre_pieces_principales) || 0,
    });
  }

  return mutations;
}

/* ─── Fallback : API CEREMA ──────────────────────────────────────────────── */

async function fetchMutationsCerema(
  lat: number,
  lon: number,
  typeDVF: string
): Promise<MutationDVF[]> {
  const url =
    `https://apidf-preprod.cerema.fr/dvf_opendata/geomutations/?lat=${lat}&lon=${lon}&dist=500` +
    `&nature_mutation=Vente&type_local=${encodeURIComponent(typeDVF)}&page_size=100`;

  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];

  const data = await res.json();
  const results = data.results ?? data.features ?? [];
  const mutations: MutationDVF[] = [];

  for (const item of results) {
    const props = item.properties ?? item;
    const valeur = parseFloat(props.valeur_fonciere);
    const surface = parseFloat(props.surface_reelle_bati);
    if (!valeur || !surface || surface < 5) continue;

    mutations.push({
      valeur_fonciere: valeur,
      surface_reelle_bati: surface,
      type_local: props.type_local ?? typeDVF,
      date_mutation: props.date_mutation ?? "",
      nombre_pieces_principales: parseInt(props.nombre_pieces_principales) || 0,
    });
  }

  return mutations;
}

/* ─── Statistiques ───────────────────────────────────────────────────────── */

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

/* ─── Fonction principale ────────────────────────────────────────────────── */

export async function getLoyerMarche(
  adresse: string,
  surface: number,
  typeBien: string
): Promise<LoyerMarcheResult | null> {
  const geo = await geocoder(adresse);
  if (!geo) return null;

  const typeDVF = mapTypeBienToDVF(typeBien);
  const departement = geo.postcode.slice(0, 2);

  /* Chercher les mutations DVF */
  let mutations = await fetchMutationsDVF(geo.lat, geo.lon, typeDVF, 500);
  let source = "DVF (api.cquest.org)";

  /* Fallback CEREMA si pas assez de résultats */
  if (mutations.length < 5) {
    const cerema = await fetchMutationsCerema(geo.lat, geo.lon, typeDVF);
    if (cerema.length > mutations.length) {
      mutations = cerema;
      source = "DVF (CEREMA)";
    }
  }

  /* Élargir à 1km si toujours pas assez */
  if (mutations.length < 5) {
    const wider = await fetchMutationsDVF(geo.lat, geo.lon, typeDVF, 1000);
    if (wider.length > mutations.length) {
      mutations = wider;
      source = "DVF (rayon 1km)";
    }
  }

  if (mutations.length < 3) return null;

  /* Filtrer : 12 derniers mois + surface similaire (±40%) */
  const now = new Date();
  const unAnAvant = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const surfaceMin = surface * 0.6;
  const surfaceMax = surface * 1.4;

  let filtered = mutations.filter((m) => {
    if (m.date_mutation) {
      const dateMut = new Date(m.date_mutation);
      if (dateMut < unAnAvant) return false;
    }
    return m.surface_reelle_bati >= surfaceMin && m.surface_reelle_bati <= surfaceMax;
  });

  /* Si pas assez après filtre temporel, prendre les 24 derniers mois */
  if (filtered.length < 5) {
    const deuxAnsAvant = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    filtered = mutations.filter((m) => {
      if (m.date_mutation) {
        const dateMut = new Date(m.date_mutation);
        if (dateMut < deuxAnsAvant) return false;
      }
      return m.surface_reelle_bati >= surfaceMin && m.surface_reelle_bati <= surfaceMax;
    });
    if (filtered.length >= 3) {
      source += " (24 mois)";
    }
  }

  /* Si toujours pas assez, utiliser toutes les mutations sans filtre de surface strict */
  if (filtered.length < 3) {
    filtered = mutations.filter((m) => {
      if (m.date_mutation) {
        const dateMut = new Date(m.date_mutation);
        const troisAnsAvant = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
        if (dateMut < troisAnsAvant) return false;
      }
      return m.surface_reelle_bati >= surface * 0.4 && m.surface_reelle_bati <= surface * 1.8;
    });
    if (filtered.length >= 3) {
      source += " (élargi)";
    }
  }

  if (filtered.length < 3) return null;

  /* Calculer les prix au m² de vente */
  const prixM2 = filtered
    .map((m) => m.valeur_fonciere / m.surface_reelle_bati)
    .filter((p) => p > 500 && p < 30000) /* Filtrer les aberrations */
    .sort((a, b) => a - b);

  if (prixM2.length < 3) return null;

  /* Convertir en loyer estimé via taux de rendement */
  const taux = getTauxRendement(departement);
  const prixMedianVenteM2 = percentile(prixM2, 50);
  const loyerMedianM2 = (prixMedianVenteM2 * taux) / 12;
  const loyerQ1M2 = (percentile(prixM2, 25) * taux) / 12;
  const loyerQ3M2 = (percentile(prixM2, 75) * taux) / 12;

  return {
    loyerMedianM2: Math.round(loyerMedianM2 * 100) / 100,
    loyerQ1M2: Math.round(loyerQ1M2 * 100) / 100,
    loyerQ3M2: Math.round(loyerQ3M2 * 100) / 100,
    nbTransactions: prixM2.length,
    source,
    dateCalcul: now.toISOString(),
    prixMedianVenteM2: Math.round(prixMedianVenteM2),
    tauxRendement: taux,
  };
}
