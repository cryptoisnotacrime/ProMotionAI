import { ReactNode, useEffect, useState } from 'react';
import { createApp } from '@shopify/app-bridge';

interface ShopifyAppBridgeProps {
  children: ReactNode;
  apiKey?: string;
}

export function ShopifyAppBridge({ children, apiKey }: ShopifyAppBridgeProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const host = params.get('host');
    const shop = params.get('shop');

    console.log('ShopifyAppBridge initializing with:', { host, shop, url: window.location.href });

    if (host && shop && apiKey) {
      const config = {
        apiKey: apiKey,
        host: host,
        forceRedirect: false,
      };

      console.log('Creating Shopify App with config:', {
        apiKey: config.apiKey ? 'present' : 'missing',
        host: config.host ? 'present' : 'missing'
      });

      try {
        const app = createApp(config);
        (window as any).shopifyApp = app;
        console.log('Shopify App Bridge created successfully');
        setIsReady(true);
      } catch (error) {
        console.error('Error creating Shopify App Bridge:', error);
        setIsReady(true);
      }
    } else {
      console.log('Not running in Shopify embedded context or missing apiKey');
      setIsReady(true);
    }
  }, [apiKey]);

  if (!isReady) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
