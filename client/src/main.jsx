import 'regenerator-runtime/runtime';
import { createRoot } from 'react-dom/client';
import React from 'react';
import './locales/i18n';
import App from './App';
import ReactGA from 'react-ga';
import './style.css';
import './mobile.css';
import { ApiErrorBoundaryProvider } from './hooks/ApiErrorBoundaryContext';
import 'katex/dist/katex.min.css';
import 'katex/dist/contrib/copy-tex.js';

const container = document.getElementById('root');
const root = createRoot(container);
const trackingId = import.meta.env.VITE_REACT_APP_GOOGLE_ANALYTICS_TRACKING_ID;

if (trackingId) {
  ReactGA.initialize(trackingId);
}

root.render(
  <ApiErrorBoundaryProvider>
    <App />
  </ApiErrorBoundaryProvider>,
);
