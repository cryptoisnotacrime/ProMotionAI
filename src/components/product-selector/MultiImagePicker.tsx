import { useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, Info } from 'lucide-react';

export interface ImageSlot {
  url: string;
  file?: File;
  isProductImage: boolean;
}

interface MultiImagePickerProps {
  productImageUrl: string;
  productTitle: string;
  onImagesChange: (images: ImageSlot[]) => void;
  maxImages?: number;
}

export function MultiImagePicker({
  productImageUrl,
  productTitle,
  onImagesChange,
  maxImages = 3,
}: MultiImagePickerProps) {
  const [images, setImages] = useState<ImageSlot[]>([
    { url: productImageUrl, isProductImage: true }
  ]);
  const [includeProductImage, setIncludeProductImage] = useState(true);
  const [showTips, setShowTips] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleIncludeProductToggle = () => {
    const newValue = !includeProductImage;
    setIncludeProductImage(newValue);

    if (newValue) {
      const newImages = [{ url: productImageUrl, isProductImage: true }, ...images.filter(img => !img.isProductImage)];
      setImages(newImages.slice(0, maxImages));
      onImagesChange(newImages.slice(0, maxImages));
    } else {
      const newImages = images.filter(img => !img.isProductImage);
      setImages(newImages);
      onImagesChange(newImages);
    }
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
      };

      const newImages = [...images, newImage].slice(0, maxImages);
      setImages(newImages);
      onImagesChange(newImages);
    };
    reader.readAsDataURL(file);

    event.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);

    if (images[index].isProductImage) {
      setIncludeProductImage(false);
    }
  };

  const imageCount = images.length;
  const canAddMore = imageCount < maxImages;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Reference Images</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {imageCount} of {maxImages} images selected
          </p>
        </div>
        <button
          onClick={() => setShowTips(!showTips)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <Info className="w-3 h-3" />
          {showTips ? 'Hide Tips' : 'Multi-Image Tips'}
        </button>
      </div>

      {showTips && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs space-y-2">
          <p className="font-semibold text-blue-900">Using multiple images helps create more consistent videos:</p>
          <ul className="list-disc list-inside text-blue-800 space-y-1 ml-2">
            <li>Product from different angles for 360-degree reveals</li>
            <li>Product in use + lifestyle setting for context</li>
            <li>Product + brand aesthetic references for style consistency</li>
            <li>Character/model in different poses for appearance consistency</li>
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <input
          type="checkbox"
          id="includeProduct"
          checked={includeProductImage}
          onChange={handleIncludeProductToggle}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="includeProduct" className="text-sm text-gray-700">
          Include product image as primary reference
        </label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 group"
          >
            <img
              src={image.url}
              alt={image.isProductImage ? productTitle : `Reference ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {image.isProductImage && (
              <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                Primary
              </div>
            )}
            <button
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
              Image {index + 1}
            </div>
          </div>
        ))}

        {canAddMore && (
          <label className="relative aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer group">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileSelect}
              className="sr-only"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-600">
              <Upload className="w-8 h-8 mb-2" />
              <span className="text-xs font-medium">Upload Image</span>
              <span className="text-xs mt-1">JPG or PNG</span>
            </div>
          </label>
        )}
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">{uploadError}</p>
        </div>
      )}

      {imageCount > 1 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
          <ImageIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-green-800">
            <p className="font-semibold mb-1">Multi-Image Mode Active</p>
            <p>Veo 3.1 will use all {imageCount} images to maintain consistency across your video, creating more professional results.</p>
          </div>
        </div>
      )}
    </div>
  );
}
