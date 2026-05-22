import React from 'react';
import { motion } from 'framer-motion';
import { Leaf } from 'lucide-react';

const SplashScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999
      }}
    >
      <motion.div
        initial={{ scale: 0.8, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 1, type: "spring", stiffness: 100 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            y: [0, -10, 0]
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: "easeInOut"
          }}
          style={{
            background: 'rgba(20, 184, 166, 0.1)',
            padding: '2rem',
            borderRadius: '50%',
            marginBottom: '1.5rem',
            boxShadow: '0 0 40px rgba(20, 184, 166, 0.2)'
          }}
        >
          <Leaf size={64} color="#14b8a6" strokeWidth={1.5} />
        </motion.div>
        
        <h1 style={{ fontSize: '3rem', fontWeight: 700, margin: 0, letterSpacing: '-0.05em' }}>
          <span style={{ color: '#e2e8f0' }}>Blue</span>
          <span className="gradient-text">Carbon</span>
        </h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '1.1rem', fontWeight: 300 }}>
          AI-Powered Carbon Credit Issuance
        </p>

        <motion.div 
          style={{
            marginTop: '3rem',
            height: '4px',
            width: '200px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.5, duration: 2, ease: "easeInOut" }}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #14b8a6)',
              borderRadius: '4px'
            }}
          />
        </motion.div>

      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
