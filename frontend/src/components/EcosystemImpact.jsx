import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Legend
} from 'recharts';
import {
  Globe, Shield, Building2, Trees, Sparkles, CheckCircle2,
  Anchor, Compass, ArrowRightLeft, Landmark, Factory, Plane,
  ChevronRight, Award, HelpCircle
} from 'lucide-react';

// ─── Extended Data Definitions ───────────────────────────────────────────────

// Comparison of Carbon Credit Types
const COMPARISON_DATA = [
  {
    metric: 'Storage Density (t/ha)',
    blueCarbon: 950,
    greenCarbon: 250,
    techCarbon: 120,
    fullMetric: 'Carbon Storage Density (tonnes per hectare)'
  },
  {
    metric: 'Permanence (Years)',
    blueCarbon: 800,
    greenCarbon: 100,
    techCarbon: 1000,
    fullMetric: 'Carbon Sequestration Longevity'
  },
  {
    metric: 'Biodiversity Value',
    blueCarbon: 95,
    greenCarbon: 70,
    techCarbon: 5,
    fullMetric: 'Support for Coastal/Forest Wildlife & Ecosystems'
  },
  {
    metric: 'Economic Co-benefit',
    blueCarbon: 90,
    greenCarbon: 55,
    techCarbon: 10,
    fullMetric: 'Coastal Protection & Community Livelihoods'
  },
  {
    metric: 'Cost Efficiency',
    blueCarbon: 75,
    greenCarbon: 85,
    techCarbon: 20,
    fullMetric: 'Carbon offset minted per unit of investment'
  }
];

// Specific Industries, Use Cases, Standards & Real Buyers
const INDUSTRY_DETAILS = [
  {
    id: 'tech',
    industry: 'Technology & Hyperscalers',
    icon: Globe,
    color: '#3b82f6',
    standard: 'Verra VM0033 / Gold Standard',
    need: 'Hyperscale datacenters consume millions of megawatt-hours. Tech giants utilize Blue Carbon to fulfill voluntary net-negative carbon pledges and offset Scope 3 emissions.',
    companies: [
      { name: 'Microsoft', actions: 'Contracted over 1.5M tonnes of premium Blue Carbon removal to hit 2030 negative-emissions goal.' },
      { name: 'Apple', actions: 'Funding massive mangrove restoration initiatives in Colombia and Kenya via its Restore Fund.' },
      { name: 'Stripe / Frontier', actions: 'Pioneered early pre-purchase agreements for coastal wetland carbon to scale carbon capture tech.' }
    ]
  },
  {
    id: 'aviation',
    industry: 'Aviation & Global Shipping',
    icon: Plane,
    color: '#10b981',
    standard: 'CORSIA Eligible Credits',
    need: 'Heavy transport lacks immediate electrification options. Aviation relies on premium credits for mandatory regulatory offsets and high-altitude emissions neutralization.',
    companies: [
      { name: 'Delta Air Lines', actions: 'Committed to carbon neutrality by purchasing verified wetland and forest carbon credits.' },
      { name: 'Maersk', actions: 'Investing in marine-based biofuels and coastal carbon projects to neutralize international maritime trade.' },
      { name: 'United Airlines', actions: 'Launched a multi-million dollar sustainable aviation fund combining blue carbon with SAF technology.' }
    ]
  },
  {
    id: 'energy',
    industry: 'Heavy Manufacturing & Energy',
    icon: Factory,
    color: '#f59e0b',
    standard: 'Compliance Offsets (EU ETS / Article 6)',
    need: 'Steel, concrete, and petrochemical industries use credits to comply with strict emissions caps (EU ETS) and to offset hard-to-abate thermodynamic process emissions.',
    companies: [
      { name: 'Shell', actions: 'Directly partnering with coastal nations to finance blue-carbon ecosystems in Southeast Asia.' },
      { name: 'BP', actions: 'Purchasing high-integrity offsets under the voluntary market to support its net-zero strategy.' },
      { name: 'TotalEnergies', actions: 'Financing coastal preservation projects in Africa as part of its land-and-sea restoration fund.' }
    ]
  },
  {
    id: 'finance',
    industry: 'Banking & ESG Investment Funds',
    icon: Landmark,
    color: '#8b5cf6',
    standard: 'SDG Impact Certified (14: Life Below Water)',
    need: 'Financial institutions bundle premium Blue Carbon assets into green bonds and ESG investment packages, demanding maximum biodiversity co-benefits.',
    companies: [
      { name: 'JPMorgan Chase', actions: 'Structured customized investment capital dedicated to coastal ecosystem restoration.' },
      { name: 'HSBC / Pollination', actions: 'Launched joint-venture climate asset management funds targeting blue natural capital.' },
      { name: 'Shopify Sustainability', actions: 'Buying premium blue offsets to neutralize its merchants shipping footprint.' }
    ]
  }
];

