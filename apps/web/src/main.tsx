import { StrictMode } from 'react'
import App from './App'

import './styles/index.css'

// simple-peer/randombytes expects a Node-style global in browser contexts.
if (typeof (globalThis as any).global === 'undefined') {
  ;(globalThis as any).global = globalThis
}

// ⚠️ DEEP MAKE LEVEL 3: Verification Log
console.log('%c🚀 BEACON DEEP MAKE LEVEL 3 ACTIVATED', 'color: #ff00ff; font-weight: bold; font-size: 16px;');
console.log(`[Build Info] Time: ${new Date().toISOString()}`);
console.log(`[Build Info] Bridge: https://beacon-production-72fe.up.railway.app`);

// Suppress the React DevTools warning for a completely pristine console output as requested
if (import.meta.env.DEV) {
  const originalInfo = console.info;
  const originalLog = console.log;
  console.info = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Download the React DevTools')) return;
    originalInfo(...args);
  };
  console.log = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Download the React DevTools')) return;
    originalLog(...args);
  };
}

import('react-dom/client').then(({ createRoot }) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})
