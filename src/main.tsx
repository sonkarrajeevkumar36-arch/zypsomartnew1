import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Early capture of Google Maps quota/auth failures before React hydration
if (typeof window !== 'undefined') {
  (window as any).gm_authFailure = () => {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };
  const origConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    const msg = args.map((a) => String(a)).join(' ');
    if (
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes("Backend didn't respond within 10 seconds")
    ) {
      console.warn(...args);
      return;
    }
    origConsoleError.apply(console, args);
    if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  };
}

// Early capture of beforeinstallprompt before React hydration
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent the default browser mini-infobar
    e.preventDefault();
    (window as any).__pwaDeferredPrompt = e;
    // Notify any listening components that prompt is ready
    window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

// Register service worker with immediate execution if page is already loaded
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const registerServiceWorker = () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Check for updates periodically
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA]: New version available');
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn('[SW Registration Error]:', err);
      });
  };

  if (document.readyState === 'complete') {
    registerServiceWorker();
  } else {
    window.addEventListener('load', registerServiceWorker);
  }
}

