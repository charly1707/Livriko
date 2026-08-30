const GEOAPIFY_BASE = 'https://api.geoapify.com/v1';

function apiKey() {
  return String(process.env.GEOAPIFY_API_KEY || process.env.MAPS_API_KEY || '').trim();
}

function ensureKey() {
  const key = apiKey();
  if (!key) {
    throw new Error('GEOAPIFY_API_KEY manquante.');
  }
  return key;
}

function osrmLikeRoute(geoapifyBody) {
  const feature = geoapifyBody?.features?.[0];
  const props = feature?.properties || {};
  const geometry = feature?.geometry;
  if (!geometry || !Number.isFinite(props.distance)) {
    throw new Error('Itinéraire Geoapify invalide.');
  }
  return {
    routes: [{
      distance: props.distance,
      duration: props.time,
      geometry,
    }],
  };
}

export async function geoapifyRoute(fromLat, fromLng, toLat, toLng) {
  const key = ensureKey();
  const waypoints = `${fromLat},${fromLng}|${toLat},${toLng}`;
  const url = `${GEOAPIFY_BASE}/routing?waypoints=${encodeURIComponent(waypoints)}&mode=drive&format=geojson&apiKey=${encodeURIComponent(key)}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    throw new Error('API Geoapify indisponible.');
  }
  const body = await response.json().catch(() => null);
  return osrmLikeRoute(body);
}

export async function geoapifyGeocode(text, limit = 5) {
  const key = ensureKey();
  const query = String(text || '').trim();
  if (!query) return [];
  const url = `${GEOAPIFY_BASE}/geocode/search?text=${encodeURIComponent(query)}&limit=${limit}&format=json&apiKey=${encodeURIComponent(key)}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    throw new Error('Géocodage Geoapify indisponible.');
  }
  const body = await response.json().catch(() => null);
  const results = Array.isArray(body?.results) ? body.results : [];
  return results.map((item) => ({
    label: item.formatted || item.address_line1 || query,
    lat: item.lat,
    lng: item.lon,
    city: item.city || item.county || '',
    country: item.country || '',
  })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
}

export async function geoapifyAutocomplete(text, limit = 5) {
  const key = ensureKey();
  const query = String(text || '').trim();
  if (query.length < 2) return [];
  const url = `${GEOAPIFY_BASE}/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=${limit}&format=json&apiKey=${encodeURIComponent(key)}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) {
    throw new Error('Autocomplétion Geoapify indisponible.');
  }
  const body = await response.json().catch(() => null);
  const results = Array.isArray(body?.results) ? body.results : [];
  return results.map((item) => ({
    label: item.formatted || item.address_line1 || query,
    lat: item.lat,
    lng: item.lon,
    city: item.city || item.county || '',
    country: item.country || '',
  })).filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
}
