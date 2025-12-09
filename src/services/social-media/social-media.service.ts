import { supabase } from '../../lib/supabase';
import type { SocialMediaConnection, SocialMediaPhoto } from '../../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_Bolt_Database_URL?.startsWith('base64:')
  ? atob(import.meta.env.VITE_Bolt_Database_URL.substring(7))
  : import.meta.env.VITE_Bolt_Database_URL;

const SUPABASE_ANON_KEY = import.meta.env.VITE_Bolt_Database_ANON_KEY?.startsWith('base64:')
  ? atob(import.meta.env.VITE_Bolt_Database_ANON_KEY.substring(7))
  : import.meta.env.VITE_Bolt_Database_ANON_KEY;

export class SocialMediaService {
  /**
   * Connect Instagram account - Opens OAuth window
   */
  static async connectInstagram(storeId: string): Promise<void> {
    try {
      // Get auth URL from edge function
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/instagram-oauth-init?store_id=${storeId}`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to initialize Instagram OAuth');
      }

      const { authUrl } = await response.json();

      // Open OAuth window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'instagram_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth completion
      return new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'instagram_connected') {
            window.removeEventListener('message', messageHandler);
            popup?.close();
            resolve();
          } else if (event.data.type === 'instagram_error') {
            window.removeEventListener('message', messageHandler);
            popup?.close();
            reject(new Error(event.data.error || 'Instagram connection failed'));
          }
        };

        window.addEventListener('message', messageHandler);

        // Check if popup was closed
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            reject(new Error('OAuth window was closed'));
          }
        }, 500);
      });
    } catch (error) {
      console.error('Instagram connect error:', error);
      throw error;
    }
  }

  /**
   * Connect TikTok account - Opens OAuth window
   */
  static async connectTikTok(storeId: string): Promise<void> {
    try {
      // Get auth URL from edge function
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/tiktok-oauth-init?store_id=${storeId}`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to initialize TikTok OAuth');
      }

      const { authUrl } = await response.json();

      // Open OAuth window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'tiktok_oauth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth completion
      return new Promise((resolve, reject) => {
        const messageHandler = (event: MessageEvent) => {
          if (event.data.type === 'tiktok_connected') {
            window.removeEventListener('message', messageHandler);
            popup?.close();
            resolve();
          } else if (event.data.type === 'tiktok_error') {
            window.removeEventListener('message', messageHandler);
            popup?.close();
            reject(new Error(event.data.error || 'TikTok connection failed'));
          }
        };

        window.addEventListener('message', messageHandler);

        // Check if popup was closed
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            reject(new Error('OAuth window was closed'));
          }
        }, 500);
      });
    } catch (error) {
      console.error('TikTok connect error:', error);
      throw error;
    }
  }

  /**
   * Get all social media connections for a store
   */
  static async getConnections(storeId: string): Promise<SocialMediaConnection[]> {
    const { data, error } = await supabase
      .from('social_media_connections')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching connections:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Disconnect a social media account by connection ID
   */
  static async disconnect(connectionId: string): Promise<void> {
    const { error } = await supabase
      .from('social_media_connections')
      .update({ is_active: false })
      .eq('id', connectionId);

    if (error) {
      console.error('Error disconnecting account:', error);
      throw error;
    }
  }

  /**
   * Disconnect a social media account by platform name
   */
  static async disconnectPlatform(storeId: string, platform: string): Promise<void> {
    const { error } = await supabase
      .from('social_media_connections')
      .update({ is_active: false })
      .eq('store_id', storeId)
      .eq('platform', platform);

    if (error) {
      console.error('Error disconnecting platform:', error);
      throw error;
    }
  }

  /**
   * Fetch Instagram photos for a store
   */
  static async getInstagramPhotos(storeId: string, limit: number = 25): Promise<SocialMediaPhoto[]> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/instagram-media?store_id=${storeId}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Instagram photos');
      }

      const { media } = await response.json();
      return media.map((item: any) => ({
        ...item,
        platform: 'instagram' as const,
      }));
    } catch (error) {
      console.error('Error fetching Instagram photos:', error);
      throw error;
    }
  }

  /**
   * Fetch TikTok video thumbnails for a store
   */
  static async getTikTokPhotos(storeId: string, limit: number = 20): Promise<SocialMediaPhoto[]> {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/tiktok-videos?store_id=${storeId}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch TikTok videos');
      }

      const { media } = await response.json();
      return media.map((item: any) => ({
        ...item,
        platform: 'tiktok' as const,
      }));
    } catch (error) {
      console.error('Error fetching TikTok videos:', error);
      throw error;
    }
  }

  /**
   * Get photos from all connected platforms
   */
  static async getAllPhotos(storeId: string): Promise<SocialMediaPhoto[]> {
    const connections = await this.getConnections(storeId);
    const photoPromises: Promise<SocialMediaPhoto[]>[] = [];

    for (const connection of connections) {
      if (connection.platform === 'instagram') {
        photoPromises.push(this.getInstagramPhotos(storeId));
      } else if (connection.platform === 'tiktok') {
        photoPromises.push(this.getTikTokPhotos(storeId));
      }
    }

    const results = await Promise.allSettled(photoPromises);
    const allPhotos: SocialMediaPhoto[] = [];

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allPhotos.push(...result.value);
      }
    });

    // Sort by timestamp, newest first
    return allPhotos.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
  }
}
