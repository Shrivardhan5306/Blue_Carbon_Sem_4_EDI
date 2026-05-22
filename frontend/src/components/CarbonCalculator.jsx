import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, Leaf, Map, Activity, TrendingUp, DollarSign,
  Car, Trees, Zap, Globe, Info, ChevronDown, Award, Wind
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';

// ── Ecosystem presets ──────────────────────────────────────────────────────
const ECOSYSTEMS = [
  { id: 'mangrove',   label: 'Mangrove',     icon: '🌿', color: '#10b981', glow: 'rgba(16,185,129,0.2)',
    biomassBase: 160, seqRate: 6.4,  ndviDefault: 0.72, desc: 'Highest blue carbon density' },
  { id: 'seagrass',   label: 'Seagrass',     icon: '🌊', color: '#3b82f6', glow: 'rgba(59,130,246,0.2)',
    biomassBase: 80,  seqRate: 3.8,  ndviDefault: 0.55, desc: 'Rich sediment carbon storage' },
  { id: 'saltmarsh',  label: 'Salt Marsh',   icon: '🌾', color: '#14b8a6', glow: 'rgba(20,184,166,0.2)',
    biomassBase: 110, seqRate: 5.0,  ndviDefault: 0.60, desc: 'Coastal peat accumulation' },
  { id: 'dryland',    label: 'Dry Forest',   icon: '🌳', color: '#f59e0b', glow: 'rgba(245,158,11,0.2)',
    biomassBase: 60,  seqRate: 2.1,  ndviDefault: 0.40, desc: 'Semi-arid biomass sink' },
  { id: 'tropical',   label: 'Tropical',     icon: '🌴', color: '#8b5cf6', glow: 'rgba(139,92,246,0.2)',
    biomassBase: 200, seqRate: 8.5,  ndviDefault: 0.82, desc: 'Peak biomass accumulation' },
];

// MCO2 approximate price in INR (static fallback)
const MCO2_PRICE_INR = 420;

// CO2 equivalence constants
const KG_CO2_PER_TREE_PER_YEAR = 21;
const KG_CO2_PER_CAR_PER_YEAR = 4600;
const KG_CO2_PER_FLIGHT = 255;  // avg domestic flight
const TONNES_CO2_PER_CREDIT = 1;

// ── Slider component ───────────────────────────────────────────────────────
const Slider = ({ label, icon: Icon, value, min, max, step = 1, unit, color, onChange, format }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
      <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Icon size={14} color="#64748b" /> {label}
      </label>
      <span style={{
        fontWeight: 700, color, fontSize: '0.9rem',
        background: `${color}18`, border: `1px solid ${color}35`,
        padding: '2px 10px', borderRadius: 20,
      }}>
        {format ? format(value) : `${value}${unit}`}
      </span>
    </div>
    <div style={{ position: 'relative' }}>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color }}
      />
      <div style={{
        position: 'absolute', bottom: -16, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-between',
        fontSize: '0.65rem', color: '#334155', pointerEvents: 'none',
      }}>
        <span>{min}{unit}</span><span>{Math.round((max - min) / 2 + min)}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  </div>
);

