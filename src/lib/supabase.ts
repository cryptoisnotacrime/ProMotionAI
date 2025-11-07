import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { setShopifyHeaders } from '../utils/shopify-session';

function decodeBase64EnvVar(envVar: string | undefined): string | undefined {
  if (!envVar) return undefined;
  try {
    if (envVar.startsWith('base64:')) {
      return atob(envVar.substring(7));
    }
    return envVar;
  } catch {
    return envVar;
  }
}

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = decodeBase64EnvVar(import.meta.env.VITE_Bolt_Database_URL);
  const supabaseAnonKey = decodeBase64EnvVar(import.meta.env.VITE_Bolt_Database_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables:', {
      url: supabaseUrl ? 'present' : 'missing',
      key: supabaseAnonKey ? 'present' : 'missing'
    });
    throw new Error('Missing Supabase environment variables. Please configure VITE_Bolt_Database_URL and VITE_Bolt_Database_ANON_KEY');
  }

  const headers = setShopifyHeaders();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers
    }
  });
}

export const supabase = getSupabaseClient();

export function getAuthenticatedClient(): SupabaseClient {
  return getSupabaseClient();
}

export type Store = {
  id: string;
  shop_domain: string;
  access_token?: string;
  shopify_store_id?: string;
  store_name?: string;
  email?: string;
  contact_email?: string;
  plan_name: string;
  credits_remaining: number;
  credits_total: number;
  billing_cycle_start: string;
  billing_cycle_end: string;
  subscription_status: string;
  installed_at: string;
  updated_at: string;
  created_at: string;
  default_brand_name?: string;
  default_call_to_action?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  brand_description?: string;
  brand_logo_url?: string;
  brand_colors?: Array<{ name?: string; hex: string }>;
  brand_fonts?: { primary?: string; secondary?: string };
  brand_images?: string[];
  brand_tagline?: string;
  brand_values?: string[];
  brand_aesthetic?: string[];
  brand_tone_of_voice?: string[];
  business_overview?: string;
  onboarding_completed?: boolean;
  brand_dna_updated_at?: string;
};

export type GeneratedVideo = {
  id: string;
  store_id: string;
  product_id: string;
  product_title?: string;
  source_image_url: string;
  video_url?: string;
  thumbnail_url?: string;
  prompt?: string;
  duration_seconds: number;
  generation_status: 'pending' | 'processing' | 'completed' | 'failed';
  generation_started_at?: string;
  generation_completed_at?: string;
  credits_used: number;
  error_message?: string;
  veo_job_id?: string;
  veo_model?: string;
  api_cost_usd?: number;
  video_downloaded?: boolean;
  expires_at?: string;
  attached_to_product?: boolean;
  shopify_media_id?: string;
  template_id?: string;
  template_inputs?: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type CreditTransaction = {
  id: string;
  store_id: string;
  video_id?: string;
  transaction_type: 'purchase' | 'usage' | 'refund' | 'grant';
  credits_amount: number;
  credits_before: number;
  credits_after: number;
  description?: string;
  metadata: Record<string, any>;
  created_at: string;
};

export type SubscriptionPlan = {
  id: string;
  plan_name: string;
  display_name: string;
  monthly_price: number | string;
  annual_price: number | string;
  credits_per_cycle: number;
  max_video_duration: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
