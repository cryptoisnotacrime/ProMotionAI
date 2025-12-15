import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '@shopify/polaris';
import '@shopify/polaris/build/esm/styles.css';
import App from './App.tsx';
import './index.css';
import { ShopifyAppBridge } from './components/auth/ShopifyAppBridge';

const params = new URLSearchParams(window.location.search);
const apiKey = params.get('apiKey') || undefined;

const theme = {
  colorScheme: 'dark',
  colors: {
    surface: '#0a0a0a',
    onSurface: '#f9fafb',
    interactive: '#3b82f6',
    secondary: '#10b981',
    primary: '#3b82f6',
    critical: '#ef4444',
    warning: '#f59e0b',
    highlight: '#3b82f6',
    success: '#10b981',
    decorative: '#3b82f6',
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider i18n={{}} theme={theme}>
      <ShopifyAppBridge apiKey={apiKey}>
        <App />
      </ShopifyAppBridge>
    </AppProvider>
  </StrictMode>
);
