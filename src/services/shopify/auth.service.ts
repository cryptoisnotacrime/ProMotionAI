import { supabase } from '../../lib/supabase';

export interface ShopifyAuthParams {
  shop: string;
  code: string;
}

export interface ShopifyStore {
  id: string;
  shop: string;
  name: string;
  email: string;
}

export class ShopifyAuthService {
  static async initiateOAuth(shop: string, host?: string): Promise<string> {
    const supabaseUrl = import.meta.env.VITE_Bolt_Database_URL;
    const supabaseAnonKey = import.meta.env.VITE_Bolt_Database_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const params = new URLSearchParams({ shop });
    if (host) {
      params.set('host', host);
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/shopify-oauth-init?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to initialize OAuth' }));
      throw new Error(error.error || 'Failed to connect to Shopify');
    }

    const data = await response.json();
    return data.authUrl;
  }

  static async exchangeCodeForToken(params: ShopifyAuthParams): Promise<string> {
    const response = await fetch('/api/shopify/exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    return data.access_token;
  }

  static async getStoreInfo(shop: string, accessToken: string): Promise<ShopifyStore> {
    const response = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch store info');
    }

    const data = await response.json();
    return {
      id: data.shop.id.toString(),
      shop: data.shop.domain,
      name: data.shop.name,
      email: data.shop.email,
    };
  }

  static async saveStoreToDatabase(store: ShopifyStore, accessToken: string) {
    const { data, error } = await supabase
      .from('stores')
      .upsert({
        shop_domain: store.shop,
        access_token: accessToken,
        shopify_store_id: store.id,
        store_name: store.name,
        email: store.email,
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to save store: ${error.message}`);
    }

    return data;
  }

  static async getStoreByDomain(shop: string) {
    const supabaseUrl = import.meta.env.VITE_Bolt_Database_URL;
    const supabaseAnonKey = import.meta.env.VITE_Bolt_Database_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/stores?shop_domain=eq.${encodeURIComponent(shop)}&select=*`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'x-shopify-shop': shop,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch store: ${response.statusText}`);
    }

    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  }
}
