import { useState } from 'react';
import { Sparkles, Globe, Instagram, Video, X, Loader, ArrowRight, SkipForward } from 'lucide-react';
import { Store } from '../../lib/supabase';
import { BrandDNAService, BrandDNA } from '../../services/onboarding/brand-dna.service';

interface BusinessDNAOnboardingProps {
  store: Store;
  onComplete: (brandDNA?: BrandDNA) => void;
}

export function BusinessDNAOnboarding({ store, onComplete }: BusinessDNAOnboardingProps) {
  const [step, setStep] = useState<'welcome' | 'input' | 'generating' | 'review'>('welcome');

  // Auto-fill with Shopify store URL
  const getDefaultWebsite = () => {
    // Always use shop_domain from Shopify OAuth
    if (store.shop_domain) {
      return `https://${store.shop_domain}`;
    }
    return '';
  };

  const defaultWebsite = getDefaultWebsite();

  const [urls, setUrls] = useState({
    website: defaultWebsite,
    instagram: store.instagram_handle ? `https://instagram.com/${store.instagram_handle.replace('@', '')}` : '',
    tiktok: store.tiktok_handle ? `https://tiktok.com/@${store.tiktok_handle.replace('@', '')}` : '',
    facebook: '',
  });
  const [brandDNA, setBrandDNA] = useState<BrandDNA>({
    brand_colors: [],
    brand_fonts: {},
    brand_images: [],
    brand_values: [],
    brand_aesthetic: [],
    brand_tone_of_voice: [],
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSkip = async () => {
    try {
      await BrandDNAService.skipOnboarding(store.id);
      onComplete();
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStep('generating');

    try {
      const generated = await BrandDNAService.generateBrandDNA(store.id, {
        websiteUrl: urls.website,
        instagramUrl: urls.instagram,
        tiktokUrl: urls.tiktok,
      });

      setBrandDNA(generated);
      setStep('review');
    } catch (error) {
      console.error('Failed to generate brand DNA:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate Brand DNA. Please try again.';
      alert(errorMessage);
      setStep('input');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      // Save any manual edits made in the review screen
      await BrandDNAService.saveBrandDNA(store.id, brandDNA);
      onComplete(brandDNA);
    } catch (error) {
      console.error('Failed to save manual edits:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-900 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-100 mb-3">
              Welcome to ProMotionAI!
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Let's create your Business DNA to generate amazing product videos that match your brand perfectly.
            </p>

            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-gray-100 mb-3">What we'll do:</h3>
              <ul className="text-left space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Analyze your website and social media</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Extract your brand colors, fonts, and imagery</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Understand your brand voice and aesthetic</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 mt-1">✓</span>
                  <span>Auto-fill future video generations with your brand DNA</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-3 border-2 border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 font-medium transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={() => setStep('input')}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 font-semibold transition-all flex items-center justify-center gap-2"
              >
                Let's Get Started
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mt-4">
              Takes less than 2 minutes • You can edit anytime
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'input') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-2xl max-w-2xl w-full p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-100">Your Brand Links</h2>
            <button onClick={handleSkip} className="text-gray-400 hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-gray-400 mb-6">
            Share your website and social media links so we can learn about your brand.
          </p>

          <div className="space-y-4 mb-8">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Globe className="w-4 h-4" />
                Website URL
              </label>
              <input
                type="url"
                value={urls.website}
                onChange={(e) => setUrls(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourstore.com"
                disabled={!!defaultWebsite}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-75 disabled:cursor-not-allowed"
              />
              {defaultWebsite && (
                <p className="text-xs text-gray-400 mt-1">Auto-filled from your Shopify store</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Instagram className="w-4 h-4" />
                Instagram (optional)
              </label>
              <input
                type="url"
                value={urls.instagram}
                onChange={(e) => setUrls(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="https://instagram.com/yourstore"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Video className="w-4 h-4" />
                TikTok (optional)
              </label>
              <input
                type="url"
                value={urls.tiktok}
                onChange={(e) => setUrls(prev => ({ ...prev, tiktok: e.target.value }))}
                placeholder="https://tiktok.com/@yourstore"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="px-6 py-3 text-gray-400 hover:text-gray-100 font-medium flex items-center gap-2"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </button>
            <button
              onClick={handleGenerate}
              disabled={!urls.website}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate Brand DNA
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-2xl max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-900 rounded-full mb-4 animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-100 mb-3">
            Analyzing Your Brand...
          </h2>
          <p className="text-gray-400 mb-6">
            We're extracting colors, fonts, images, and understanding your brand voice.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Loader className="w-5 h-5 text-purple-400 animate-spin" />
            <span className="text-sm text-gray-400">This usually takes 30-60 seconds</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
        <div className="bg-gray-900 rounded-2xl max-w-4xl w-full p-8 my-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-100">Your Business DNA</h2>
              <p className="text-gray-400 text-sm mt-1">
                Review and edit your brand profile
              </p>
            </div>
            <button onClick={handleSkip} className="text-gray-400 hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Colors */}
            <div className="bg-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-gray-100 mb-3">Brand Colors</h3>
              <div className="flex gap-2">
                {brandDNA.brand_colors.map((color, index) => (
                  <div key={index} className="flex-1">
                    <div
                      className="w-full h-16 rounded-lg border-2 border-gray-700 cursor-pointer hover:border-purple-400 transition-colors"
                      style={{ backgroundColor: color.hex }}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'color';
                        input.value = color.hex;
                        input.onchange = (e) => {
                          const newColors = [...brandDNA.brand_colors];
                          newColors[index] = { ...color, hex: (e.target as HTMLInputElement).value };
                          setBrandDNA({ ...brandDNA, brand_colors: newColors });
                        };
                        input.click();
                      }}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-center">{color.hex}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Click any color to change it</p>
            </div>

            {/* Fonts */}
            <div className="bg-gray-800 rounded-xl p-5">
              <h3 className="font-semibold text-gray-100 mb-3">Brand Fonts</h3>
              <div className="space-y-2">
                {brandDNA.brand_fonts?.primary && (
                  <div>
                    <p className="text-sm text-gray-400">Primary</p>
                    <p className="font-semibold text-lg text-gray-100">{brandDNA.brand_fonts.primary}</p>
                  </div>
                )}
                {brandDNA.brand_fonts?.secondary && (
                  <div>
                    <p className="text-sm text-gray-400">Secondary</p>
                    <p className="text-lg text-gray-100">{brandDNA.brand_fonts.secondary}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tagline */}
            {brandDNA.brand_tagline && (
              <div className="bg-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-gray-100 mb-3">Tagline</h3>
                <textarea
                  value={brandDNA.brand_tagline}
                  onChange={(e) => setBrandDNA({ ...brandDNA, brand_tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>
            )}

            {/* Brand Values */}
            {brandDNA.brand_values && brandDNA.brand_values.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-gray-100 mb-3">Brand Values</h3>
                <div className="flex flex-wrap gap-2">
                  {brandDNA.brand_values.map((value, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-900 border border-gray-700 rounded-full text-sm text-gray-300"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Aesthetic */}
            {brandDNA.brand_aesthetic && brandDNA.brand_aesthetic.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-gray-100 mb-3">Brand Aesthetic</h3>
                <div className="flex flex-wrap gap-2">
                  {brandDNA.brand_aesthetic.map((aesthetic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm"
                    >
                      {aesthetic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tone of Voice */}
            {brandDNA.brand_tone_of_voice && brandDNA.brand_tone_of_voice.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-gray-100 mb-3">Tone of Voice</h3>
                <div className="flex flex-wrap gap-2">
                  {brandDNA.brand_tone_of_voice.map((tone, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-sm"
                    >
                      {tone}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Business Overview */}
          {brandDNA.business_overview && (
            <div className="bg-gray-800 rounded-xl p-5 mb-8">
              <h3 className="font-semibold text-gray-100 mb-3">Business Overview</h3>
              <p className="text-gray-300">{brandDNA.business_overview}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('input')}
              className="px-6 py-3 border-2 border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 font-medium transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 font-semibold transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Save & Start Creating Videos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
