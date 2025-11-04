function decodeEnvVar(value: string | undefined): string {
  if (!value) return '';
  if (value.startsWith('base64:')) {
    return atob(value.substring(7));
  }
  return value;
}

export const SHOPIFY_CONFIG = {
  clientId: decodeEnvVar(import.meta.env.VITE_SHOPIFY_CLIENT_ID) || '',
  supabaseUrl: decodeEnvVar(import.meta.env.VITE_Bolt_Database_URL),
  supabaseAnonKey: decodeEnvVar(import.meta.env.VITE_Bolt_Database_ANON_KEY),
};

export const getShopifyAuthUrl = async (shop: string): Promise<string> => {
  if (!SHOPIFY_CONFIG.supabaseUrl || !SHOPIFY_CONFIG.supabaseAnonKey) {
    throw new Error('Supabase configuration missing. Please add VITE_Bolt_Database_URL and VITE_Bolt_Database_ANON_KEY to your environment variables.');
  }

  const response = await fetch(
    `${SHOPIFY_CONFIG.supabaseUrl}/functions/v1/shopify-oauth-init?shop=${encodeURIComponent(shop)}`,
    {
      headers: {
        'Authorization': `Bearer ${SHOPIFY_CONFIG.supabaseAnonKey}`,
        'apikey': SHOPIFY_CONFIG.supabaseAnonKey,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to initialize OAuth' }));
    throw new Error(error.error || 'Failed to connect to Shopify');
  }

  const data = await response.json();
  return data.authUrl;
};
