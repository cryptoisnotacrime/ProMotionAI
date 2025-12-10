import { useState, useEffect } from 'react';
import { Sparkles, Info, Film, Heart, Users, ChevronDown, ChevronUp, Lock, Crown, Youtube, Instagram, Zap, Palette, Camera, Sun, Eye, Aperture, Star, Trash2 } from 'lucide-react';
import { TemplateInput, getDefaultInputsForProductType } from '../../services/ai-generator/template.service';
import { DetailedTemplate } from '../../services/ai-generator/json-templates.service';
import { ShopifyProduct } from '../../services/shopify/products.service';
import { Store } from '../../lib/supabase';
import { prefillFromStoreSettings } from '../../services/ai-generator/prefill.service';
import {
  CAMERA_MOVEMENTS,
  LENS_EFFECTS,
  LIGHTING_MOODS,
  BACKGROUNDS,
  TONES,
  VISUAL_STYLES
} from '../../constants/video-generation';
import { Tooltip } from '../common/Tooltip';
import { CustomTemplatesService } from '../../services/ai-generator/custom-templates.service';
import { TemplateMappingService } from '../../services/ai-generator/template-mapper.service';

interface TemplateFormProps {
  templates: DetailedTemplate[];
  selectedTemplate: DetailedTemplate | null;
  onTemplateSelect: (template: DetailedTemplate) => void;
  product: ShopifyProduct;
  productImageUrl: string;
  store: Store;
  onInputChange: (input: TemplateInput) => void;
  userTier: string;
}

const categoryIcons: Record<string, any> = {
  'Cinematic Reveal': Film,
  'Lifestyle Connection': Heart,
  'UGC': Users,
  'Custom': Star,
};

const categoryDescriptions: Record<string, string> = {
  'Cinematic Reveal': 'Premium, high-end product reveals with dramatic lighting and camera movements',
  'Lifestyle Connection': 'Natural, authentic scenes showing your product in everyday use',
  'UGC': 'User-generated content style videos that feel personal and relatable',
  'Custom': 'Your saved custom templates with personalized settings',
};

