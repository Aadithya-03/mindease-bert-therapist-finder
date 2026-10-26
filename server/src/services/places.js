import { config } from '../config.js';

const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const TTL = 10 * 60 * 1000;
const cache = new Map();

function remember(key, value) {
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  cache.set(key, { value, at: Date.now() });
  return value;
}
function recall(key) {
  const hit = cache.get(key);
  return hit && Date.now() - hit.at < TTL ? hit.value : null;
}

const haversineKm = (a, b, c, d) => {
  const R = 6371, rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(c - a), dLon = rad(d - b);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const safeUrl = (u) => (typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null);

/** specialty: psychiatrist | psychologist | counsellor | hospital */
export function classify(tags = {}) {
  const h = (tags.healthcare || '').toLowerCase();
  const spec = (tags['healthcare:speciality'] || '').toLowerCase();
  if (tags.amenity === 'hospital') {
    const psych = /psychiat|mental/.test(`${spec} ${(tags.name || '').toLowerCase()}`);
    return { category: 'hospital', specialty: 'hospital', label: psych ? 'Psychiatric hospital' : 'Hospital' };
  }
  if (h === 'psychiatrist' || spec.includes('psychiatry')) return { category: 'therapist', specialty: 'psychiatrist', label: 'Psychiatrist' };
  if (h === 'psychologist' || h === 'psychotherapist' || /psycholog|psychotherap/.test(spec))
    return { category: 'therapist', specialty: 'psychologist', label: h === 'psychotherapist' ? 'Psychotherapist' : 'Psychologist' };
  if (h === 'counselling' || h === 'counsellor' || h === 'counselor') return { category: 'therapist', specialty: 'counsellor', label: 'Counsellor' };
  return null;
}

function address(t) {
  if (t['addr:full']) return t['addr:full'];
  const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ');
  return [street, t['addr:suburb'] || t['addr:neighbourhood'], t['addr:city'] || t['addr:town'] || t['addr:village'], t['addr:postcode']]
    .filter(Boolean).join(', ');
}

async function overpass(query) {
  let lastErr;
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': config.osmUserAgent },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) return await res.json();
      lastErr = new Error(`Overpass ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
  }
  const e = new Error('The map data service is busy. Please try again in a moment.');
  e.status = 502;
  e.cause = lastErr;
  throw e;
}

export async function searchNearby(lat, lng, radiusKm) {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)},${radiusKm}`;
  const cached = recall(key);
  if (cached) return cached;

  const r = Math.round(radiusKm * 1000);
  const around = `(around:${r},${lat},${lng})`;
  const query = `[out:json][timeout:25];(
    nwr["healthcare"~"^(psychotherapist|psychiatrist|psychologist|counselling|counsellor|counselor)$"]${around};
    nwr["healthcare:speciality"~"psychiatry|psychotherapy|psychology"]${around};
    nwr["amenity"="hospital"]${around};
  );out center tags;`;

  const data = await overpass(query);
  const seen = new Set();
  const items = [];
  for (const el of data.elements || []) {
    const kind = classify(el.tags);
    const pLat = el.lat ?? el.center?.lat, pLon = el.lon ?? el.center?.lon;
    if (!kind || pLat == null || pLon == null) continue;
    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const t = el.tags;
    items.push({
      id, ...kind,
      name: t.name || `Unnamed ${kind.label.toLowerCase()}`,
      lat: pLat, lon: pLon,
      distanceKm: Math.round(haversineKm(lat, lng, pLat, pLon) * 10) / 10,
      address: address(t) || null,
      phone: t.phone || t['contact:phone'] || null,
      website: safeUrl(t.website || t['contact:website']),
      hours: t.opening_hours || null,
    });
  }
  items.sort((a, b) => a.distanceKm - b.distanceKm);
  return remember(key, items.slice(0, 120));
}

export async function geocode(q) {
  const key = `geo:${q.toLowerCase()}`;
  const cached = recall(key);
  if (cached) return cached;
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': config.osmUserAgent, 'Accept-Language': 'en' }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) { const e = new Error('Address lookup failed. Please try again.'); e.status = 502; throw e; }
  const [hit] = await res.json();
  if (!hit) return null;
  return remember(key, { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name });
}
