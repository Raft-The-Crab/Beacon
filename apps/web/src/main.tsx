import { StrictMode } from 'react'
import App from './App'

import './styles/index.css'

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
