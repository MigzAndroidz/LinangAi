import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './services/pushService.js'

// Register the service worker on boot so it's ready when the user grants
// notification permission. This is non-blocking and safe to call unconditionally.
registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
