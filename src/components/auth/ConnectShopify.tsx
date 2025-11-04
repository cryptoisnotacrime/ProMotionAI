import { useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { getShopifyAuthUrl } from '../../config/shopify';

interface ConnectShopifyProps {
  onConnect: (shop: string) => void;
}

export function ConnectShopify({ onConnect }: ConnectShopifyProps) {
  const [shop, setShop] = useState('');
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!shop) {
      setError('Please enter your shop domain');
      return;
    }

    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

    try {
      const authUrl = await getShopifyAuthUrl(shopDomain);
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect. Please check your configuration.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ProMotionAI</h1>
          <p className="text-gray-600">
            Transform product images into engaging videos with AI
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Store</h2>
          <p className="text-gray-600 mb-6">
            Enter your Shopify store domain to get started
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shop Domain
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={shop}
                  onChange={(e) => {
                    setShop(e.target.value);
                    setError('');
                  }}
                  placeholder="your-store"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  .myshopify.com
                </span>
              </div>
              {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
            </div>

            <button
              onClick={handleConnect}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Connect to Shopify
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">What you'll get:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>AI-powered video generation from product images</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>10 free credits to start</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Unlimited video downloads and embeds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Flexible subscription plans</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          By connecting, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
