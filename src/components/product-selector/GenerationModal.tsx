import { useState, useEffect } from 'react';
import { Modal, Scrollable } from '@shopify/polaris';
import { X, Wand2, Sparkles, Clock, Play, Save, Lock, MonitorPlay } from 'lucide-react';
import { ShopifyProduct } from '../../services/shopify/products.service';
import { VideoTemplate, TemplateInput, generateVeoPrompt } from '../../services/ai-generator/template.service';
import { DetailedTemplate, getTemplatesByTier, fillTemplateVariables } from '../../services/ai-generator/json-templates.service';
import { TemplateForm } from './TemplateForm';
import { Store } from '../../lib/supabase';
import { ImageSlot, ImageMode, MultiImagePicker } from './MultiImagePicker';
import { CustomTemplateModal } from '../settings/CustomTemplateModal';
import { calculateCreditsRequired } from '../../constants/video-generation';

interface GenerationModalProps {
  product: ShopifyProduct;
  imageUrl: string;
  creditsAvailable: number;
  maxDuration: number;
  planName: string;
  store: Store;
  onGenerate: (prompt: string, duration: number, aspectRatio: string, templateId?: string, templateInputs?: Record<string, any>, imageUrls?: string[], imageMode?: 'first-last-frame' | 'multiple-angles', resolution?: '720p' | '1080p') => void;
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
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [selectedImages, setSelectedImages] = useState<ImageSlot[]>([
    { url: imageUrl, isProductImage: true, source: 'product' }
  ]);
  const [imageMode, setImageMode] = useState<ImageMode>('multiple-angles');
  const [templateInputs, setTemplateInputs] = useState<TemplateInput>({
    product_name: product.title,
    product_image_url: imageUrl,
    duration: 8,
    platform: '9:16',
    tier: planName,
  });
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [showCustomTemplateModal, setShowCustomTemplateModal] = useState(false);

  const isProPlan = planName.toLowerCase() === 'pro' || planName.toLowerCase() === 'enterprise';
  const imageCount = selectedImages.length;
  const requiresEightSeconds = imageMode === 'multiple-angles' && imageCount > 1;

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

  const creditCost = calculateCreditsRequired(duration, imageCount);
  const hasEnoughCredits = creditsAvailable >= creditCost;

  const imageSurcharge = imageCount > 1 ? 1 : 0;
  const baseCreditCost = creditCost - imageSurcharge;

  useEffect(() => {
    if (requiresEightSeconds && duration !== 8) {
      setDuration(8);
    }
  }, [requiresEightSeconds]);

  useEffect(() => {
    setTemplateInputs(prev => ({ ...prev, duration }));
  }, [duration]);

  // Update product_image_url when selected images change
  useEffect(() => {
    if (selectedImages.length > 0) {
      setTemplateInputs(prev => ({
        ...prev,
        product_image_url: selectedImages[0].url
      }));
    }
  }, [selectedImages]);

  const handleGenerate = () => {
    if (!selectedTemplate || !hasEnoughCredits) {
      return;
    }

    if (imageCount > 1 && !isProPlan) {
      alert('Multiple reference images require Pro plan. Upgrade to unlock this feature.');
      return;
    }

    if (imageMode === 'multiple-angles' && imageCount > 1 && duration !== 8) {
      alert('Multiple Angles mode requires 8-second videos. First & Last Frame mode supports 4s, 6s, or 8s.');
      return;
    }

    if (resolution === '1080p' && !isProPlan) {
      alert('1080p resolution requires Pro plan. Upgrade to unlock this feature.');
      return;
    }

    const variables: Record<string, string> = {
      product_name: product.title,
      product_image_url: selectedImages[0]?.url || imageUrl,
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

      if (imageMode === 'first-last-frame') {
        promptText = `Using 2 reference images for first and last frame: Start with the composition shown in the first image and smoothly transition to end with the composition shown in the last image. Create a seamless narrative arc between these two frames. ` + promptText;
      } else {
        promptText = `Using ${imageCount} reference images: The first image shows the main product view, additional images show different angles and details. Feature all perspectives of the product throughout the video, showing it from multiple angles while maintaining accurate representation. ` + promptText;
      }
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
      imageUrls,
      imageMode,
      resolution
    );
  };