// ── Mini ring chart ────────────────────────────────────────────────────────
const RingChart = ({ value, max, color, size = 80, label, sublabel }) => {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  const dash = pct * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id={`glow-${label}`}>
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
        {/* Fill */}
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          filter={`url(#glow-${label})`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ}` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize={10} fontWeight={700} fontFamily="Outfit, sans-serif">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e2e8f0' }}>{label}</div>
        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{sublabel}</div>
      </div>
    </div>
  );
};

// ── Chart tooltip ──────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(59,130,246,0.3)',
      borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.78rem',
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 3 }}>Year {label}</p>
      <p style={{ color: '#10b981', fontWeight: 700 }}>{payload[0]?.value?.toLocaleString()} credits</p>
      {payload[1] && <p style={{ color: '#3b82f6', fontWeight: 700 }}>₹{payload[1]?.value?.toLocaleString()}</p>}
    </div>
  );
};

// ── Equivalence badge ──────────────────────────────────────────────────────
const EqBadge = ({ icon, value, label, color }) => (
  <motion.div
    whileHover={{ y: -2, boxShadow: `0 8px 24px ${color}22` }}
    style={{
      background: `${color}0d`, border: `1px solid ${color}28`,
      borderRadius: 12, padding: '0.8rem 1rem',
      display: 'flex', flexDirection: 'column', gap: '0.25rem',
    }}
  >
    <div style={{ fontSize: '1.3rem' }}>{icon}</div>
    <div style={{ fontSize: '1rem', fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.3 }}>{label}</div>
  </motion.div>
);

// ── Main component ─────────────────────────────────────────────────────────
const CarbonCalculator = () => {
  const [ecosystem, setEcosystem] = useState('mangrove');
  const [area, setArea]     = useState(200);
  const [ndvi, setNdvi]     = useState(0.72);
  const [years, setYears]   = useState(10);
  const [showInfo, setShowInfo] = useState(false);

  const eco = ECOSYSTEMS.find(e => e.id === ecosystem);

  // ── Core calculations ────────────────────────────────────────────────────
  const calc = useMemo(() => {
    // Biomass (tons): area × base × NDVI multiplier
    const biomassPerHa  = eco.biomassBase * (0.5 + ndvi * 0.8);
    const totalBiomass  = area * biomassPerHa;

    // Carbon credits: 1 credit = 1 tonne CO2e
    // Sequestration: seqRate tons CO2/ha/yr × area × years
    const annualCredits = eco.seqRate * area * ndvi;
    const totalCredits  = annualCredits * years;

    // Market value (INR)
    const marketValue   = totalCredits * MCO2_PRICE_INR;

    // CO2 equivalence
    const co2Tonnes     = totalCredits * TONNES_CO2_PER_CREDIT;
    const trees         = Math.round((co2Tonnes * 1000) / KG_CO2_PER_TREE_PER_YEAR);
    const cars          = Math.round((co2Tonnes * 1000) / KG_CO2_PER_CAR_PER_YEAR);
    const flights       = Math.round((co2Tonnes * 1000) / KG_CO2_PER_FLIGHT);

    // Sequestration rate quality score (0-100)
    const score = Math.round(Math.min(99, (ndvi * 60) + (eco.seqRate / 8.5) * 40));

    // Year-by-year accumulation for chart
    const timeline = Array.from({ length: Math.min(years, 30) }, (_, i) => ({
      year: i + 1,
      credits: Math.round(annualCredits * (i + 1)),
      value:   Math.round(annualCredits * (i + 1) * MCO2_PRICE_INR),
    }));

    return { biomassPerHa, totalBiomass, annualCredits, totalCredits, marketValue,
             co2Tonnes, trees, cars, flights, score, timeline };
  }, [eco, area, ndvi, years]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* ── Header ── */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: `${eco.color}18`, padding: '0.5rem', borderRadius: 10, border: `1px solid ${eco.color}30` }}>
              <Calculator size={22} color={eco.color} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                Carbon Credit <span className="gradient-text">Calculator</span>
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                Real-time estimation with ecosystem-specific coefficients
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', padding: '3px 10px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981' }}>
              MCO2 ₹{MCO2_PRICE_INR}/credit
            </span>
            <button
              onClick={() => setShowInfo(v => !v)}
              style={{ background: 'none', border: 'none', color: '#64748b', padding: 4, cursor: 'pointer' }}
              title="About the formula"
            >
              <Info size={16} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: '1rem', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}
            >
              <strong style={{ color: '#60a5fa' }}>Formula:</strong> Annual Credits = Seq. Rate (tCO₂/ha/yr) × Area × NDVI <br />
              Biomass = Area × Base Density × (0.5 + NDVI×0.8) | Carbon conversion: 0.47× biomass <br />
              Market value uses live MCO2 indicative price (₹{MCO2_PRICE_INR}/credit). Results are <em>estimates only</em> — use the Biomass Analyzer for certified ML predictions.
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* ── Left: Inputs ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Ecosystem selector */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Ecosystem Type
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {ECOSYSTEMS.map(e => (
                <motion.button
                  key={e.id}
                  onClick={() => { setEcosystem(e.id); setNdvi(e.ndviDefault); }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: ecosystem === e.id ? `${e.color}20` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${ecosystem === e.id ? e.color + '60' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: 10, padding: '0.45rem 0.75rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    fontSize: '0.8rem', color: ecosystem === e.id ? e.color : '#94a3b8',
                    fontWeight: ecosystem === e.id ? 700 : 400,
                    transition: 'all 0.2s',
                  }}
                >
                  {e.icon} {e.label}
                </motion.button>
              ))}
            </div>
            <div style={{ marginTop: '0.6rem', fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ color: eco.color }}>●</span>
              {eco.desc} · Seq. rate: <strong style={{ color: eco.color }}>{eco.seqRate} tCO₂/ha/yr</strong>
            </div>
          </div>

          {/* Sliders panel */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <Slider
              label="Project Area" icon={Map} value={area} min={1} max={5000}
              unit=" ha" color="#3b82f6" onChange={setArea}
              format={v => `${v.toLocaleString()} ha`}
            />
            <Slider
              label="NDVI Vegetation Index" icon={Activity} value={ndvi} min={0} max={1} step={0.01}
              unit="" color={eco.color} onChange={setNdvi}
              format={v => v.toFixed(2)}
            />
            <Slider
              label="Project Duration" icon={TrendingUp} value={years} min={1} max={50}
              unit=" yr" color="#8b5cf6" onChange={setYears}
              format={v => `${v} yrs`}
            />
          </div>

          {/* Quality rings */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quality Metrics
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <RingChart value={ndvi * 100} max={100} color={eco.color} label="NDVI" sublabel="Vegetation" />
              <RingChart value={calc.score} max={100} color="#8b5cf6" label="Score" sublabel="Seq. Quality" />
              <RingChart value={Math.min(100, (eco.seqRate / 8.5) * 100)} max={100} color="#f59e0b" label="Rate" sublabel="CO₂/ha/yr" />
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Main stats */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Projection Results
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'TOTAL BIOMASS', value: Math.round(calc.totalBiomass).toLocaleString(), unit: 'tons', color: '#10b981', icon: Leaf },
                { label: 'CARBON CREDITS', value: Math.round(calc.totalCredits).toLocaleString(), unit: 'credits', color: '#3b82f6', icon: Award },
                { label: 'ANNUAL YIELD', value: Math.round(calc.annualCredits).toLocaleString(), unit: 'cr/yr', color: '#f59e0b', icon: Zap },
                { label: 'MARKET VALUE', value: `₹${(calc.marketValue / 100000).toFixed(1)}L`, unit: `over ${years}yr`, color: '#8b5cf6', icon: DollarSign },
              ].map(({ label, value, unit, color, icon: Icon }) => (
                <motion.div
                  key={label}
                  whileHover={{ y: -2 }}
                  style={{
                    background: `${color}0d`, border: `1px solid ${color}28`,
                    borderRadius: 12, padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
                    <Icon size={12} color={color} />
                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color, lineHeight: 1.1 }}>{value}</div>
                  <div style={{ fontSize: '0.7rem', color: '#475569' }}>{unit}</div>
                </motion.div>
              ))}
            </div>

            {/* Biomass per hectare bar */}
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '0.4rem' }}>
                <span>Biomass density per hectare</span>
                <span style={{ color: eco.color, fontWeight: 700 }}>{Math.round(calc.biomassPerHa)} t/ha</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (calc.biomassPerHa / 280) * 100)}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  style={{ height: '100%', background: `linear-gradient(90deg, ${eco.color}, ${eco.color}aa)`, borderRadius: 4 }}
                />
              </div>
            </div>
          </div>

          {/* CO2 Equivalence */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              🌍 CO₂ Equivalence — {Math.round(calc.co2Tonnes).toLocaleString()} tonnes absorbed
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              <EqBadge icon="🌳" value={calc.trees.toLocaleString()} label="trees planted per year" color="#10b981" />
              <EqBadge icon="🚗" value={calc.cars.toLocaleString()} label="cars off road per year" color="#3b82f6" />
              <EqBadge icon="✈️" value={calc.flights.toLocaleString()} label="domestic flights offset" color="#f59e0b" />
            </div>
          </div>

          {/* Timeline chart */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Credit Accumulation Timeline
              </div>
              <span style={{ fontSize: '0.7rem', color: eco.color, background: `${eco.color}12`, border: `1px solid ${eco.color}30`, padding: '2px 8px', borderRadius: 20 }}>
                {Math.min(years, 30)}-year projection
              </span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={calc.timeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="credGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={eco.color} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={eco.color} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false}
                  label={{ value: 'Year', position: 'insideBottom', offset: -2, fill: '#334155', fontSize: 10 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="credits" stroke={eco.color} strokeWidth={2}
                  fill="url(#credGrad)" dot={false}
                  activeDot={{ r: 5, fill: eco.color, stroke: '#0b1120', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Disclaimer ── */}
      <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
        <Leaf size={11} />
        Heuristic estimate only. Run the <strong style={{ color: '#64748b' }}>Biomass Analyzer</strong> for certified ML-backed predictions with anomaly detection &amp; blockchain minting.
      </div>
    </motion.div>
  );
};

export default CarbonCalculator;
