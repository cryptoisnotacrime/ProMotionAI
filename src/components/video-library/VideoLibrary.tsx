import { useState } from 'react';
import { Download, ExternalLink, Trash2, Video, Clock, CheckCircle2, AlertCircle, Loader2, Upload, Eye, Search, Filter, SortAsc, Grid3x3, List } from 'lucide-react';
import { GeneratedVideo } from '../../lib/supabase';
import { getProxiedVideoUrl } from '../../utils/video-url';

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
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case 'processing':
    case 'pending':
      return <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />;
    case 'failed':
      return <AlertCircle className="w-5 h-5 text-red-400" />;
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

    // Search filter (searches in product title and template name)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesTitle = video.product_title?.toLowerCase().includes(searchLower);
      const matchesTemplate = video.metadata?.template_name?.toLowerCase().includes(searchLower);
      return matchesTitle || matchesTemplate;
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
          <h2 className="text-2xl font-bold text-gray-100">Video Library</h2>
          <p className="text-sm text-gray-400 mt-1">
            {stats.total} total • {stats.completed} completed • {stats.processing} processing • {stats.failed} failed
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-sm font-medium text-purple-400 hover:bg-gray-800 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Product filter notification */}
      {filteredProductId && onClearFilter && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-gray-100">
              Showing videos for: {filteredVideos[0]?.product_title || 'selected product'}
            </span>
          </div>
          <button
            onClick={onClearFilter}
            className="text-sm text-purple-400 hover:text-purple-300 font-medium"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Search and filters */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 md:p-4">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by product or template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filters and View */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="hidden sm:block w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="flex-1 sm:flex-initial px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm min-w-0"
              >
                <option value="all">All ({stats.total})</option>
                <option value="completed">Completed ({stats.completed})</option>
                <option value="processing">Processing ({stats.processing})</option>
                <option value="failed">Failed ({stats.failed})</option>
              </select>

              <SortAsc className="hidden sm:block w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="flex-1 sm:flex-initial px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm min-w-0"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="duration-desc">Longest First</option>
                <option value="duration-asc">Shortest First</option>
              </select>
            </div>

            <div className="flex gap-2 justify-center sm:justify-start sm:border-l sm:border-gray-700 sm:pl-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 sm:flex-initial p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
                title="Grid view"
              >
                <Grid3x3 className="w-5 h-5 mx-auto" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 sm:flex-initial p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'
                }`}
                title="List view"
              >
                <List className="w-5 h-5 mx-auto" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 rounded-xl border border-gray-800">
          <Video className="mx-auto w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No videos match your filters' : 'No videos yet'}
          </h3>
          <p className="text-gray-400">
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
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden hover:shadow-xl hover:shadow-purple-900/20 transition-shadow">
      <div className="aspect-video bg-gray-800 relative group cursor-pointer" onClick={onView}>
        {isCompleted && video.video_url ? (
          <video
            src={getProxiedVideoUrl(video.video_url)}
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
          <h3 className="font-semibold text-gray-100 text-sm line-clamp-1 mb-1.5">
            {video.product_title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-1.5 flex-wrap">
            {aspectRatio && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
                {aspectRatio}
              </span>
            )}
            <span className="text-xs text-gray-400">{new Date(video.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {getStatusIcon(video.generation_status)}
          <span className={
            video.generation_status === 'completed' ? 'text-green-400 font-medium' :
            video.generation_status === 'failed' ? 'text-red-400 font-medium' :
            'text-purple-400 font-medium'
          }>
            {getStatusText(video.generation_status)}
          </span>
          <span className="text-gray-600">•</span>
          <span className="text-gray-400">{video.credits_used} credits</span>
        </div>

        {(templateName || category) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {templateName && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-purple-400 border border-gray-700">
                {templateName}
              </span>
            )}
            {category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-purple-300 border border-gray-700">
                {category}
              </span>
            )}
          </div>
        )}

        {isCompleted && (
          <div className="space-y-2 pt-2 border-t border-gray-800">
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
                  className="w-full px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:bg-gray-700 disabled:cursor-not-allowed min-h-[36px]"
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
                <div className="w-full px-3 py-2 text-xs font-bold text-purple-300 bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-lg flex items-center justify-center gap-1.5 border border-purple-700 min-h-[36px]">
                  <Upload className="w-3.5 h-3.5" />
                  PRO ONLY
                </div>
              )
            )}
            {video.attached_to_product && (
              <div className="w-full px-3 py-2 text-xs font-medium text-green-300 bg-green-900/50 rounded-lg flex items-center justify-center gap-1.5 border border-green-700 min-h-[36px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Added to Product
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="flex-1 px-3 py-2 text-xs font-medium text-purple-300 bg-purple-900/50 hover:bg-purple-900/70 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-purple-700 min-h-[36px]"
              >
                <Eye className="w-3.5 h-3.5" />
                View
              </button>
              <a
                href={getProxiedVideoUrl(video.video_url)}
                download
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-gray-700 min-h-[36px]"
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
                className="sm:flex-initial px-3 py-2 text-xs font-medium text-red-300 bg-red-900/50 hover:bg-red-900/70 rounded-lg transition-colors border border-red-700 min-h-[36px] flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="sm:hidden">Delete</span>
              </button>
            </div>
          </div>
        )}

        {video.generation_status === 'failed' && (
          <p className="text-xs text-red-300 bg-red-900/30 p-2 rounded border border-red-800">
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
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 hover:shadow-lg hover:shadow-purple-900/20 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Thumbnail */}
        <div className="w-full sm:w-32 h-48 sm:h-20 flex-shrink-0 bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all relative" onClick={onView}>
          {isCompleted && video.video_url ? (
            <video src={getProxiedVideoUrl(video.video_url)} poster={video.thumbnail_url} className="w-full h-full object-cover" />
          ) : (
            <img src={video.source_image_url} alt={video.product_title || 'Product'} className="w-full h-full object-cover" />
          )}
          <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-75 rounded text-white text-xs font-medium">
            {video.duration_seconds}s
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-100 text-base line-clamp-1 mb-1.5">
            {video.product_title || 'Untitled'}
          </h3>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1.5">
              {getStatusIcon(video.generation_status)}
              <span className={
                video.generation_status === 'completed' ? 'text-green-400 font-medium' :
                video.generation_status === 'failed' ? 'text-red-400 font-medium' :
                'text-purple-400 font-medium'
              }>
                {getStatusText(video.generation_status)}
              </span>
            </div>
            {aspectRatio && (
              <>
                <span className="text-gray-600">•</span>
                <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-medium border border-gray-700">{aspectRatio}</span>
              </>
            )}
            {templateName && (
              <>
                <span className="text-gray-600 hidden sm:inline">•</span>
                <span className="px-2 py-0.5 rounded bg-gray-800 text-purple-400 font-medium border border-gray-700">{templateName}</span>
              </>
            )}
            {category && (
              <>
                <span className="text-gray-600 hidden lg:inline">•</span>
                <span className="px-2 py-0.5 rounded bg-gray-800 text-purple-300 font-medium border border-gray-700 hidden lg:inline-flex">{category}</span>
              </>
            )}
            <span className="text-gray-600 hidden sm:inline">•</span>
            <span className="text-gray-400 hidden sm:inline">{new Date(video.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Actions */}
        {isCompleted && (
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:flex-shrink-0">
            <button onClick={onView} className="flex-1 sm:flex-initial px-3 py-2 text-xs font-medium text-purple-300 bg-purple-900/50 hover:bg-purple-900/70 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-purple-700 min-h-[36px]">
              <Eye className="w-3.5 h-3.5" />
              View
            </button>
            <a href={getProxiedVideoUrl(video.video_url)} download className="flex-1 sm:flex-initial px-3 py-2 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-gray-700 min-h-[36px]">
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
                className="flex-1 sm:flex-initial px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:bg-gray-700 min-h-[36px]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add to Shopify</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Delete this video?')) onDelete(video.id);
              }}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs font-medium text-red-300 bg-red-900/50 hover:bg-red-900/70 rounded-lg transition-colors border border-red-700 flex items-center justify-center gap-1.5 min-h-[36px]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="sm:hidden">Delete</span>
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
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100">
            {video.product_title || 'Video Preview'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ExternalLink className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
            {isCompleted && video.video_url ? (
              <video
                src={getProxiedVideoUrl(video.video_url)}
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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Duration:</span>
                <span className="ml-2 font-medium text-gray-200">{video.duration_seconds}s</span>
              </div>
              <div>
                <span className="text-gray-400">Credits Used:</span>
                <span className="ml-2 font-medium text-gray-200">{video.credits_used}</span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <span className="ml-2 font-medium text-gray-200">{getStatusText(video.generation_status)}</span>
              </div>
              <div>
                <span className="text-gray-400">Created:</span>
                <span className="ml-2 font-medium text-gray-200">
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
