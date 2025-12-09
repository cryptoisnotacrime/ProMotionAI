import { useState, useEffect } from 'react';
import { Sparkles, Info, Film, Heart, Users, ChevronDown, ChevronUp, Lock, Crown, Youtube, Instagram, Zap, Palette, Camera, Sun } from 'lucide-react';
import { TemplateInput, getDefaultInputsForProductType } from '../../services/ai-generator/template.service';
import { DetailedTemplate } from '../../services/ai-generator/json-templates.service';
import { ShopifyProduct } from '../../services/shopify/products.service';
import { Store } from '../../lib/supabase';
import { prefillFromStoreSettings } from '../../services/ai-generator/prefill.service';

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
};

const categoryDescriptions: Record<string, string> = {
  'Cinematic Reveal': 'Premium, high-end product reveals with dramatic lighting and camera movements',
  'Lifestyle Connection': 'Natural, authentic scenes showing your product in everyday use',
  'UGC': 'User-generated content style videos that feel personal and relatable',
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

  // Extract colors from product description
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
    tone: 'cinematic',
    background_style: 'studio',
    lighting_mood: 'dramatic',
    camera_motion: 'slow dolly-in',
    color_palette: extractColors(),
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
      color_palette: prev.color_palette || extractColors(),
    }));
  }, [product.title, productImageUrl, userTier, store]);

  useEffect(() => {
    onInputChange(formData);
  }, [formData, onInputChange]);

  const handleProductTypeChange = (type: string) => {
    const defaults = getDefaultInputsForProductType(type);
    setFormData(prev => ({
      ...prev,
      product_type: type,
      ...defaults,
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

  const groupedTemplates = allTemplatesSorted.reduce((acc, template) => {
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

  const tones = ['Luxury', 'Bold', 'Minimal', 'Warm', 'Futuristic', 'Playful'];
  const backgrounds = ['Studio', 'Outdoor', 'Abstract', 'Lifestyle', 'Natural'];
  const lighting = ['Golden Hour', 'Neon Glow', 'Natural Light', 'Spotlight', 'Dramatic', 'Soft Diffused'];
  const cameraMoves = ['Static', 'Slow Dolly-In', 'Orbit', 'Track-In', 'Crane Shot', 'Dolly Zoom', 'Handheld'];

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

                      return (
                        <button
                          key={`${template.template_name}-${index}`}
                          onClick={() => !isLocked && onTemplateSelect(template)}
                          disabled={isLocked}
                          className={`p-3 border-2 rounded-lg text-left transition-all relative ${
                            isLocked
                              ? 'border-gray-700 bg-gray-800/50 opacity-60 cursor-not-allowed'
                              : selectedTemplate?.template_name === template.template_name
                              ? 'border-purple-500 bg-purple-900/30 shadow-lg shadow-purple-500/20'
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
                            <h5 className="font-semibold text-gray-100 text-sm pr-2">{template.template_name}</h5>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ml-2 flex items-center gap-1 ${
                              template.meta.tier.toLowerCase() === 'free' ? 'bg-gray-700 text-gray-300' :
                              template.meta.tier.toLowerCase() === 'basic' ? 'bg-blue-900 text-blue-300' :
                              'bg-gradient-to-r from-purple-900 to-pink-900 text-purple-300'
                            }`}>
                              {(isPro || isBasic) && <Crown className="w-3 h-3" />}
                              {template.meta.tier.toUpperCase()}
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
                <Zap className="w-3 h-3" /> Tone
              </label>
              <select
                value={formData.tone}
                onChange={(e) => updateField('tone', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100"
              >
                {tones.map(tone => (
                  <option key={tone} value={tone.toLowerCase()}>{tone}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Background</label>
              <select
                value={formData.background_style}
                onChange={(e) => updateField('background_style', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100"
              >
                {backgrounds.map(bg => (
                  <option key={bg} value={bg.toLowerCase()}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
                <Sun className="w-3 h-3" /> Lighting
              </label>
              <select
                value={formData.lighting_mood}
                onChange={(e) => updateField('lighting_mood', e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 bg-gray-800 text-gray-100"
              >
                {lighting.map(light => (
                  <option key={light} value={light.toLowerCase()}>{light}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1 flex items-center gap-1">
                <Camera className="w-3 h-3" /> Camera
              </label>
              <select
                value={formData.camera_motion}
                onChange={(e) => updateField('camera_motion', e.target.value)}
                disabled={userTier === 'free'}
                className="w-full px-2 py-1.5 text-sm border border-gray-700 rounded focus:ring-1 focus:ring-purple-500 disabled:bg-gray-900 bg-gray-800 text-gray-100"
              >
                {cameraMoves.map(move => (
                  <option key={move} value={move.toLowerCase()}>{move}</option>
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
                  <span className="text-sm font-semibold">9:16</span>
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
                  <span className="text-sm font-semibold">16:9</span>
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
