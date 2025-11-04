import { CreditCard, Video, TrendingUp, Clock } from 'lucide-react';
import { Store, GeneratedVideo } from '../../lib/supabase';

interface DashboardProps {
  store: Store;
  videos: GeneratedVideo[];
  onUpgrade: () => void;
}

export function Dashboard({ store, videos, onUpgrade }: DashboardProps) {
  const completedVideos = videos.filter((v) => v.generation_status === 'completed').length;
  const processingVideos = videos.filter(
    (v) => v.generation_status === 'processing' || v.generation_status === 'pending'
  ).length;
  const totalCreditsUsed = store.credits_total - store.credits_remaining;

  const creditUsagePercentage = (totalCreditsUsed / store.credits_total) * 100;

  const daysUntilRenewal = Math.ceil(
    (new Date(store.billing_cycle_end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {store.store_name || store.shop_domain}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<CreditCard className="w-6 h-6" />}
          label="Credits Remaining"
          value={store.credits_remaining.toString()}
          subtext={`of ${store.credits_total} total`}
          color="blue"
        />
        <StatCard
          icon={<Video className="w-6 h-6" />}
          label="Videos Generated"
          value={completedVideos.toString()}
          subtext={`${processingVideos} processing`}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Current Plan"
          value={store.plan_name.charAt(0).toUpperCase() + store.plan_name.slice(1)}
          subtext={store.subscription_status}
          color="purple"
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          label="Cycle Renewal"
          value={`${daysUntilRenewal}d`}
          subtext="until next billing"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Credit Usage</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Used</span>
                <span className="font-medium">
                  {totalCreditsUsed} / {store.credits_total} credits
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(creditUsagePercentage, 100)}%` }}
                />
              </div>
            </div>

            {creditUsagePercentage > 80 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  You're running low on credits. Consider upgrading your plan to continue
                  generating videos.
                </p>
                <button
                  onClick={onUpgrade}
                  className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  Upgrade Plan
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Videos</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{videos.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Success Rate</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">
                    {videos.length > 0
                      ? Math.round((completedVideos / videos.length) * 100)
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-2">Need More Credits?</h2>
          <p className="text-blue-100 text-sm mb-4">
            Purchase additional credits or upgrade your plan for more features.
          </p>
          <div className="space-y-3 mb-6">
            <button
              onClick={() => alert('Shopify billing integration coming soon! Credits will be charged to your Shopify account.')}
              className="w-full px-4 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Purchase Credits
            </button>
            <button
              onClick={onUpgrade}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              View All Plans
            </button>
          </div>
          <div className="pt-4 border-t border-blue-500">
            <p className="text-xs text-blue-100 mb-2">Current Plan Benefits:</p>
            <ul className="text-sm space-y-1">
              <li>• {store.credits_total} credits per month</li>
              <li>• Generate videos from products</li>
              <li>• Download and embed videos</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {videos.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No videos generated yet. Get started by selecting a product!
          </p>
        ) : (
          <div className="space-y-3">
            {videos.slice(0, 5).map((video) => (
              <div
                key={video.id}
                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <img
                  src={video.source_image_url}
                  alt={video.product_title || ''}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {video.product_title || 'Untitled'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    video.generation_status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : video.generation_status === 'failed'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {video.generation_status}
                </span>
              </div>
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
}

function StatCard({ icon, label, value, subtext, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className={`w-12 h-12 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtext}</p>
    </div>
  );
}
