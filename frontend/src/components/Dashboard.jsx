import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Leaf, Activity, CheckCircle, AlertTriangle, ShieldCheck, Link as LinkIcon, TreePine, BarChart2, Calculator, Globe, MapPin, User, Copy, ExternalLink, LogOut, Check, RefreshCw, Coins, Wallet, List } from 'lucide-react';
import MarketTrends from './MarketTrends';
import ConfidenceVisualizer from './ConfidenceVisualizer';
import CarbonCalculator from './CarbonCalculator';
import EcosystemImpact from './EcosystemImpact';
import EcosystemHealth from './EcosystemHealth';
import GeoExplorer from './GeoExplorer';
import TransactionHistory from './TransactionHistory';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getEcosystemHealth = (ndvi, evi) => {
  const score = (ndvi * 0.6) + (evi * 0.4);

  if (score >= 0.55) {
    return { grade: 'A', label: 'Excellent', color: '#10b981', bg: 'rgba(16,185,129,0.1)', desc: 'Pristine canopy density and exceptional photosynthetic activity. Outstanding biodiversity support and soil carbon capture capabilities.' };
  } else if (score >= 0.4) {
    return { grade: 'B', label: 'Good', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', desc: 'Healthy vegetated structure. Standard coastal biomass density with high soil organic stability.' };
  } else if (score >= 0.25) {
    return { grade: 'C', label: 'Fair', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', desc: 'Moderate biomass coverage. Shows minor environmental strain, mild canopy thinning, or coastal erosion.' };
  } else if (score >= 0.1) {
    return { grade: 'D', label: 'Poor', color: '#f97316', bg: 'rgba(249,115,22,0.1)', desc: 'Depleted vegetation density. Restorative intervention is strongly recommended to stabilize estuary soils.' };
  } else {
    return { grade: 'F', label: 'Degraded', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', desc: 'Critical ecological damage or deforestation. Severe environmental decay or wetland salinity erosion detected.' };
  }
};

const TABS = [
  { id: 'analyzer',    label: 'Biomass Analyzer',   icon: TreePine },
  { id: 'health',      label: 'Ecosystem Health',    icon: Activity },
  { id: 'market',      label: 'Market Trends',       icon: BarChart2 },
  { id: 'history',     label: 'Activity Log',        icon: List },
  { id: 'calculator',  label: 'Credit Calculator',   icon: Calculator },
  { id: 'impact',      label: 'Ecosystem & Impact',  icon: Globe },
  { id: 'geo',         label: 'Geo Explorer',         icon: MapPin },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('analyzer');
  const [formData, setFormData] = useState({
    NDVI: 0.65,
    EVI: 0.45,
    RED: 0.04,
    SWIR: 0.12,
    Area: 100
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // ── Web3 MetaMask State ──
  const [walletAddress, setWalletAddress] = useState('');
  const [tokenBalance, setTokenBalance] = useState(null);
  const [connectingWallet, setConnectingWallet] = useState(false);

  // ── Web3 Authentication & Registration Gateway States ──
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [regName, setRegName] = useState('');
  const [regOrg, setRegOrg] = useState('');
  const [regRegion, setRegRegion] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  
  // Terminal states
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [showTerminal, setShowTerminal] = useState(false);

  // Profile & Wallet Details Popover States
  const [showProfile, setShowProfile] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const profileRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfile]);

  const getDeveloperProfile = () => {
    try {
      const data = localStorage.getItem('blue_carbon_developer');
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Error reading profile:", e);
    }
    return null;
  };

  const fetchBalance = async (address) => {
    try {
      const contractAddress = "0x2e4d486d84CCBA47f0601F552AcF5129Ed5292d9";
      const cleanAddress = address.substring(2).toLowerCase();
      const calldata = "0x70a08231" + cleanAddress.padStart(64, '0');

      // Call the Alchemy Sepolia RPC directly for reliable balance reads
      const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/asD5khNptnhgPrPkDG3-e";
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: contractAddress,
            data: calldata
          }, 'latest']
        })
      });

      const json = await response.json();
      const balanceHex = json.result;

      if (balanceHex && balanceHex !== '0x' && balanceHex !== '0x0') {
        const rawBalance = BigInt(balanceHex);
        const formattedBalance = Number(rawBalance) / 1e18;
        setTokenBalance(formattedBalance);
      } else {
        setTokenBalance(0);
      }
    } catch (err) {
      console.error("Failed to query Sepolia carbon token balance:", err);
      setTokenBalance(0);
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      const enterSandbox = window.confirm('MetaMask is not installed or inactive!\n\nWould you like to enter "Sandbox Demo Mode" using a pre-configured environmental sandbox wallet?');
      if (enterSandbox) {
        setWalletAddress('0xEnvironmentalSandboxWallet7c93');
        setTokenBalance(250);
        setAuthSuccess(true);
        return true;
      }
      return false;
    }
    setConnectingWallet(true);
    try {
      // Force MetaMask to show the account picker popup every time
      // wallet_requestPermissions re-prompts even if already authorized
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      // Now get the selected account(s) after user picks from popup
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        await fetchBalance(accounts[0]);
        setAuthSuccess(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error("MetaMask connection failed:", err);
      return false;
    } finally {
      setConnectingWallet(false);
    }
  };

  React.useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then(accounts => {
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            fetchBalance(accounts[0]);
            setAuthSuccess(true);
          }
        });

      // Handle account changes
      const handleAccounts = (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          fetchBalance(accounts[0]);
          setAuthSuccess(true);
        } else {
          setWalletAddress('');
          setTokenBalance(null);
          setAuthSuccess(false);
        }
      };

      window.ethereum.on('accountsChanged', handleAccounts);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccounts);
      };
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const simulateLogs = async (actualResult) => {
    const addLog = (msg, delay) => new Promise(res => setTimeout(() => {
      setTerminalLogs(prev => [...prev, msg]);
      res();
    }, delay));
    
    await addLog('[AI] Initializing Biomass Estimation Model...', 600);
    await addLog(`[AI] Analyzing multispectral bands (RED: ${formData.RED}, SWIR: ${formData.SWIR})...`, 800);
    await addLog(`[AI] Processing vegetation indices (NDVI: ${formData.NDVI}, EVI: ${formData.EVI})...`, 700);
    await addLog('[AI] Checking anomaly detection matrices...', 900);
    
    if (actualResult.anomaly_detection_status === 'valid_data') {
      await addLog('[AI] SUCCESS: Data validated. No anomalies detected.', 600);
      
      const biomass = actualResult.predicted_biomass !== undefined ? actualResult.predicted_biomass : 0;
      const carbon = actualResult.carbon_estimate !== undefined ? actualResult.carbon_estimate : 0;
      
      await addLog(`[AI] Calculated Biomass: ${biomass.toFixed(2)} tons`, 800);
      await addLog(`[AI] Estimated Carbon Yield: ${carbon.toFixed(2)} credits`, 800);
      
      if (actualResult.blockchain_tx) {
        await addLog('[AI] Executing smart contract minting on Sepolia...', 1000);
        await addLog(`[AI] Transaction verified: ${actualResult.blockchain_tx}`, 500);
      }
      
      // Sync Sandbox Activity Logs
      const isSandbox = !window.ethereum || (walletAddress && walletAddress.toLowerCase().includes('sandbox'));
      if (isSandbox) {
        try {
          const saved = localStorage.getItem('sandbox_activity_logs');
          let localLogs = [];
          if (saved) {
            localLogs = JSON.parse(saved);
          }
          const newLog = {
            id: `sim-tx-${Date.now()}`,
            type: "MINT",
            amount: carbon.toFixed(2),
            txHash: actualResult.blockchain_tx || ("0x" + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join("")),
            timestamp: Date.now()
          };
          localLogs.unshift(newLog);
          localStorage.setItem('sandbox_activity_logs', JSON.stringify(localLogs));
        } catch (err) {
          console.error("Failed to update sandbox logs:", err);
        }
      }
    } else {
      await addLog('[AI] WARNING: Suspicious data detected!', 600);
      await addLog(`[AI] Error details: ${actualResult.message || 'Environmental data appears unrealistic'}`, 600);
      await addLog('[AI] Calculation aborted due to data anomalies.', 800);
    }
    
    await addLog('[AI] Verification complete.', 600);
    setTimeout(() => {
      setShowTerminal(false);
      setResult(actualResult);
      if (walletAddress) {
        fetchBalance(walletAddress);
      }
    }, 1200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setShowTerminal(true);
    setTerminalLogs(['[SYSTEM] Connecting to BlueCarbon AI Engine...']);

    try {
      const response = await axios.post(`${API_BASE_URL}/predict-biomass`, null, {
        params: {
          ...formData,
          wallet_address: walletAddress || undefined
        }
      });
      await simulateLogs(response.data);
    } catch (err) {
      setShowTerminal(false);
      setError(err.response?.data?.message || 'Failed to connect to the backend. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  if (!walletAddress || isAuthenticating || !authSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        background: 'radial-gradient(circle at top right, rgba(20, 184, 166, 0.08), transparent), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.08), transparent)'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-panel"
          style={{
            maxWidth: '480px',
            width: '100%',
            padding: '3rem 2.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.06)'
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
              style={{
                background: 'rgba(20, 184, 166, 0.1)',
                border: '2px solid rgba(20, 184, 166, 0.3)',
                padding: '1rem',
                borderRadius: '50%',
                display: 'inline-flex',
                boxShadow: '0 0 20px rgba(20, 184, 166, 0.15)'
              }}
            >
              <Leaf size={36} color="#14b8a6" />
            </motion.div>
            <h2 style={{ margin: '1rem 0 0 0', fontSize: '1.8rem', fontWeight: 800 }}>
              Blue<span className="gradient-text">Carbon</span> AI
            </h2>
            <div style={{ fontSize: '0.85rem', color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
              Decentralized Carbon Ledger
            </div>
          </div>

          {/* Verification Screen */}
          {isAuthenticating ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                style={{ border: '3px solid rgba(59,130,246,0.1)', borderTop: '3px solid #3b82f6', borderRadius: '50%', width: '48px', height: '48px' }}
              />
              <div style={{ fontSize: '0.95rem', color: '#cbd5e1', fontWeight: 600 }}>Verifying Cryptographic Ledger...</div>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Establishing secure session with wallet identity...</p>
            </motion.div>
          ) : (
            <>
              {/* Tab Selector */}
              <div style={{
                display: 'flex',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '3px',
                gap: '2px'
              }}>
                <button
                  onClick={() => setAuthMode('login')}
                  style={{
                    flex: 1,
                    background: authMode === 'login' ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: 'none',
                    color: authMode === 'login' ? '#e2e8f0' : '#64748b',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🔐 Connect &amp; Login
                </button>
                <button
                  onClick={() => setAuthMode('register')}
                  style={{
                    flex: 1,
                    background: authMode === 'register' ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: 'none',
                    color: authMode === 'register' ? '#e2e8f0' : '#64748b',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🌱 Ecosystem Register
                </button>
              </div>

              {authMode === 'login' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                    Access your environmental assets, predict biomass, and trade carbon credits using your secure Ethereum credentials.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={async () => {
                      setIsAuthenticating(true);
                      const success = await connectMetaMask();
                      setTimeout(() => {
                        setIsAuthenticating(false);
                        if (success) {
                          setAuthSuccess(true);
                        }
                      }, 1500);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.8rem 1.5rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    🦊 Connect MetaMask Wallet
                  </motion.button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setIsAuthenticating(true);
                  // Connect Wallet
                  const success = await connectMetaMask();
                  // Save user profile details
                  localStorage.setItem('blue_carbon_developer', JSON.stringify({
                    name: regName,
                    organization: regOrg,
                    region: regRegion,
                    registeredAt: new Date().toISOString()
                  }));
                  setTimeout(() => {
                    setIsAuthenticating(false);
                    if (success) {
                      setAuthSuccess(true);
                    }
                  }, 1500);
                }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Ecosystem Developer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Shrivardhan Patil"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      style={{ width: '100%', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', padding: '0.5rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Organization Domain / Name</label>
                    <input
                      type="text"
                      placeholder="e.g. greenfuture.org"
                      value={regOrg}
                      onChange={(e) => setRegOrg(e.target.value)}
                      required
                      style={{ width: '100%', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', padding: '0.5rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>Primary Restoration Region</label>
                    <input
                      type="text"
                      placeholder="e.g. Maharashtra Coastal Delta"
                      value={regRegion}
                      onChange={(e) => setRegRegion(e.target.value)}
                      required
                      style={{ width: '100%', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: 'white', padding: '0.5rem', fontSize: '0.85rem' }}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.8rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      marginTop: '0.5rem'
                    }}
                  >
                    🦊 Register &amp; Connect Wallet
                  </motion.button>
                </form>
              )}
            </>
          )}

          {/* Footer details */}
          <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: '0.5rem', lineHeight: 1.4 }}>
            Secured by Sepolia Test Network.<br />
            Smart Contract: <code>0x2e4d...92d9</code>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>

      {/* ── Header ── */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          marginBottom: '1.5rem',
          position: 'relative',
          zIndex: 50,
          gap: '1rem'
        }}
        className="glass-panel"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '0.5rem', borderRadius: '50%' }}>
            <Leaf size={24} color="#14b8a6" />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>
            Blue<span className="gradient-text">Carbon</span>
          </h2>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '4px',
          gap: '4px',
        }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              whileTap={{ scale: 0.96 }}
              style={{
                background: activeTab === id
                  ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(20,184,166,0.3))'
                  : 'transparent',
                border: activeTab === id
                  ? '1px solid rgba(59,130,246,0.4)'
                  : '1px solid transparent',
                color: activeTab === id ? '#e2e8f0' : '#64748b',
                borderRadius: '8px',
                padding: '0.45rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontFamily: 'Inter, sans-serif',
                fontWeight: activeTab === id ? 600 : 400,
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={15} />
              {label}
            </motion.button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity size={14} color="#10b981" /> System Online
          </span>

          {walletAddress ? (
            <div ref={profileRef} style={{ position: 'relative' }}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.02, background: 'rgba(20, 184, 166, 0.15)', cursor: 'pointer' }}
                onClick={() => setShowProfile(!showProfile)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  background: 'rgba(20, 184, 166, 0.1)',
                  border: showProfile ? '1px solid #14b8a6' : '1px solid rgba(20, 184, 166, 0.25)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  userSelect: 'none'
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#14b8a6', boxShadow: '0 0 6px #14b8a6' }} />
                <span style={{ color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 600 }}>
                  {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                </span>
                {tokenBalance !== null && (
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    padding: '1px 6px',
                    borderRadius: '5px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: '#60a5fa'
                  }}>
                    {tokenBalance.toFixed(2)} CO2
                  </span>
                )}
              </motion.div>

              <AnimatePresence>
                {showProfile && (() => {
                  const profile = getDeveloperProfile();
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '125%',
                        width: '320px',
                        background: 'rgba(15, 23, 42, 0.96)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.85rem',
                        textAlign: 'left'
                      }}
                    >
                      {/* Dropdown Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                        <div style={{ background: 'rgba(20, 184, 166, 0.1)', padding: '0.35rem', borderRadius: '50%' }}>
                          <User size={18} color="#14b8a6" />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 700 }}>Ecosystem Developer</h4>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Profile &amp; Wallet Credentials</span>
                        </div>
                      </div>

                      {/* Profile details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Name</span>
                          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{profile?.name || 'Anonymous Developer'}</span>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Organization</span>
                          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{profile?.organization || 'External / Guest'}</span>
                        </div>
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Restoration Region</span>
                          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{profile?.region || 'Global'}</span>
                        </div>
                      </div>

                      {/* Wallet details */}
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div>
                          <span style={{ color: '#64748b', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Connected Wallet</span>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <span style={{ fontFamily: 'monospace', color: '#34d399', fontSize: '0.75rem', wordBreak: 'break-all' }}>{walletAddress}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(walletAddress);
                                setCopiedText(true);
                                setTimeout(() => setCopiedText(false), 2000);
                              }}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', cursor: 'pointer' }}
                              title="Copy Address"
                            >
                              {copiedText ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Balance:</span>
                          <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.85rem' }}>{tokenBalance !== null ? tokenBalance.toFixed(2) : '0.00'} CO2</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                        <a
                          href={`https://sepolia.etherscan.io/address/${walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: '#3b82f6',
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 600
                          }}
                        >
                          <ExternalLink size={12} /> View wallet on Etherscan
                        </a>

                        <a
                          href={`https://sepolia.etherscan.io/address/0x2e4d486d84CCBA47f0601F552AcF5129Ed5292d9`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: '#3b82f6',
                            textDecoration: 'none',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 600
                          }}
                        >
                          <ExternalLink size={12} /> View Smart Contract
                        </a>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setWalletAddress('');
                            setTokenBalance(null);
                            setAuthSuccess(false);
                            setShowProfile(false);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: '0.3rem',
                            padding: '4px 0'
                          }}
                        >
                          <LogOut size={12} /> Disconnect Wallet
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={connectMetaMask}
              disabled={connectingWallet}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                border: 'none',
                padding: '0.4rem 0.8rem',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(245, 158, 11, 0.15)'
              }}
            >
              {connectingWallet ? 'Connecting...' : '🦊 Connect Wallet'}
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* ── Token Balance Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        style={{
          maxWidth: '1200px',
          margin: '0 auto 1.5rem auto',
          padding: '1.25rem 2rem',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.7))',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08), transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-60%',
          left: '10%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.06), transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Left: Token info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
          {/* Animated coin icon */}
          <motion.div
            animate={{
              boxShadow: [
                '0 0 15px rgba(59, 130, 246, 0.2)',
                '0 0 30px rgba(59, 130, 246, 0.4)',
                '0 0 15px rgba(59, 130, 246, 0.2)'
              ]
            }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(20, 184, 166, 0.15))',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              padding: '0.85rem',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Coins size={28} color="#60a5fa" />
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <motion.span
                key={tokenBalance}
                initial={{ scale: 1.15, color: '#93c5fd' }}
                animate={{ scale: 1, color: '#e2e8f0' }}
                transition={{ duration: 0.5 }}
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: 'Outfit, sans-serif',
                  letterSpacing: '-0.02em',
                  lineHeight: 1
                }}
              >
                {tokenBalance !== null ? tokenBalance.toFixed(2) : '0.00'}
              </motion.span>
              <span style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#60a5fa',
                letterSpacing: '0.05em',
                fontFamily: 'Outfit, sans-serif'
              }}>
                CCT
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.78rem',
                color: '#64748b',
                fontWeight: 500
              }}>
                Carbon Credit Tokens
              </span>
              <span style={{
                fontSize: '0.68rem',
                color: '#94a3b8',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '1px 8px',
                borderRadius: '4px',
                fontFamily: 'monospace'
              }}>
                Sepolia Testnet
              </span>
            </div>
          </div>
        </div>

        {/* Right: Wallet + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
          {/* Wallet chip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '0.45rem 0.85rem',
            borderRadius: '10px',
          }}>
            <Wallet size={14} color="#94a3b8" />
            <span style={{
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              color: '#cbd5e1',
              fontWeight: 600
            }}>
              {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
            </span>
          </div>

          {/* Refresh balance button */}
          <motion.button
            whileHover={{ scale: 1.08, background: 'rgba(59, 130, 246, 0.15)' }}
            whileTap={{ scale: 0.92, rotate: 180 }}
            onClick={() => fetchBalance(walletAddress)}
            title="Refresh Token Balance"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#94a3b8',
              padding: '0.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <RefreshCw size={16} />
          </motion.button>

          {/* Etherscan link */}
          <motion.a
            whileHover={{ scale: 1.08, background: 'rgba(20, 184, 166, 0.15)' }}
            whileTap={{ scale: 0.92 }}
            href={`https://sepolia.etherscan.io/token/0x2e4d486d84CCBA47f0601F552AcF5129Ed5292d9?a=${walletAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View on Etherscan"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#14b8a6',
              padding: '0.5rem',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            <ExternalLink size={16} />
          </motion.a>
        </div>
      </motion.div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'analyzer' && (
          <motion.div
            key="analyzer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

              {/* Left — Input Form */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="glass-panel"
                style={{ padding: '2rem' }}
              >
                <motion.div variants={itemVariants} style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TreePine size={20} color="#3b82f6" />
                    Satellite Data Input
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Enter multispectral remote sensing metrics to evaluate biomass and mint carbon credits.
                  </p>
                </motion.div>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <motion.div variants={itemVariants}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#cbd5e1' }}>NDVI (Normalized Difference Vegetation Index)</label>
                      <input type="number" step="0.01" name="NDVI" value={formData.NDVI} onChange={handleChange} required />
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#cbd5e1' }}>EVI (Enhanced Vegetation Index)</label>
                      <input type="number" step="0.01" name="EVI" value={formData.EVI} onChange={handleChange} required />
                    </motion.div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <motion.div variants={itemVariants}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#cbd5e1' }}>RED Band Reflectance</label>
                        <input type="number" step="0.01" name="RED" value={formData.RED} onChange={handleChange} required />
                      </motion.div>
                      <motion.div variants={itemVariants}>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#cbd5e1' }}>SWIR Reflectance</label>
                        <input type="number" step="0.01" name="SWIR" value={formData.SWIR} onChange={handleChange} required />
                      </motion.div>
                    </div>

                    <motion.div variants={itemVariants}>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Area (Hectares)</label>
                      <input type="number" step="1" name="Area" value={formData.Area} onChange={handleChange} required />
                    </motion.div>

                    <motion.button
                      variants={itemVariants}
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                      style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {loading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                          <Activity size={20} />
                        </motion.div>
                      ) : (
                        <><Leaf size={20} />Analyze &amp; Mint</>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>

              {/* Right — Results */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-panel"
                  style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={20} color="#14b8a6" />
                    Analysis Results
                  </h3>

                  {!result && !loading && !error && !showTerminal && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                      <Activity size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p>Awaiting satellite data input...</p>
                    </div>
                  )}

                  {loading && !showTerminal && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                        <Activity size={48} color="#3b82f6" style={{ marginBottom: '1rem' }} />
                      </motion.div>
                      <p className="gradient-text">Running AI Models &amp; Blockchain Verification...</p>
                    </div>
                  )}

                  {showTerminal && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ 
                        flex: 1, 
                        background: '#020617', 
                        border: '1px solid #1e293b', 
                        borderRadius: '12px', 
                        padding: '1.5rem', 
                        fontFamily: '"Fira Code", monospace', 
                        color: '#10b981', 
                        overflowY: 'auto', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.6rem',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '0.5rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>// BlueCarbon AI Terminal v2.1.0</div>
                      {terminalLogs.map((log, i) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }}
                          style={{ fontSize: '0.85rem', wordBreak: 'break-all', color: log.includes('WARNING') ? '#ef4444' : log.includes('SUCCESS') ? '#34d399' : '#10b981' }}
                        >
                          <span style={{ color: '#64748b', marginRight: '0.5rem' }}>&gt;</span> {log}
                        </motion.div>
                      ))}
                      <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ display: 'inline-block', width: 8, height: 14, background: '#10b981' }} />
                    </motion.div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', padding: '1rem', borderRadius: '10px', color: '#fca5a5', display: 'flex', gap: '0.75rem' }}
                    >
                      <AlertTriangle size={24} />
                      <p>{error}</p>
                    </motion.div>
                  )}

                  {result && !loading && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                      {/* Anomaly Status */}
                      <motion.div
                        variants={itemVariants}
                        style={{
                          background: result.anomaly_detection_status === 'valid_data' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          padding: '1rem', borderRadius: '10px',
                          border: `1px solid ${result.anomaly_detection_status === 'valid_data' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                          display: 'flex', alignItems: 'center', gap: '1rem'
                        }}
                      >
                        {result.anomaly_detection_status === 'valid_data'
                          ? <CheckCircle size={28} color="#10b981" />
                          : <AlertTriangle size={28} color="#ef4444" />}
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Anomaly Check</div>
                          <div style={{ fontWeight: 600, color: result.anomaly_detection_status === 'valid_data' ? '#34d399' : '#fca5a5' }}>
                            {result.anomaly_detection_status === 'valid_data' ? 'Data Validated' : 'Suspicious Data Detected'}
                          </div>
                          {result.message && <div style={{ fontSize: '0.85rem', color: '#fca5a5', marginTop: '0.25rem' }}>{result.message}</div>}
                        </div>
                      </motion.div>

                      {/* Biomass + Carbon */}
                      {result.predicted_biomass && (
                        <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div style={{ background: 'rgba(15,23,42,0.5)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>PREDICTED BIOMASS</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#e2e8f0' }}>
                              {result.predicted_biomass.toFixed(2)} <span style={{ fontSize: '1rem', color: '#64748b' }}>tons</span>
                            </div>
                          </div>
                          <div style={{ background: 'rgba(59,130,246,0.1)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)' }}>
                            <div style={{ fontSize: '0.8rem', color: '#93c5fd', marginBottom: '0.5rem' }}>CARBON ESTIMATE</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#60a5fa' }}>
                              {result.carbon_estimate.toFixed(2)} <span style={{ fontSize: '1rem', color: '#3b82f6' }}>credits</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Ecosystem Health Score Card */}
                      {result.predicted_biomass && (() => {
                        const health = getEcosystemHealth(formData.NDVI, formData.EVI);
                        return (
                          <motion.div
                            variants={itemVariants}
                            style={{
                              background: 'rgba(15,23,42,0.55)',
                              border: '1px solid rgba(255, 255, 255, 0.05)',
                              borderRadius: '12px',
                              padding: '1.25rem',
                              display: 'flex',
                              gap: '1.25rem',
                              alignItems: 'center',
                              marginTop: '0.5rem',
                            }}
                          >
                            {/* Left: Big Grade Badge */}
                            <div style={{
                              background: health.bg,
                              border: `2px solid ${health.color}`,
                              borderRadius: '16px',
                              width: '68px',
                              height: '68px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '2.2rem',
                              fontWeight: 900,
                              color: health.color,
                              fontFamily: 'Outfit, sans-serif',
                              flexShrink: 0,
                              boxShadow: `0 0 16px ${health.color}15`
                            }}>
                              {health.grade}
                            </div>

                            {/* Right: Details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flexGrow: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'Outfit, sans-serif' }}>
                                  Ecosystem Health
                                </span>
                                <span style={{
                                  fontSize: '0.7rem',
                                  color: '#0b1329',
                                  background: health.color,
                                  fontWeight: 800,
                                  padding: '2px 9px',
                                  borderRadius: '20px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.02em',
                                  fontFamily: 'Outfit, sans-serif'
                                }}>
                                  {health.label}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.4, fontFamily: 'Inter, sans-serif' }}>
                                {health.desc}
                              </p>
                              <span style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', marginTop: '0.1rem' }}>
                                Input Bands: NDVI={formData.NDVI.toFixed(2)} · EVI={formData.EVI.toFixed(2)}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })()}

                      {/* Blockchain TX */}
                      {result.blockchain_tx && (
                        <motion.div
                          variants={itemVariants}
                          style={{ background: 'rgba(15,23,42,0.5)', padding: '1.5rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '0.5rem' }}
                        >
                          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <LinkIcon size={14} /> BLOCKCHAIN TRANSACTION
                            </span>
                            {walletAddress && (
                              <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                ✓ Transferred to Connected Wallet
                              </span>
                            )}
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#34d399', wordBreak: 'break-all', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px' }}>
                            {result.blockchain_tx.startsWith('0x') ? (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${result.blockchain_tx}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: '#34d399',
                                  textDecoration: 'underline',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  cursor: 'pointer'
                                }}
                              >
                                {result.blockchain_tx} <ExternalLink size={14} style={{ flexShrink: 0 }} />
                              </a>
                            ) : (
                              <span>{result.blockchain_tx}</span>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* ── Confidence Visualizer ── */}
                      {result.confidence_pct != null && result.feature_importances?.length > 0 && (
                        <motion.div variants={itemVariants}>
                          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0.5rem 0' }} />
                          <ConfidenceVisualizer
                            confidence={result.confidence_pct}
                            featureImportances={result.feature_importances}
                          />
                        </motion.div>
                      )}

                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'health' && (
          <motion.div
            key="health"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ maxWidth: '1200px', margin: '0 auto' }}
          >
            <EcosystemHealth />
          </motion.div>
        )}

        {activeTab === 'market' && (
          <motion.div
            key="market"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ maxWidth: '1200px', margin: '0 auto' }}
          >
            <MarketTrends
              walletAddress={walletAddress}
              tokenBalance={tokenBalance}
              fetchBalance={fetchBalance}
            />
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ maxWidth: '1200px', margin: '0 auto' }}
          >
            <TransactionHistory walletAddress={walletAddress} />
          </motion.div>
        )}

        {activeTab === 'calculator' && (
          <motion.div
            key="calculator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ maxWidth: '1200px', margin: '0 auto', marginTop: '2rem' }}
          >
            <CarbonCalculator />
          </motion.div>
        )}

        {activeTab === 'impact' && (
          <motion.div
            key="impact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ maxWidth: '1200px', margin: '0 auto', marginTop: '2rem' }}
          >
            <EcosystemImpact />
          </motion.div>
        )}

        {activeTab === 'geo' && (
          <motion.div
            key="geo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ maxWidth: '1400px', margin: '0 auto' }}
          >
            <GeoExplorer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
