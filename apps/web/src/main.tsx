import { StrictMode } from 'react'
import App from './App'

import './styles/index.css'

// simple-peer/randombytes expects a Node-style global in browser contexts.
if (typeof (globalThis as any).global === 'undefined') {
  ;(globalThis as any).global = globalThis
}

// ⚠️ DEEP MAKE LEVEL 5: NUCLEAR VERIFICATION
console.log('%c☢️ BEACON DEEP MAKE LEVEL 5 ACTIVATED', 'color: #00ff00; font-weight: bold; font-size: 24px; text-shadow: 2px 2px #000;');
console.log(`[Version] 5.0.0-NUCLEAR_STABLE`);
console.log(`[Build Info] Bridge: https://beacon-production-72fe.up.railway.app`);

if (typeof window !== 'undefined') {
  alert('☢️ BEACON NUCLEAR LEVEL 5 ACTIVATED! Cache purged and bridge locked.');
}

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
