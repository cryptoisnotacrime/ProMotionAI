import { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Info, Instagram, Music, Lock } from 'lucide-react';
import { SocialMediaService } from '../../services/social-media/social-media.service';
import type { SocialMediaPhoto, SocialMediaConnection } from '../../lib/supabase';

export interface ImageSlot {
  url: string;
  file?: File;
  isProductImage: boolean;
  source: 'product' | 'upload' | 'url' | 'instagram' | 'tiktok';
}

interface MultiImagePickerProps {
  productImages: { id: string; src: string; alt?: string }[];
  productTitle: string;
  onImagesChange: (images: ImageSlot[]) => void;
  maxImages?: number;
  storeId?: string;
  planName?: string;
}

type SourceTab = 'product' | 'upload' | 'social';

export function MultiImagePicker({
  productImages,
  productTitle,
  onImagesChange,
  maxImages = 3,
  storeId,
  planName = 'free',
}: MultiImagePickerProps) {
  const [selectedImages, setSelectedImages] = useState<ImageSlot[]>([
    productImages[0] ? { url: productImages[0].src.trim(), isProductImage: true, source: 'product' } : null
  ].filter(Boolean) as ImageSlot[]);
  const [activeTab, setActiveTab] = useState<SourceTab>('product');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [socialPhotos, setSocialPhotos] = useState<SocialMediaPhoto[]>([]);
  const [socialConnections, setSocialConnections] = useState<SocialMediaConnection[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);

  // Load social media connections and photos
  useEffect(() => {
    if (storeId && activeTab === 'social') {
      loadSocialMedia();
    }
  }, [storeId, activeTab]);

  const loadSocialMedia = async () => {
    if (!storeId) return;

    setLoadingSocial(true);
    setSocialError(null);

    try {
      const connections = await SocialMediaService.getConnections(storeId);
      setSocialConnections(connections);

      if (connections.length > 0) {
        const photos = await SocialMediaService.getAllPhotos(storeId);
        setSocialPhotos(photos);
      } else {
        setSocialPhotos([]);
      }
    } catch (error) {
      console.error('Error loading social media:', error);
      setSocialError(error instanceof Error ? error.message : 'Failed to load social media content');
    } finally {
      setLoadingSocial(false);
    }
  };

  const updateImages = (newImages: ImageSlot[]) => {
    setSelectedImages(newImages);
    onImagesChange(newImages);
  };

  const handleProductImageSelect = (imageSrc: string) => {
    if (selectedImages.length >= maxImages) return;
    if (!canAddMultiImage && selectedImages.length >= 1) return;

    const newImage: ImageSlot = {
      url: imageSrc.trim(),
      isProductImage: true,
      source: 'product',
    };
    updateImages([...selectedImages, newImage]);
  };

  const handleSocialPhotoSelect = (photo: SocialMediaPhoto) => {
    if (selectedImages.length >= maxImages) return;
    if (!canAddMultiImage && selectedImages.length >= 1) return;

    const newImage: ImageSlot = {
      url: photo.url.trim(),
      isProductImage: false,
      source: photo.platform,
    };
    updateImages([...selectedImages, newImage]);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!canAddMultiImage && selectedImages.length >= 1) {
      setUploadError('Multiple reference images require Pro plan. Upgrade to unlock this feature.');
      event.target.value = '';
      return;
    }

    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file (JPG or PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const newImage: ImageSlot = {
        url: e.target?.result as string,
        file,
        isProductImage: false,
        source: 'upload',
      };
      updateImages([...selectedImages, newImage]);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleUrlAdd = () => {
    setUrlError(null);

    if (!urlInput.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    try {
      new URL(urlInput);
    } catch {
      setUrlError('Please enter a valid URL');
      return;
    }

    const newImage: ImageSlot = {
      url: urlInput.trim(),
      isProductImage: false,
      source: 'url',
    };
    updateImages([...selectedImages, newImage]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    updateImages(newImages);
  };

  const isProPlan = planName.toLowerCase() === 'pro' || planName.toLowerCase() === 'enterprise';
  const canAddMore = selectedImages.length < maxImages;
  const canAddMultiImage = isProPlan || selectedImages.length < 1;
  const availableProductImages = productImages.filter(
    img => !selectedImages.some(sel => sel.url === img.src)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-100">Reference Images</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {selectedImages.length} of {maxImages} selected
          </p>
        </div>
        <button
          onClick={() => setShowTips(!showTips)}
          className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
        >
          <Info className="w-3.5 h-3.5" />
          {showTips ? 'Hide' : 'Tips'}
        </button>
      </div>

      {showTips && (
        <div className="bg-purple-900/30 border border-purple-700/30 rounded-lg p-3 text-xs space-y-2">
          <p className="font-semibold text-purple-200">Multi-image improves consistency {!isProPlan && '(Pro feature)'}:</p>
          <ul className="list-disc list-inside text-purple-300 space-y-1 ml-2">
            <li>Product from different angles for 360° reveals</li>
            <li>Lifestyle settings for contextual videos</li>
            <li>Brand aesthetic references for style consistency</li>
          </ul>
          {!isProPlan && (
            <p className="text-purple-400 font-semibold mt-2">
              Upgrade to Pro to unlock multiple reference images for 8-second videos!
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {selectedImages.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 group"
          >
            <img
              src={image.url}
              alt={`Reference ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {index === 0 && (
              <div className="absolute top-1.5 left-1.5 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                Primary
              </div>
            )}
            <button
              onClick={() => removeImage(index)}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] px-2 py-1.5 flex items-center gap-1">
              {image.source === 'product' && 'Product'}
              {image.source === 'upload' && 'Uploaded'}
              {image.source === 'url' && 'URL'}
              {image.source === 'instagram' && <><Instagram className="w-3 h-3" /> Instagram</>}
              {image.source === 'tiktok' && <><Music className="w-3 h-3" /> TikTok</>}
            </div>
          </div>
        ))}

        {canAddMore && (
          <>
            {canAddMultiImage ? (
              <>
                <label className="relative aspect-square bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 hover:bg-gray-800 transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-purple-400">
                    <Upload className="w-6 h-6 mb-1.5" />
                    <span className="text-[10px] font-medium">Upload</span>
                  </div>
                </label>

                {!showUrlInput && (
                  <button
                    onClick={() => setShowUrlInput(true)}
                    className="relative aspect-square bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 hover:bg-gray-800 transition-all group"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-purple-400">
                      <LinkIcon className="w-6 h-6 mb-1.5" />
                      <span className="text-[10px] font-medium">From URL</span>
                    </div>
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="relative aspect-square bg-gray-800/30 border-2 border-dashed border-gray-700/50 rounded-lg group">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                    <Lock className="w-6 h-6 mb-1.5" />
                    <span className="text-[10px] font-medium">Pro Plan</span>
                  </div>
                  <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <p className="text-[10px] text-center text-purple-300 font-semibold">Upgrade to Pro for multi-image</p>
                  </div>
                </div>
                {selectedImages.length < maxImages - 1 && (
                  <div className="relative aspect-square bg-gray-800/30 border-2 border-dashed border-gray-700/50 rounded-lg group">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                      <Lock className="w-6 h-6 mb-1.5" />
                      <span className="text-[10px] font-medium">Pro Plan</span>
                    </div>
                    <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                      <p className="text-[10px] text-center text-purple-300 font-semibold">Upgrade to Pro for multi-image</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {showUrlInput && (
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <label className="block text-xs font-medium text-gray-300 mb-2">
            Add Image from URL
          </label>
          <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-2 mb-3 text-xs text-purple-200">
            <p className="font-semibold mb-1">💡 Quick Tip:</p>
            <p className="text-purple-300">Right-click any image on Instagram, TikTok, or Pinterest and select "Copy Image Address" to get the direct URL</p>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste image URL here..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleUrlAdd}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowUrlInput(false);
                setUrlInput('');
                setUrlError(null);
              }}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {urlError && (
            <p className="text-xs text-red-400 mt-2">{urlError}</p>
          )}
        </div>
      )}

      {uploadError && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-2 text-xs text-red-300">
          {uploadError}
        </div>
      )}

      {canAddMore && (
        <div className="space-y-3">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('product')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'product'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
              Product
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Upload className="w-3.5 h-3.5 inline mr-1" />
              Upload/URL
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                activeTab === 'social'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Instagram className="w-3.5 h-3.5 inline mr-1" />
              Social
            </button>
          </div>

          {/* Product Gallery Tab */}
          {activeTab === 'product' && availableProductImages.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-300">Product Gallery</h4>
              <div className="grid grid-cols-6 gap-2">
                {availableProductImages.slice(0, 12).map((img) => (
                  <button
                    key={img.id}
                    onClick={() => handleProductImageSelect(img.src)}
                    className="aspect-square bg-gray-800 rounded border-2 border-gray-700 hover:border-purple-500 overflow-hidden transition-all group"
                  >
                    <img
                      src={img.src}
                      alt={img.alt || productTitle}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload/URL Tab - Already exists above, just show message */}
          {activeTab === 'upload' && (
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 text-center">
              <p className="text-xs text-gray-400">Use the Upload or From URL buttons above to add images</p>
            </div>
          )}

          {/* Social Media Tab */}
          {activeTab === 'social' && (
            <div className="space-y-3">
              {loadingSocial ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : socialError ? (
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-xs text-red-300">
                  {socialError}
                </div>
              ) : socialConnections.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <Instagram className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-300 mb-1">No social accounts connected</p>
                  <p className="text-xs text-gray-400">Connect Instagram or TikTok in Settings under the Brand DNA tab to use your social media photos</p>
                </div>
              ) : socialPhotos.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-400">No photos found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-300">
                      Your Social Media Photos ({socialPhotos.length})
                    </h4>
                    <button
                      onClick={loadSocialMedia}
                      className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                    {socialPhotos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => handleSocialPhotoSelect(photo)}
                        className="relative aspect-square bg-gray-800 rounded border-2 border-gray-700 hover:border-purple-500 overflow-hidden transition-all group"
                        title={photo.caption}
                      >
                        <img
                          src={photo.thumbnail}
                          alt={photo.caption || ''}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute top-1 right-1">
                          {photo.platform === 'instagram' && (
                            <Instagram className="w-3 h-3 text-white drop-shadow" />
                          )}
                          {photo.platform === 'tiktok' && (
                            <Music className="w-3 h-3 text-white drop-shadow" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {selectedImages.length > 1 && (
        <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-700/30 rounded-lg p-3 flex items-start gap-2">
          <ImageIcon className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-purple-200">
            <p className="font-semibold mb-1">Multi-Image Mode Active</p>
            <p className="text-purple-300">Veo 3.1 will use all {selectedImages.length} images to maintain visual consistency</p>
          </div>
        </div>
      )}
    </div>
  );
}
