import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { CurrencyProvider } from './contexts/CurrencyContext';

import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <CurrencyProvider>
        <App />
      </CurrencyProvider>
    </HelmetProvider>
  </StrictMode>,
);
