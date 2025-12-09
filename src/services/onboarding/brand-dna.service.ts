import { supabase, Store } from '../../lib/supabase';

export interface BrandDNAInput {
  websiteUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  facebookUrl?: string;
}

export interface BrandDNA {
  brand_logo_url?: string;
  brand_colors: Array<{ name?: string; hex: string }>;
  brand_fonts: { primary?: string; secondary?: string };
  brand_images: string[];
  brand_tagline?: string;
  brand_values: string[];
  brand_aesthetic: string[];
  brand_tone_of_voice: string[];
  business_overview?: string;
}

export class BrandDNAService {
  /**
   * Generate Business DNA from provided URLs using AI-powered web scraping
   */
  static async generateBrandDNA(storeId: string, input: BrandDNAInput): Promise<BrandDNA> {
    const { data, error } = await supabase.functions.invoke('generate-brand-dna', {
      body: {
        storeId,
        websiteUrl: input.websiteUrl,
        instagramUrl: input.instagramUrl,
        tiktokUrl: input.tiktokUrl,
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Failed to generate brand DNA: ${error.message}`);
    }

    if (!data?.success || !data?.brandDNA) {
      throw new Error('Invalid response from brand DNA generation');
    }

    return data.brandDNA;
  }

  /**
   * Save Brand DNA to store
   */
  static async saveBrandDNA(storeId: string, brandDNA: Partial<BrandDNA>): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .update({
        ...brandDNA,
        onboarding_completed: true,
        brand_dna_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (error) {
      throw new Error(`Failed to save brand DNA: ${error.message}`);
    }
  }

  /**
   * Get Brand DNA for a store
   */
  static async getBrandDNA(storeId: string): Promise<BrandDNA | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('brand_logo_url, brand_colors, brand_fonts, brand_images, brand_tagline, brand_values, brand_aesthetic, brand_tone_of_voice, business_overview')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      brand_logo_url: data.brand_logo_url,
      brand_colors: data.brand_colors || [],
      brand_fonts: data.brand_fonts || {},
      brand_images: data.brand_images || [],
      brand_tagline: data.brand_tagline,
      brand_values: data.brand_values || [],
      brand_aesthetic: data.brand_aesthetic || [],
      brand_tone_of_voice: data.brand_tone_of_voice || [],
      business_overview: data.business_overview,
    };
  }

  /**
   * Check if store has completed onboarding
   */
  static async hasCompletedOnboarding(storeId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('stores')
      .select('onboarding_completed')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.onboarding_completed || false;
  }

  /**
   * Mark onboarding as skipped
   */
  static async skipOnboarding(storeId: string): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (error) {
      throw new Error(`Failed to skip onboarding: ${error.message}`);
    }
  }

  /**
   * Reset all Brand DNA data
   */
  static async resetBrandDNA(storeId: string): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .update({
        brand_logo_url: null,
        brand_colors: [],
        brand_fonts: {},
        brand_images: [],
        brand_tagline: null,
        brand_values: [],
        brand_aesthetic: [],
        brand_tone_of_voice: [],
        business_overview: null,
        onboarding_completed: false,
        brand_dna_updated_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', storeId);

    if (error) {
      throw new Error(`Failed to reset brand DNA: ${error.message}`);
    }
  }
}
