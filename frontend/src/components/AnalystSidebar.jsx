import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Bot, User, Sparkles, Loader,
  HelpCircle, ArrowRight, CornerDownLeft
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const QUICK_QUESTIONS = [
  "Explain NDVI & EVI bands",
  "How does XGBoost predict biomass?",
  "How are credits issued on Sepolia?",
  "Which industries adopt blue carbon?"
];

const AnalystSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 **Welcome! I am your Blue Carbon AI Analyst.**\n\nAsk me anything about satellite remote sensing bands, XGBoost predictions, carbon credit sequestration rates, or our Ethereum Sepolia ledger integrations!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    // Clear input
    if (!textToSend) setInput('');

    // Append user message
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: newMessages.slice(1, -1) // pass history excluding system intro
        })
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (e) {
      console.error("Chatbot request failed:", e);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Connection Error:** Could not sync with the AI Analyst backend. Please make sure the FastAPI server is running on \`${API_BASE_URL}/\`.`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Convert simple markdown to React elements
  const renderMessageContent = (text) => {
    return text.split('\n\n').map((paragraph, pIdx) => {
      // Check for markdown headers
      if (paragraph.startsWith('### ')) {
        return <h4 key={pIdx} style={{ margin: '0.75rem 0 0.4rem 0', color: '#60a5fa', fontWeight: 700, fontSize: '0.92rem', fontFamily: 'Outfit, sans-serif' }}>{paragraph.replace('### ', '')}</h4>;
      }
      if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
        return <p key={pIdx} style={{ margin: 0, fontWeight: 700, color: '#e2e8f0' }}>{paragraph.replace(/\*\*/g, '')}</p>;
      }

      // Format inline bold markers
      const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={pIdx} style={{ margin: '0 0 0.5rem 0', lineHeight: 1.5, fontSize: '0.82rem', color: '#cbd5e1' }}>
          {parts.map((part, partIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={partIdx} style={{ color: '#fff', fontWeight: 600 }}>{part.replace(/\*\*/g, '')}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <>
      {/* ── Floating Bubble Button ── */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.08, boxShadow: '0 0 24px rgba(16,185,129,0.35)' }}
        whileTap={{ scale: 0.92 }}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(16,185,129,0.2)'
        }}
      >
        <MessageSquare size={24} />
        {/* Waving Glow effect */}
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px solid #10b981',
            pointerEvents: 'none'
          }}
        />
      </motion.button>

      {/* ── Slide-Out Sidebar ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: '#000',
                zIndex: 10000,
                backdropFilter: 'blur(2px)'
              }}
            />

            {/* Sidebar Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '420px',
                background: 'rgba(15, 23, 42, 0.96)',
                backdropFilter: 'blur(16px)',
                borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
                zIndex: 10001,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              {/* Header */}
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(10, 15, 30, 0.4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(16,185,129,0.15)', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
                    <Bot size={18} color="#10b981" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', fontFamily: 'Outfit, sans-serif' }}>
                      Ask the Analyst
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500 }}>Blue Carbon AI Active</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={18} className="hover-color" style={{ transition: 'color 0.2s' }} />
                </button>
              </div>

              {/* Chat Log Panel */}
              <div style={{
                flexGrow: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
              }}>
                {messages.map((msg, idx) => {
                  const isAssistant = msg.role === 'assistant';
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                        flexDirection: isAssistant ? 'row' : 'row-reverse',
                        maxWidth: '90%'
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: isAssistant ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                        border: `1px solid ${isAssistant ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {isAssistant ? <Bot size={14} color="#10b981" /> : <User size={14} color="#3b82f6" />}
                      </div>

                      {/* Content Bubble */}
                      <div style={{
                        background: isAssistant ? 'rgba(30, 41, 59, 0.4)' : 'rgba(59, 130, 246, 0.12)',
                        border: `1px solid ${isAssistant ? 'rgba(255,255,255,0.04)' : 'rgba(59,130,246,0.25)'}`,
                        padding: '0.75rem 1rem',
                        borderRadius: isAssistant ? '0 16px 16px 16px' : '16px 0 16px 16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
                        {renderMessageContent(msg.content)}
                      </div>
                    </motion.div>
                  );
                })}

                {/* Loading indicator */}
                {loading && (
                  <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start', maxWidth: '80%' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Bot size={14} color="#10b981" />
                    </div>
                    <div style={{
                      background: 'rgba(30, 41, 59, 0.4)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      padding: '0.75rem 1rem',
                      borderRadius: '0 16px 16px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <Loader size={14} color="#10b981" />
                      </motion.div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Analyzing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Questions & Input Box */}
              <div style={{
                padding: '1.25rem 1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(10, 15, 30, 0.45)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {/* Quick questions chips */}
                {messages.length === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <HelpCircle size={12} /> SUGGESTED QUESTIONS
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {QUICK_QUESTIONS.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(q)}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: '#94a3b8',
                            fontSize: '0.74rem',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(16,185,129,0.08)';
                            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.25)';
                            e.currentTarget.style.color = '#10b981';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.color = '#94a3b8';
                          }}
                        >
                          {q} <ArrowRight size={10} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  style={{
                    display: 'flex',
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '4px 8px',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about remote sensing or credits..."
                    disabled={loading}
                    style={{
                      flexGrow: 1,
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      color: '#e2e8f0',
                      fontSize: '0.82rem',
                      padding: '8px 4px',
                      fontFamily: 'Inter, sans-serif'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    style={{
                      background: input.trim() ? '#10b981' : 'none',
                      border: 'none',
                      color: input.trim() ? '#fff' : '#475569',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: input.trim() ? 'pointer' : 'default',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AnalystSidebar;
