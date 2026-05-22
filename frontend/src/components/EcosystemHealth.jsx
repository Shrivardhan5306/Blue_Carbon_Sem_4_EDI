import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Legend
} from 'recharts';
import {
  Activity, ShieldCheck, Heart, Droplets, Waves, Leaf, Wind,
  AlertCircle, Sparkles, ArrowRight, Settings, Info
} from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n));

const getDetailedHealth = (ndvi, evi) => {
  const score = (ndvi * 0.6) + (evi * 0.4);
  
  if (score >= 0.55) {
    return {
      grade: 'A',
      label: 'Excellent',
      color: '#10b981',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.3)',
      desc: 'Pristine, hyper-dense coastal canopy with outstanding chlorophyll concentration. Highest carbon sequestration potential and robust biodiversity framework.',
      savi: (ndvi + evi) * 0.72,
      ndwi: ndvi * 0.85,
      pipeline: [
        { title: 'Strict Sanctuary Zoning', progress: 100, status: 'Active' },
        { title: 'Biodiversity Biosphere Audits', progress: 85, status: 'Ongoing' },
        { title: 'Genomic Blue Carbon Mapping', progress: 60, status: 'Progress' }
      ]
    };
  } else if (score >= 0.4) {
    return {
      grade: 'B',
      label: 'Good',
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.1)',
      border: 'rgba(59,130,246,0.3)',
      desc: 'Healthy, stable ecosystem coverage. Standard levels of growth and solid soil structure with minimal human encroachment.',
      savi: (ndvi + evi) * 0.65,
      ndwi: ndvi * 0.72,
      pipeline: [
        { title: 'Eco-Corridor Preservation', progress: 90, status: 'Active' },
        { title: 'Hydrologic Nutrient Channeling', progress: 70, status: 'Ongoing' },
        { title: 'Community-Based Guard Patrols', progress: 40, status: 'Initiated' }
      ]
    };
  } else if (score >= 0.25) {
    return {
      grade: 'C',
      label: 'Fair',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.3)',
      desc: 'Moderate vegetation health. Shows initial symptoms of environmental stress, hydrologic blockages, or minor agricultural runoff.',
      savi: (ndvi + evi) * 0.52,
      ndwi: ndvi * 0.58,
      pipeline: [
        { title: 'Hydrology De-blocking', progress: 65, status: 'Urgent' },
        { title: 'Runoff Filtration Buffers', progress: 50, status: 'Planning' },
        { title: 'Encroachment Monitoring', progress: 30, status: 'Initiated' }
      ]
    };
  } else if (score >= 0.1) {
    return {
      grade: 'D',
      label: 'Poor',
      color: '#f97316',
      bg: 'rgba(249,115,22,0.1)',
      border: 'rgba(249,115,22,0.3)',
      desc: 'Sparse, fragmented canopy coverage with visible soil exposure. Ecological services are degraded and immediate recovery action is needed.',
      savi: (ndvi + evi) * 0.38,
      ndwi: ndvi * 0.42,
      pipeline: [
        { title: 'Rhizophora Re-seeding Plan', progress: 40, status: 'Critical' },
        { title: 'Soil Enrichment & Inoculation', progress: 25, status: 'Urgent' },
        { title: 'Siltation Trap Installation', progress: 10, status: 'Planning' }
      ]
    };
  } else {
    return {
      grade: 'F',
      label: 'Degraded',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.3)',
      desc: 'Critical ecological failure. Deforestation, severe soil oxidation, or estuary erosion. Urgent, high-intensity restorative reclamation required.',
      savi: (ndvi + evi) * 0.2,
      ndwi: ndvi * 0.25,
      pipeline: [
        { title: 'Severe Salinity Neutralization', progress: 20, status: 'Emergency' },
        { title: 'Complete Shoreline Re-alignment', progress: 15, status: 'Emergency' },
        { title: 'Mass Mangrove Seedling Plantations', progress: 5, status: 'Emergency' }
      ]
    };
  }
};

