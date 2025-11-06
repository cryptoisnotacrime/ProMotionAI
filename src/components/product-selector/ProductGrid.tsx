import { useState } from 'react';
import { Search, Package, Video, Image, Layers, CheckCircle, Filter, Grid3x3, List } from 'lucide-react';
import { ShopifyProduct } from '../../services/shopify/products.service';
import { GeneratedVideo } from '../../lib/supabase';

interface ProductGridProps {
  products: ShopifyProduct[];
  onSelectProduct: (product: ShopifyProduct, imageUrl: string) => void;
  isLoading?: boolean;
  videos?: GeneratedVideo[];
  onViewVideos?: (productId: string) => void;
}

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'with-videos' | 'no-videos';

export function ProductGrid({ products, onSelectProduct, isLoading, videos = [], onViewVideos }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const productVideos = videos.filter(v => v.product_id === product.id.toString());

    if (filterMode === 'with-videos') {
      return matchesSearch && productVideos.length > 0;
    } else if (filterMode === 'no-videos') {
      return matchesSearch && productVideos.length === 0;
    }
    return matchesSearch;
  });

  const stats = {
    total: products.length,
    withVideos: new Set(videos.map(v => v.product_id)).size,
    noVideos: products.length - new Set(videos.map(v => v.product_id)).size,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as FilterMode)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Products ({stats.total})</option>
              <option value="with-videos">With Videos ({stats.withVideos})</option>
              <option value="no-videos">No Videos ({stats.noVideos})</option>
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

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Connect your Shopify store to see products'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {filteredProducts.map((product) => {
            const productVideos = videos.filter(v => v.product_id === product.id.toString());
            const completedVideos = productVideos.filter(v => v.generation_status === 'completed');
            return (
              <ProductCardCompact
                key={product.id}
                product={product}
                onSelectImage={(imageUrl) => onSelectProduct(product, imageUrl)}
                videoCount={productVideos.length}
                completedVideoCount={completedVideos.length}
                onViewVideos={onViewVideos}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((product) => {
            const productVideos = videos.filter(v => v.product_id === product.id.toString());
            const completedVideos = productVideos.filter(v => v.generation_status === 'completed');
            return (
              <ProductListItem
                key={product.id}
                product={product}
                onSelectImage={(imageUrl) => onSelectProduct(product, imageUrl)}
                videoCount={productVideos.length}
                completedVideoCount={completedVideos.length}
                onViewVideos={onViewVideos}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

interface ProductCardCompactProps {
  product: ShopifyProduct;
  onSelectImage: (imageUrl: string) => void;
  videoCount: number;
  completedVideoCount: number;
  onViewVideos?: (productId: string) => void;
}

function ProductCardCompact({ product, onSelectImage, videoCount, completedVideoCount, onViewVideos }: ProductCardCompactProps) {
  const mainImage = product.images[0];
  const variantCount = product.variants?.length || 1;
  const imageCount = product.images.length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
      <div className="aspect-square bg-gray-100 relative cursor-pointer" onClick={() => mainImage && onSelectImage(mainImage.src)}>
        {/* Stats badges */}
        <div className="absolute top-1 left-1 right-1 flex items-start justify-between z-10">
          <div className="flex flex-col gap-1">
            {videoCount > 0 && (
              <div className="bg-green-600 text-white rounded px-1.5 py-0.5 text-xs font-bold flex items-center gap-1 shadow-sm">
                <Video className="w-3 h-3" />
                {completedVideoCount}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="bg-white/90 backdrop-blur-sm rounded px-1.5 py-0.5 text-xs font-medium text-gray-700 flex items-center gap-1 shadow-sm">
              <Image className="w-3 h-3" />
              {imageCount}
            </div>
            {variantCount > 1 && (
              <div className="bg-white/90 backdrop-blur-sm rounded px-1.5 py-0.5 text-xs font-medium text-gray-700 flex items-center gap-1 shadow-sm">
                <Layers className="w-3 h-3" />
                {variantCount}
              </div>
            )}
          </div>
        </div>

        {mainImage ? (
          <img
            src={mainImage.src}
            alt={mainImage.alt || product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Hover overlay */}
        {mainImage && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <span className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium text-sm">
              Generate Video
            </span>
          </div>
        )}
      </div>

      <div className="p-2">
        <h3 className="font-medium text-gray-900 text-xs line-clamp-2 mb-1" title={product.title}>
          {product.title}
        </h3>

        {videoCount > 0 && onViewVideos && (
          <button
            onClick={() => onViewVideos(product.id.toString())}
            className="w-full mt-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
          >
            <CheckCircle className="w-3 h-3" />
            View Videos
          </button>
        )}
      </div>
    </div>
  );
}

interface ProductListItemProps {
  product: ShopifyProduct;
  onSelectImage: (imageUrl: string) => void;
  videoCount: number;
  completedVideoCount: number;
  onViewVideos?: (productId: string) => void;
}

function ProductListItem({ product, onSelectImage, videoCount, completedVideoCount, onViewVideos }: ProductListItemProps) {
  const mainImage = product.images[0];
  const variantCount = product.variants?.length || 1;
  const imageCount = product.images.length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-all">
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <div
          className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          onClick={() => mainImage && onSelectImage(mainImage.src)}
        >
          {mainImage ? (
            <img
              src={mainImage.src}
              alt={mainImage.alt || product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">
            {product.title}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Image className="w-3.5 h-3.5" />
              <span>{imageCount} photo{imageCount !== 1 ? 's' : ''}</span>
            </div>
            {variantCount > 1 && (
              <div className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>{variantCount} variant{variantCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            {videoCount > 0 && (
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <Video className="w-3.5 h-3.5" />
                <span>{completedVideoCount} video{completedVideoCount !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {videoCount > 0 && onViewVideos ? (
            <button
              onClick={() => onViewVideos(product.id.toString())}
              className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors flex items-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              View Videos
            </button>
          ) : null}
          <button
            onClick={() => mainImage && onSelectImage(mainImage.src)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}
