import { CreditCard, Video, TrendingUp, Clock, ShoppingBag, Eye, Download, ArrowRight, ExternalLink, Play, Package, X } from 'lucide-react';
import { Store, GeneratedVideo } from '../../lib/supabase';
import { useState } from 'react';

interface DashboardProps {
  store: Store;
  videos: GeneratedVideo[];
  onUpgrade: () => void;
  onNavigateToProducts?: () => void;
  onNavigateToVideoLibrary?: () => void;
}

export function Dashboard({ store, videos, onUpgrade, onNavigateToProducts, onNavigateToVideoLibrary }: DashboardProps) {
  const completedVideos = videos.filter((v) => v.generation_status === 'completed').length;
  const processingVideos = videos.filter(
    (v) => v.generation_status === 'processing' || v.generation_status === 'pending'
  ).length;
  const totalCreditsUsed = store.credits_total - store.credits_remaining;

  const creditUsagePercentage = (totalCreditsUsed / store.credits_total) * 100;

  const daysUntilRenewal = Math.ceil(
    (new Date(store.billing_cycle_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate product coverage stats
  const totalProductsWithVideos = new Set(videos.map(v => v.product_id)).size;
  const coveragePercentage = totalProductsWithVideos > 0 ? Math.min((totalProductsWithVideos / Math.max(totalProductsWithVideos * 1.5, 10)) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-100">
          Welcome back, {store.store_name || store.shop_domain}
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Here's what's happening with your video content
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Video className="w-5 h-5" />}
          label="Videos Generated"
          value={completedVideos.toString()}
          subtext={`${processingVideos} processing`}
          color="green"
          actionLabel="View Library"
          onAction={onNavigateToVideoLibrary}
        />
        <StatCard
          icon={<Package className="w-5 h-5" />}
          label="Products with Videos"
          value={totalProductsWithVideos.toString()}
          subtext={`${Math.round(coveragePercentage)}% catalog coverage`}
          color="blue"
          actionLabel="Add Videos"
          onAction={onNavigateToProducts}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Success Rate"
          value={`${videos.length > 0 ? Math.round((completedVideos / videos.length) * 100) : 0}%`}
          subtext={`${videos.length} total attempts`}
          color="purple"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Cycle Renewal"
          value={`${daysUntilRenewal}d`}
          subtext={`${store.plan_name.toUpperCase()} • ${store.credits_remaining}/${store.credits_total} credits`}
          color="orange"
          actionLabel="Upgrade"
          onAction={onUpgrade}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-900 rounded-lg border border-gray-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-100">Performance Insights</h2>
            <button
              onClick={onNavigateToVideoLibrary}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-green-900/30 rounded-lg p-3 border border-green-800/50">
              <div className="flex items-center gap-2 mb-1">
                <Video className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400 font-medium">Completed</span>
              </div>
              <p className="text-2xl font-bold text-green-300">{completedVideos}</p>
            </div>
            <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-800/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-blue-400 font-medium">Processing</span>
              </div>
              <p className="text-2xl font-bold text-blue-300">{processingVideos}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">Failed</span>
              </div>
              <p className="text-2xl font-bold text-gray-300">
                {videos.filter(v => v.generation_status === 'failed').length}
              </p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">Credits Used This Cycle</span>
              <span className="text-sm font-semibold text-gray-100">
                {totalCreditsUsed} / {store.credits_total}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  creditUsagePercentage > 80 ? 'bg-red-600' : creditUsagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-600'
                }`}
                style={{ width: `${Math.min(creditUsagePercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {store.credits_remaining} credits remaining • Resets in {daysUntilRenewal} days
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-5 border border-purple-800/50">
          <h2 className="text-base font-semibold mb-1 text-gray-100">Quick Actions</h2>
          <p className="text-gray-400 text-xs mb-4">Boost your productivity</p>
          <div className="space-y-2">
            <button
              onClick={onNavigateToProducts}
              className="w-full px-3 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-between"
            >
              <span>Generate Videos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateToVideoLibrary}
              className="w-full px-3 py-2.5 bg-gray-800 text-gray-100 border border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-between"
            >
              <span>Video Library</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onUpgrade}
              className="w-full px-3 py-2.5 bg-gray-800 text-gray-100 border border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center justify-between"
            >
              <span>Upgrade Plan</span>
              <TrendingUp className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-400 mb-2">{store.plan_name.toUpperCase()} Plan:</p>
            <ul className="text-xs space-y-1.5 text-gray-300">
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                <span>{store.credits_total} credits/month</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                <span>Max {store.plan_name === 'pro' ? '8' : store.plan_name === 'basic' ? '6' : '4'}s videos</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                <span>HD quality export</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-100">Recent Activity</h2>
          {videos.length > 0 && (
            <button
              onClick={onNavigateToVideoLibrary}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        {videos.length === 0 ? (
          <div className="text-center py-8">
            <Video className="mx-auto w-12 h-12 text-gray-600 mb-3" />
            <p className="text-gray-300 font-medium mb-1">No videos yet</p>
            <p className="text-sm text-gray-400 mb-4">Start creating engaging product videos</p>
            <button
              onClick={onNavigateToProducts}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Create First Video
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {videos.slice(0, 5).map((video) => (
              <RecentActivityItem key={video.id} video={video} isPro={store.plan_name === 'pro'} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  actionLabel?: string;
  onAction?: () => void;
}

function StatCard({ icon, label, value, subtext, color, actionLabel, onAction }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-900/30 text-blue-400 border border-blue-800/50',
    green: 'bg-green-900/30 text-green-400 border border-green-800/50',
    purple: 'bg-purple-900/30 text-purple-400 border border-purple-800/50',
    orange: 'bg-orange-900/30 text-orange-400 border border-orange-800/50',
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="text-xs text-gray-400 hover:text-gray-200 font-medium flex items-center gap-1"
          >
            {actionLabel} <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-100 mb-1">{value}</p>
      <p className="text-xs text-gray-400">{subtext}</p>
    </div>
  );
}

interface RecentActivityItemProps {
  video: GeneratedVideo;
  isPro: boolean;
}

interface VideoPreviewModalProps {
  video: GeneratedVideo;
  onClose: () => void;
}

function RecentActivityItem({ video, isPro }: RecentActivityItemProps) {
  const [showPreview, setShowPreview] = useState(false);

  const statusConfig = {
    completed: { bg: 'bg-green-900/50', text: 'text-green-300', label: 'Completed' },
    processing: { bg: 'bg-purple-900/50', text: 'text-purple-300', label: 'Processing' },
    pending: { bg: 'bg-yellow-900/50', text: 'text-yellow-300', label: 'Pending' },
    failed: { bg: 'bg-red-900/50', text: 'text-red-300', label: 'Failed' },
  };

  const config = statusConfig[video.generation_status];
  const templateName = video.metadata?.template_name || 'Custom';
  const duration = video.duration_seconds;
  const aspectRatio = video.metadata?.aspect_ratio || '9:16';

  return (
    <div className="border border-gray-700 rounded-lg p-3 hover:bg-gray-800/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <img
            src={video.source_image_url}
            alt={video.product_title || ''}
            className="w-16 h-16 object-cover rounded border border-gray-700"
          />
          {video.generation_status === 'completed' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded">
              <Play className="w-6 h-6 text-white" fill="white" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-medium text-gray-100 text-sm truncate">
              {video.product_title || 'Untitled Product'}
            </p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} whitespace-nowrap`}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
            <span className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              {templateName}
            </span>
            <span>{duration}s • {aspectRatio}</span>
            <span>{new Date(video.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      {video.generation_status === 'completed' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
          <button
            onClick={() => setShowPreview(true)}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
          <button
            onClick={async () => {
              try {
                const response = await fetch(video.video_url);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${video.product_title || 'video'}-${video.duration_seconds}s.mp4`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                console.error('Download failed:', error);
              }
            }}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
          >
            <Download className="w-3 h-3" />
            Download
          </button>
          {!video.attached_to_product && (
            <button
              disabled={!isPro}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors flex items-center justify-center gap-1 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-3 h-3" />
              {isPro ? 'Add to Shopify' : 'Add (Pro)'}
            </button>
          )}
        </div>
      )}
      {showPreview && video.video_url && (
        <VideoPreviewModal video={video} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

function VideoPreviewModal({ video, onClose }: VideoPreviewModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-5 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">{video.product_title || 'Video Preview'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{video.duration_seconds}s • {new Date(video.created_at).toLocaleDateString()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="p-5">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              src={video.video_url}
              controls
              autoPlay
              loop
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
