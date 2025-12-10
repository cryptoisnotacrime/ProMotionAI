import { supabase } from '../../lib/supabase';
import { DetailedTemplate } from './json-templates.service';

export interface CustomTemplate {
  id: string;
  store_id: string;
  name: string;
  description: string;
  category: string;
  base_template_id: string | null;
  prompt_template: string;
  variables: any;
  settings: any;
  is_favorite: boolean;
  is_enabled: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export class CustomTemplatesService {
  static async getCustomTemplates(storeId: string): Promise<DetailedTemplate[]> {
    const { data, error } = await supabase
      .from('custom_templates')
      .select('*')
      .eq('store_id', storeId)
      .eq('is_enabled', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching custom templates:', error);
      return [];
    }

    return (data || []).map(template => this.convertToDetailedTemplate(template));
  }

  static convertToDetailedTemplate(customTemplate: CustomTemplate): DetailedTemplate {
    const settings = customTemplate.settings || {};

    return {
      template_name: customTemplate.name,
      description: customTemplate.description || customTemplate.prompt_template.substring(0, 200),
      visual_style: settings.visual_style || 'cinematic',
      camera: settings.camera_motion || 'dolly_in',
      main_subject: '{{product_name}}',
      background: settings.background_style || 'studio',
      lighting_mood: settings.lighting_mood || 'dramatic',
      color_palette: settings.color_palette || '{{color_palette}}',
      hook: 'Product appears prominently',
      finale: 'Product displayed clearly',
      keywords: settings.keywords || ['custom'],
      negative_prompt: settings.negative_prompt || 'watermarks, stock footage watermarks, brand logos, text overlays, subtitle boxes, caption text, UI elements, speech bubbles, animated text',
      meta: {
        platform: settings.platform || '9:16',
        duration: settings.duration?.toString() || '6',
        aspect_ratio: settings.aspect_ratio || '9:16',
        tier: settings.tier || 'Pro',
        category: customTemplate.category,
      },
    };
  }

  static async saveCustomTemplate(storeId: string, templateData: {
    name: string;
    description: string;
    category: string;
    base_template_id?: string;
    settings: any;
  }): Promise<CustomTemplate | null> {
    const { data, error } = await supabase
      .from('custom_templates')
      .insert({
        store_id: storeId,
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        base_template_id: templateData.base_template_id || null,
        prompt_template: JSON.stringify(templateData.settings),
        variables: [],
        settings: templateData.settings,
        is_favorite: false,
        is_enabled: true,
        usage_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving custom template:', error);
      return null;
    }

    return data;
  }

  static async deleteCustomTemplate(templateId: string): Promise<boolean> {
    const { error } = await supabase
      .from('custom_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting custom template:', error);
      return false;
    }

    return true;
  }

  static async incrementUsageCount(templateId: string): Promise<void> {
    await supabase.rpc('increment_custom_template_usage', { template_id: templateId });
  }
}
