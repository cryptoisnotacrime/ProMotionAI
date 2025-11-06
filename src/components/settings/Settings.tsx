import { useState, useEffect } from 'react';
import { User, CreditCard, Video, Save, RefreshCw, Palette, Sparkles, X, Plus, Instagram } from 'lucide-react';
import { Store } from '../../lib/supabase';
import { BrandDNAService } from '../../services/onboarding/brand-dna.service';

interface SettingsProps {
  store: Store;
  onSave: (settings: Partial<Store>) => Promise<void>;
  onRestartOnboarding?: () => void;
}

type SettingsTab = 'profile' | 'billing' | 'video' | 'brand';

export function Settings({ store, onSave, onRestartOnboarding }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    contact_email: store.contact_email || '',
    video_style: 'cinematic',
    default_duration: 4,
    auto_add_to_shopify: false,
    default_brand_name: store.default_brand_name || '',
    default_call_to_action: store.default_call_to_action || '',
    instagram_handle: store.instagram_handle || '',
    tiktok_handle: store.tiktok_handle || '',
    brand_description: store.brand_description || '',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        contact_email: settings.contact_email,
        default_brand_name: settings.default_brand_name,
        default_call_to_action: settings.default_call_to_action,
        instagram_handle: settings.instagram_handle,
        tiktok_handle: settings.tiktok_handle,
        brand_description: settings.brand_description,
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile & Contact', icon: User },
    { id: 'billing' as const, label: 'Billing & Plan', icon: CreditCard },
    { id: 'brand' as const, label: 'Brand DNA', icon: Palette },
    { id: 'video' as const, label: 'Video Settings', icon: Video },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account preferences and video generation settings
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-8">
          {activeTab === 'profile' && (
            <ProfileSettings
              store={store}
              settings={settings}
              onSettingsChange={setSettings}
            />
          )}

          {activeTab === 'billing' && (
            <BillingSettings store={store} />
          )}

          {activeTab === 'brand' && (
            <BrandDNASettings
              store={store}
              onRestartOnboarding={onRestartOnboarding}
            />
          )}

          {activeTab === 'video' && (
            <VideoSettings
              settings={settings}
              onSettingsChange={setSettings}
            />
          )}
        </div>

        {(activeTab === 'profile' || activeTab === 'video') && (
          <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ProfileSettingsProps {
  store: Store;
  settings: any;
  onSettingsChange: (settings: any) => void;
}

function ProfileSettings({ store, settings, onSettingsChange }: ProfileSettingsProps) {
  const shopifyStoreUrl = `https://${store.shop_domain}`;
  const displayName = store.store_name || store.shop_domain;
  const storeInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {storeInitial}
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
          <p className="text-sm text-gray-600 mt-1">Shopify Store</p>
          <a
            href={shopifyStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-2"
          >
            Visit Store →
          </a>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={settings.contact_email}
              onChange={(e) => onSettingsChange({ ...settings, contact_email: e.target.value })}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for billing notifications and important updates
            </p>
          </div>

          {store.email && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shopify Account Email
              </label>
              <input
                type="text"
                value={store.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                From your Shopify account
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Store ID</div>
            <div className="font-mono text-sm text-gray-900">{store.id.slice(0, 18)}...</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Member Since</div>
            <div className="text-sm text-gray-900">
              {new Date(store.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Last Updated</div>
            <div className="text-sm text-gray-900">
              {new Date(store.updated_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Installation Date</div>
            <div className="text-sm text-gray-900">
              {new Date(store.installed_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BillingSettingsProps {
  store: Store;
}

function BillingSettings({ store }: BillingSettingsProps) {
  const cycleStart = new Date(store.billing_cycle_start);
  const cycleEnd = new Date(store.billing_cycle_end);
  const daysRemaining = Math.ceil((cycleEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Plan</h2>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 capitalize">{store.plan_name} Plan</h3>
              <p className="text-sm text-gray-600 mt-1">
                Status: <span className="font-semibold text-green-600 capitalize">{store.subscription_status}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Credits Remaining</div>
              <div className="text-2xl font-bold text-gray-900">
                {store.credits_remaining} <span className="text-sm font-normal text-gray-500">/ {store.credits_total}</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Cycle Resets In</div>
              <div className="text-2xl font-bold text-gray-900">
                {daysRemaining} <span className="text-sm font-normal text-gray-500">days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing Cycle</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-gray-600">Current Period Start</span>
            <span className="font-medium text-gray-900">
              {cycleStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between py-3 border-b border-gray-200">
            <span className="text-gray-600">Current Period End</span>
            <span className="font-medium text-gray-900">
              {cycleEnd.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <div className="flex justify-between py-3">
            <span className="text-gray-600">Next Renewal</span>
            <span className="font-medium text-gray-900">
              {cycleEnd.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Payment Integration Coming Soon</strong>
            <br />
            Stripe/Shopify Billing integration is currently in development. Plan upgrades are instant for testing purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

interface VideoSettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

interface BrandDNASettingsProps {
  store: Store;
  onRestartOnboarding?: () => void;
}

function BrandDNASettings({ store, onRestartOnboarding }: BrandDNASettingsProps) {
  const [brandDNA, setBrandDNA] = useState({
    brand_colors: store.brand_colors || [],
    brand_fonts: store.brand_fonts || {},
    brand_tagline: store.brand_tagline || '',
    brand_values: store.brand_values || [],
    brand_aesthetic: store.brand_aesthetic || [],
    brand_tone_of_voice: store.brand_tone_of_voice || [],
    business_overview: store.business_overview || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [newValueInput, setNewValueInput] = useState('');
  const [newAestheticInput, setNewAestheticInput] = useState('');
  const [newToneInput, setNewToneInput] = useState('');
  const [instagramPhotos, setInstagramPhotos] = useState<string[]>([]);

  const handleColorChange = (index: number, newColor: string) => {
    const newColors = [...brandDNA.brand_colors];
    newColors[index] = { ...newColors[index], hex: newColor };
    setBrandDNA({ ...brandDNA, brand_colors: newColors });
    setHasChanges(true);
  };

  const handleColorDelete = (index: number) => {
    const newColors = brandDNA.brand_colors.filter((_: any, i: number) => i !== index);
    setBrandDNA({ ...brandDNA, brand_colors: newColors });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await BrandDNAService.saveBrandDNA(store.id, brandDNA);
      alert('Brand DNA updated successfully!');
      setHasChanges(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to save Brand DNA:', error);
      alert('Failed to save Brand DNA');
    } finally {
      setIsSaving(false);
    }
  };

  const hasBrandDNA = store.onboarding_completed &&
    (store.brand_colors?.length > 0 || store.brand_tagline);

  if (!hasBrandDNA) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Brand DNA Yet
        </h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Complete the Brand DNA onboarding to let AI learn your brand's colors, fonts, style, and values for better video generation.
        </p>
        {onRestartOnboarding && (
          <button
            onClick={onRestartOnboarding}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Start Brand DNA Setup
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your Brand DNA</h2>
          <p className="text-sm text-gray-600">
            Review and edit your brand profile. Changes will be reflected in future video generations.
          </p>
        </div>
        {onRestartOnboarding && (
          <button
            onClick={onRestartOnboarding}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        )}
      </div>

      {store.brand_dna_updated_at && (
        <div className="text-xs text-gray-500">
          Last updated: {new Date(store.brand_dna_updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colors */}
        {brandDNA.brand_colors && brandDNA.brand_colors.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Brand Colors</h3>
            <div className="flex gap-2">
              {brandDNA.brand_colors.map((color: any, index: number) => (
                <div key={index} className="flex-1 relative group">
                  <div
                    className="w-full h-16 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors"
                    style={{ backgroundColor: color.hex }}
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'color';
                      input.value = color.hex;
                      input.onchange = (e) => {
                        handleColorChange(index, (e.target as HTMLInputElement).value);
                      };
                      input.click();
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleColorDelete(index);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                    title="Delete color"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p className="text-xs text-gray-600 mt-1 text-center">{color.hex}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">Click any color to change it, hover to delete</p>
          </div>
        )}

        {/* Fonts */}
        {brandDNA.brand_fonts && (brandDNA.brand_fonts.primary || brandDNA.brand_fonts.secondary) && (
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Brand Fonts</h3>
            <div className="space-y-2">
              {brandDNA.brand_fonts.primary && (
                <div>
                  <p className="text-sm text-gray-600">Primary</p>
                  <p className="font-semibold text-lg">{brandDNA.brand_fonts.primary}</p>
                </div>
              )}
              {brandDNA.brand_fonts.secondary && (
                <div>
                  <p className="text-sm text-gray-600">Secondary</p>
                  <p className="text-lg">{brandDNA.brand_fonts.secondary}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tagline */}
        {brandDNA.brand_tagline && (
          <div className="bg-gray-50 rounded-xl p-5 md:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-3">Tagline</h3>
            <textarea
              value={brandDNA.brand_tagline}
              onChange={(e) => {
                setBrandDNA({ ...brandDNA, brand_tagline: e.target.value });
                setHasChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
            />
          </div>
        )}

        {/* Brand Values */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Brand Values</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {brandDNA.brand_values && brandDNA.brand_values.map((value: string, index: number) => (
              <span
                key={index}
                className="group px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 flex items-center gap-2 hover:border-red-300 transition-colors"
              >
                {value}
                <button
                  onClick={() => {
                    const newValues = brandDNA.brand_values.filter((_: string, i: number) => i !== index);
                    setBrandDNA({ ...brandDNA, brand_values: newValues });
                    setHasChanges(true);
                  }}
                  className="w-4 h-4 rounded-full bg-gray-200 group-hover:bg-red-500 text-gray-600 group-hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newValueInput}
              onChange={(e) => setNewValueInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newValueInput.trim()) {
                  setBrandDNA({ ...brandDNA, brand_values: [...brandDNA.brand_values, newValueInput.trim()] });
                  setNewValueInput('');
                  setHasChanges(true);
                }
              }}
              placeholder="Add a value (e.g., Quality, Innovation)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                if (newValueInput.trim()) {
                  setBrandDNA({ ...brandDNA, brand_values: [...brandDNA.brand_values, newValueInput.trim()] });
                  setNewValueInput('');
                  setHasChanges(true);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Brand Aesthetic */}
        <div className="bg-gray-50 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Brand Aesthetic</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {brandDNA.brand_aesthetic && brandDNA.brand_aesthetic.map((aesthetic: string, index: number) => (
              <span
                key={index}
                className="group px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2 hover:bg-blue-200 transition-colors"
              >
                {aesthetic}
                <button
                  onClick={() => {
                    const newAesthetic = brandDNA.brand_aesthetic.filter((_: string, i: number) => i !== index);
                    setBrandDNA({ ...brandDNA, brand_aesthetic: newAesthetic });
                    setHasChanges(true);
                  }}
                  className="w-4 h-4 rounded-full bg-blue-200 group-hover:bg-red-500 text-blue-700 group-hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAestheticInput}
              onChange={(e) => setNewAestheticInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newAestheticInput.trim()) {
                  setBrandDNA({ ...brandDNA, brand_aesthetic: [...brandDNA.brand_aesthetic, newAestheticInput.trim()] });
                  setNewAestheticInput('');
                  setHasChanges(true);
                }
              }}
              placeholder="Add aesthetic (e.g., Modern, Minimalist)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                if (newAestheticInput.trim()) {
                  setBrandDNA({ ...brandDNA, brand_aesthetic: [...brandDNA.brand_aesthetic, newAestheticInput.trim()] });
                  setNewAestheticInput('');
                  setHasChanges(true);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tone of Voice */}
        <div className="bg-gray-50 rounded-xl p-5 md:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-3">Tone of Voice</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {brandDNA.brand_tone_of_voice && brandDNA.brand_tone_of_voice.map((tone: string, index: number) => (
              <span
                key={index}
                className="group px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2 hover:bg-purple-200 transition-colors"
              >
                {tone}
                <button
                  onClick={() => {
                    const newTone = brandDNA.brand_tone_of_voice.filter((_: string, i: number) => i !== index);
                    setBrandDNA({ ...brandDNA, brand_tone_of_voice: newTone });
                    setHasChanges(true);
                  }}
                  className="w-4 h-4 rounded-full bg-purple-200 group-hover:bg-red-500 text-purple-700 group-hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newToneInput}
              onChange={(e) => setNewToneInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newToneInput.trim()) {
                  setBrandDNA({ ...brandDNA, brand_tone_of_voice: [...brandDNA.brand_tone_of_voice, newToneInput.trim()] });
                  setNewToneInput('');
                  setHasChanges(true);
                }
              }}
              placeholder="Add tone (e.g., Friendly, Professional)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                if (newToneInput.trim()) {
                  setBrandDNA({ ...brandDNA, brand_tone_of_voice: [...brandDNA.brand_tone_of_voice, newToneInput.trim()] });
                  setNewToneInput('');
                  setHasChanges(true);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Business Overview */}
        {brandDNA.business_overview && (
          <div className="bg-gray-50 rounded-xl p-5 md:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-3">Business Overview</h3>
            <textarea
              value={brandDNA.business_overview}
              onChange={(e) => {
                setBrandDNA({ ...brandDNA, business_overview: e.target.value });
                setHasChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Instagram Photo Stream */}
        {store.instagram_handle && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 md:col-span-2 border border-purple-200">
            <div className="flex items-center gap-2 mb-4">
              <Instagram className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Instagram Feed</h3>
              <span className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded-full">@{store.instagram_handle}</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Recent posts from your Instagram feed help AI understand your visual brand style
            </p>
            {store.brand_images && store.brand_images.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {store.brand_images.slice(0, 6).map((imageUrl: string, index: number) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform">
                    <img
                      src={imageUrl}
                      alt={`Instagram post ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-6 text-center border border-purple-200">
                <Instagram className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">No Instagram photos loaded</p>
                <p className="text-xs text-gray-500">
                  Complete Brand DNA onboarding to import photos from @{store.instagram_handle}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {hasChanges && (
        <div className="border-t pt-4 flex justify-end gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function VideoSettings({ settings, onSettingsChange }: VideoSettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Brand & Social Media</h2>
        <p className="text-sm text-gray-600 mb-4">
          Set your brand information to auto-fill video generation forms
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Brand Name
            </label>
            <input
              type="text"
              value={settings.default_brand_name}
              onChange={(e) => onSettingsChange({ ...settings, default_brand_name: e.target.value })}
              placeholder="Your Brand"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              This will be used as the default brand name in video captions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instagram Handle
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                  @
                </span>
                <input
                  type="text"
                  value={settings.instagram_handle}
                  onChange={(e) => onSettingsChange({ ...settings, instagram_handle: e.target.value })}
                  placeholder="yourshop"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TikTok Handle
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">
                  @
                </span>
                <input
                  type="text"
                  value={settings.tiktok_handle}
                  onChange={(e) => onSettingsChange({ ...settings, tiktok_handle: e.target.value })}
                  placeholder="yourshop"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Description
            </label>
            <textarea
              value={settings.brand_description}
              onChange={(e) => onSettingsChange({ ...settings, brand_description: e.target.value })}
              placeholder="e.g., Minimalist aesthetic with earthy tones"
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Helps AI generate videos that match your brand style
            </p>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Default Video Settings</h2>
        <p className="text-sm text-gray-600 mb-4">
          These defaults will pre-fill the video generation form. Our videos are video-only (no audio).
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Call to Action
            </label>
            <input
              type="text"
              value={settings.default_call_to_action}
              onChange={(e) => onSettingsChange({ ...settings, default_call_to_action: e.target.value })}
              placeholder="e.g., Shop now at yourstore.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              If not set, we'll generate one from your store URL or social handles
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
