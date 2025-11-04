import { supabase } from '../../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class AddVideoToShopifyService {
  static async addVideoToProduct(videoId: string, storeId: string): Promise<void> {
    const apiUrl = `${SUPABASE_URL}/functions/v1/add-video-to-product`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoId,
        storeId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to add video to Shopify' }));
      throw new Error(error.error || 'Failed to add video to Shopify');
    }

    const result = await response.json();
    return result;
  }
}