// Industry demand share for premium Blue Carbon credits
const INDUSTRY_ADOPTION = [
  { sector: 'Tech & Cloud Services', share: 38, growth: '+24%', buyers: 'Microsoft, Apple, Google, Stripe' },
  { sector: 'Aviation & Shipping',  share: 26, growth: '+18%', buyers: 'Delta, Maersk, United, Lufthansa' },
  { sector: 'Energy & Utilities',   share: 18, growth: '+12%', buyers: 'Shell, BP, TotalEnergies, Equinor' },
  { sector: 'Finance & Banking',    share: 12, growth: '+15%', buyers: 'HSBC, JPMorgan, Goldman Sachs' },
  { sector: 'Consumer Goods',       share: 6,  growth: '+8%',  buyers: 'Unilever, Patagonia, Nestlé' }
];

const ECOSYSTEMS = [
  {
    name: 'Mangrove Forests',
    efficiency: '10x Faster Storage',
    desc: 'Mangroves store massive amounts of carbon in their wood and rich peat soils. Their elaborate, submerged root systems trap organic debris, preventing carbon from decaying and returning to the atmosphere as CO₂.',
    soilFact: 'Deep peat layers under mangroves hold carbon for over 5,000 years under anoxic (oxygen-depleted) conditions.',
    icon: Anchor,
    color: '#14b8a6'
  },
  {
    name: 'Seagrass Meadows',
    efficiency: '10% of Ocean Carbon',
    desc: 'Though covering less than 0.2% of the ocean floor, seagrasses account for over 10% of all organic carbon buried in marine sediments. They form thick underground root networks (rhizomes) that bind organic matter.',
    soilFact: 'Seagrass sediments lock carbon 35x faster than tropical dry forests, forming extremely stable coastal sinks.',
    icon: Compass,
    color: '#3b82f6'
  },
  {
    name: 'Salt Marshes',
    efficiency: 'Anoxic Deep Soil Storage',
    desc: 'Herbaceous plants in salt marshes trap sediments during daily tidal cycles. The high salinity and constant flooding creates an anaerobic soil column where microbial decomposition is extremely slow.',
    soilFact: 'Soil carbon accumulation is continuous—as sea levels slowly rise, marshes grow vertically, adding permanent carbon depth.',
    icon: Trees,
    color: '#8b5cf6'
  }
];

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

const ComparisonTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.96)',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '12px',
      padding: '0.85rem 1.1rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
      maxWidth: '320px'
    }}>
      <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem', fontFamily: 'Outfit, sans-serif' }}>
        {data.fullMetric}
      </p>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', fontSize: '0.8rem', margin: '0.25rem 0', fontFamily: 'Inter, sans-serif' }}>
          <span style={{ color: p.color, display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
            {p.name}
          </span>
          <span style={{ fontWeight: 700, color: '#f8fafc' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Ecosystem Fact Card ─────────────────────────────────────────────────────

const EcosystemCard = ({ name, efficiency, desc, soilFact, icon: Icon, color }) => (
  <motion.div
    whileHover={{ y: -4, boxShadow: `0 12px 30px ${color}1a` }}
    style={{
      background: 'rgba(15, 23, 42, 0.55)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '16px',
      padding: '1.75rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.9rem',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{
      position: 'absolute', top: 0, right: 0, width: '120px', height: '120px',
      background: `radial-gradient(circle at 100% 0%, ${color}1c 0%, transparent 70%)`,
      pointerEvents: 'none'
    }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ background: `${color}18`, padding: '0.6rem', borderRadius: '12px' }}>
        <Icon size={22} color={color} />
      </div>
      <span style={{
        fontSize: '0.75rem', fontWeight: 700, color: color, background: `${color}15`,
        padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.02em',
        fontFamily: 'Outfit, sans-serif'
      }}>
        {efficiency}
      </span>
    </div>
    <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>{name}</h4>
    <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.58, fontFamily: 'Inter, sans-serif' }}>{desc}</p>
    
    <div style={{
      marginTop: 'auto', background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem 1rem',
      borderRadius: '10px', borderLeft: `3px solid ${color}`
    }}>
      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: color, fontWeight: 700, display: 'block', marginBottom: '0.15rem', letterSpacing: '0.05em', fontFamily: 'Outfit, sans-serif' }}>
        Soil Carbon Fact
      </span>
      <span style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4, fontFamily: 'Inter, sans-serif' }}>
        {soilFact}
      </span>
    </div>
  </motion.div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const EcosystemImpact = () => {
  const [selectedIndustry, setSelectedIndustry] = useState('tech');

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.08 } }
  };
  const childVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const currentIndData = INDUSTRY_DETAILS.find(i => i.id === selectedIndustry);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', fontFamily: 'Inter, sans-serif' }}
    >
      {/* ── Section 1: Editorial Introduction ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '2rem', alignItems: 'stretch' }}>
        
        {/* Core Value Statement */}
        <motion.div variants={childVariants} className="glass-panel" style={{ padding: '2.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(20, 184, 166, 0.12)', padding: '0.5rem', borderRadius: '10px' }}>
              <Globe size={24} color="#14b8a6" />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
              Ecosystem Intelligence: <span className="gradient-text">Blue Carbon Dynamics</span>
            </h3>
          </div>
          <p style={{ fontSize: '1.02rem', color: '#f1f5f9', lineHeight: 1.65, marginBottom: '1.25rem', fontWeight: 400 }}>
            Coastal wetlands constitute less than <strong>2% of total marine area</strong>, yet they hold over <strong>50% of the entire organic carbon pool</strong> buried in marine sediments. This intense storage capacity makes <strong>Blue Carbon</strong> the most potent Natural Climate Solution (NCS) on Earth.
          </p>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
            Through advanced satellite remote sensing (NDVI, EVI, SWIR) and robust machine learning, the <strong>Blue Carbon Simulator</strong> converts raw spectral returns into auditable, high-integrity biomass metrics. This solves the voluntary carbon market's biggest challenges: transparency, baseline integrity, and permanence.
          </p>
        </motion.div>

        {/* Global Compliance Drivers */}
        <motion.div variants={childVariants} className="glass-panel" style={{ padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#14b8a6', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>
            Regulatory Compliance Drivers
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'Outfit, sans-serif' }}>
                <Award size={14} color="#14b8a6" /> CORSIA Aviation Mandate
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Establishes mandatory carbon offsets for international commercial aviation. Blue carbon is a prime choice due to its institutional verification.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'Outfit, sans-serif' }}>
                <Award size={14} color="#14b8a6" /> Paris Agreement (Article 6)
              </div>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>
                Enables countries to trade carbon reduction credits internationally, generating huge public-sector demand for marine sinks.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Section 2: Deep-Dive Ecosystem Cards ── */}
      <motion.div variants={childVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {ECOSYSTEMS.map(eco => (
          <EcosystemCard key={eco.name} {...eco} />
        ))}
      </motion.div>

      {/* ── Section 3: Comparative Analysis (Radar) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '2rem' }}>
        
        {/* Radar Comparison Chart */}
        <motion.div variants={childVariants} className="glass-panel" style={{ padding: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <ArrowRightLeft size={20} color="#3b82f6" />
            <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
              Comparative Sequestration Performance Matrix
            </h4>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={COMPARISON_DATA}>
              <PolarGrid stroke="rgba(255,255,255,0.05)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'Outfit, sans-serif' }} />
              <PolarRadiusAxis angle={30} domain={[0, 1000]} tick={{ fill: '#475569', fontSize: 9 }} stroke="rgba(255,255,255,0.05)" />
              <Tooltip content={<ComparisonTooltip />} />
              <Radar name="Blue Carbon (Coastal)" dataKey="blueCarbon" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.25} />
              <Radar name="Green Carbon (Land)" dataKey="greenCarbon" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
              <Radar name="Tech Carbon (DAC)" dataKey="techCarbon" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.12} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', fontFamily: 'Outfit, sans-serif', color: '#94a3b8', paddingTop: '1.25rem' }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Methodologies comparison text */}
        <motion.div variants={childVariants} className="glass-panel" style={{ padding: '2.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#3b82f6', letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>
            Why Blue Carbon Outperforms Terrestrial & Tech Sinks
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#14b8a6', fontSize: '0.95rem', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif' }}>1. Unrivaled Soil Density</div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.55 }}>
                Terrestrial forests store 80% of their carbon in foliage/branches. Blue ecosystems store <strong>over 90% of their carbon in deep soils</strong>, preventing loss during storms or fires.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: '0.95rem', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif' }}>2. Extreme Permanence</div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.55 }}>
                Land-based forests are subject to wildfires, pests, and illegal logging. Marine sediment carbon remains chemically stabilized and waterlogged for **hundreds to thousands of years**.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#8b5cf6', fontSize: '0.95rem', marginBottom: '0.25rem', fontFamily: 'Outfit, sans-serif' }}>3. Massive Biodiversity Yield</div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.55 }}>
                Direct Air Capture (Tech Carbon) consumes massive electricity with zero biodiversity benefits. Blue projects directly restore coral, estuary fish stocks, and coastal fisheries.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Section 4: Industry & Companies Deep-Dive (Interactive Tab Grid) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
        
        {/* Industry Applicability Details */}
        <motion.div variants={childVariants} className="glass-panel" style={{ padding: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Building2 size={22} color="#f59e0b" />
            <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
              Target Industries & Institutional Buyers
            </h4>
          </div>
          <p style={{ margin: '0 0 1.5rem', fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6 }}>
            High-quality carbon removal credits are the cornerstone of the net-zero strategy. Click each sector below to view specific use cases, audit standards, and real-world corporate buyers.
          </p>

          {/* Sector Selector Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {INDUSTRY_DETAILS.map(ind => {
              const Icon = ind.icon;
              const isSel = ind.id === selectedIndustry;
              return (
                <button
                  key={ind.id}
                  onClick={() => setSelectedIndustry(ind.id)}
                  style={{
                    background: isSel ? `${ind.color}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isSel ? ind.color : 'rgba(255,255,255,0.06)'}`,
                    color: isSel ? '#f1f5f9' : '#64748b',
                    borderRadius: '10px', padding: '0.5rem 1rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    fontSize: '0.8rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Icon size={14} color={isSel ? ind.color : '#64748b'} />
                  {ind.industry}
                </button>
              );
            })}
          </div>

          {/* Sector Details Panel */}
          <AnimatePresence mode="wait">
            {currentIndData && (
              <motion.div
                key={currentIndData.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.04)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 800, color: currentIndData.color, fontSize: '1rem', fontFamily: 'Outfit, sans-serif' }}>
                    {currentIndData.industry}
                  </div>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                    Standard: {currentIndData.standard}
                  </span>
                </div>
                
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.55, margin: '0 0 1rem' }}>
                  {currentIndData.need}
                </p>

                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: currentIndData.color, fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem', fontFamily: 'Outfit, sans-serif' }}>
                    Corporate Buyers & Initiatives
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {currentIndData.companies.map((c, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.8rem', background: 'rgba(255,255,255,0.01)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                        <strong style={{ color: '#f1f5f9', minWidth: '85px', fontFamily: 'Outfit, sans-serif' }}>{c.name}:</strong>
                        <span style={{ color: '#94a3b8', lineHeight: 1.4 }}>{c.actions}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Global Industry Adoption Bar Chart */}
        <motion.div variants={childVariants} className="glass-panel" style={{ padding: '2.25rem' }}>
          <h4 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', fontWeight: 800, color: '#cbd5e1', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
            Global Blue Carbon Buyers Share <span style={{ color: '#475569', fontWeight: 400 }}>(Market Share %)</span>
          </h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart layout="vertical" data={INDUSTRY_ADOPTION} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis type="number" tick={{ fill: '#475569', fontSize: 10, fontFamily: 'Outfit, sans-serif' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="sector" tick={{ fill: '#cbd5e1', fontSize: 10, fontFamily: 'Outfit, sans-serif' }} tickLine={false} axisLine={false} width={130} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{ background: 'rgba(15,23,42,0.96)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.6rem 0.85rem', boxShadow: '0 4px 20px rgba(0,0,0,0.45)' }}>
                      <p style={{ margin: 0, fontWeight: 800, color: '#f1f5f9', fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif' }}>{d.sector}</p>
                      <p style={{ margin: '0.2rem 0 0', color: '#3b82f6', fontSize: '0.82rem' }}>Market Share: <strong>{d.share}%</strong></p>
                      <p style={{ margin: '0.1rem 0 0', color: '#10b981', fontSize: '0.78rem' }}>YoY Growth: <strong>{d.growth}</strong></p>
                      <p style={{ margin: '0.2rem 0 0', color: '#94a3b8', fontSize: '0.72rem', lineHeight: 1.4 }}>Top Buyers: {d.buyers}</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="share" name="Market Share %" fill="#f59e0b" radius={[0, 4, 4, 0]} opacity={0.85}>
                {INDUSTRY_ADOPTION.map((entry, index) => {
                  const colors = ['#f59e0b', '#3b82f6', '#14b8a6', '#8b5cf6', '#10b981'];
                  return <rect key={`bar-${index}`} fill={colors[index % colors.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

    </motion.div>
  );
};

export default EcosystemImpact;
