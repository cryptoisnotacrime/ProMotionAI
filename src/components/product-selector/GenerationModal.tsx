import { useState, useEffect } from 'react';
import { X, Wand2, AlertCircle, Sparkles, Clock } from 'lucide-react';
import { ShopifyProduct } from '../../services/shopify/products.service';
import { VideoTemplate, TemplateInput, generateVeoPrompt } from '../../services/ai-generator/template.service';
import { DetailedTemplate, getTemplatesByTier, fillTemplateVariables } from '../../services/ai-generator/json-templates.service';
import { TemplateForm } from './TemplateForm';
import { Store } from '../../lib/supabase';

interface GenerationModalProps {
  product: ShopifyProduct;
  imageUrl: string;
  creditsAvailable: number;
  maxDuration: number;
  planName: string;
  store: Store;
  onGenerate: (prompt: string, duration: number, aspectRatio: string, templateId?: string, templateInputs?: Record<string, any>) => void;
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
  const [templateInputs, setTemplateInputs] = useState<TemplateInput>({
    product_name: product.title,
    product_image_url: imageUrl,
    duration: 8,
    platform: '9:16',
    tier: planName,
  });
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

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

  const creditCost = duration;

  useEffect(() => {
    setTemplateInputs(prev => ({ ...prev, duration }));
  }, [duration]);

  const handleGenerate = () => {
    if (!selectedTemplate || creditsAvailable < creditCost) {
      return;
    }

    // Build variables map from template inputs and store data
    const variables: Record<string, string> = {
      product_name: product.title,
      product_image_url: imageUrl,
      brand_name: templateInputs.brand_name || store.default_brand_name || '',
      platform: templateInputs.platform || '9:16',
      duration: `${duration}s`,
      aspect_ratio: templateInputs.platform || '9:16',
      background_style: templateInputs.background_style || 'studio',
      color_palette: store.brand_colors?.map((c: any) => c.hex).join(', ') || 'brand colors',
    };

    // Fill template variables to create comprehensive prompt
    const promptText = fillTemplateVariables(selectedTemplate, variables);

    // Convert platform format to aspect ratio for Veo API
    const aspectRatioMap: Record<string, string> = {
      '9:16': '9:16',
      '16:9': '16:9',
    };
    const aspectRatio = aspectRatioMap[templateInputs.platform || '9:16'] || '9:16';

    onGenerate(
      promptText,
      duration,
      aspectRatio,
      selectedTemplate.template_name,
      { ...templateInputs, template_name: selectedTemplate.template_name, category: selectedTemplate.meta.category }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Generate Video</h2>
            <p className="text-xs text-gray-600 mt-0.5 truncate max-w-xl">{product.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-1">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Product Image</h3>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-5">

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-gray-700" />
                  <label className="block text-sm font-medium text-gray-900">
                    Video Duration
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[4, 6, 8].map((seconds) => {
                    const isDisabled = seconds > maxDuration;
                    const isSelected = duration === seconds;
                    const getTierBadge = () => {
                      if (seconds === 4) return null;
                      if (seconds === 6) return planName.toLowerCase() === 'free' ? 'Basic' : null;
                      if (seconds === 8) return planName.toLowerCase() !== 'pro' ? 'Pro' : null;
                      return null;
                    };
                    const badge = getTierBadge();

                    return (
                      <button
                        key={seconds}
                        type="button"
                        onClick={() => setDuration(seconds)}
                        disabled={isDisabled}
                        className={`relative px-4 py-3 rounded-lg font-semibold transition-all border-2 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                            : isDisabled
                            ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <div className="text-xl font-bold">{seconds}s</div>
                        <div className="text-xs mt-0.5 opacity-90">{seconds} credits</div>
                        {badge && (
                          <div className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold">
                            {badge}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <span className="font-medium">{planName.toUpperCase()}</span> plan • Max {maxDuration}s
                </p>
              </div>

            </div>
          </div>

          {isLoadingTemplates ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-0.5">No Templates Available</p>
                  <p className="text-xs text-yellow-700">
                    Please contact support to add video templates to your account.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
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

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-900">Generation Summary</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-xs text-gray-600 mb-0.5">Template</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {selectedTemplate?.name || 'None'}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-xs text-gray-600 mb-0.5">Duration</p>
                    <p className="text-sm font-semibold text-gray-900">{creditCost}s</p>
                  </div>
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-xs text-gray-600 mb-0.5">Credit Cost</p>
                    <p className="text-lg font-bold text-blue-600">{creditCost}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2.5">
                    <p className="text-xs text-gray-600 mb-0.5">Available</p>
                    <p className={`text-lg font-bold ${creditsAvailable >= creditCost ? 'text-green-600' : 'text-red-600'}`}>
                      {creditsAvailable}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">After generation:</span>
                    <span className="font-bold text-gray-900">
                      {Math.max(0, creditsAvailable - creditCost)} credits remaining
                    </span>
                  </div>
                </div>
              </div>

              {creditsAvailable < creditCost && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900 mb-0.5">Insufficient Credits</p>
                      <p className="text-xs text-red-700">
                        You need {creditCost - creditsAvailable} more credits. Upgrade your plan or reduce duration.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || creditsAvailable < creditCost || !selectedTemplate}
                  className="flex-1 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate Video ({creditCost} credits)
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
