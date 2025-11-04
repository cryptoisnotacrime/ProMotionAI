import { useState } from 'react';
import { Download, ExternalLink, Trash2, Video, Clock, CheckCircle2, AlertCircle, Loader2, Upload, Eye } from 'lucide-react';
import { GeneratedVideo } from '../../lib/supabase';

interface VideoLibraryProps {
  videos: GeneratedVideo[];
  onDelete: (videoId: string) => void;
  onRefresh: () => void;
  onAddToShopify: (videoId: string) => Promise<void>;
  planName: string;
}

function getStatusIcon(status: GeneratedVideo['generation_status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case 'processing':
    case 'pending':
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    case 'failed':
      return <AlertCircle className="w-5 h-5 text-red-600" />;
  }
}

function getStatusText(status: GeneratedVideo['generation_status']): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'processing':
      return 'Processing';
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
  }
}

export function VideoLibrary({ videos, onDelete, onRefresh, onAddToShopify, planName }: VideoLibraryProps) {
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Video Library</h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Video className="mx-auto w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
          <p className="text-gray-500">
            Generate your first product video to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onView={() => setSelectedVideo(video)}
              onDelete={onDelete}
              onAddToShopify={onAddToShopify}
              planName={planName}
            />
          ))}
        </div>
      )}

      {selectedVideo && (
        <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
}

interface VideoCardProps {
  video: GeneratedVideo;
  onView: () => void;
  onDelete: (videoId: string) => void;
  onAddToShopify: (videoId: string) => Promise<void>;
  planName: string;
}

function VideoCard({ video, onView, onDelete, onAddToShopify, planName }: VideoCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const isCompleted = video.generation_status === 'completed';
  const isPro = planName === 'pro';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-100 relative group cursor-pointer" onClick={onView}>
        {isCompleted && video.video_url ? (
          <video
            src={video.video_url}
            poster={video.thumbnail_url}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={video.source_image_url}
            alt={video.product_title || 'Product'}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <Video className="w-12 h-12 text-white" />
        </div>
        <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-75 rounded text-white text-xs flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {video.duration_seconds}s
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-medium text-gray-900 line-clamp-1">
            {video.product_title || 'Untitled'}
          </h3>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">
            {video.prompt || 'No description'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {getStatusIcon(video.generation_status)}
          <span className={
            video.generation_status === 'completed' ? 'text-green-600' :
            video.generation_status === 'failed' ? 'text-red-600' :
            'text-blue-600'
          }>
            {getStatusText(video.generation_status)}
          </span>
        </div>

        {isCompleted && (
          <div className="space-y-2">
            {!video.attached_to_product && (
              isPro ? (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    setIsUploading(true);
                    try {
                      await onAddToShopify(video.id);
                    } catch (error) {
                      console.error('Failed to add to Shopify:', error);
                      alert('Failed to add video to Shopify');
                    } finally {
                      setIsUploading(false);
                    }
                  }}
                  disabled={isUploading}
                  className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Adding to Shopify...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Add to Shopify
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full px-3 py-2 text-sm font-bold text-blue-700 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center gap-2 border-2 border-blue-200">
                  <Upload className="w-4 h-4" />
                  PRO ONLY
                </div>
              )
            )}
            {video.attached_to_product && (
              <div className="w-full px-3 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Added to Product
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <a
                href={video.video_url}
                download
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this video? This action cannot be undone.')) {
                    onDelete(video.id);
                  }
                }}
                className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {video.generation_status === 'failed' && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
            {video.error_message || 'Generation failed'}
          </p>
        )}
      </div>
    </div>
  );
}

interface VideoModalProps {
  video: GeneratedVideo;
  onClose: () => void;
}

function VideoModal({ video, onClose }: VideoModalProps) {
  const isCompleted = video.generation_status === 'completed';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {video.product_title || 'Video Preview'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
            {isCompleted && video.video_url ? (
              <video
                src={video.video_url}
                controls
                autoPlay
                loop
                className="w-full h-full"
              />
            ) : (
              <img
                src={video.source_image_url}
                alt={video.product_title || 'Product'}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Prompt</h3>
              <p className="text-gray-600">{video.prompt}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Duration:</span>
                <span className="ml-2 font-medium">{video.duration_seconds}s</span>
              </div>
              <div>
                <span className="text-gray-500">Credits Used:</span>
                <span className="ml-2 font-medium">{video.credits_used}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium">{getStatusText(video.generation_status)}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 font-medium">
                  {new Date(video.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {isCompleted && video.video_url && video.attached_to_product && (
              <div className="pt-4 border-t space-y-2">
                <button
                  onClick={() => {
                    const embedCode = `<video src="${video.video_url}" controls loop muted autoplay playsinline style="width:100%;height:auto;"></video>`;
                    navigator.clipboard.writeText(embedCode);
                    alert('Embed code copied to clipboard!');
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Copy Embed Code
                </button>
                <button
                  onClick={() => {
                    if (video.video_url) {
                      navigator.clipboard.writeText(video.video_url);
                      alert('Video URL copied to clipboard!');
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Copy Video URL
                </button>
                <p className="text-xs text-gray-500 text-center pt-1">
                  Video hosted on Shopify CDN
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
