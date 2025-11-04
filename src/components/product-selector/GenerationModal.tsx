import { useState, useEffect } from 'react';
import { X, Wand2, AlertCircle, Sparkles, Clock } from 'lucide-react';
import { ShopifyProduct } from '../../services/shopify/products.service';
import { VideoTemplate, TemplateInput, fetchTemplates, generateVeoPrompt } from '../../services/ai-generator/template.service';
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
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
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
      const fetchedTemplates = await fetchTemplates(planName);
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

    const generatedPrompt = generateVeoPrompt(selectedTemplate, templateInputs);
    const promptText = generatedPrompt.description || JSON.stringify(generatedPrompt);

    // Convert platform format to aspect ratio for Veo API
    const aspectRatioMap: Record<string, string> = {
      '9:16': '9:16',
      '16:9': '16:9',
      '1:1': '1:1',
    };
    const aspectRatio = aspectRatioMap[templateInputs.platform || '9:16'] || '9:16';

    onGenerate(
      promptText,
      duration,
      aspectRatio,
      selectedTemplate.id,
      { ...templateInputs, generated_prompt: generatedPrompt }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Generate Video</h2>
            <p className="text-sm text-gray-600 mt-1">{product.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Product Image</h3>
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden max-w-md">
              <img
                src={imageUrl}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-gray-700" />
              <label className="block text-base font-semibold text-gray-900">
                Video Duration
              </label>
            </div>
            <div className="grid grid-cols-3 gap-3">
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
                    className={`relative px-6 py-4 rounded-xl font-semibold transition-all border-2 ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                        : isDisabled
                        ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="text-2xl font-bold">{seconds}s</div>
                    <div className="text-xs mt-1 opacity-90">{seconds} credits</div>
                    {badge && (
                      <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-full font-semibold">
                        {badge}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Your plan: <span className="font-medium">{planName}</span> • Max duration: {maxDuration}s
            </p>
          </div>

          {isLoadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : templates.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 mb-1">No Templates Available</p>
                  <p className="text-sm text-yellow-700">
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

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Generation Summary</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Template:</span>
                    <span className="font-medium text-gray-900">
                      {selectedTemplate?.name || 'None selected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium text-gray-900">{creditCost}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Credit Cost:</span>
                    <span className="text-2xl font-bold text-blue-600">{creditCost}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                    <span className="text-gray-600">Available Credits:</span>
                    <span className={creditsAvailable >= creditCost ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {creditsAvailable}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">After generation:</span>
                    <span className="font-medium text-gray-900">
                      {Math.max(0, creditsAvailable - creditCost)} credits
                    </span>
                  </div>
                </div>
              </div>

              {creditsAvailable < creditCost && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900 mb-1">Insufficient Credits</p>
                      <p className="text-sm text-red-700">
                        You need {creditCost - creditsAvailable} more credits to generate this video.
                        Please upgrade your plan or reduce the video duration.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || creditsAvailable < creditCost || !selectedTemplate}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate Video
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
