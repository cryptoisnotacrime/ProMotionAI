import { useState, useEffect } from 'react';
import { X, Wand2, Sparkles, Clock, Play, Save } from 'lucide-react';
import { ShopifyProduct } from '../../services/shopify/products.service';
import { VideoTemplate, TemplateInput, generateVeoPrompt } from '../../services/ai-generator/template.service';
import { DetailedTemplate, getTemplatesByTier, fillTemplateVariables } from '../../services/ai-generator/json-templates.service';
import { TemplateForm } from './TemplateForm';
import { Store } from '../../lib/supabase';
import { MultiImagePicker, ImageSlot } from './MultiImagePicker';
import { CustomTemplateModal } from '../settings/CustomTemplateModal';

interface GenerationModalProps {
  product: ShopifyProduct;
  imageUrl: string;
  creditsAvailable: number;
  maxDuration: number;
  planName: string;
  store: Store;
  onGenerate: (prompt: string, duration: number, aspectRatio: string, templateId?: string, templateInputs?: Record<string, any>, imageUrls?: string[]) => void;
  onClose: () => void;
  isGenerating?: boolean;
}

export function GenerationModal({
  product,
  imageUrl,
  creditsAvailable,
  maxDuration,
  planName,
  store,
  onGenerate,
  onClose,
  isGenerating,
}: GenerationModalProps) {
  const [templates, setTemplates] = useState<DetailedTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DetailedTemplate | null>(null);
  const [duration, setDuration] = useState(maxDuration >= 6 ? 6 : 4);
  const [selectedImages, setSelectedImages] = useState<ImageSlot[]>([
    { url: imageUrl, isProductImage: true, source: 'product' }
  ]);
  const [templateInputs, setTemplateInputs] = useState<TemplateInput>({
    product_name: product.title,
    product_image_url: imageUrl,
    duration: 8,
    platform: '9:16',
    tier: planName,
  });
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [showCustomTemplateModal, setShowCustomTemplateModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [planName]);

  const loadTemplates = async () => {
    try {
      setIsLoadingTemplates(true);
      const fetchedTemplates = getTemplatesByTier(planName);
      setTemplates(fetchedTemplates);
      if (fetchedTemplates.length > 0) {
        setSelectedTemplate(fetchedTemplates[0]);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const getImageCostSurcharge = (imageCount: number): number => {
    if (imageCount <= 1) return 0;
    if (imageCount === 2) return 1;
    return 1; // 3 images also costs +1
  };

  const imageCount = selectedImages.length;
  const imageSurcharge = getImageCostSurcharge(imageCount);
  const creditCost = duration + imageSurcharge;
  const hasEnoughCredits = creditsAvailable >= creditCost;

  useEffect(() => {
    setTemplateInputs(prev => ({ ...prev, duration }));
  }, [duration]);

  const handleGenerate = () => {
    if (!selectedTemplate || !hasEnoughCredits) {
      return;
    }

    const variables: Record<string, string> = {
      product_name: product.title,
      product_image_url: imageUrl,
      brand_name: templateInputs.brand_name || store.default_brand_name || '',
      platform: templateInputs.platform || '9:16',
      duration: `${duration}s`,
      aspect_ratio: templateInputs.platform || '9:16',
      background_style: templateInputs.background_style || 'studio',
      color_palette: store.brand_colors?.map((c: any) => c.hex).join(', ') || 'brand colors',
      camera_motion: templateInputs.camera_motion || 'dolly_in',
      lens_effect: templateInputs.lens_effect || '',
      visual_style: templateInputs.visual_style || 'cinematic',
      lighting_mood: templateInputs.lighting_mood || 'dramatic',
      tone: templateInputs.tone || 'luxury',
    };

    let promptText = fillTemplateVariables(selectedTemplate, variables);

    if (imageCount > 1) {
      promptText = promptText.replace(/\bthe image\b/gi, 'the provided images');
      promptText = promptText.replace(/\bthis image\b/gi, 'these images');
    }

    const aspectRatioMap: Record<string, string> = {
      '9:16': '9:16',
      '16:9': '16:9',
    };
    const aspectRatio = aspectRatioMap[templateInputs.platform || '9:16'] || '9:16';
    const imageUrls = selectedImages.map(img => img.url.trim());

    onGenerate(
      promptText,
      duration,
      aspectRatio,
      undefined,
      { ...templateInputs, template_name: selectedTemplate.template_name, category: selectedTemplate.meta.category, image_count: imageCount },
      imageUrls
    );
  };

  const durationOptions = [
    { value: 4, label: '4s', disabled: false },
    { value: 6, label: '6s', disabled: maxDuration < 6 },
    { value: 8, label: '8s', disabled: maxDuration < 8 },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-purple-500/20">
        <div className="sticky top-0 bg-gradient-to-r from-gray-900 to-purple-900/30 border-b border-purple-500/20 px-6 py-4 flex items-center justify-between backdrop-blur-sm z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Wand2 className="w-6 h-6 text-purple-400" />
              Generate Video
            </h2>
            <p className="text-sm text-gray-400 mt-1">{product.title}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-260px)] pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <MultiImagePicker
                productImages={product.images}
                productTitle={product.title}
                onImagesChange={setSelectedImages}
                maxImages={3}
                storeId={store.id}
              />
            </div>

            <div className="lg:col-span-2 space-y-6">
              {selectedTemplate && (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-200">
                      Using: <span className="font-semibold">{selectedTemplate.template_name}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCustomTemplateModal(true)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save as Custom
                  </button>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <label className="text-sm font-semibold text-gray-100">Video Duration</label>
                </div>
                <div className="flex gap-2">
                  {durationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => !option.disabled && setDuration(option.value)}
                      disabled={option.disabled}
                      className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all relative ${
                        duration === option.value
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                          : option.disabled
                          ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                      }`}
                    >
                      {option.value === 8 && (
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
                          PRO
                        </span>
                      )}
                      <div>{option.label}</div>
                      <div className="text-xs mt-0.5 opacity-80">{option.value} credits</div>
                    </button>
                  ))}
                </div>
                {maxDuration < 8 && (
                  <p className="text-xs text-gray-400 mt-2">
                    {planName.toUpperCase()} plan • Max {maxDuration}s
                  </p>
                )}
              </div>

              {isLoadingTemplates ? (
                <div className="bg-gray-800/50 rounded-lg p-8 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <TemplateForm
                  templates={templates}
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={setSelectedTemplate}
                  product={product}
                  productImageUrl={imageUrl}
                  store={store}
                  onInputChange={setTemplateInputs}
                  userTier={planName}
                />
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gradient-to-r from-gray-900 to-purple-900/30 border-t border-purple-500/20 px-6 py-5 backdrop-blur-sm z-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Template</p>
              <p className="text-sm font-semibold text-white truncate" title={selectedTemplate?.template_name || 'None'}>
                {selectedTemplate?.template_name || 'None'}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Duration</p>
              <p className="text-sm font-semibold text-white">{duration}s</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Images</p>
              <p className="text-sm font-semibold text-white">{imageCount} ref{imageCount !== 1 ? 's' : ''}</p>
            </div>
            <div className={`rounded-lg p-3 border ${
              hasEnoughCredits
                ? 'bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-500/30'
                : 'bg-red-900/30 border-red-500/30'
            }`}>
              <p className="text-xs text-gray-400 mb-1.5 font-medium">Total Cost</p>
              <div className="flex items-baseline gap-1.5">
                <p className={`text-lg font-bold ${hasEnoughCredits ? 'text-purple-300' : 'text-red-300'}`}>
                  {creditCost}
                </p>
                {imageSurcharge > 0 && (
                  <p className="text-xs text-gray-400 whitespace-nowrap">
                    ({duration} + {imageSurcharge})
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="flex-1 bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Available Credits</span>
                <span className={`text-lg font-bold ${hasEnoughCredits ? 'text-green-400' : 'text-red-400'}`}>
                  {creditsAvailable}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">After generation</span>
                <span className="text-sm font-semibold text-gray-300">
                  {Math.max(0, creditsAvailable - creditCost)} credits
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!selectedTemplate || !hasEnoughCredits || isGenerating}
              className="sm:min-w-[200px] px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Generate Video
                </>
              )}
            </button>
          </div>

          {!hasEnoughCredits && (
            <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-300 text-center">
              Insufficient credits. You need {creditCost - creditsAvailable} more credit{creditCost - creditsAvailable !== 1 ? 's' : ''} to generate this video.
            </div>
          )}
        </div>
      </div>

      {showCustomTemplateModal && selectedTemplate && (
        <CustomTemplateModal
          baseTemplate={selectedTemplate}
          storeId={store.id}
          onClose={() => setShowCustomTemplateModal(false)}
          onSave={() => {
            setShowCustomTemplateModal(false);
            alert('Custom template saved! You can now use it from the template selector.');
          }}
        />
      )}
    </div>
  );
}
