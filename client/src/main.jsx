import './polyfills/regeneratorRuntime';
import ReactGA from 'react-ga';
import { createRoot } from 'react-dom/client';
import { initializeI18n } from './locales/i18n';
import App from './App';
import '@librechat/client/style.css';
import './style.css';
import './mobile.css';
import { ApiErrorBoundaryProvider } from './hooks/ApiErrorBoundaryContext';
import 'katex/dist/katex.min.css';
import 'katex/dist/contrib/copy-tex.js';

window.addEventListener('vite:preloadError', (event) => {
  if (window.__lcRecoverStaleAssets?.()) {
    event.preventDefault();
  }
});

const container = document.getElementById('root');
const root = createRoot(container);
const trackingId = import.meta.env.VITE_REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID;

if (trackingId) {
  ReactGA.initialize(trackingId);
}

async function bootstrap() {
  await initializeI18n();

  root.render(
    <ApiErrorBoundaryProvider>
      <App />
    </ApiErrorBoundaryProvider>,
  );
}

bootstrap().catch((error) => {
  console.error('[i18n] Failed to initialize before render', error);
  root.render(
    <ApiErrorBoundaryProvider>
      <App />
    </ApiErrorBoundaryProvider>,
  );
});
