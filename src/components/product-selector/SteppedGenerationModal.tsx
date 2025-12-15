import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@shopify/polaris';
import { X, Image as ImageIcon, Clock, MonitorPlay, Film, Settings as SettingsIcon, Play, ChevronDown, ChevronUp, CheckCircle2, Circle, Bookmark, Sparkles } from 'lucide-react';
import { ShopifyProduct } from '../../services/shopify/products.service';
import { DetailedTemplate, getTemplatesByTier, fillTemplateVariables } from '../../services/ai-generator/json-templates.service';
import { TemplateInput } from '../../services/ai-generator/template.service';
import { Store } from '../../lib/supabase';
import { ImageSlot, ImageMode, MultiImagePicker } from './MultiImagePicker';
import { TemplateSelector } from './TemplateSelector';
import { TemplateSettings } from './TemplateSettings';
import { calculateCreditsRequired } from '../../constants/video-generation';
import { prefillFromStoreSettings } from '../../services/ai-generator/prefill.service';
import { TemplateMappingService } from '../../services/ai-generator/template-mapper.service';
import { hexToColorName } from '../../utils/color-converter';
import { CustomTemplatesService } from '../../services/ai-generator/custom-templates.service';

interface SteppedGenerationModalProps {
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

type Step = 'images' | 'duration' | 'resolution' | 'template' | 'settings';

interface StepConfig {
  id: Step;
  title: string;
  icon: any;
  description: string;
}

const STEPS: StepConfig[] = [
  { id: 'images', title: 'Reference Images', icon: ImageIcon, description: 'Select product images' },
  { id: 'duration', title: 'Video Duration', icon: Clock, description: 'Choose video length' },
  { id: 'resolution', title: 'Video Resolution', icon: MonitorPlay, description: 'Select quality' },
  { id: 'template', title: 'Template', icon: Film, description: 'Pick a style' },
  { id: 'settings', title: 'Customize', icon: SettingsIcon, description: 'Fine-tune details' },
];

export function SteppedGenerationModal({
  product,
  imageUrl,
  creditsAvailable,
  maxDuration,
  planName,
  store,
  onGenerate,
  onClose,
  isGenerating,
}: SteppedGenerationModalProps) {
  const [activeStep, setActiveStep] = useState<Step>('images');
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set());
  const [templates, setTemplates] = useState<DetailedTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DetailedTemplate | null>(null);
  const [duration, setDuration] = useState(maxDuration >= 6 ? 6 : 4);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [selectedImages, setSelectedImages] = useState<ImageSlot[]>([
    { url: imageUrl, isProductImage: true, source: 'product' }
  ]);
  const [imageMode, setImageMode] = useState<ImageMode>('first-last-frame');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const stepRefs = useRef<Record<Step, HTMLDivElement | null>>({
    images: null,
    duration: null,
    resolution: null,
    template: null,
    settings: null,
  });

  const isProPlan = planName.toLowerCase() === 'pro' || planName.toLowerCase() === 'enterprise';
  const imageCount = selectedImages.length;
  const requiresEightSeconds = imageMode === 'multiple-angles' && imageCount > 1;

