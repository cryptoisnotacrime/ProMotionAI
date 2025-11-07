import { useState } from 'react';
import { Download, ExternalLink, Trash2, Video, Clock, CheckCircle2, AlertCircle, Loader2, Upload, Eye, Search, Filter, SortAsc, Grid3x3, List } from 'lucide-react';
import { GeneratedVideo } from '../../lib/supabase';

interface VideoLibraryProps {
  videos: GeneratedVideo[];
  onDelete: (videoId: string) => void;
  onRefresh: () => void;
  onAddToShopify: (videoId: string) => Promise<void>;
  planName: string;
  filteredProductId?: string | null;
  onClearFilter?: () => void;
}

type ViewMode = 'grid' | 'list';
type SortMode = 'newest' | 'oldest' | 'duration-asc' | 'duration-desc';
type FilterStatus = 'all' | 'completed' | 'processing' | 'failed';

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

export function VideoLibrary({ videos, onDelete, onRefresh, onAddToShopify, planName, filteredProductId, onClearFilter }: VideoLibraryProps) {
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Filter and sort videos
  let filteredVideos = videos.filter((video) => {
    // Product ID filter (from "View Videos" button)
    if (filteredProductId && video.product_id !== filteredProductId) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'all' && video.generation_status !== filterStatus) {
      return false;
    }

    // Search filter (searches in product title and prompt)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesTitle = video.product_title?.toLowerCase().includes(searchLower);
      const matchesPrompt = video.prompt?.toLowerCase().includes(searchLower);
      const matchesTemplate = video.metadata?.template_name?.toLowerCase().includes(searchLower);
      return matchesTitle || matchesPrompt || matchesTemplate;
    }

    return true;
  });

  // Sort videos
  filteredVideos = [...filteredVideos].sort((a, b) => {
    switch (sortMode) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'duration-asc':
        return a.duration_seconds - b.duration_seconds;
      case 'duration-desc':
        return b.duration_seconds - a.duration_seconds;
      default:
        return 0;
    }
  });

  const stats = {
    total: videos.length,
    completed: videos.filter(v => v.generation_status === 'completed').length,
    processing: videos.filter(v => v.generation_status === 'processing' || v.generation_status === 'pending').length,
    failed: videos.filter(v => v.generation_status === 'failed').length,
  };

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Video Library</h2>
          <p className="text-sm text-gray-500 mt-1">
            {stats.total} total • {stats.completed} completed • {stats.processing} processing • {stats.failed} failed
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Product filter notification */}
      {filteredProductId && onClearFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Showing videos for: {filteredVideos[0]?.product_title || 'selected product'}
            </span>
          </div>
          <button
            onClick={onClearFilter}
            className="text-sm text-blue-700 hover:text-blue-900 font-medium"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Search and filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by product, template, or prompt details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters and View */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All ({stats.total})</option>
              <option value="completed">Completed ({stats.completed})</option>
              <option value="processing">Processing ({stats.processing})</option>
              <option value="failed">Failed ({stats.failed})</option>
            </select>

            <SortAsc className="w-4 h-4 text-gray-500 ml-2" />
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="duration-desc">Longest First</option>
              <option value="duration-asc">Shortest First</option>
            </select>

            <div className="border-l border-gray-300 pl-2 flex gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="Grid view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Video className="mx-auto w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No videos match your filters' : 'No videos yet'}
          </h3>
          <p className="text-gray-500">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Generate your first product video to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
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
      ) : (
        <div className="space-y-2">
          {filteredVideos.map((video) => (
            <VideoListItem
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
  const templateName = video.metadata?.template_name || null;
  const category = video.metadata?.category;
  const aspectRatio = video.metadata?.aspect_ratio;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
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

      <div className="p-3 space-y-2">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1.5">
            {video.product_title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            {aspectRatio && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                {aspectRatio}
              </span>
            )}
            <span className="text-xs text-gray-500">{new Date(video.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {getStatusIcon(video.generation_status)}
          <span className={
            video.generation_status === 'completed' ? 'text-green-600 font-medium' :
            video.generation_status === 'failed' ? 'text-red-600 font-medium' :
            'text-blue-600 font-medium'
          }>
            {getStatusText(video.generation_status)}
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{video.credits_used} credits</span>
        </div>

        {(templateName || category) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {templateName && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                {templateName}
              </span>
            )}
            {category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                {category}
              </span>
            )}
          </div>
        )}

        {isCompleted && (
          <div className="space-y-2 pt-2 border-t">
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
                  className="w-full px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Add to Shopify
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full px-3 py-2 text-xs font-bold text-blue-700 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center gap-1.5 border border-blue-200">
                  <Upload className="w-3.5 h-3.5" />
                  PRO ONLY
                </div>
              )
            )}
            {video.attached_to_product && (
              <div className="w-full px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg flex items-center justify-center gap-1.5 border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Added to Product
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="flex-1 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-blue-200"
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </button>
              <a
                href={video.video_url}
                download
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-gray-200"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this video? This action cannot be undone.')) {
                    onDelete(video.id);
                  }
                }}
                className="px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
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

interface VideoListItemProps {
  video: GeneratedVideo;
  onView: () => void;
  onDelete: (videoId: string) => void;
  onAddToShopify: (videoId: string) => Promise<void>;
  planName: string;
}

function VideoListItem({ video, onView, onDelete, onAddToShopify, planName }: VideoListItemProps) {
  const [isUploading, setIsUploading] = useState(false);
  const isCompleted = video.generation_status === 'completed';
  const isPro = planName === 'pro';
  const templateName = video.metadata?.template_name || null;
  const category = video.metadata?.category;
  const aspectRatio = video.metadata?.aspect_ratio;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-all">
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <div className="w-32 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all relative" onClick={onView}>
          {isCompleted && video.video_url ? (
            <video src={video.video_url} poster={video.thumbnail_url} className="w-full h-full object-cover" />
          ) : (
            <img src={video.source_image_url} alt={video.product_title || 'Product'} className="w-full h-full object-cover" />
          )}
          <div className="absolute top-1.5 right-1.5 px-2 py-0.5 bg-black bg-opacity-75 rounded text-white text-xs font-medium">
            {video.duration_seconds}s
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-base line-clamp-1 mb-1.5">
            {video.product_title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              {getStatusIcon(video.generation_status)}
              <span className={
                video.generation_status === 'completed' ? 'text-green-600 font-medium' :
                video.generation_status === 'failed' ? 'text-red-600 font-medium' :
                'text-blue-600 font-medium'
              }>
                {getStatusText(video.generation_status)}
              </span>
            </div>
            {aspectRatio && (
              <>
                <span className="text-gray-300">•</span>
                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">{aspectRatio}</span>
              </>
            )}
            {templateName && (
              <>
                <span className="text-gray-300">•</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">{templateName}</span>
              </>
            )}
            {category && (
              <>
                <span className="text-gray-300">•</span>
                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium border border-purple-200">{category}</span>
              </>
            )}
            <span className="text-gray-300">•</span>
            <span className="text-gray-600">{new Date(video.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Actions */}
        {isCompleted && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={onView} className="px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5 border border-blue-200">
              <Eye className="w-3.5 h-3.5" />
              View
            </button>
            <a href={video.video_url} download className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 border border-gray-200">
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            {!video.attached_to_product && isPro && (
              <button
                onClick={async () => {
                  setIsUploading(true);
                  try {
                    await onAddToShopify(video.id);
                  } catch (error) {
                    alert('Failed to add video to Shopify');
                  } finally {
                    setIsUploading(false);
                  }
                }}
                disabled={isUploading}
                className="px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:bg-gray-300"
              >
                <Upload className="w-3.5 h-3.5" />
                Add to Shopify
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Delete this video?')) onDelete(video.id);
              }}
              className="px-3 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
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
              <p className="text-gray-600 text-sm">{video.prompt}</p>
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
          </div>
        </div>
      </div>
    </div>
  );
}
