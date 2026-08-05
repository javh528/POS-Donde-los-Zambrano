import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ── Reset de localStorage al primer arranque de una nueva versión ─────────────
// Cambia APP_VERSION para forzar que todos los clientes arranquen con datos limpios.
const APP_VERSION = '1.0.0';
const storedVersion = localStorage.getItem('zambrano_app_version');
if (storedVersion !== APP_VERSION) {
  localStorage.removeItem('zambrano_tables');
  localStorage.removeItem('zambrano_sales');
  localStorage.setItem('zambrano_app_version', APP_VERSION);
}
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