export function TemplateForm({
  templates,
  selectedTemplate,
  onTemplateSelect,
  product,
  productImageUrl,
  store,
  onInputChange,
  userTier,
}: TemplateFormProps) {
  const prefillData = prefillFromStoreSettings(store, product);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set([]));
  const [customTemplates, setCustomTemplates] = useState<DetailedTemplate[]>([]);

  // Get brand colors from Brand DNA
  const getBrandColors = (): string => {
    if (store.brand_colors && store.brand_colors.length > 0) {
      return store.brand_colors
        .slice(0, 3)
        .map((c: any) => c.name || c.hex)
        .filter(Boolean)
        .join(', ');
    }
    return '';
  };

  // Extract colors from product description (fallback only)
  const extractColors = () => {
    const description = product.body_html?.toLowerCase() || '';
    const colorKeywords = ['gold', 'silver', 'black', 'white', 'blue', 'red', 'green', 'purple', 'pink', 'yellow', 'orange', 'brown', 'grey', 'gray', 'navy', 'rose'];
    const foundColors: string[] = [];

    colorKeywords.forEach(color => {
      if (description.includes(color)) {
        foundColors.push(color.charAt(0).toUpperCase() + color.slice(1));
      }
    });

    return foundColors.slice(0, 2).join(' and ') || '';
  };

  // Generate custom notes from product description
  const generateCustomNotes = () => {
    const description = product.body_html?.replace(/<[^>]*>/g, '').trim() || '';
    if (!description) return '';

    const words = description.split(/\s+/);
    const excerpt = words.slice(0, 15).join(' ');
    return excerpt + (words.length > 15 ? '...' : '');
  };

  const [formData, setFormData] = useState<TemplateInput>({
    product_name: product.title,
    product_image_url: productImageUrl,
    product_type: '',
    brand_name: prefillData.brand_name || '',
    tone: 'luxury',
    background_style: 'studio',
    lighting_mood: 'dramatic',
    camera_motion: 'dolly_in',
    lens_effect: 'shallow_dof',
    visual_style: 'cinematic',
    color_palette: getBrandColors() || extractColors(),
    platform: '9:16',
    duration: 8,
    tier: userTier,
    final_call_to_action: prefillData.final_call_to_action || '',
    custom_notes: generateCustomNotes() || prefillData.custom_notes || '',
  });

  useEffect(() => {
    const updatedPrefillData = prefillFromStoreSettings(store, product);
    setFormData(prev => ({
      ...prev,
      product_name: product.title,
      product_image_url: productImageUrl,
      tier: userTier,
      brand_name: prev.brand_name || updatedPrefillData.brand_name || '',
      final_call_to_action: prev.final_call_to_action || updatedPrefillData.final_call_to_action || '',
      custom_notes: prev.custom_notes || generateCustomNotes() || updatedPrefillData.custom_notes || '',
      color_palette: prev.color_palette || getBrandColors() || extractColors(),
    }));
  }, [product.title, productImageUrl, userTier, store]);

  useEffect(() => {
    if (selectedTemplate) {
      const mappedValues = {
        visual_style: TemplateMappingService.mapVisualStyle(selectedTemplate.visual_style),
        camera_motion: TemplateMappingService.mapCameraMovement(selectedTemplate.camera),
        lighting_mood: TemplateMappingService.mapLighting(selectedTemplate.lighting_mood),
        background_style: TemplateMappingService.mapBackground(selectedTemplate.background),
        tone: TemplateMappingService.mapTone(selectedTemplate.hook || selectedTemplate.meta.category),
        lens_effect: TemplateMappingService.mapLensEffect(selectedTemplate.visual_style),
        color_palette: selectedTemplate.color_palette || getBrandColors() || extractColors(),
      };

      const categoryDefaults = TemplateMappingService.getCategoryDefaults(selectedTemplate.meta.category);

      setFormData(prev => ({
        ...prev,
        visual_style: mappedValues.visual_style || categoryDefaults.visualStyle,
        camera_motion: mappedValues.camera_motion || categoryDefaults.camera,
        lighting_mood: mappedValues.lighting_mood || categoryDefaults.lighting,
        background_style: mappedValues.background_style || categoryDefaults.background,
        tone: mappedValues.tone || categoryDefaults.tone,
        lens_effect: mappedValues.lens_effect || categoryDefaults.lensEffect,
        color_palette: prev.color_palette || mappedValues.color_palette,
      }));
    }
  }, [selectedTemplate]);

  useEffect(() => {
    onInputChange(formData);
  }, [formData, onInputChange]);

  useEffect(() => {
    const fetchCustomTemplates = async () => {
      const custom = await CustomTemplatesService.getCustomTemplates(store.id);
      setCustomTemplates(custom);
    };
    fetchCustomTemplates();
  }, [store.id]);

  const handleProductTypeChange = (type: string) => {
    // Only update product_type field, don't override other dropdown selections
    // Template selection should be the only thing that changes dropdown defaults
    setFormData(prev => ({
      ...prev,
      product_type: type,
    }));
  };

  const updateField = (field: keyof TemplateInput, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check if user can access template
  const canAccessTemplate = (template: DetailedTemplate): boolean => {
    const tierHierarchy: Record<string, number> = { 'free': 0, 'basic': 1, 'pro': 2 };
    const userLevel = tierHierarchy[userTier.toLowerCase()] || 0;
    const templateLevel = tierHierarchy[template.meta.tier.toLowerCase()] || 0;
    return userLevel >= templateLevel;
  };

  // Sort templates by tier (Pro first to entice upgrades)
  const allTemplatesSorted = [...templates].sort((a, b) => {
    const tierOrder: Record<string, number> = { 'pro': 0, 'basic': 1, 'free': 2 };
    return tierOrder[a.meta.tier.toLowerCase()] - tierOrder[b.meta.tier.toLowerCase()];
  });

  // Combine regular templates and custom templates
  const allTemplatesWithCustom = [...allTemplatesSorted, ...customTemplates];

  const groupedTemplates = allTemplatesWithCustom.reduce((acc, template) => {
    const category = template.meta.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, DetailedTemplate[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Clean description - remove template variables and show readable description
  const getCleanDescription = (template: DetailedTemplate): string => {
    let desc = template.description;

    // Remove all {{variable}} placeholders completely
    desc = desc.replace(/using\s+\{\{[^}]+\}\}/g, '');
    desc = desc.replace(/from\s+\{\{[^}]+\}\}/g, '');
    desc = desc.replace(/\{\{[^}]+\}\}/g, 'the product');

    // Clean up extra spaces and punctuation
    desc = desc.replace(/\s+/g, ' ').trim();
    desc = desc.replace(/\s+([,.])/g, '$1');

    return desc;
  };

  const productTypes = [
    'Fashion', 'Tech', 'Food', 'Jewelry', 'Cosmetics',
    'Home Decor', 'Fitness', 'Other'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-100 mb-2">Select Template</h3>
        <p className="text-sm text-gray-400 mb-4">Choose a style that best fits your product and brand</p>

        <div className="space-y-3">
          {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => {
            const Icon = categoryIcons[category] || Film;
            const isExpanded = expandedCategories.has(category);

            return (
              <div key={category} className="border border-gray-700 rounded-xl overflow-hidden bg-gray-800/50">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-750 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-purple-400" />
                    <div className="text-left">
                      <h4 className="font-semibold text-gray-100 text-sm">{category}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{categoryDescriptions[category]}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">{categoryTemplates.length} templates</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3 bg-gray-900/50 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {categoryTemplates.map((template, index) => {
                      const isLocked = !canAccessTemplate(template);
                      const isPro = template.meta.tier.toLowerCase() === 'pro';
                      const isBasic = template.meta.tier.toLowerCase() === 'basic';
                      const isCustom = template.meta.category === 'Custom';

                      return (
                        <button
                          key={`${template.template_name}-${index}`}
                          onClick={() => !isLocked && onTemplateSelect(template)}
                          disabled={isLocked}
                          className={`p-3 border-2 rounded-lg text-left transition-all relative ${
                            isLocked
                              ? 'border-gray-700 bg-gray-800/50 opacity-60 cursor-not-allowed'
                              : selectedTemplate?.template_name === template.template_name
                              ? isCustom
                                ? 'border-amber-500 bg-amber-900/30 shadow-lg shadow-amber-500/20'
                                : 'border-purple-500 bg-purple-900/30 shadow-lg shadow-purple-500/20'
                              : isCustom
                              ? 'border-amber-700/50 hover:border-amber-600 bg-gray-800 hover:shadow-sm'
                              : 'border-gray-700 hover:border-purple-600 bg-gray-800 hover:shadow-sm'
                          }`}
                        >
                          {isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 rounded-lg">
                              <div className="text-center px-4">
                                <Lock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-gray-300 mb-1">
                                  {isPro ? 'Pro Plan Required' : 'Basic Plan Required'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  Upgrade to unlock this premium template
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start justify-between mb-1.5">
                            <h5 className="font-semibold text-gray-100 text-sm pr-2 flex items-center gap-1.5">
                              {isCustom && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                              {template.template_name}
                            </h5>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ml-2 flex items-center gap-1 ${
                              isCustom ? 'bg-amber-900 text-amber-300' :
                              template.meta.tier.toLowerCase() === 'free' ? 'bg-gray-700 text-gray-300' :
                              template.meta.tier.toLowerCase() === 'basic' ? 'bg-blue-900 text-blue-300' :
                              'bg-gradient-to-r from-purple-900 to-pink-900 text-purple-300'
                            }`}>
                              {isCustom && <Star className="w-3 h-3" />}
                              {!isCustom && (isPro || isBasic) && <Crown className="w-3 h-3" />}
                              {isCustom ? 'CUSTOM' : template.meta.tier.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed mb-2">
                            {getCleanDescription(template)}
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {template.keywords.slice(0, 3).map((keyword, ki) => (
                              <span key={ki} className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedTemplate && (
        <div className="border-t border-gray-700 pt-6 space-y-4">
          <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-700/30 rounded-xl p-3 flex gap-2">
            <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-200">Customize the template below. Fields with <Sparkles className="w-3 h-3 inline text-purple-400" /> are auto-filled.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Product Type</label>
              <select
                value={formData.product_type}
                onChange={(e) => handleProductTypeChange(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100"
              >
                <option value="">Select...</option>
                {productTypes.map(type => (
                  <option key={type} value={type.toLowerCase().replace(' ', '_')}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
                Brand {prefillData.brand_name && <Sparkles className="w-3 h-3 text-purple-400" />}
              </label>
              <input
                type="text"
                value={formData.brand_name}
                onChange={(e) => updateField('brand_name', e.target.value)}
                placeholder={prefillData.brand_name || 'Brand name'}
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100 placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Visual Style
                <Tooltip content={VISUAL_STYLES.find(s => s.value === formData.visual_style)?.description || 'Overall aesthetic and presentation style'} />
              </label>
              <select
                value={formData.visual_style}
                onChange={(e) => updateField('visual_style', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100"
              >
                {VISUAL_STYLES.map(style => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Tone
                <Tooltip content={TONES.find(t => t.value === formData.tone)?.description || 'Emotional mood and feeling'} />
              </label>
              <select
                value={formData.tone}
                onChange={(e) => updateField('tone', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100"
              >
                {TONES.map(tone => (
                  <option key={tone.value} value={tone.value}>{tone.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
                Background
                <Tooltip content={BACKGROUNDS.find(b => b.value === formData.background_style)?.description || 'Setting and environment for your video'} />
              </label>
              <select
                value={formData.background_style}
                onChange={(e) => updateField('background_style', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100"
              >
                {BACKGROUNDS.map(bg => (
                  <option key={bg.value} value={bg.value}>{bg.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
                <Sun className="w-3 h-3" />
                Lighting
                <Tooltip content={LIGHTING_MOODS.find(l => l.value === formData.lighting_mood)?.description || 'Lighting setup and mood'} />
              </label>
              <select
                value={formData.lighting_mood}
                onChange={(e) => updateField('lighting_mood', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100"
              >
                {LIGHTING_MOODS.map(light => (
                  <option key={light.value} value={light.value}>{light.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
                <Camera className="w-3 h-3" />
                Camera Movement
                <Tooltip content={CAMERA_MOVEMENTS.find(c => c.value === formData.camera_motion)?.description || 'How the camera moves through the scene'} example={CAMERA_MOVEMENTS.find(c => c.value === formData.camera_motion)?.example} />
              </label>
              <select
                value={formData.camera_motion}
                onChange={(e) => updateField('camera_motion', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100"
              >
                {CAMERA_MOVEMENTS.map(move => (
                  <option key={move.value} value={move.value}>{move.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
                <Aperture className="w-3 h-3" />
                Lens Effect
                <Tooltip content={LENS_EFFECTS.find(l => l.value === formData.lens_effect)?.description || 'Optical effects and lens characteristics'} example={LENS_EFFECTS.find(l => l.value === formData.lens_effect)?.example} />
              </label>
              <select
                value={formData.lens_effect}
                onChange={(e) => updateField('lens_effect', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100"
              >
                {LENS_EFFECTS.map(lens => (
                  <option key={lens.value} value={lens.value}>{lens.label}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
                {formData.color_palette && <Sparkles className="w-3 h-3 text-purple-400" />}
                <Palette className="w-3 h-3" /> Colors
              </label>
              <input
                type="text"
                value={formData.color_palette}
                onChange={(e) => updateField('color_palette', e.target.value)}
                placeholder="e.g., Gold and Black"
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100 placeholder-gray-500"
              />
            </div>

            <div className="col-span-2 md:col-span-4">
              <label className="block text-xs font-medium text-gray-300 mb-2">Platform</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateField('platform', '9:16')}
                  className={`flex flex-col items-center justify-center gap-2 px-3 py-3 border-2 rounded-lg transition-all ${
                    formData.platform === '9:16'
                      ? 'border-purple-500 bg-purple-900/30 text-purple-200'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <Instagram className="w-6 h-6" />
                  <div>
                    <span className="text-sm font-semibold block">9:16 Vertical</span>
                    <span className="text-xs text-gray-400">Instagram, TikTok, Shorts</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('platform', '16:9')}
                  className={`flex flex-col items-center justify-center gap-2 px-3 py-3 border-2 rounded-lg transition-all ${
                    formData.platform === '16:9'
                      ? 'border-red-500 bg-red-900/30 text-red-200'
                      : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <Youtube className="w-6 h-6" />
                  <div>
                    <span className="text-sm font-semibold block">16:9 Horizontal</span>
                    <span className="text-xs text-gray-400">YouTube, Facebook, Web</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
              {prefillData.final_call_to_action && <Sparkles className="w-3 h-3 text-purple-400" />}
              Call to Action
            </label>
            <input
              type="text"
              value={formData.final_call_to_action}
              onChange={(e) => updateField('final_call_to_action', e.target.value)}
              placeholder={prefillData.final_call_to_action || 'e.g., Shop now @yourhandle'}
              className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
              {formData.custom_notes && formData.custom_notes === generateCustomNotes() && (
                <Sparkles className="w-3 h-3 text-purple-400" />
              )}
              Custom Notes
            </label>
            <textarea
              value={formData.custom_notes}
              onChange={(e) => updateField('custom_notes', e.target.value)}
              placeholder="e.g., Emphasize premium quality"
              rows={3}
              className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 resize-y bg-gray-800 text-gray-100 placeholder-gray-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
