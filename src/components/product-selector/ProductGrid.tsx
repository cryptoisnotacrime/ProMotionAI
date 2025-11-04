import { useState } from 'react';
import { Search, Package } from 'lucide-react';
import { ShopifyProduct } from '../../services/shopify/products.service';

interface ProductGridProps {
  products: ShopifyProduct[];
  onSelectProduct: (product: ShopifyProduct, imageUrl: string) => void;
  isLoading?: boolean;
}

export function ProductGrid({ products, onSelectProduct, isLoading }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectImage={(imageUrl) => onSelectProduct(product, imageUrl)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ProductCardProps {
  product: ShopifyProduct;
  onSelectImage: (imageUrl: string) => void;
}

function ProductCard({ product, onSelectImage }: ProductCardProps) {
  const mainImage = product.images[0];

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-gray-100 relative group">
        {mainImage ? (
          <img
            src={mainImage.src}
            alt={mainImage.alt || product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}
        {mainImage && (
          <button
            onClick={() => onSelectImage(mainImage.src)}
            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          >
            <span className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">
              Generate Video
            </span>
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">{product.title}</h3>
        {product.images.length > 1 && (
          <div className="flex gap-2 mt-3">
            {product.images.slice(1, 4).map((image) => (
              <button
                key={image.id}
                onClick={() => onSelectImage(image.src)}
                className="w-12 h-12 rounded border border-gray-200 hover:border-blue-500 overflow-hidden"
              >
                <img
                  src={image.src}
                  alt={image.alt || ''}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
