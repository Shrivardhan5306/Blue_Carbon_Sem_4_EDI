import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { Activity, ArrowRight, ArrowLeft, RefreshCw, Leaf, ShoppingCart, Tag, Flame } from 'lucide-react';
import CarbonTokenABI from '../CarbonTokenABI.json';
import CarbonMarketplaceABI from '../CarbonMarketplaceABI.json';
import CarbonOffsetNFTABI from '../CarbonOffsetNFTABI.json';

const TransactionHistory = ({ walletAddress }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const TOKEN_ADDRESS = "0x2e4d486d84CCBA47f0601F552AcF5129Ed5292d9";
  const MARKETPLACE_ADDRESS = "0xde2d052b038Ad5EdB4a9503591b26A0c81193537";
  const NFT_ADDRESS = "0x014571180Bd329C55Cd93721624208Bb981e7265";

  const fetchHistory = useCallback(async () => {
    if (!walletAddress) return;
    
    const isSandbox = !window.ethereum || walletAddress.toLowerCase().includes('sandbox');
    
    setLoading(true);
    setFetchError(null);
    
    if (isSandbox) {
      try {
        let localLogs = [];
        const saved = localStorage.getItem('sandbox_activity_logs');
        if (saved) {
          localLogs = JSON.parse(saved);
        } else {
          const now = Date.now();
          localLogs = [
            {
              id: "sim-tx-1",
              type: "MINT",
              amount: "120.00",
              txHash: "0x3a82f6e2e4d486d84CCBA47f0601F552AcF5129Ed5292d9d97706f59e0bc1193537",
              timestamp: now - 3600000 * 2, // 2 hours ago
            },
            {
              id: "sim-tx-2",
              type: "RETIRE",
              amount: "50.00",
              txHash: "0xde2d052b038Ad5EdB4a9503591b26A0c8119353784ccba47f0601f552acf5129ed",
              timestamp: now - 3600000 * 24, // 1 day ago
              tokenId: "142"
            },
            {
              id: "sim-tx-3",
              type: "LIST",
              amount: "30.00",
              txHash: "0x014571180Bd329C55Cd93721624208Bb981e7265de2d052b038ad5edb4a9503591b",
              timestamp: now - 3600000 * 48, // 2 days ago
              price: "0.02"
            },
            {
              id: "sim-tx-4",
              type: "MINT",
              amount: "250.00",
              txHash: "0x2e4d486d84CCBA47f0601F552AcF5129Ed5292d90000000000000000000000000",
              timestamp: now - 3600000 * 72, // 3 days ago
            }
          ];
          localStorage.setItem('sandbox_activity_logs', JSON.stringify(localLogs));
        }
        setEvents(localLogs);
      } catch (err) {
        console.error("Failed to load sandbox logs:", err);
        setFetchError("Failed to parse sandbox logs.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, CarbonTokenABI, provider);
      const marketplaceContract = new ethers.Contract(MARKETPLACE_ADDRESS, CarbonMarketplaceABI.abi, provider);
      const nftContract = new ethers.Contract(NFT_ADDRESS, CarbonOffsetNFTABI.abi, provider);

      const currentBlock = await provider.getBlockNumber();
      
      let transfersTo = [];
      let transfersFrom = [];
      let listed = [];
      let purchased = [];
      let retired = [];
      
      const ranges = [50000, 10000, 1000, 100, 10];
      let logsFetched = false;

      for (let r = 0; r < ranges.length; r++) {
        const range = ranges[r];
        try {
          const fromBlock = Math.max(0, currentBlock - range);
          
          const filterTransferTo = tokenContract.filters.Transfer(null, walletAddress);
          const filterTransferFrom = tokenContract.filters.Transfer(walletAddress, null);
          const filterListed = marketplaceContract.filters.ListingCreated(null, walletAddress);
          const filterPurchased = marketplaceContract.filters.ListingBought(null, walletAddress);
          const filterRetired = nftContract.filters.CarbonRetired(null, walletAddress);

          // Fetch all logs in parallel for high speed
          const [tTo, tFrom, lst, pur, ret] = await Promise.all([
            tokenContract.queryFilter(filterTransferTo, fromBlock, 'latest'),
            tokenContract.queryFilter(filterTransferFrom, fromBlock, 'latest'),
            marketplaceContract.queryFilter(filterListed, fromBlock, 'latest'),
            marketplaceContract.queryFilter(filterPurchased, fromBlock, 'latest'),
            nftContract.queryFilter(filterRetired, fromBlock, 'latest')
          ]);

          transfersTo = tTo;
          transfersFrom = tFrom;
          listed = lst;
          purchased = pur;
          retired = ret;
          
          logsFetched = true;
          console.log(`Successfully fetched logs with range: ${range}`);
          break;
        } catch (rangeErr) {
          console.warn(`Failed to fetch logs with block range ${range}:`, rangeErr);
          if (r === ranges.length - 1) {
            throw rangeErr;
          }
        }
      }

      if (!logsFetched) {
        throw new Error("Failed to fetch logs after all fallbacks.");
      }

      // Format events with parallel block resolution and timestamp caching
      const blockCache = {};
      const getBlockTimestamp = async (blockNumber, log) => {
        if (blockCache[blockNumber] !== undefined) {
          return blockCache[blockNumber];
        }
        try {
          const block = await log.getBlock();
          blockCache[blockNumber] = block.timestamp * 1000;
          return blockCache[blockNumber];
        } catch (e) {
          console.warn(`Failed to get block ${blockNumber}:`, e);
          return Date.now(); // Fallback timestamp
        }
      };

      const formatEvent = async (log, type, amount, extra = {}) => {
        const timestamp = await getBlockTimestamp(log.blockNumber, log);
        return {
          id: `${log.transactionHash}-${log.index}-${type}`, // Unique key per event type
          type,
          amount,
          txHash: log.transactionHash,
          timestamp,
          ...extra
        };
      };

      const eventPromises = [];

      for (const log of transfersTo) {
        if (log.args && log.args[0] === ethers.ZeroAddress) {
          const amount = log.args[2] !== undefined ? ethers.formatEther(log.args[2]) : "0.0";
          eventPromises.push(formatEvent(log, 'MINT', amount));
        } else if (log.args && log.args[0] !== MARKETPLACE_ADDRESS) {
          const amount = log.args[2] !== undefined ? ethers.formatEther(log.args[2]) : "0.0";
          eventPromises.push(formatEvent(log, 'RECEIVE', amount, { from: log.args[0] }));
        }
      }

      for (const log of transfersFrom) {
        if (log.args && log.args[1] !== MARKETPLACE_ADDRESS && log.args[1] !== NFT_ADDRESS) {
          const amount = log.args[2] !== undefined ? ethers.formatEther(log.args[2]) : "0.0";
          eventPromises.push(formatEvent(log, 'SEND', amount, { to: log.args[1] }));
        }
      }

      for (const log of listed) {
        if (log.args) {
          const amount = log.args[2] !== undefined ? log.args[2].toString() : "0";
          const price = log.args[3] !== undefined ? ethers.formatEther(log.args[3]) : "0.0";
          eventPromises.push(formatEvent(log, 'LIST', amount, { price }));
        }
      }

      for (const log of purchased) {
        if (log.args) {
          const amount = log.args[2] !== undefined ? log.args[2].toString() : "0";
          eventPromises.push(formatEvent(log, 'BUY', amount));
        }
      }

      for (const log of retired) {
        if (log.args) {
          const amount = log.args[2] !== undefined ? log.args[2].toString() : "0";
          const tokenId = log.args[0] !== undefined ? log.args[0].toString() : "0";
          eventPromises.push(formatEvent(log, 'RETIRE', amount, { tokenId }));
        }
      }

      // Resolve all event promises in parallel
      const allEvents = await Promise.all(eventPromises);

      allEvents.sort((a, b) => b.timestamp - a.timestamp);
      setEvents(allEvents);

    } catch (err) {
      console.error("Failed to fetch history from blockchain:", err);
      setFetchError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const renderIcon = (type) => {
    switch(type) {
      case 'MINT': return <Leaf size={18} color="#10b981" />;
      case 'RECEIVE': return <ArrowLeft size={18} color="#3b82f6" />;
      case 'SEND': return <ArrowRight size={18} color="#f59e0b" />;
      case 'LIST': return <Tag size={18} color="#8b5cf6" />;
      case 'BUY': return <ShoppingCart size={18} color="#06b6d4" />;
      case 'RETIRE': return <Flame size={18} color="#ef4444" />;
      default: return <Activity size={18} />;
    }
  };

  const renderDescription = (event) => {
    switch(event.type) {
      case 'MINT': return `Issued ${event.amount} CCT from AI Verification`;
      case 'RECEIVE': return `Received ${event.amount} CCT from ${event.from.substring(0,6)}...`;
      case 'SEND': return `Sent ${event.amount} CCT to ${event.to.substring(0,6)}...`;
      case 'LIST': return `Listed ${event.amount} CCT at ${event.price} ETH each`;
      case 'BUY': return `Purchased ${event.amount} CCT from Marketplace`;
      case 'RETIRE': return `Retired ${event.amount} CCT (Minted NFT #${event.tokenId})`;
      default: return `Unknown event`;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity color="#3b82f6" /> Activity Log
          </h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Transparent on-chain history of all your transactions on Sepolia.
          </p>
        </div>
        <button onClick={fetchHistory} disabled={loading} style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6', borderRadius: '8px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Refresh
        </button>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .history-row {
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid rgba(255,255,255,0.03);
          border-radius: 12px;
          padding: 1rem 1.5rem;
          margin-bottom: 0.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
        }
        .history-row:hover {
          background: rgba(30, 41, 59, 0.6);
          border-color: rgba(255,255,255,0.1);
          transform: translateY(-2px);
        }
      `}</style>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem', color: '#3b82f6', display: 'inline-block' }} />
          <div>Querying the blockchain for your historical events...</div>
        </div>
      ) : fetchError ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <Activity size={32} style={{ marginBottom: '1rem', opacity: 0.8 }} />
          <div>Error fetching history:</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8, maxWidth: '80%', margin: '0.5rem auto 0 auto' }}>{fetchError}</div>
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b', background: 'rgba(15, 23, 42, 0.2)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <Activity size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <div>No transactions found in the recent blocks.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <AnimatePresence>
            {events.map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="history-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '50%' }}>
                    {renderIcon(ev.type)}
                  </div>
                  <div>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem' }}>
                      {renderDescription(ev)}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {new Date(ev.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <a href={`https://sepolia.etherscan.io/tx/${ev.txHash}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontSize: '0.8rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.8rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '20px' }}>
                    View Tx <ArrowRight size={12} />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default TransactionHistory;
