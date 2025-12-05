import { useState } from 'react';
import { X, CheckCircle, RotateCw, Save, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { GeneratedVideo } from '../../lib/supabase';
import { ShopifyProduct } from '../../services/shopify/products.service';
import { getProxiedVideoUrl } from '../../utils/video-url';

interface VideoPreviewModalProps {
  video: GeneratedVideo;
  product: ShopifyProduct;
  onAddToProduct: (videoId: string) => Promise<void>;
  onRegenerate: (product: ShopifyProduct, imageUrl: string) => void;
  onSaveToLibrary: (videoId: string) => Promise<void>;
  onDiscard: (videoId: string) => Promise<void>;
  onClose: () => void;
}

export function VideoPreviewModal({
  video,
  product,
  onAddToProduct,
  onRegenerate,
  onSaveToLibrary,
  onDiscard,
  onClose,
}: VideoPreviewModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [actionCompleted, setActionCompleted] = useState<'added' | 'saved' | null>(null);

  const handleAddToProduct = async () => {
    setIsAdding(true);
    try {
      await onAddToProduct(video.id);
      setActionCompleted('added');
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error('Failed to add to product:', error);
      setIsAdding(false);
    }
  };

  const handleSaveToLibrary = async () => {
    setIsSaving(true);
    try {
      await onSaveToLibrary(video.id);
      setActionCompleted('saved');
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error('Failed to save to library:', error);
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (!confirm('Are you sure you want to discard this video? This action cannot be undone.')) {
      return;
    }
    setIsDiscarding(true);
    try {
      await onDiscard(video.id);
      onClose();
    } catch (error) {
      console.error('Failed to discard video:', error);
      setIsDiscarding(false);
    }
  };

  const handleRegenerate = () => {
    onRegenerate(product, video.source_image_url);
    onClose();
  };

  if (actionCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-xl max-w-md w-full p-8 text-center border border-gray-800">
          <div className="w-16 h-16 bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {actionCompleted === 'added' ? 'Video Added to Product!' : 'Video Saved to Library!'}
          </h3>
          <p className="text-gray-300">
            {actionCompleted === 'added'
              ? 'The video is now live on your product page in Shopify.'
              : 'You can add this video to your product later from the Video Library.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-white">Review Your Video</h2>
            <p className="text-sm text-gray-400 mt-0.5">Preview before adding to product</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-300 hover:text-white"
            disabled={isAdding || isSaving || isDiscarding}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-200 mb-3">Generated Video</h3>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={getProxiedVideoUrl(video.video_url)}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full"
                />
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-medium text-gray-100">{video.duration_seconds}s</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Credits Used:</span>
                  <span className="font-medium text-gray-100">{video.credits_used}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-200 mb-3">Original Product Image</h3>
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={video.source_image_url}
                  alt={video.product_title || 'Product'}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-400 mb-1">Product:</div>
                <div className="font-medium text-gray-100">{video.product_title}</div>
              </div>
              <div className="mt-3">
                <div className="text-sm text-gray-400 mb-1">Prompt Used:</div>
                <div className="text-sm text-gray-300 bg-gray-800 p-3 rounded-lg border border-gray-700">
                  {video.prompt || 'No prompt specified'}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-900/30 border border-purple-700/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-100 mb-1">What happens when you add to product?</h4>
                <p className="text-sm text-gray-400">
                  This video will be published to your Shopify product page and visible to customers immediately.
                  You can manage or remove it later from your Shopify admin.
                </p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={handleAddToProduct}
              disabled={isAdding || isSaving || isDiscarding}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Add to Product
                </>
              )}
            </button>

            <button
              onClick={handleRegenerate}
              disabled={isAdding || isSaving || isDiscarding}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <RotateCw className="w-5 h-5" />
              Regenerate
            </button>

            <button
              onClick={handleSaveToLibrary}
              disabled={isAdding || isSaving || isDiscarding}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save for Later
                </>
              )}
            </button>

            <button
              onClick={handleDiscard}
              disabled={isAdding || isSaving || isDiscarding}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isDiscarding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Discarding...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Discard
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              Not happy with the result? Try regenerating with different style or motion options.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
