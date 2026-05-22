import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Info } from 'lucide-react';

// ─── Feature colour palette ───────────────────────────────────────────────────
const FEATURE_COLORS = {
  NDVI:  { bar: '#3b82f6', glow: 'rgba(59,130,246,0.25)',  label: 'Vegetation Density'       },
  EVI:   { bar: '#14b8a6', glow: 'rgba(20,184,166,0.25)',  label: 'Enhanced Vegetation'      },
  RED:   { bar: '#f43f5e', glow: 'rgba(244,63,94,0.25)',   label: 'Red Band Reflectance'     },
  SWIR:  { bar: '#f59e0b', glow: 'rgba(245,158,11,0.25)',  label: 'Short-Wave Infrared'      },
  Area:  { bar: '#8b5cf6', glow: 'rgba(139,92,246,0.25)',  label: 'Project Area (Hectares)'  },
};

// ─── SVG Circular Gauge ───────────────────────────────────────────────────────
const CircularGauge = ({ value, size = 180 }) => {
  const radius    = (size - 24) / 2;
  const cx        = size / 2;
  const cy        = size / 2;
  const startAngle = -210;          // degrees — bottom-left
  const endAngle   =  30;           // degrees — bottom-right  (240° sweep)
  const sweepDeg   = 240;

  const toRad = (deg) => (deg * Math.PI) / 180;

  // Arc path helper
  const arcPath = (fromDeg, toDeg, r, inset = 0) => {
    const rr = r - inset;
    const x1 = cx + rr * Math.cos(toRad(fromDeg));
    const y1 = cy + rr * Math.sin(toRad(fromDeg));
    const x2 = cx + rr * Math.cos(toRad(toDeg));
    const y2 = cy + rr * Math.sin(toRad(toDeg));
    const large = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${rr} ${rr} 0 ${large} 1 ${x2} ${y2}`;
  };

  // Filled arc: starts at startAngle, sweeps (value/100)*sweepDeg
  const filledEnd = startAngle + (value / 100) * sweepDeg;

  // Colour: green ≥ 80, amber 60–79, red < 60
  const gaugeColor = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444';
  const glowColor  = value >= 80 ? 'rgba(16,185,129,0.4)' : value >= 60 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)';

  // Tick marks
  const ticks = [0, 25, 50, 75, 100];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id="gaugeGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <linearGradient id="arcGrad" gradientUnits="userSpaceOnUse"
          x1={cx + radius * Math.cos(toRad(startAngle))}
          y1={cy + radius * Math.sin(toRad(startAngle))}
          x2={cx + radius * Math.cos(toRad(startAngle + sweepDeg))}
          y2={cy + radius * Math.sin(toRad(startAngle + sweepDeg))}
        >
          <stop offset="0%"   stopColor="#ef4444" />
          <stop offset="40%"  stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>

      {/* Background track */}
      <path
        d={arcPath(startAngle, endAngle, radius)}
        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} strokeLinecap="round"
      />

      {/* Coloured filled arc */}
      {value > 0 && (
        <motion.path
          d={arcPath(startAngle, filledEnd, radius)}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth={14}
          strokeLinecap="round"
          filter="url(#gaugeGlow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      )}

      {/* Tick marks */}
      {ticks.map(t => {
        const deg = startAngle + (t / 100) * sweepDeg;
        const inner = radius - 12;
        const outer = radius + 1;
        const x1 = cx + inner * Math.cos(toRad(deg));
        const y1 = cy + inner * Math.sin(toRad(deg));
        const x2 = cx + outer * Math.cos(toRad(deg));
        const y2 = cy + outer * Math.sin(toRad(deg));
        return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.15)" strokeWidth={2} strokeLinecap="round" />;
      })}

      {/* Needle dot at value position */}
      {value > 0 && (
        <motion.circle
          cx={cx + radius * Math.cos(toRad(filledEnd))}
          cy={cy + radius * Math.sin(toRad(filledEnd))}
          r={7}
          fill={gaugeColor}
          style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.3 }}
        />
      )}

      {/* Centre value */}
      <motion.text
        x={cx} y={cy - 8}
        textAnchor="middle"
        fill={gaugeColor}
        fontSize={32} fontWeight={800}
        fontFamily="'Outfit', sans-serif"
        style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        {value}%
      </motion.text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize={11} fontFamily="'Inter', sans-serif">
        Confidence
      </text>

      {/* Low / High labels */}
      <text x={cx - radius + 4} y={cy + radius * 0.72} textAnchor="middle" fill="#475569" fontSize={10}>Low</text>
      <text x={cx + radius - 4} y={cy + radius * 0.72} textAnchor="middle" fill="#475569" fontSize={10}>High</text>
    </svg>
  );
};

// ─── Feature Importance Bar ───────────────────────────────────────────────────
const FeatureBar = ({ feature, importance, maxImportance, index }) => {
  const cfg = FEATURE_COLORS[feature] || { bar: '#3b82f6', glow: 'rgba(59,130,246,0.2)', label: feature };
  const widthPct = (importance / maxImportance) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 * index + 0.4, duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '3px', background: cfg.bar, boxShadow: `0 0 6px ${cfg.bar}` }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>{feature}</span>
          <span style={{ fontSize: '0.75rem', color: '#475569' }}>{cfg.label}</span>
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: cfg.bar }}>{importance.toFixed(1)}%</span>
      </div>

      {/* Bar track */}
      <div style={{
        height: '8px', background: 'rgba(255,255,255,0.05)',
        borderRadius: '8px', overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ delay: 0.15 * index + 0.5, duration: 0.7, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${cfg.bar}, ${cfg.bar}cc)`,
            borderRadius: '8px',
            boxShadow: `0 0 8px ${cfg.glow}`,
          }}
        />
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ConfidenceVisualizer = ({ confidence, featureImportances }) => {
  const maxImportance = Math.max(...featureImportances.map(f => f.importance));

  const confidenceLabel =
    confidence >= 85 ? { text: 'Very High', color: '#10b981' } :
    confidence >= 70 ? { text: 'High',      color: '#34d399' } :
    confidence >= 60 ? { text: 'Moderate',  color: '#f59e0b' } :
                       { text: 'Low',       color: '#ef4444' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}
    >
      {/* ── Panel header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div style={{ background: 'rgba(139,92,246,0.15)', padding: '0.4rem', borderRadius: '8px' }}>
          <BrainCircuit size={18} color="#8b5cf6" />
        </div>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
          ML Confidence & <span className="gradient-text">Feature Impact</span>
        </h4>
      </div>

      {/* ── Two-column layout: gauge + bars ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'center' }}>

        {/* Left — Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <CircularGauge value={confidence} size={176} />
          <span style={{
            fontSize: '0.8rem', fontWeight: 700, color: confidenceLabel.color,
            background: `${confidenceLabel.color}18`,
            border: `1px solid ${confidenceLabel.color}40`,
            padding: '3px 12px', borderRadius: '20px',
          }}>
            {confidenceLabel.text} Confidence
          </span>
          <span style={{ fontSize: '0.72rem', color: '#475569', textAlign: 'center', maxWidth: '140px' }}>
            Based on IsolationForest anomaly score
          </span>
        </div>

        {/* Right — Feature importance bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Feature Contribution to Biomass Prediction</span>
            <div title="How much each satellite band contributed to the XGBoost model's prediction (Gain importance, normalized to 100%)."
              style={{ cursor: 'help' }}>
              <Info size={13} color="#475569" />
            </div>
          </div>
          {featureImportances.map((f, i) => (
            <FeatureBar
              key={f.feature}
              feature={f.feature}
              importance={f.importance}
              maxImportance={maxImportance}
              index={i}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ConfidenceVisualizer;
