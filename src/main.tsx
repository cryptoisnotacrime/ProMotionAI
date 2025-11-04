import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ShopifyAppBridge } from './components/auth/ShopifyAppBridge';

const params = new URLSearchParams(window.location.search);
const apiKey = params.get('apiKey') || undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ShopifyAppBridge apiKey={apiKey}>
      <App />
    </ShopifyAppBridge>
  </StrictMode>
);
