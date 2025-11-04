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
    const embedded = params.get('embedded');

    console.log('ShopifyAppBridge initializing with:', {
      host,
      shop,
      embedded,
      isTopFrame: window.self === window.top,
      url: window.location.href
    });

    // Only initialize App Bridge if we have a host parameter AND we're in an iframe
    // Legacy install flow opens in new tab (not iframe) and has no host parameter
    const isInIframe = window.self !== window.top;
    const shouldInitialize = host && shop && apiKey && (isInIframe || embedded === '1');

    if (shouldInitialize) {
      const config = {
        apiKey: apiKey,
        host: host,
        forceRedirect: false,
      };

      console.log('Creating Shopify App with config:', {
        apiKey: config.apiKey ? 'present' : 'missing',
        host: config.host ? 'present' : 'missing',
        isInIframe
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
      console.log('Not running in Shopify embedded context - skipping App Bridge initialization', {
        host: !!host,
        shop: !!shop,
        apiKey: !!apiKey,
        isInIframe,
        embedded
      });
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
