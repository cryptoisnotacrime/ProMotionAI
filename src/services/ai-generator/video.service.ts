import { supabase, GeneratedVideo } from '../../lib/supabase';
import { CreditsService } from '../billing/credits.service';
import { calculateCreditsRequired, calculateApiCost, getVeoModel } from '../../constants/video-generation';

export interface VideoGenerationRequest {
  storeId: string;
  productId: string;
  productTitle: string;
  imageUrl?: string;
  imageUrls?: string[];
  imageMode?: 'first-last-frame' | 'multiple-angles';
  prompt?: string;
  durationSeconds?: number;
  aspectRatio?: string;
  templateId?: string;
  templateInputs?: Record<string, any>;
  resolution?: '720p' | '1080p';
}

export interface VideoGenerationResponse {
  videoId: string;
  status: 'pending' | 'processing';
  message: string;
}

export class VideoGenerationService {
  static async generateVideo(
    request: VideoGenerationRequest
  ): Promise<VideoGenerationResponse> {
    const durationSeconds = request.durationSeconds || 5;

    // Determine image URLs and sanitize them (remove whitespace/newlines)
    const imageUrls = (request.imageUrls || (request.imageUrl ? [request.imageUrl] : [])).map(url => url.trim());
    const imageCount = imageUrls.length;

    // Credit calculation with margin: uses dynamic pricing based on model selection
    // Fast model (with images): $0.10/sec * 1.5 margin = 1 credit per ~6.67 seconds
    // Standard model (no images): $0.20/sec * 1.5 margin = 1 credit per ~3.33 seconds
    // Plus multi-image surcharge: 2+ images = +1 credit flat fee
    const creditsRequired = calculateCreditsRequired(durationSeconds, imageCount);

    const store = await CreditsService.getStoreInfo(request.storeId);
    if (!store) {
      throw new Error('Store not found');
    }

    const currentCredits = await CreditsService.checkCredits(request.storeId);
    if (currentCredits < creditsRequired) {
      throw new Error(`Insufficient credits. Required: ${creditsRequired}, Available: ${currentCredits}`);
    }

    const maxDuration =
      store.plan_name === 'free' ? 5 :
      store.plan_name === 'basic' ? 8 :
      store.plan_name === 'pro' ? 15 :
      store.plan_name === 'enterprise' ? 30 : 5;
    if (durationSeconds > maxDuration) {
      throw new Error(`Video duration (${durationSeconds}s) exceeds plan limit (${maxDuration}s)`);
    }

    const videoRecord = await this.createVideoRecord(request);

    try {
      const apiUrl = `${import.meta.env.VITE_Bolt_Database_URL}/functions/v1/generate-video`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_Bolt_Database_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: videoRecord.id,
          storeId: request.storeId,
          imageUrls: imageUrls,
          imageMode: request.imageMode || (imageUrls.length === 2 ? 'first-last-frame' : 'multiple-angles'),
          prompt: request.prompt || `Create an engaging e-commerce product video showcasing ${request.productTitle} for an online store`,
          durationSeconds: durationSeconds,
          aspectRatio: request.aspectRatio || '9:16',
          creditsRequired: creditsRequired,
          resolution: request.resolution || '720p',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'API request failed' }));
        await this.updateVideoStatus(videoRecord.id, 'failed', errorData.error || 'API request failed');
        throw new Error(errorData.error || 'Video generation failed');
      }

      return {
        videoId: videoRecord.id,
        status: 'processing',
        message: 'Video generation started',
      };
    } catch (error) {
      await this.updateVideoStatus(
        videoRecord.id,
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private static async createVideoRecord(
    request: VideoGenerationRequest
  ): Promise<GeneratedVideo> {
    const durationSeconds = request.durationSeconds || 5;

    // Determine primary image URL - use imageUrl if provided, otherwise first from imageUrls array (sanitize)
    const primaryImageUrl = (request.imageUrl || request.imageUrls?.[0])?.trim();
    if (!primaryImageUrl) {
      throw new Error('At least one image URL is required for video generation');
    }

    // Store all image URLs in metadata for multi-image generation (sanitize)
    const imageUrls = (request.imageUrls || (request.imageUrl ? [request.imageUrl] : [])).map(url => url.trim());
    const imageCount = imageUrls.length;
    const hasImages = imageCount > 0;

    // Determine which model will be used and calculate costs
    const veoModel = getVeoModel(hasImages);
    const apiCostUsd = calculateApiCost(durationSeconds, hasImages);
    const creditsUsed = calculateCreditsRequired(durationSeconds, imageCount);

    // Extract metadata from template inputs for easy querying
    const metadata: Record<string, any> = {
      template_name: request.templateInputs?.template_name,
      category: request.templateInputs?.category,
      aspect_ratio: request.aspectRatio,
      tone: request.templateInputs?.tone,
      background_style: request.templateInputs?.background_style,
      image_urls: imageUrls, // Store all image URLs for reference
      image_count: imageCount,
      model_selected: veoModel,
      has_reference_images: hasImages,
      ...request.templateInputs,
    };

    const { data, error } = await supabase
      .from('generated_videos')
      .insert({
        store_id: request.storeId,
        product_id: request.productId,
        product_title: request.productTitle,
        source_image_url: primaryImageUrl, // Use primary image URL (first image)
        prompt: request.prompt,
        duration_seconds: durationSeconds,
        generation_status: 'pending',
        generation_started_at: new Date().toISOString(),
        credits_used: creditsUsed,
        veo_model: veoModel,
        api_cost_usd: apiCostUsd,
        template_id: request.templateId,
        template_inputs: request.templateInputs,
        metadata,
        resolution: request.resolution || '720p',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create video record: ${error.message}`);
    }

    return data;
  }

  static async updateVideoStatus(
    videoId: string,
    status: GeneratedVideo['generation_status'],
    errorMessage?: string,
    videoUrl?: string
  ) {
    const updates: Partial<GeneratedVideo> = {
      generation_status: status,
      updated_at: new Date().toISOString(),
    };

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    if (videoUrl) {
      updates.video_url = videoUrl;
      updates.generation_completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('generated_videos')
      .update(updates)
      .eq('id', videoId);

    if (error) {
      throw new Error(`Failed to update video status: ${error.message}`);
    }
  }

  static async getVideosByStore(storeId: string): Promise<GeneratedVideo[]> {
    const { data, error } = await supabase
      .from('generated_videos')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch videos: ${error.message}`);
    }

    return data || [];
  }

  static async getVideoById(videoId: string): Promise<GeneratedVideo | null> {
    const { data, error } = await supabase
      .from('generated_videos')
      .select('*')
      .eq('id', videoId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch video: ${error.message}`);
    }

    return data;
  }

  static async deleteVideo(videoId: string) {
    // First, get the video record to check if we need to delete from storage
    const video = await this.getVideoById(videoId);

    if (!video) {
      throw new Error('Video not found');
    }

    // Delete from Supabase storage if video was downloaded
    if (video.video_downloaded) {
      const storagePath = `videos/${videoId}.mp4`;
      console.log('Attempting to delete video from storage:', storagePath);

      const { data: deleteData, error: storageError } = await supabase.storage
        .from('generated-videos')
        .remove([storagePath]);

      if (storageError) {
        console.error('Failed to delete video from storage:', storageError);
        throw new Error(`Failed to delete video from storage: ${storageError.message}`);
      }

      console.log('Successfully deleted video from storage:', deleteData);
    }

    // Delete from database
    const { error } = await supabase
      .from('generated_videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      throw new Error(`Failed to delete video from database: ${error.message}`);
    }

    console.log('Successfully deleted video:', videoId);
  }

  static async pollVideoStatus(videoId: string): Promise<void> {
    const apiUrl = `${import.meta.env.VITE_Bolt_Database_URL}/functions/v1/poll-video-status`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_Bolt_Database_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to poll video status' }));
      throw new Error(errorData.error || 'Failed to poll video status');
    }
  }
}