  const getBrandColors = (): string => {
    if (store.brand_colors && store.brand_colors.length > 0) {
      const colorNames = store.brand_colors
        .slice(0, 3)
        .map((c: any) => {
          const isGenericName = c.name && /^Color\s+\d+$/i.test(c.name.trim());
          if (c.name && c.name.trim() && !isGenericName) {
            return c.name;
          }
          if (c.hex) {
            return hexToColorName(c.hex);
          }
          return null;
        })
        .filter(Boolean)
        .filter((name: string) => !/^#[0-9A-Fa-f]{3,6}$/.test(name));

      const uniqueColors = Array.from(
        new Set(colorNames.map((name: string) => name.toLowerCase()))
      ).map((lowerName: string) =>
        colorNames.find((name: string) => name.toLowerCase() === lowerName) || ''
      );

      return uniqueColors.join(', ');
    }
    return '';
  };

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

  const generateCustomNotes = () => {
    const description = product.body_html?.replace(/<[^>]*>/g, '').trim() || '';
    if (!description) return '';
    const words = description.split(/\s+/);
    const excerpt = words.slice(0, 15).join(' ');
    return excerpt + (words.length > 15 ? '...' : '');
  };

  const prefillData = prefillFromStoreSettings(store, product);
  const [templateInputs, setTemplateInputs] = useState<TemplateInput>({
    product_name: product.title,
    product_image_url: imageUrl,
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
    tier: planName,
    final_call_to_action: prefillData.final_call_to_action || '',
    custom_notes: generateCustomNotes() || prefillData.custom_notes || '',
  });

  useEffect(() => {
    loadTemplates();
  }, [planName]);

  useEffect(() => {
    if (requiresEightSeconds && duration !== 8) {
      setDuration(8);
    }
  }, [requiresEightSeconds]);

  useEffect(() => {
    setTemplateInputs(prev => ({ ...prev, duration }));
  }, [duration]);

  useEffect(() => {
    if (selectedImages.length > 0) {
      setTemplateInputs(prev => ({
        ...prev,
        product_image_url: selectedImages[0].url
      }));
    }
  }, [selectedImages]);

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

      setTemplateInputs(prev => ({
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

  const markStepComplete = (step: Step) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const scrollToStep = (step: Step) => {
    const element = stepRefs.current[step];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSaveTemplate = async (templateName: string, templateDescription: string, category: string) => {
    if (!selectedTemplate) return;

    setIsSavingTemplate(true);
    try {
      const settings = {
        visual_style: templateInputs.visual_style,
        camera_motion: templateInputs.camera_motion,
        lighting_mood: templateInputs.lighting_mood,
        background_style: templateInputs.background_style,
        tone: templateInputs.tone,
        lens_effect: templateInputs.lens_effect,
        color_palette: templateInputs.color_palette,
        platform: resolution === '1080p' ? '16:9' : '9:16',
        aspect_ratio: resolution === '1080p' ? '16:9' : '9:16',
        duration: duration,
        tier: 'Pro',
        keywords: selectedTemplate.keywords || [],
        negative_prompt: selectedTemplate.negative_prompt,
      };

      await CustomTemplatesService.saveCustomTemplate(store.id, {
        name: templateName,
        description: templateDescription,
        category: category,
        base_template_id: selectedTemplate.template_name,
        settings,
      });

      alert('Template saved successfully! You can now find it in your custom templates.');
      setShowSaveTemplateModal(false);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleImagesComplete = () => {
    markStepComplete('images');
    setActiveStep('duration');
    setTimeout(() => scrollToStep('duration'), 100);
  };

  const handleDurationSelect = (value: number) => {
    setDuration(value);
    markStepComplete('duration');
    setActiveStep('resolution');
    setTimeout(() => scrollToStep('resolution'), 100);
  };

  const handleResolutionSelect = (value: '720p' | '1080p') => {
    setResolution(value);
    markStepComplete('resolution');
    setActiveStep('template');
    setTimeout(() => scrollToStep('template'), 100);
  };

  const handleTemplateSelect = (template: DetailedTemplate) => {
    setSelectedTemplate(template);
    markStepComplete('template');
    setActiveStep('settings');
    setTimeout(() => scrollToStep('settings'), 100);
  };

  const creditCost = calculateCreditsRequired(duration, imageCount);
  const hasEnoughCredits = creditsAvailable >= creditCost;
  const imageSurcharge = imageCount > 1 ? 1 : 0;
  const baseCreditCost = creditCost - imageSurcharge;

  const handleGenerate = () => {
    if (!selectedTemplate || !hasEnoughCredits) return;

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

    // Only pass imageMode if there are multiple images
    const effectiveImageMode = imageCount > 1 ? imageMode : undefined;

    onGenerate(
      promptText,
      duration,
      aspectRatio,
      undefined,
      { ...templateInputs, template_name: selectedTemplate.template_name, category: selectedTemplate.meta.category, image_count: imageCount },
      imageUrls,
      effectiveImageMode,
      resolution
    );
  };

  const durationOptions = [
    { value: 4, label: '4s', disabled: requiresEightSeconds || maxDuration < 4 },
    { value: 6, label: '6s', disabled: requiresEightSeconds || maxDuration < 6 },
    { value: 8, label: '8s', disabled: maxDuration < 8 },
  ];

  const isStepComplete = (step: Step) => completedSteps.has(step);
  const canComplete = selectedTemplate && hasEnoughCredits;
  const allStepsComplete = isStepComplete('settings');

  return (
    <>
      {/* Dark Backdrop */}
      <div className="fixed inset-0 bg-black/80 z-[999]" onClick={isGenerating ? undefined : onClose} />

      {/* Modal Container */}
      <div className="fixed inset-0 md:inset-8 z-[1000] flex items-center justify-center p-0 md:p-4">
        <div className="bg-gray-950 w-full h-full md:h-auto md:max-h-[90vh] md:rounded-xl md:shadow-2xl overflow-hidden flex flex-col">
          {/* Progress Bar */}
          <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 px-3 sm:px-4 py-2.5 sm:py-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-100 truncate pr-2 max-w-[calc(100%-48px)]">{product.title}</h2>
              <button
                onClick={onClose}
                className="min-h-[44px] min-w-[44px] p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                disabled={isGenerating}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="flex gap-1">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex-1">
                  <div className={`h-1 rounded-full transition-all ${
                    isStepComplete(step.id) ? 'bg-blue-500' :
                    activeStep === step.id ? 'bg-blue-600 animate-pulse' :
                    'bg-gray-800'
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          {/* Images Step */}
          <StepCard
            step={STEPS[0]}
            isActive={activeStep === 'images'}
            isComplete={isStepComplete('images')}
            onClick={() => setActiveStep('images')}
            ref={(el) => (stepRefs.current.images = el)}
          >
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
            {selectedImages.length >= 1 && activeStep === 'images' && (
              <button
                onClick={handleImagesComplete}
                className="w-full mt-3 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Continue to Duration
                <ChevronDown className="w-4 h-4" />
              </button>
            )}
          </StepCard>

          {/* Duration Step */}
          <StepCard
            step={STEPS[1]}
            isActive={activeStep === 'duration'}
            isComplete={isStepComplete('duration')}
            onClick={() => setActiveStep('duration')}
            ref={(el) => (stepRefs.current.duration = el)}
          >
            <div className="flex gap-2">
              {durationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => !option.disabled && handleDurationSelect(option.value)}
                  disabled={option.disabled}
                  className={`min-h-[56px] flex-1 px-3 py-3 rounded-lg font-semibold text-sm transition-all relative ${
                    duration === option.value
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : option.disabled
                      ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                  }`}
                >
                  <div className="text-lg">{option.label}</div>
                  <div className="text-xs mt-1 opacity-80">{option.value} credits</div>
                </button>
              ))}
            </div>
            {requiresEightSeconds && (
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-2.5 mt-3">
                <p className="text-xs text-blue-200">
                  Multiple Angles mode requires 8-second videos. First & Last Frame mode supports 4s, 6s, or 8s.
                </p>
              </div>
            )}
          </StepCard>

          {/* Resolution Step */}
          <StepCard
            step={STEPS[2]}
            isActive={activeStep === 'resolution'}
            isComplete={isStepComplete('resolution')}
            onClick={() => setActiveStep('resolution')}
            ref={(el) => (stepRefs.current.resolution = el)}
          >
            <div className="flex gap-2">
              <button
                onClick={() => handleResolutionSelect('720p')}
                className={`min-h-[56px] flex-1 px-3 py-3 rounded-lg font-semibold text-sm transition-all ${
                  resolution === '720p'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                }`}
              >
                <div className="text-lg">720p</div>
                <div className="text-xs mt-1 opacity-80">Standard HD</div>
              </button>
              <button
                onClick={() => {
                  if (isProPlan) {
                    handleResolutionSelect('1080p');
                  } else {
                    alert('1080p resolution requires Pro plan. Upgrade to unlock this feature.');
                  }
                }}
                className={`min-h-[56px] flex-1 px-3 py-3 rounded-lg font-semibold text-sm transition-all relative ${
                  resolution === '1080p'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : !isProPlan
                    ? 'bg-gray-800/50 text-gray-500 cursor-not-allowed border border-gray-700'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-750 border border-gray-700'
                }`}
              >
                <div className="text-lg">1080p</div>
                <div className="text-xs mt-1 opacity-80">Full HD {!isProPlan && '(Pro)'}</div>
              </button>
            </div>
          </StepCard>

          {/* Template Step */}
          <StepCard
            step={STEPS[3]}
            isActive={activeStep === 'template'}
            isComplete={isStepComplete('template')}
            onClick={() => setActiveStep('template')}
            ref={(el) => (stepRefs.current.template = el)}
          >
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <TemplateSelector
                templates={templates}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
                userTier={planName}
                storeId={store.id}
              />
            )}
          </StepCard>

          {/* Settings Step */}
          <StepCard
            step={STEPS[4]}
            isActive={activeStep === 'settings'}
            isComplete={isStepComplete('settings')}
            onClick={() => setActiveStep('settings')}
            ref={(el) => (stepRefs.current.settings = el)}
          >
            {selectedTemplate && (
              <TemplateSettings
                product={product}
                productImageUrl={imageUrl}
                store={store}
                templateInputs={templateInputs}
                onInputChange={setTemplateInputs}
              />
            )}
          </StepCard>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-950 border-t border-gray-800 px-4 py-4">
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
              <p className="text-[10px] text-gray-500 mb-0.5">Template</p>
              <p className="text-xs font-semibold text-white truncate" title={selectedTemplate?.template_name || 'None'}>
                {selectedTemplate?.template_name || 'None'}
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
              <p className="text-[10px] text-gray-500 mb-0.5">Duration</p>
              <p className="text-xs font-semibold text-white">{duration}s</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-2 border border-gray-800">
              <p className="text-[10px] text-gray-500 mb-0.5">Quality</p>
              <p className="text-xs font-semibold text-white">{resolution}</p>
            </div>
            <div className={`rounded-lg p-2 border ${
              hasEnoughCredits
                ? 'bg-blue-900/50 border-blue-500/30'
                : 'bg-red-900/30 border-red-500/30'
            }`}>
              <p className="text-[10px] text-gray-500 mb-0.5">Cost</p>
              <p className={`text-base font-bold ${hasEnoughCredits ? 'text-blue-300' : 'text-red-300'}`}>
                {creditCost}
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canComplete || isGenerating}
            className="w-full min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
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

          {allStepsComplete && (
            <>
              {isProPlan ? (
                <button
                  onClick={() => setShowSaveTemplateModal(true)}
                  disabled={!canComplete}
                  className="w-full min-h-[44px] px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700 flex items-center justify-center gap-2 mt-2"
                >
                  <Bookmark className="w-4 h-4" />
                  Save as Template
                </button>
              ) : (
                <button
                  onClick={() => alert('Upgrade to Pro to save custom templates and reuse your favorite video configurations!')}
                  className="w-full min-h-[44px] px-6 py-2.5 bg-gradient-to-r from-purple-900/50 to-purple-800/50 hover:from-purple-900/70 hover:to-purple-800/70 text-purple-300 font-bold rounded-lg transition-all border border-purple-700 flex items-center justify-center gap-2 relative mt-2"
                >
                  <Bookmark className="w-4 h-4" />
                  Save as Template
                  <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    PRO
                  </span>
                </button>
              )}
            </>
          )}

          {!hasEnoughCredits && (
            <div className="mt-2 bg-red-900/20 border border-red-500/30 rounded-lg p-2 text-xs text-red-300 text-center">
              Insufficient credits. You need {creditCost - creditsAvailable} more credit{creditCost - creditsAvailable !== 1 ? 's' : ''}.
            </div>
          )}
          </div>
        </div>
      </div>

      {showSaveTemplateModal && (
        <SaveTemplateModal
          onSave={handleSaveTemplate}
          onClose={() => setShowSaveTemplateModal(false)}
          isSaving={isSavingTemplate}
        />
      )}
    </>
  );
}

interface StepCardProps {
  step: StepConfig;
  isActive: boolean;
  isComplete: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const StepCard = React.forwardRef<HTMLDivElement, StepCardProps>(
  ({ step, isActive, isComplete, onClick, children }, ref) => {
    const Icon = step.icon;

    return (
      <div
        ref={ref}
        className={`rounded-lg border transition-all ${
          isActive
            ? 'border-blue-500 bg-gray-900'
            : isComplete
            ? 'border-green-500/30 bg-gray-900/50'
            : 'border-gray-800 bg-gray-900/30'
        }`}
      >
        <button
          onClick={onClick}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/50 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isComplete ? 'bg-green-600' : isActive ? 'bg-blue-600' : 'bg-gray-800'
            }`}>
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
              )}
            </div>
            <div className="text-left">
              <h3 className={`text-sm font-semibold ${
                isActive ? 'text-blue-400' : isComplete ? 'text-green-400' : 'text-gray-400'
              }`}>
                {step.title}
              </h3>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
          </div>
          {isActive ? (
            <ChevronUp className="w-5 h-5 text-blue-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {isActive && (
          <div className="px-4 pb-4 pt-2">
            {children}
          </div>
        )}
      </div>
    );
  }
);

StepCard.displayName = 'StepCard';

interface SaveTemplateModalProps {
  onSave: (name: string, description: string, category: string) => void;
  onClose: () => void;
  isSaving: boolean;
}

function SaveTemplateModal({ onSave, onClose, isSaving }: SaveTemplateModalProps) {
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [category, setCategory] = useState('Product');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (templateName.trim()) {
      onSave(templateName.trim(), templateDescription.trim(), category);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[1100] overflow-hidden" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl max-w-lg w-full max-h-[90vh] border border-gray-700 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-100 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-blue-400" />
            Save as Template
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., My Product Video Style"
              className="w-full px-3 sm:px-4 py-2.5 bg-gray-800 border border-gray-700 text-sm sm:text-base text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe what makes this template special..."
              rows={3}
              className="w-full px-3 sm:px-4 py-2.5 bg-gray-800 border border-gray-700 text-sm sm:text-base text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 bg-gray-800 border border-gray-700 text-sm sm:text-base text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Product">Product</option>
              <option value="Lifestyle">Lifestyle</option>
              <option value="Promotional">Promotional</option>
              <option value="Social Media">Social Media</option>
              <option value="Story">Story</option>
              <option value="UGC">UGC</option>
            </select>
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] px-3 sm:px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm sm:text-base font-medium rounded-lg transition-colors border border-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !templateName.trim()}
              className="flex-1 min-h-[44px] px-3 sm:px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm sm:text-base font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">Save...</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline">Save Template</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