const EcosystemHealth = () => {
  const [ndvi, setNdvi] = useState(0.65);
  const [evi, setEvi]   = useState(0.45);
  const [currentHealth, setCurrentHealth] = useState(getDetailedHealth(0.65, 0.45));

  // Sync state whenever sliders change
  useEffect(() => {
    setCurrentHealth(getDetailedHealth(ndvi, evi));
  }, [ndvi, evi]);

  // Derived values for dynamic graphs
  const radarData = [
    { subject: 'Chlorophyll Vigor (NDVI)', current: Math.round(ndvi * 100), benchmark: 85 },
    { subject: 'Soil Adjustment (EVI)',   current: Math.round(evi * 100),  benchmark: 70 },
    { subject: 'Canopy Water (NDWI)',    current: Math.round(currentHealth.ndwi * 100), benchmark: 75 },
    { subject: 'Albedo Adjusted (SAVI)',  current: Math.round(currentHealth.savi * 100), benchmark: 80 },
    { subject: 'Soil Organic Carbon',     current: Math.round((ndvi * 0.7 + evi * 0.3) * 100), benchmark: 90 },
  ];

  // Dynamic 50-year sequestration forecast
  const dynamicForecastData = Array.from({ length: 6 }, (_, idx) => {
    const year = idx * 10;
    // Sequestration efficiency factor based on grade
    let multiplier = 1.0;
    if (currentHealth.grade === 'A') multiplier = 1.35;
    else if (currentHealth.grade === 'B') multiplier = 1.1;
    else if (currentHealth.grade === 'C') multiplier = 0.75;
    else if (currentHealth.grade === 'D') multiplier = 0.4;
    else multiplier = 0.12;

    const baseCarbonSeq = 2.4; // tons per hectare per year
    const accumulatedCarbon = baseCarbonSeq * year * multiplier * 100; // 100 Hectares baseline

    return {
      year: `Yr ${year}`,
      'Accumulated Carbon (tons)': parseFloat(accumulatedCarbon.toFixed(1)),
      Benchmark: parseFloat((baseCarbonSeq * year * 100).toFixed(1))
    };
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.08 } }
  };
  const childVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '2rem' }}
    >
      {/* ── Header ── */}
      <motion.div variants={childVariants} className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.15)', padding: '0.4rem', borderRadius: '8px' }}>
                <Activity size={20} color="#10b981" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Ecosystem Health <span className="gradient-text">Diagnostics</span>
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
              Interactive multispectral band simulator & environmental health index calculations.
            </p>
          </div>
          <div style={{ background: currentHealth.bg, border: `1px solid ${currentHealth.border}`, borderRadius: '20px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color={currentHealth.color} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: currentHealth.color, textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>
              Diagnostic Mode: Active
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Main Workspace ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem' }}>
        
        {/* Left Column: Interactive Simulators & Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Simulator Sliders */}
          <motion.div variants={childVariants} className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1.25rem 0', fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Settings size={16} color="#10b981" /> Multispectral Band Simulator
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* NDVI Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    NDVI <span style={{ color: '#475569', fontSize: '0.75rem' }}>(Photosynthetic Vigor)</span>
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', fontFamily: 'monospace' }}>{ndvi.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.00"
                  max="1.00"
                  step="0.01"
                  value={ndvi}
                  onChange={(e) => setNdvi(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#10b981',
                    background: '#1e293b',
                    height: '6px',
                    borderRadius: '4px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* EVI Slider */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    EVI <span style={{ color: '#475569', fontSize: '0.75rem' }}>(Atmospheric/Soil Adjusted)</span>
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace' }}>{evi.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.00"
                  max="1.00"
                  step="0.01"
                  value={evi}
                  onChange={(e) => setEvi(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#3b82f6',
                    background: '#1e293b',
                    height: '6px',
                    borderRadius: '4px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Sequestration Growth Curve Graph */}
          <motion.div variants={childVariants} className="glass-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1' }}>
              Estimated 50-Year Soil Organic Carbon Accumulation
              <span style={{ color: '#475569', fontWeight: 400, fontSize: '0.78rem' }}> (tons per 100 Hectares)</span>
            </h4>
            
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dynamicForecastData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="year" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: 'rgba(15,23,42,0.96)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '0.75rem' }}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '0.5rem' }} />
                <Line type="monotone" dataKey="Accumulated Carbon (tons)" stroke={currentHealth.color} strokeWidth={3} dot={{ r: 4, strokeWidth: 0, fill: currentHealth.color }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Benchmark" stroke="#475569" strokeDasharray="5 5" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

        </div>

        {/* Right Column: Health Status Card & Diagnostic Indices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Health Card */}
          <motion.div
            variants={childVariants}
            style={{
              background: `linear-gradient(135deg, rgba(15,23,42,0.8), ${currentHealth.color}08)`,
              border: `1px solid ${currentHealth.border}`,
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: `0 12px 32px ${currentHealth.color}05`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {/* Big Circular Animated Grade */}
              <motion.div
                key={currentHealth.grade}
                initial={{ scale: 0.8, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '20px',
                  background: currentHealth.bg,
                  border: `3px solid ${currentHealth.color}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: currentHealth.color,
                  fontFamily: 'Outfit, sans-serif',
                  flexShrink: 0,
                  boxShadow: `0 0 20px ${currentHealth.color}1c`
                }}
              >
                {currentHealth.grade}
              </motion.div>

              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  DIAGNOSTIC STATUS
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#e2e8f0', fontFamily: 'Outfit, sans-serif' }}>
                  Ecosystem is <span style={{ color: currentHealth.color }}>{currentHealth.label}</span>
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.55, fontFamily: 'Inter, sans-serif' }}>
              {currentHealth.desc}
            </p>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.2rem 0' }} />

            {/* Radar Spider Graph for Diagnostic Bands */}
            <div style={{ width: '100%', height: '170px', display: 'flex', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.05)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 8 }} />
                  <Radar name="Current Indices" dataKey="current" stroke={currentHealth.color} fill={currentHealth.color} fillOpacity={0.25} />
                  <Radar name="Forest Benchmark" dataKey="benchmark" stroke="#475569" fill="#475569" fillOpacity={0.05} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>

      </div>

      {/* ── Ecological Sub-Indices (SAVI, NDWI) ── */}
      <motion.div
        variants={childVariants}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}
      >
        <div style={{ background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(255,255,255,0.04)', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', padding: '0.4rem', borderRadius: '8px' }}>
            <Leaf size={16} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1.1, fontFamily: 'monospace' }}>{ndvi.toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NDVI index</div>
          </div>
        </div>

        <div style={{ background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(255,255,255,0.04)', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.4rem', borderRadius: '8px' }}>
            <Waves size={16} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1.1, fontFamily: 'monospace' }}>{evi.toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>EVI index</div>
          </div>
        </div>

        <div style={{ background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(255,255,255,0.04)', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(245,158,11,0.1)', padding: '0.4rem', borderRadius: '8px' }}>
            <Droplets size={16} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1.1, fontFamily: 'monospace' }}>{currentHealth.ndwi.toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>NDWI Moisture</div>
          </div>
        </div>

        <div style={{ background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(255,255,255,0.04)', padding: '1rem 1.25rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(139,92,246,0.1)', padding: '0.4rem', borderRadius: '8px' }}>
            <Wind size={16} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0', lineHeight: 1.1, fontFamily: 'monospace' }}>{currentHealth.savi.toFixed(2)}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SAVI index</div>
          </div>
        </div>
      </motion.div>

      {/* ── Restorative Remediation Pipeline ── */}
      <motion.div variants={childVariants} className="glass-panel" style={{ padding: '1.5rem' }}>
        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={16} color={currentHealth.color} /> Conservation & Restoration Action Plan
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {currentHealth.pipeline.map((step, idx) => (
            <div key={idx} style={{
              background: 'rgba(15,23,42,0.4)',
              border: '1px solid rgba(255,255,255,0.04)',
              borderRadius: '12px',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Dynamic Status Badges */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>Phase 0{idx + 1}</span>
                <span style={{
                  fontSize: '0.65rem',
                  color: '#fff',
                  background: step.status === 'Emergency' || step.status === 'Critical' ? '#ef4444' : (step.status === 'Urgent' ? '#f97316' : '#10b981'),
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}>
                  {step.status}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', minHeight: '36px', display: 'flex', alignItems: 'center' }}>
                {step.title}
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '2px' }}>
                  <span>Completion</span>
                  <span>{step.progress}%</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${step.progress}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.15 }}
                    style={{
                      height: '100%',
                      background: currentHealth.color,
                      borderRadius: '3px'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EcosystemHealth;
