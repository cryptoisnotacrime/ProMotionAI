import { useState, useEffect } from 'react';
import { Sparkles, Info } from 'lucide-react';
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

  const [formData, setFormData] = useState<TemplateInput>({
    product_name: product.title,
    product_image_url: productImageUrl,
    product_type: '',
    brand_name: prefillData.brand_name || '',
    tone: 'cinematic',
    background_style: 'studio',
    lighting_mood: 'dramatic',
    camera_motion: 'slow dolly-in',
    color_palette: '',
    platform: '9:16',
    duration: 8,
    tier: userTier,
    final_call_to_action: prefillData.final_call_to_action || '',
    custom_notes: prefillData.custom_notes || '',
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
      custom_notes: prev.custom_notes || updatedPrefillData.custom_notes || '',
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
        <h3 className="text-base font-semibold text-gray-900 mb-4">Select Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((template, index) => (
            <button
              key={`${template.template_name}-${index}`}
              onClick={() => onTemplateSelect(template)}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                selectedTemplate?.template_name === template.template_name
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">{template.template_name}</h4>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  template.meta.tier.toLowerCase() === 'free' ? 'bg-gray-100 text-gray-700' :
                  template.meta.tier.toLowerCase() === 'basic' ? 'bg-blue-100 text-blue-700' :
                  'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                }`}>
                  {template.meta.tier.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                {template.description.substring(0, template.description.indexOf('{{') > 0 ? template.description.indexOf('{{') : 100)}...
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">Category: {template.meta.category}</p>
                <div className="flex gap-1">
                  {template.keywords.slice(0, 3).map((keyword, ki) => (
                    <span key={ki} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTemplate && (
        <div className="border-t pt-6 space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Fill in the details below</p>
              <p className="text-blue-700">Your inputs will be merged into the template to create a cinematic prompt.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Type *
              </label>
              <select
                value={formData.product_type}
                onChange={(e) => handleProductTypeChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select type...</option>
                {productTypes.map(type => (
                  <option key={type} value={type.toLowerCase().replace(' ', '_')}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Name (optional)
              </label>
              <input
                type="text"
                value={formData.brand_name}
                onChange={(e) => updateField('brand_name', e.target.value)}
                placeholder={prefillData.brand_name || 'Your brand name'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {prefillData.brand_name && (
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Auto-filled from store settings
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tone *
              </label>
              <select
                value={formData.tone}
                onChange={(e) => updateField('tone', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {tones.map(tone => (
                  <option key={tone} value={tone.toLowerCase()}>
                    {tone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Style *
              </label>
              <select
                value={formData.background_style}
                onChange={(e) => updateField('background_style', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {backgrounds.map(bg => (
                  <option key={bg} value={bg.toLowerCase()}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lighting Mood *
              </label>
              <select
                value={formData.lighting_mood}
                onChange={(e) => updateField('lighting_mood', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {lighting.map(light => (
                  <option key={light} value={light.toLowerCase()}>
                    {light}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Camera Motion {userTier === 'free' ? '(Pro only)' : '*'}
              </label>
              <select
                value={formData.camera_motion}
                onChange={(e) => updateField('camera_motion', e.target.value)}
                disabled={userTier === 'free'}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
              >
                {cameraMoves.map(move => (
                  <option key={move} value={move.toLowerCase()}>
                    {move}
                  </option>
                ))}
              </select>
              {userTier === 'free' && (
                <p className="text-xs text-blue-600 mt-1">
                  Upgrade to Pro for advanced camera movements
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color Palette (optional)
              </label>
              <input
                type="text"
                value={formData.color_palette}
                onChange={(e) => updateField('color_palette', e.target.value)}
                placeholder="e.g., Gold and Black"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform Format * <span className="text-gray-500 font-normal">(Video aspect ratio)</span>
              </label>
              <select
                value={formData.platform}
                onChange={(e) => updateField('platform', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="9:16">TikTok/Reels (9:16 vertical)</option>
                <option value="16:9">YouTube (16:9 landscape)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the platform where you'll use this video
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Call to Action (optional)
            </label>
            <input
              type="text"
              value={formData.final_call_to_action}
              onChange={(e) => updateField('final_call_to_action', e.target.value)}
              placeholder={prefillData.final_call_to_action || 'e.g., Shop now at yourstore.com'}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {prefillData.final_call_to_action && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {store.instagram_handle || store.tiktok_handle ? 'Based on your social media' : 'Auto-generated from store URL'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Notes (optional)
            </label>
            <textarea
              value={formData.custom_notes}
              onChange={(e) => updateField('custom_notes', e.target.value)}
              placeholder={prefillData.custom_notes || 'e.g., Include subtle sparkle particles around the product'}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            {prefillData.custom_notes && formData.custom_notes && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI-suggested based on product and brand
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
