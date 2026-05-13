/**
 * Main entry point
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[PWA] Service Worker registered:', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('[PWA] New Service Worker available');
              // Optionally notify user about update
            }
          });
        }
      });

      // Check for updates periodically
      setInterval(() => {
        registration.update().catch(() => {});
      }, 60000); // Check every minute
    } catch (error) {
      console.warn('[PWA] Service Worker registration failed:', error);
    }
  });

  // Handle controller change
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[PWA] Service Worker controller changed');
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)