import { supabase } from '../lib/supabase';

export function getProxiedVideoUrl(videoUrl: string | null | undefined): string {
  if (!videoUrl) return '';

  // If it's already a proxy URL, return as is
  if (videoUrl.includes('/functions/v1/video-proxy')) {
    return videoUrl;
  }

  // If it's a Supabase storage URL, convert to proxy
  if (videoUrl.includes('/storage/v1/object/')) {
    const url = new URL(videoUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/(sign|public)\/generated-videos\/(.+)/);

    if (pathMatch) {
      const videoPath = pathMatch[2];
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      return `${supabaseUrl}/functions/v1/video-proxy?path=${encodeURIComponent(videoPath)}`;
    }
  }

  // For Shopify CDN URLs or other external URLs, return as is
  // (These won't work due to ORB, but we can't proxy external URLs)
  return videoUrl;
}

export function extractVideoPathFromUrl(videoUrl: string): string | null {
  if (!videoUrl) return null;

  // Extract from Supabase storage URLs
  if (videoUrl.includes('/storage/v1/object/')) {
    const url = new URL(videoUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/(sign|public)\/generated-videos\/(.+)/);
    return pathMatch ? pathMatch[2] : null;
  }

  // Extract from proxy URLs
  if (videoUrl.includes('/functions/v1/video-proxy')) {
    const url = new URL(videoUrl);
    return url.searchParams.get('path');
  }

  return null;
}
