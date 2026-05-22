import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Search, Leaf, Activity, CheckCircle, AlertTriangle, Loader, BarChart2, Satellite } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';

// Leaflet CSS (loaded dynamically to avoid SSR issues)
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

const NDVI_COLOR = (ndvi) => {
  if (ndvi >= 0.65) return '#10b981';
  if (ndvi >= 0.45) return '#3b82f6';
  if (ndvi >= 0.30) return '#f59e0b';
  return '#ef4444';
};

const CARBON_MAX = 250000; // scale for bar chart

const StatBadge = ({ label, value, unit, color }) => (
  <div style={{
    background: `${color}12`, border: `1px solid ${color}30`,
    borderRadius: 10, padding: '0.85rem 1.1rem',
  }}>
    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>
      {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
      {unit && <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 4 }}>{unit}</span>}
    </div>
  </div>
);

const RegionalTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(59,130,246,0.3)',
      borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem',
    }}>
      <p style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{label}</p>
      <p style={{ color: '#60a5fa' }}>Carbon: {payload[0]?.value?.toLocaleString()} credits</p>
      <p style={{ color: '#34d399' }}>Biomass: {payload[1]?.value?.toLocaleString()} tons</p>
    </div>
  );
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const GeoExplorer = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [districts, setDistricts] = useState([]);
  const [distLoading, setDistLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  // Load Leaflet CSS + JS dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = LEAFLET_CSS;
    document.head.appendChild(link);

    import('leaflet').then(L => {
      window._L = L.default || L;
      setMapReady(true);
    });

    // Load district data
    axios.get(`${API_BASE_URL}/maharashtra-districts`)
      .then(r => setDistricts(r.data.districts || []))
      .catch(() => setDistricts([]))
      .finally(() => setDistLoading(false));

    return () => { document.head.removeChild(link); };
  }, []);

  // Init Leaflet map once div is ready
  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInstance.current) return;
    const L = window._L;

    mapInstance.current = L.map(mapRef.current, {
      center: [19.75, 75.71], zoom: 7, zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00a9 OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mapReady]);

  // Drop/move marker when result changes
  useEffect(() => {
    if (!result || !mapInstance.current) return;
    const L = window._L;
    const { lat, lon } = result;

    if (markerRef.current) markerRef.current.remove();

    const icon = L.divIcon({
      html: `<div style="width:18px;height:18px;border-radius:50%;background:${NDVI_COLOR(result.ndvi)};
             border:3px solid white;box-shadow:0 0 12px ${NDVI_COLOR(result.ndvi)}"></div>`,
      className: '', iconAnchor: [9, 9],
    });

    markerRef.current = L.marker([lat, lon], { icon })
      .addTo(mapInstance.current)
      .bindPopup(`
        <div style="font-family:Inter,sans-serif;padding:4px">
          <b style="color:#0f172a">${result.district || result.location?.split(',')[0]}</b><br/>
          <span style="color:#475569;font-size:12px">${result.ecosystem_type}</span><br/>
          <span style="color:#3b82f6;font-weight:700">NDVI: ${result.ndvi}</span><br/>
          <span style="color:#10b981;font-weight:700">Carbon: ${result.carbon_estimate?.toLocaleString()} credits</span>
        </div>
      `)
      .openPopup();

    mapInstance.current.flyTo([lat, lon], 10, { duration: 1.5 });
  }, [result]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/geo-predict`, { params: { location: query } });
      if (res.data.error) setError(res.data.error);
      else setResult(res.data);
    } catch (err) {
      setError('Backend not reachable. Make sure the Python API is running.');
    } finally {
      setLoading(false);
    }
  };

  const topDistricts = districts.slice(0, 15);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1.5rem' }}
    >
      {/* ── Header ── */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ background: 'rgba(16,185,129,0.12)', padding: '0.45rem', borderRadius: 8 }}>
            <MapPin size={20} color="#10b981" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              Geo <span className="gradient-text">Explorer</span>
            </h3>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
              Search any Maharashtra location → live NDVI + carbon prediction
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
            <Satellite size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />NASA MODIS
          </span>
          <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 20, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
            OpenStreetMap
          </span>
        </div>
      </div>

      {/* ── Main grid: map + sidebar ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '1.5rem' }}>

        {/* Left — Leaflet Map */}
        <div className="glass-panel" style={{ overflow: 'hidden', borderRadius: 20, height: 520, position: 'relative' }}>
          {/* Search bar overlay */}
          <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '85%' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', zIndex: 1 }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Type a district e.g. Thane, Raigad, Gadchiroli..."
                  style={{
                    width: '100%', paddingLeft: 36,
                    background: 'rgba(11,17,32,0.92)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(59,130,246,0.4)',
                    borderRadius: 10, fontSize: '0.88rem',
                  }}
                />
              </div>
              <motion.button
                type="submit" disabled={loading}
                whileTap={{ scale: 0.96 }}
                style={{
                  background: 'linear-gradient(135deg,#3b82f6,#10b981)',
                  border: 'none', borderRadius: 10, padding: '0 1rem',
                  color: 'white', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem',
                }}
              >
                {loading
                  ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader size={16} /></motion.div>
                  : <><MapPin size={15} /> Search</>}
              </motion.button>
            </form>
          </div>

          {/* Map container */}
          <div ref={mapRef} style={{ width: '100%', height: '520px', borderRadius: 20 }} />

          {/* Loading overlay */}
          {!mapReady && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(11,17,32,0.8)', borderRadius: 20, zIndex: 500 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
                <Loader size={32} color="#3b82f6" />
              </motion.div>
            </div>
          )}
        </div>

        {/* Right — Results Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '1rem', display: 'flex', gap: '0.6rem', color: '#fca5a5' }}
              >
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!result && !loading && !error && (
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', color: '#475569' }}>
              <MapPin size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Search a Maharashtra district or city to get satellite-driven biomass & carbon predictions.</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '1rem' }}>
              <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <Satellite size={36} color="#3b82f6" />
              </motion.div>
              <p className="gradient-text" style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Fetching satellite data...</p>
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                className="glass-panel"
                style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              >
                {/* Location header */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <CheckCircle size={16} color="#10b981" />
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: '#e2e8f0' }}>
                      {result.district || result.location?.split(',')[0]}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                    {result.location?.substring(0, 60)}{result.location?.length > 60 ? '…' : ''}
                  </p>
                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
                      {result.ecosystem_type}
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
                      {result.ndvi_source === 'nasa_modis_live' ? '🛰 NASA MODIS Live' : '📊 District KB'}
                    </span>
                  </div>
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                {/* Stat grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <StatBadge label="NDVI" value={result.ndvi} color={NDVI_COLOR(result.ndvi)} />
                  <StatBadge label="CONFIDENCE" value={result.confidence_pct} unit="%" color="#8b5cf6" />
                  <StatBadge label="BIOMASS" value={result.predicted_biomass} unit="tons" color="#f59e0b" />
                  <StatBadge label="CARBON CREDITS" value={result.carbon_estimate} unit="cr" color="#3b82f6" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '0.6rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>LAT / LON</div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1', fontFamily: 'monospace' }}>
                      {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '0.6rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>AREA</div>
                    <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{result.area_ha?.toLocaleString()} ha</div>
                  </div>
                </div>

                {/* Feature importances mini */}
                {result.feature_importances?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Feature Contribution</div>
                    {result.feature_importances.slice(0, 4).map(f => (
                      <div key={f.feature} style={{ marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: 2 }}>
                          <span>{f.feature}</span><span>{f.importance}%</span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${f.importance}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#3b82f6,#10b981)' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Regional Distribution ── */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <div style={{ background: 'rgba(59,130,246,0.12)', padding: '0.4rem', borderRadius: 8 }}>
            <BarChart2 size={18} color="#3b82f6" />
          </div>
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
            Maharashtra <span className="gradient-text">District Carbon Distribution</span>
          </h4>
          <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', marginLeft: 'auto' }}>
            Top 15 districts by carbon stock
          </span>
        </div>

        {distLoading ? (
          <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}>
              <Loader size={28} color="#3b82f6" />
            </motion.div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topDistricts} margin={{ top: 5, right: 10, left: 10, bottom: 40 }}>
              <XAxis dataKey="district" tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<RegionalTooltip />} />
              <Bar dataKey="carbon_estimate" name="Carbon Credits" radius={[5, 5, 0, 0]} maxBarSize={32}>
                {topDistricts.map((d, i) => (
                  <Cell key={d.district} fill={NDVI_COLOR(d.ndvi)} opacity={result?.district === d.district ? 1 : 0.75} />
                ))}
              </Bar>
              <Bar dataKey="predicted_biomass" name="Biomass (tons)" radius={[5, 5, 0, 0]} fill="#3b82f620" stroke="#3b82f6" strokeWidth={1} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* District cards row */}
        {!distLoading && districts.length > 0 && (
          <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '0.6rem' }}>
            {districts.slice(0, 8).map((d, i) => (
              <motion.div
                key={d.district}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                onClick={() => { setQuery(d.district); }}
                style={{
                  background: `${NDVI_COLOR(d.ndvi)}0d`, border: `1px solid ${NDVI_COLOR(d.ndvi)}30`,
                  borderRadius: 10, padding: '0.7rem 0.85rem', cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>{d.district}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 4 }}>{d.ecosystem}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: NDVI_COLOR(d.ndvi) }}>
                  {d.carbon_estimate?.toLocaleString()} <span style={{ fontSize: '0.65rem', fontWeight: 400 }}>credits</span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#475569' }}>NDVI {d.ndvi}</div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GeoExplorer;
