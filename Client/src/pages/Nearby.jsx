import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair, Search, Navigation, Phone, Globe, Clock, MapPin } from 'lucide-react';
import { api } from '../api';

const FILTERS = [
  ['all', 'All'], ['psychiatrist', 'Psychiatrists'], ['psychologist', 'Psychologists'], ['counsellor', 'Counsellors'], ['hospital', 'Hospitals'],
];
const COLORS = { therapist: '#4f7fe0', hospital: '#d65f93', you: '#2f9e6b' };

const pin = (color) => L.divIcon({
  className: 'pin-wrap', html: `<span class="pin" style="--pin:${color}"></span>`,
  iconSize: [24, 24], iconAnchor: [12, 24], popupAnchor: [0, -22],
});
const safeHref = (u) => (/^https?:\/\//i.test(u || '') ? u : null);
const directionsUrl = (f) => `https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}`;

/** Popups are built with DOM nodes + textContent because OpenStreetMap names are user-generated. */
function popupEl(f) {
  const root = document.createElement('div');
  root.className = 'popup';
  const add = (tag, text, cls) => { const el = document.createElement(tag); el.textContent = text; if (cls) el.className = cls; root.appendChild(el); return el; };
  add('strong', f.name);
  add('span', `${f.label} · ${f.distanceKm} km away`, 'muted');
  if (f.address) add('span', f.address);
  if (f.phone) add('span', f.phone);
  const a = document.createElement('a');
  a.href = directionsUrl(f); a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Get directions';
  root.appendChild(a);
  return root;
}

export default function Nearby() {
  const mapEl = useRef(null);
  const map = useRef(null);
  const layers = useRef({ markers: null, you: null, circle: null });
  const markerById = useRef(new Map());

  const [loc, setLoc] = useState(null);           // { lat, lng, label? }
  const [radius, setRadius] = useState(10);
  const [filter, setFilter] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState('');
  const [activeId, setActiveId] = useState(null);

  // Create the map once.
  useEffect(() => {
    const m = L.map(mapEl.current, { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    layers.current.markers = L.layerGroup().addTo(m);
    m.on('click', (e) => setLoc({ lat: e.latlng.lat, lng: e.latlng.lng }));
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  // New location or radius: move marker + circle, then (debounced) search.
  useEffect(() => {
    if (!loc || !map.current) return undefined;
    const m = map.current;
    layers.current.you?.remove();
    layers.current.circle?.remove();
    layers.current.you = L.marker([loc.lat, loc.lng], { icon: pin(COLORS.you), keyboard: false }).addTo(m).bindPopup('Your search location');
    layers.current.circle = L.circle([loc.lat, loc.lng], { radius: radius * 1000, color: '#89b4f8', weight: 2, fillOpacity: 0.08 }).addTo(m);
    m.fitBounds(layers.current.circle.getBounds(), { padding: [20, 20] });

    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true); setError('');
      try {
        const r = await api(`/places/search?lat=${loc.lat}&lng=${loc.lng}&radius=${radius}`, { signal: ctrl.signal });
        setResults(r.results);
      } catch (e) { if (e.name !== 'AbortError') { setError(e.message); setResults([]); } }
      finally { if (!ctrl.signal.aborted) setLoading(false); }
    }, 500);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [loc, radius]);

  const shown = useMemo(() => results.filter((f) => filter === 'all' || f.specialty === filter), [results, filter]);

  // Redraw markers whenever the visible list changes.
  useEffect(() => {
    const group = layers.current.markers;
    if (!group) return;
    group.clearLayers();
    markerById.current = new Map();
    shown.forEach((f) => {
      const mk = L.marker([f.lat, f.lon], { icon: pin(f.category === 'hospital' ? COLORS.hospital : COLORS.therapist), title: f.name, alt: f.name })
        .bindPopup(() => popupEl(f));
      mk.on('click', () => setActiveId(f.id));
      mk.addTo(group);
      markerById.current.set(f.id, mk);
    });
  }, [shown]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) { setError('Your browser does not support location. Search by address instead.'); return; }
    setError(''); setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude, label: 'Your current location' }),
      (err) => { setLoading(false); setError(err.code === 1 ? 'Location permission was denied. Search by address instead.' : 'Could not get your location. Search by address instead.'); },
      { timeout: 12000, maximumAge: 60000 },
    );
  }, []);

  const searchAddress = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setError(''); setLoading(true);
    try {
      const hit = await api(`/places/geocode?q=${encodeURIComponent(address.trim())}`);
      setLoc({ lat: hit.lat, lng: hit.lng, label: hit.label });
    } catch (err) { setError(err.message); setLoading(false); }
  };

  const select = (f) => {
    setActiveId(f.id);
    map.current?.flyTo([f.lat, f.lon], Math.max(map.current.getZoom(), 15), { duration: 0.6 });
    markerById.current.get(f.id)?.openPopup();
  };

  return (
    <div className="stack-lg">
      <section className="card toolbar">
        <button className="btn btn-primary" onClick={useMyLocation}><Crosshair size={18} /> Use my location</button>
        <form className="searchbox" onSubmit={searchAddress}>
          <label htmlFor="addr" className="sr-only">Search by address or city</label>
          <input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Or search a city or address" maxLength={200} />
          <button className="btn"><Search size={18} /> Search</button>
        </form>
        <label className="inline range">Radius <strong>{radius} km</strong>
          <input type="range" min="1" max="50" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </label>
      </section>

      <div className="split map-split">
        <section className="card map-card">
          <div ref={mapEl} className="map" aria-label="Map of nearby therapists and hospitals" />
          <div className="legend" aria-hidden>
            <span><i style={{ background: COLORS.you }} /> You</span>
            <span><i style={{ background: COLORS.therapist }} /> Therapist</span>
            <span><i style={{ background: COLORS.hospital }} /> Hospital</span>
          </div>
        </section>

        <section className="card results">
          <div className="row between">
            <h3>Nearby help</h3>
            <span className="chip" role="status">{loading ? 'Searching…' : `${shown.length} found`}</span>
          </div>
          <div className="chips" role="group" aria-label="Filter">
            {FILTERS.map(([id, label]) => (
              <button key={id} className={`pill ${filter === id ? 'on' : ''}`} aria-pressed={filter === id} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>
          {error && <div className="banner banner-error" role="alert">{error}</div>}
          {!loc && !error && <p className="muted">Allow location access, search for a place, or click anywhere on the map to start.</p>}
          {loc && !loading && !error && shown.length === 0 && <p className="muted">Nothing found here. Try a larger radius or the “All” filter. OpenStreetMap coverage varies by area.</p>}

          <ul className="list scroll">
            {shown.map((f) => (
              <li key={f.id}>
                <div className={`place ${activeId === f.id ? 'on' : ''}`}>
                  <button className="place-main" onClick={() => select(f)}>
                    <strong>{f.name}</strong>
                    <span className="muted">{f.label} · {f.distanceKm} km</span>
                  </button>
                  <div className="place-info">
                    {f.address && <span><MapPin size={14} aria-hidden /> {f.address}</span>}
                    {f.phone && <span><Phone size={14} aria-hidden /> <a href={`tel:${f.phone.replace(/[^\d+]/g, '')}`}>{f.phone}</a></span>}
                    {f.hours && <span><Clock size={14} aria-hidden /> {f.hours}</span>}
                    {safeHref(f.website) && <span><Globe size={14} aria-hidden /> <a href={safeHref(f.website)} target="_blank" rel="noopener noreferrer">Website</a></span>}
                  </div>
                  <a className="btn btn-small" href={directionsUrl(f)} target="_blank" rel="noopener noreferrer"><Navigation size={15} /> Directions</a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="fine">Listings come from OpenStreetMap contributors and may be incomplete or out of date. Call ahead to confirm availability.</p>
    </div>
  );
}