  const durationOptions = [
    { value: 4, label: '4s', disabled: requiresEightSeconds || maxDuration < 4 },
    { value: 6, label: '6s', disabled: requiresEightSeconds || maxDuration < 6 },
    { value: 8, label: '8s', disabled: maxDuration < 8 },
  ];

  return (
    <>
      <Modal
        open={true}
        onClose={isGenerating ? () => {} : onClose}
        title={
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-500" />
            <div>
              <div className="font-bold">Generate Video</div>
              <div className="text-xs text-gray-500 font-normal">{product.title}</div>
            </div>
          </div>
        }
        large
      >
        <Modal.Section>
          <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950/20 rounded-lg p-6">
            <Scrollable shadow style={{ maxHeight: '60vh' }}>
              <div className="space-y-5 pr-4">
            {/* Reference Images Picker */}
            <MultiImagePicker
              productImages={product.images?.map((img, idx) => ({
                id: `${product.id}-${idx}`,
                src: img.src,
                alt: img.alt || product.title,
              })) || []}
              productTitle={product.title}
              onImagesChange={(images, mode) => {
                setSelectedImages(images);
                setImageMode(mode);
              }}
              maxImages={3}
              storeId={store.id}
              planName={planName}
            />

            {/* Duration Selection */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <label className="text-sm font-semibold text-gray-100">Video Duration</label>
              </div>
              <div className="flex gap-2">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => !option.disabled && setDuration(option.value)}
                    disabled={option.disabled}
                    className={`min-h-[44px] flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all relative ${
                      duration === option.value
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                        : option.disabled
                        ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                    }`}
                  >
                    {option.value === 8 && !requiresEightSeconds && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[9px] font-bold rounded-full shadow-lg">
                        PRO
                      </span>
                    )}
                    <div>{option.label}</div>
                    <div className="text-xs mt-0.5 opacity-80">{option.value} credits</div>
                  </button>
                ))}
              </div>
              {requiresEightSeconds && (
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-2 mt-2">
                  <p className="text-xs text-blue-200">
                    Multiple Angles mode requires 8-second videos. First & Last Frame mode supports 4s, 6s, or 8s.
                  </p>
                </div>
              )}
            </div>

            {/* Resolution Selection */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MonitorPlay className="w-4 h-4 text-blue-400" />
                <label className="text-sm font-semibold text-gray-100">Video Resolution</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setResolution('720p')}
                  className={`min-h-[44px] flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all relative ${
                    resolution === '720p'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                  }`}
                >
                  <div>720p</div>
                  <div className="text-xs mt-0.5 opacity-80">Standard HD</div>
                </button>
                <button
                  onClick={() => {
                    if (isProPlan) {
                      setResolution('1080p');
                    } else {
                      alert('1080p resolution requires Pro plan. Upgrade to unlock this feature.');
                    }
                  }}
                  className={`min-h-[44px] flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all relative ${
                    resolution === '1080p'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                      : !isProPlan
                      ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                  }`}
                >
                  {!isProPlan && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[9px] font-bold rounded-full shadow-lg flex items-center gap-0.5">
                      <Lock className="w-2 h-2" />
                      PRO
                    </span>
                  )}
                  <div>1080p</div>
                  <div className="text-xs mt-0.5 opacity-80">Full HD</div>
                </button>
              </div>
              {!isProPlan && (
                <div className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-2 mt-2">
                  <p className="text-xs text-gray-300">
                    Upgrade to <span className="font-semibold text-blue-400">Pro</span> to unlock 1080p Full HD resolution for higher quality videos.
                  </p>
                </div>
              )}
            </div>

            {/* Template Selection & Customization - All in One View */}
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

            {/* Current Template Badge */}
            {selectedTemplate && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-200">
                    Using: <span className="font-semibold">{selectedTemplate.template_name}</span>
                  </span>
                </div>
                {planName.toLowerCase() === 'pro' || planName.toLowerCase() === 'enterprise' ? (
                  <button
                    onClick={() => setShowCustomTemplateModal(true)}
                    className="min-h-[44px] min-w-[44px] px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save as Custom
                  </button>
                ) : (
                  <div className="group relative">
                    <button
                      disabled
                      className="min-h-[44px] min-w-[44px] px-2.5 py-1 bg-gray-700 text-gray-400 text-xs font-medium rounded-lg cursor-not-allowed flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      PRO Feature
                    </button>
                  </div>
                )}
              </div>
            )}
              </div>
            </Scrollable>
          </div>
        </Modal.Section>

        <Modal.Section>
          <div className="bg-gradient-to-r from-gray-900 to-blue-900/30 border-t border-blue-500/20 px-6 py-4 backdrop-blur-sm">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
              <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                <p className="text-[10px] text-gray-400 mb-0.5 font-medium">Template</p>
                <p className="text-xs font-semibold text-white truncate" title={selectedTemplate?.template_name || 'None'}>
                  {selectedTemplate?.template_name || 'None'}
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                <p className="text-[10px] text-gray-400 mb-0.5 font-medium">Duration</p>
                <p className="text-xs font-semibold text-white">{duration}s</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                <p className="text-[10px] text-gray-400 mb-0.5 font-medium">Resolution</p>
                <p className="text-xs font-semibold text-white">{resolution}</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                <p className="text-[10px] text-gray-400 mb-0.5 font-medium">Images</p>
                <p className="text-xs font-semibold text-white">{imageCount} ref{imageCount !== 1 ? 's' : ''}</p>
              </div>
              <div className={`rounded-lg p-2 border ${
                hasEnoughCredits
                  ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-500/30'
                  : 'bg-red-900/30 border-red-500/30'
              }`}>
                <p className="text-[10px] text-gray-400 mb-0.5 font-medium">Total Cost</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-base font-bold ${hasEnoughCredits ? 'text-blue-300' : 'text-red-300'}`}>
                    {creditCost}
                  </p>
                  {imageSurcharge > 0 && (
                    <p className="text-[10px] text-gray-400 whitespace-nowrap">
                      ({baseCreditCost} + {imageSurcharge})
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 bg-gray-800/30 rounded-lg p-2.5 border border-gray-700/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-300">Available Credits</span>
                  <span className={`text-base font-bold ${hasEnoughCredits ? 'text-green-400' : 'text-red-400'}`}>
                    {creditsAvailable}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">After generation</span>
                  <span className="text-xs font-semibold text-gray-300">
                    {Math.max(0, creditsAvailable - creditCost)} credits
                  </span>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!selectedTemplate || !hasEnoughCredits || isGenerating}
                className="min-h-[44px] sm:min-w-[180px] px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 whitespace-nowrap"
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
              <div className="mt-3 bg-red-900/20 border border-red-500/30 rounded-lg p-2 text-xs text-red-300 text-center">
                Insufficient credits. You need {creditCost - creditsAvailable} more credit{creditCost - creditsAvailable !== 1 ? 's' : ''} to generate this video.
              </div>
            )}
          </div>
        </Modal.Section>
      </Modal>

      {/* Custom Template Modal */}
      {showCustomTemplateModal && selectedTemplate && (
        <CustomTemplateModal
          baseTemplate={selectedTemplate}
          currentSettings={templateInputs}
          storeId={store.id}
          onClose={() => setShowCustomTemplateModal(false)}
          onSave={() => {
            setShowCustomTemplateModal(false);
            alert('Custom template saved! You can now use it from the template selector.');
          }}
        />
      )}
    </>
  );
}
