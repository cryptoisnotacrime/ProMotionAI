import { Sparkles, Eye, Zap, Sun, Camera, Aperture, Palette, Instagram, Youtube } from 'lucide-react';
import { TemplateInput } from '../../services/ai-generator/template.service';
import { ShopifyProduct } from '../../services/shopify/products.service';
import { Store } from '../../lib/supabase';
import {
  CAMERA_MOVEMENTS,
  LENS_EFFECTS,
  LIGHTING_MOODS,
  BACKGROUNDS,
  TONES,
  VISUAL_STYLES
} from '../../constants/video-generation';
import { Tooltip } from '../common/Tooltip';

interface TemplateSettingsProps {
  product: ShopifyProduct;
  productImageUrl: string;
  store: Store;
  templateInputs: TemplateInput;
  onInputChange: (input: TemplateInput) => void;
}

export function TemplateSettings({
  product,
  productImageUrl,
  store,
  templateInputs,
  onInputChange,
}: TemplateSettingsProps) {
  const updateField = (field: keyof TemplateInput, value: any) => {
    onInputChange({ ...templateInputs, [field]: value });
  };

  const productTypes = [
    'Fashion', 'Tech', 'Food', 'Jewelry', 'Cosmetics',
    'Home Decor', 'Fitness', 'Other'
  ];

  return (
    <div className="space-y-3">
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-2.5 flex gap-2">
        <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200">Fine-tune your video settings below. Changes update instantly.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">Product Type</label>
          <select
            value={templateInputs.product_type}
            onChange={(e) => updateField('product_type', e.target.value)}
            className="min-h-[44px] w-full px-3 py-2 text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100"
          >
            <option value="">Select...</option>
            {productTypes.map(type => (
              <option key={type} value={type.toLowerCase().replace(' ', '_')}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
            Brand {store.default_brand_name && <Sparkles className="w-3 h-3 text-blue-400" />}
          </label>
          <input
            type="text"
            value={templateInputs.brand_name}
            onChange={(e) => updateField('brand_name', e.target.value)}
            placeholder={store.default_brand_name || 'Brand name'}
            className="min-h-[44px] w-full px-3 py-2 text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            Visual Style
            <Tooltip content={VISUAL_STYLES.find(s => s.value === templateInputs.visual_style)?.description || 'Overall aesthetic'} />
          </label>
          <select
            value={templateInputs.visual_style}
            onChange={(e) => updateField('visual_style', e.target.value)}
            className="min-h-[44px] w-full px-3 py-2 text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100"
          >
            {VISUAL_STYLES.map(style => (
              <option key={style.value} value={style.value}>{style.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            Tone
            <Tooltip content={TONES.find(t => t.value === templateInputs.tone)?.description || 'Emotional mood'} />
          </label>
          <select
            value={templateInputs.tone}
            onChange={(e) => updateField('tone', e.target.value)}
            className="min-h-[44px] w-full px-3 py-2 text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100"
          >
            {TONES.map(tone => (
              <option key={tone.value} value={tone.value}>{tone.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
            Background
            <Tooltip content={BACKGROUNDS.find(b => b.value === templateInputs.background_style)?.description || 'Setting'} />
          </label>
          <select
            value={templateInputs.background_style}
            onChange={(e) => updateField('background_style', e.target.value)}
            className="min-h-[44px] w-full px-3 py-2 text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100"
          >
            {BACKGROUNDS.map(bg => (
              <option key={bg.value} value={bg.value}>{bg.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
            <Sun className="w-3.5 h-3.5" />
            Lighting
            <Tooltip content={LIGHTING_MOODS.find(l => l.value === templateInputs.lighting_mood)?.description || 'Lighting setup'} />
          </label>
          <select
            value={templateInputs.lighting_mood}
            onChange={(e) => updateField('lighting_mood', e.target.value)}
            className="min-h-[44px] w-full px-3 py-2 text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100"
          >
            {LIGHTING_MOODS.map(light => (
              <option key={light.value} value={light.value}>{light.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" />
            Camera Movement
            <Tooltip content={CAMERA_MOVEMENTS.find(c => c.value === templateInputs.camera_motion)?.description || 'Camera motion'} />
          </label>
          <select
            value={templateInputs.camera_motion}
            onChange={(e) => updateField('camera_motion', e.target.value)}
            className="min-h-[44px] w-full px-3 py-2 text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100"
          >
            {CAMERA_MOVEMENTS.map(move => (
              <option key={move.value} value={move.value}>{move.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
            <Aperture className="w-3.5 h-3.5" />
            Lens Effect
            <Tooltip content={LENS_EFFECTS.find(l => l.value === templateInputs.lens_effect)?.description || 'Optical effects'} />
          </label>
          <select
            value={templateInputs.lens_effect}
            onChange={(e) => updateField('lens_effect', e.target.value)}
            className="min-h-[44px] w-full px-3 py-2 text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100"
          >
            {LENS_EFFECTS.map(lens => (
              <option key={lens.value} value={lens.value}>{lens.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
          {templateInputs.color_palette && <Sparkles className="w-3 h-3 text-blue-400" />}
          <Palette className="w-3.5 h-3.5" /> Colors
        </label>
        <input
          type="text"
          value={templateInputs.color_palette}
          onChange={(e) => updateField('color_palette', e.target.value)}
          placeholder="e.g., Gold, Navy Blue, Crimson"
          className="min-h-[44px] w-full px-3 py-2 text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1.5">Platform</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => updateField('platform', '9:16')}
            className={`min-h-[56px] flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 border-2 rounded-lg transition-all ${
              templateInputs.platform === '9:16'
                ? 'border-blue-500 bg-blue-900/30 text-blue-200'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
            }`}
          >
            <Instagram className="w-5 h-5" />
            <div className="text-center">
              <span className="text-xs font-semibold block">9:16 Vertical</span>
              <span className="text-[10px] text-gray-400">IG, TikTok</span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => updateField('platform', '16:9')}
            className={`min-h-[56px] flex flex-col items-center justify-center gap-1.5 px-3 py-2.5 border-2 rounded-lg transition-all ${
              templateInputs.platform === '16:9'
                ? 'border-red-500 bg-red-900/30 text-red-200'
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
            }`}
          >
            <Youtube className="w-5 h-5" />
            <div className="text-center">
              <span className="text-xs font-semibold block">16:9 Horizontal</span>
              <span className="text-[10px] text-gray-400">YouTube, Web</span>
            </div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1">
          Call to Action
        </label>
        <input
          type="text"
          value={templateInputs.final_call_to_action}
          onChange={(e) => updateField('final_call_to_action', e.target.value)}
          placeholder="e.g., Shop now @yourhandle"
          className="min-h-[44px] w-full px-3 py-2 text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-gray-100 placeholder-gray-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-300 mb-1.5">
          Custom Notes
        </label>
        <textarea
          value={templateInputs.custom_notes}
          onChange={(e) => updateField('custom_notes', e.target.value)}
          placeholder="e.g., Emphasize premium quality"
          rows={3}
          className="min-h-[66px] w-full px-3 py-2 text-sm border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y bg-gray-800 text-gray-100 placeholder-gray-500"
        />
      </div>
    </div>
  );
}
