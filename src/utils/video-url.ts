export function getProxiedVideoUrl(videoUrl: string | null | undefined): string {
  if (!videoUrl) return '';

  // If it's a Supabase storage signed URL, convert to public URL
  if (videoUrl.includes('/storage/v1/object/sign/')) {
    const url = new URL(videoUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/sign\/generated-videos\/(.+)/);

    if (pathMatch) {
      const videoPath = pathMatch[1];
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      return `${supabaseUrl}/storage/v1/object/public/generated-videos/${videoPath}`;
    }
  }

  // If it's already a public URL, return as is
  if (videoUrl.includes('/storage/v1/object/public/')) {
    return videoUrl;
  }

  // For other URLs (Shopify CDN, etc), return as is
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
