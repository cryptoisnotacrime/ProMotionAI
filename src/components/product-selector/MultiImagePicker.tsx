import { useState } from 'react';
import { Upload, X, Image as ImageIcon, Link as LinkIcon, Info } from 'lucide-react';

export interface ImageSlot {
  url: string;
  file?: File;
  isProductImage: boolean;
  source: 'product' | 'upload' | 'url';
}

interface MultiImagePickerProps {
  productImages: { id: string; src: string; alt?: string }[];
  productTitle: string;
  onImagesChange: (images: ImageSlot[]) => void;
  maxImages?: number;
}

export function MultiImagePicker({
  productImages,
  productTitle,
  onImagesChange,
  maxImages = 3,
}: MultiImagePickerProps) {
  const [selectedImages, setSelectedImages] = useState<ImageSlot[]>([
    productImages[0] ? { url: productImages[0].src, isProductImage: true, source: 'product' } : null
  ].filter(Boolean) as ImageSlot[]);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showTips, setShowTips] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const updateImages = (newImages: ImageSlot[]) => {
    setSelectedImages(newImages);
    onImagesChange(newImages);
  };

  const handleProductImageSelect = (imageSrc: string) => {
    if (selectedImages.length >= maxImages) return;

    const newImage: ImageSlot = {
      url: imageSrc,
      isProductImage: true,
      source: 'product',
    };
    updateImages([...selectedImages, newImage]);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      url: urlInput,
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

  const canAddMore = selectedImages.length < maxImages;
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
          <p className="font-semibold text-purple-200">Multi-image improves consistency:</p>
          <ul className="list-disc list-inside text-purple-300 space-y-1 ml-2">
            <li>Product from different angles for 360° reveals</li>
            <li>Lifestyle settings for contextual videos</li>
            <li>Brand aesthetic references for style consistency</li>
          </ul>
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
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] px-2 py-1.5">
              {image.source === 'product' && 'Product'}
              {image.source === 'upload' && 'Uploaded'}
              {image.source === 'url' && 'URL'}
            </div>
          </div>
        ))}

        {canAddMore && (
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

      {availableProductImages.length > 0 && canAddMore && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-300">Product Gallery</h4>
          <div className="grid grid-cols-6 gap-2">
            {availableProductImages.slice(0, 6).map((img) => (
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
