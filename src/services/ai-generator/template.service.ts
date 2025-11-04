import { supabase } from '../../lib/supabase';

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'free' | 'basic' | 'pro';
  template_json: Record<string, any>;
  preview_image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateInput {
  product_name: string;
  product_image_url: string;
  product_type?: string;
  brand_name?: string;
  tone?: string;
  background_style?: string;
  lighting_mood?: string;
  camera_motion?: string;
  color_palette?: string;
  platform?: string;
  duration?: number;
  tier?: string;
  keywords?: string[];
  final_call_to_action?: string;
  custom_notes?: string;
}

export async function fetchTemplates(userTier: string = 'free'): Promise<VideoTemplate[]> {
  const { data, error } = await supabase
    .from('video_templates')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching templates:', error);
    throw new Error('Failed to fetch templates');
  }

  const tierHierarchy = { free: 0, basic: 1, pro: 2 };
  const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy] || 0;

  return data.filter(template => {
    const templateLevel = tierHierarchy[template.tier as keyof typeof tierHierarchy] || 0;
    return templateLevel <= userTierLevel;
  });
}

export async function fetchTemplateById(templateId: string): Promise<VideoTemplate | null> {
  const { data, error } = await supabase
    .from('video_templates')
    .select('*')
    .eq('id', templateId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching template:', error);
    throw new Error('Failed to fetch template');
  }

  return data;
}

export function generateVeoPrompt(template: VideoTemplate, userInput: TemplateInput): Record<string, any> {
  let promptString = JSON.stringify(template.template_json);

  Object.entries(userInput).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      const regex = new RegExp(`{{${key}}}`, 'g');
      const stringValue = Array.isArray(value) ? value.join(', ') : String(value);
      promptString = promptString.replace(regex, stringValue);
    }
  });

  const result = JSON.parse(promptString);

  if (userInput.product_image_url) {
    result.source_image_url = userInput.product_image_url;
  }

  return result;
}

export function getDefaultInputsForProductType(productType: string): Partial<TemplateInput> {
  const defaults: Record<string, Partial<TemplateInput>> = {
    fashion: {
      tone: 'luxury',
      background_style: 'studio',
      lighting_mood: 'golden hour',
      color_palette: 'elegant neutrals',
    },
    tech: {
      tone: 'futuristic',
      background_style: 'abstract',
      lighting_mood: 'neon glow',
      color_palette: 'blue and silver',
    },
    food: {
      tone: 'warm',
      background_style: 'natural',
      lighting_mood: 'natural light',
      color_palette: 'vibrant',
    },
    jewelry: {
      tone: 'luxury',
      background_style: 'studio',
      lighting_mood: 'spotlight',
      color_palette: 'gold and black',
    },
    cosmetics: {
      tone: 'bold',
      background_style: 'lifestyle',
      lighting_mood: 'soft diffused',
      color_palette: 'pastels',
    },
    home_decor: {
      tone: 'minimal',
      background_style: 'lifestyle',
      lighting_mood: 'natural light',
      color_palette: 'earth tones',
    },
    fitness: {
      tone: 'energetic',
      background_style: 'outdoor',
      lighting_mood: 'bright',
      color_palette: 'bold colors',
    },
  };

  return defaults[productType.toLowerCase()] || {
    tone: 'cinematic',
    background_style: 'studio',
    lighting_mood: 'dramatic',
  };
}
