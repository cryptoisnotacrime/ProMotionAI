import { useState, useEffect } from 'react';
import { X, Wand2, Sparkles, Clock, Play, Save, Lock, Maximize2, Instagram, Music } from 'lucide-react';
import { ShopifyProduct } from '../../services/shopify/products.service';
import { VideoTemplate, TemplateInput, generateVeoPrompt } from '../../services/ai-generator/template.service';
import { DetailedTemplate, getTemplatesByTier, fillTemplateVariables } from '../../services/ai-generator/json-templates.service';
import { TemplateForm } from './TemplateForm';
import { Store, SocialMediaPhoto } from '../../lib/supabase';
import { ImageSlot } from './MultiImagePicker';
import { CustomTemplateModal } from '../settings/CustomTemplateModal';
import { SocialMediaService } from '../../services/social-media/social-media.service';

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
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);
  const [socialPhotos, setSocialPhotos] = useState<SocialMediaPhoto[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);

  const isProPlan = planName === 'pro' || planName === 'enterprise';
  const imageCount = selectedImages.length;
  const requiresEightSeconds = imageCount > 1;

  useEffect(() => {
    loadTemplates();
    loadSocialPhotos();
  }, [planName, store.id]);

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

  const loadSocialPhotos = async () => {
    try {
      setLoadingSocial(true);
      const photos = await SocialMediaService.getAllPhotos(store.id);
      setSocialPhotos(photos.slice(0, 6)); // Only show last 6
    } catch (error) {
      console.error('Failed to load social photos:', error);
      setSocialPhotos([]);
    } finally {
      setLoadingSocial(false);
    }
  };

  const getImageCostSurcharge = (imageCount: number): number => {
    if (imageCount <= 1) return 0;
    if (imageCount === 2) return 1;
    return 1;
  };

  const imageSurcharge = getImageCostSurcharge(imageCount);
  const creditCost = duration + imageSurcharge;
  const hasEnoughCredits = creditsAvailable >= creditCost;

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

    if (imageCount > 1 && duration !== 8) {
      alert('Multiple reference images require 8-second videos (Veo 3.1 API requirement).');
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
      promptText = `Using ${imageCount} reference images: The first image shows the main product view, additional images show different angles and details. Feature all perspectives of the product throughout the video, showing it from multiple angles while maintaining accurate representation. ` + promptText;
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
    { value: 4, label: '4s', disabled: requiresEightSeconds || maxDuration < 4 },
    { value: 6, label: '6s', disabled: requiresEightSeconds || maxDuration < 6 },
    { value: 8, label: '8s', disabled: maxDuration < 8 },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-purple-500/20 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-purple-900/30 border-b border-purple-500/20 px-6 py-3 flex items-center justify-between backdrop-blur-sm flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-400" />
                Generate Video
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{product.title}</p>
            </div>
            <button
              onClick={onClose}
              disabled={isGenerating}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Main Content - Scrollable */}
          <div className="overflow-y-auto flex-1 p-6 space-y-5">
            {/* Reference Images - Compact Layout */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-100">Reference Images</h3>
                <p className="text-xs text-gray-400">{selectedImages.length} of 3 selected</p>
              </div>

              {/* Compact 3-Slot Layout - Reduced by 40% */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                {/* Slot 1: Primary Image (Always Filled) */}
                <div
                  className="relative h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-purple-500 group cursor-pointer"
                  onClick={() => setEnlargedImageUrl(selectedImages[0]?.url)}
                >
                  {selectedImages[0] && (
                    <>
                      <img
                        src={selectedImages[0].url}
                        alt="Primary reference"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1.5 left-1.5 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                        Primary
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 className="w-4 h-4 text-white" />
                      </div>
                    </>
                  )}
                </div>

                {/* Slot 2: Reference Image or Placeholder */}
                {selectedImages[1] ? (
                  <div
                    className="relative h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 group cursor-pointer hover:border-purple-500/50 transition-all"
                    onClick={() => setEnlargedImageUrl(selectedImages[1].url)}
                  >
                    <img
                      src={selectedImages[1].url}
                      alt="Reference 2"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative h-24 bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-lg group">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                      <Lock className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-medium">Reference 2</span>
                    </div>
                    {!isProPlan && (
                      <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                        <div className="text-center">
                          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1">
                            PRO
                          </div>
                          <p className="text-[10px] text-purple-300 font-semibold">Multi-image</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Slot 3: Last Frame or Placeholder */}
                {selectedImages[2] ? (
                  <div
                    className="relative h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 group cursor-pointer hover:border-purple-500/50 transition-all"
                    onClick={() => setEnlargedImageUrl(selectedImages[2].url)}
                  >
                    <img
                      src={selectedImages[2].url}
                      alt="Last frame"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="relative h-24 bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-lg group">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                      <Lock className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-medium">Last Frame</span>
                    </div>
                    {!isProPlan && (
                      <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                        <div className="text-center">
                          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full mb-1">
                            PRO
                          </div>
                          <p className="text-[10px] text-purple-300 font-semibold">8s videos</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Product Photos Gallery */}
              {product.images && product.images.length > 1 && (
                <div className="mb-2">
                  <h4 className="text-xs font-medium text-gray-300 mb-1.5">Product Photos</h4>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {product.images.slice(0, 8).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (selectedImages.length >= 3) return;
                          if (!isProPlan && selectedImages.length >= 1) return;
                          const newImage: ImageSlot = {
                            url: img.src.trim(),
                            isProductImage: true,
                            source: 'product',
                          };
                          setSelectedImages([...selectedImages, newImage]);
                        }}
                        disabled={selectedImages.some(s => s.url === img.src) || (selectedImages.length >= 3) || (!isProPlan && selectedImages.length >= 1)}
                        className={`flex-shrink-0 w-16 h-16 bg-gray-800 rounded border-2 overflow-hidden transition-all ${
                          selectedImages.some(s => s.url === img.src)
                            ? 'border-purple-500 opacity-50'
                            : ((!isProPlan && selectedImages.length >= 1) ? 'border-gray-700 opacity-40 cursor-not-allowed' : 'border-gray-700 hover:border-purple-500 cursor-pointer')
                        }`}
                      >
                        <img
                          src={img.src}
                          alt={img.alt || product.title}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Media Photos */}
              <div className="mb-2">
                <h4 className="text-xs font-medium text-gray-300 mb-1.5">Your Social Media</h4>
                <div className="flex gap-1.5 overflow-x-auto pb-1 min-h-[68px]">
                  {loadingSocial ? (
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-800/50 rounded border-2 border-gray-700 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                    </div>
                  ) : socialPhotos.length > 0 ? (
                    <>
                      {socialPhotos.map((photo, idx) => (
                        <button
                          key={photo.id}
                          onClick={() => {
                            if (selectedImages.length >= 3) return;
                            if (!isProPlan && selectedImages.length >= 1) return;
                            const newImage: ImageSlot = {
                              url: photo.url.trim(),
                              isProductImage: false,
                              source: photo.platform,
                            };
                            setSelectedImages([...selectedImages, newImage]);
                          }}
                          disabled={selectedImages.some(s => s.url === photo.url) || (selectedImages.length >= 3) || (!isProPlan && selectedImages.length >= 1)}
                          className={`relative flex-shrink-0 w-16 h-16 bg-gray-800 rounded border-2 overflow-hidden transition-all ${
                            selectedImages.some(s => s.url === photo.url)
                              ? 'border-indigo-500 opacity-50'
                              : ((!isProPlan && selectedImages.length >= 1) ? 'border-indigo-700/50 opacity-40 cursor-not-allowed' : 'border-indigo-700/50 hover:border-indigo-500 cursor-pointer')
                          }`}
                        >
                          <img
                            src={photo.thumbnail}
                            alt={photo.caption || 'Social media photo'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-0.5 right-0.5">
                            {photo.platform === 'instagram' && (
                              <Instagram className="w-3 h-3 text-white drop-shadow-lg" />
                            )}
                            {photo.platform === 'tiktok' && (
                              <Music className="w-3 h-3 text-white drop-shadow-lg" />
                            )}
                          </div>
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-800/50 rounded border-2 border-dashed border-gray-700 flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="w-4 h-4 text-gray-600 mx-auto mb-0.5" />
                          <span className="text-[9px] text-gray-500">Connect</span>
                        </div>
                      </div>
                      {[...Array(5)].map((_, idx) => (
                        <div
                          key={idx}
                          className="flex-shrink-0 w-16 h-16 bg-gray-800/30 rounded border border-gray-700/50 flex items-center justify-center opacity-40"
                        >
                          <span className="text-[9px] text-gray-600">Photo {idx + 2}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Duration Selection */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <label className="text-sm font-semibold text-gray-100">Video Duration</label>
              </div>
              <div className="flex gap-2">
                {durationOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => !option.disabled && setDuration(option.value)}
                    disabled={option.disabled}
                    className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all relative ${
                      duration === option.value
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                        : option.disabled
                        ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                    }`}
                  >
                    {option.value === 8 && !requiresEightSeconds && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[9px] font-bold rounded-full shadow-lg">
                        PRO
                      </span>
                    )}
                    <div>{option.label}</div>
                    <div className="text-xs mt-0.5 opacity-80">{option.value} credits</div>
                  </button>
                ))}
              </div>
              {requiresEightSeconds && (
                <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-2 mt-2">
                  <p className="text-xs text-purple-200">
                    Multiple reference images require 8-second videos (Veo 3.1 API requirement)
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
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-purple-200">
                    Using: <span className="font-semibold">{selectedTemplate.template_name}</span>
                  </span>
                </div>
                {planName.toLowerCase() === 'pro' || planName.toLowerCase() === 'enterprise' ? (
                  <button
                    onClick={() => setShowCustomTemplateModal(true)}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Save className="w-3 h-3" />
                    Save as Custom
                  </button>
                ) : (
                  <div className="group relative">
                    <button
                      disabled
                      className="px-2.5 py-1 bg-gray-700 text-gray-400 text-xs font-medium rounded-lg cursor-not-allowed flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3" />
                      PRO Feature
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="bg-gradient-to-r from-gray-900 to-purple-900/30 border-t border-purple-500/20 px-6 py-4 backdrop-blur-sm flex-shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
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
                <p className="text-[10px] text-gray-400 mb-0.5 font-medium">Images</p>
                <p className="text-xs font-semibold text-white">{imageCount} ref{imageCount !== 1 ? 's' : ''}</p>
              </div>
              <div className={`rounded-lg p-2 border ${
                hasEnoughCredits
                  ? 'bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-500/30'
                  : 'bg-red-900/30 border-red-500/30'
              }`}>
                <p className="text-[10px] text-gray-400 mb-0.5 font-medium">Total Cost</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-base font-bold ${hasEnoughCredits ? 'text-purple-300' : 'text-red-300'}`}>
                    {creditCost}
                  </p>
                  {imageSurcharge > 0 && (
                    <p className="text-[10px] text-gray-400 whitespace-nowrap">
                      ({duration} + {imageSurcharge})
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
                className="sm:min-w-[180px] px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 whitespace-nowrap"
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
        </div>
      </div>

      {/* Image Enlargement Modal */}
      {enlargedImageUrl && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={() => setEnlargedImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setEnlargedImageUrl(null)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={enlargedImageUrl}
              alt="Enlarged view"
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

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
