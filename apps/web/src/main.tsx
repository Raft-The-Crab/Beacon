import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'

// simple-peer/randombytes expects a Node-style global in browser contexts.
if (typeof (globalThis as any).global === 'undefined') {
  ;(globalThis as any).global = globalThis
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
